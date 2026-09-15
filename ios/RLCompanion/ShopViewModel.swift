//
//  ShopViewModel.swift
//  RLCompanion
//
//  Main ViewModel managing shop state, async network loading,
//  disk cache with FileManager (offline mode), network error handling,
//  daily rotation countdown at 21:00 UTC, search, filtering, and wishlist.
//

import Foundation
import Combine
import SwiftUI

@MainActor
public final class ShopViewModel: ObservableObject {
    // MARK: - Published State

    @Published public var items: [ShopItem] = []
    @Published public var isLoading: Bool = false
    @Published public var errorMessage: String? = nil
    @Published public var networkError: String? = nil
    @Published public var isOffline: Bool = false
    @Published public var isUsingCache: Bool = false
    @Published public var lastUpdated: Date? = nil

    // Filters and Search
    @Published public var searchQuery: String = ""
    @Published public var selectedCategory: Category = .all
    @Published public var selectedRarity: Rarity? = nil
    @Published public var selectedType: String? = nil
    @Published public var selectedPaint: String? = nil
    @Published public var sortOption: SortOption = .defaultOrder

    // Rotation Timer
    @Published public var timeUntilRotation: String = "--:--:--"
    @Published public var isRotationEndingSoon: Bool = false

    // Wishlist Persistence
    @Published public var wishlistIDs: Set<String> = []

    // Detail Sheet & Full Screen Bundle Modal
    @Published public var selectedDetailItem: ShopItem? = nil
    @Published public var selectedBundle: ShopItem? = nil

    // Cache info
    @Published public var diskCacheSizeFormatted: String = "0 KB"

    // Theme Preference (OLED, Dark, Light, System)
    @Published public var currentTheme: AppTheme = .dark {
        didSet {
            UserDefaults.standard.set(currentTheme.rawValue, forKey: "rl_app_theme")
        }
    }

    public var colorScheme: ColorScheme? {
        currentTheme.colorScheme(colorScheme: nil)
    }

    // MARK: - Private Properties

    private var countdownTimer: AnyCancellable?
    private let wishlistStorageKey = "rl_companion_wishlist_ids"
    private let cacheFileName = "rl_shop_disk_cache.json"

    // Remote Endpoints (Primary CDN + GitHub Pages fallback + Local dev)
    private let remoteEndpoints: [URL] = [
        URL(string: "https://batyass.github.io/rl-companion/shop.json")!,
        URL(string: "https://batyass.github.io/rl-companion/data/shop.json")!,
        URL(string: "http://127.0.0.1:4173/api/shop")!
    ]

    // MARK: - Sort Options

    public enum SortOption: String, CaseIterable, Identifiable {
        case defaultOrder = "Default"
        case rarityDesc = "Rarity (Highest First)"
        case priceAsc = "Price (Low to High)"
        case priceDesc = "Price (High to Low)"
        case nameAsc = "Name (A-Z)"

        public var id: String { rawValue }
    }

    // MARK: - Initializer

    public init(autoFetch: Bool = true) {
        if let envTheme = ProcessInfo.processInfo.environment["RL_APP_THEME"],
           let theme = AppTheme(rawValue: envTheme.lowercased()) {
            self.currentTheme = theme
        } else if let savedThemeRaw = UserDefaults.standard.string(forKey: "rl_app_theme"),
           let savedTheme = AppTheme(rawValue: savedThemeRaw) {
            self.currentTheme = savedTheme
        } else {
            self.currentTheme = .dark
        }
        loadWishlistFromStorage()
        updateDiskCacheSize()
        startRotationCountdown()
        if autoFetch {
            Task {
                await fetchShop()
            }
        }
    }

    // MARK: - Computed Filtered Items

    public var filteredItems: [ShopItem] {
        var result = items

        // Strict category filtering
        let fixedShops = Set(["featured", "supersonic", "bundles", "rlcs"])
        switch selectedCategory {
        case .all:
            break
        case .featured:
            result = result.filter { ($0.shop?.lowercased() ?? "") == "featured" }
        case .customs:
            result = result.filter { ($0.shop?.lowercased() ?? "") == "supersonic" }
        case .collabs:
            result = result.filter {
                guard let s = $0.shop?.lowercased() else { return false }
                return !fixedShops.contains(s)
            }
        case .bundles:
            result = result.filter { ($0.shop?.lowercased() ?? "") == "bundles" }
        case .rlcs:
            result = result.filter { ($0.shop?.lowercased() ?? "") == "rlcs" }
        }

        // Filter by rarity
        if let selectedRarity = selectedRarity {
            result = result.filter { $0.rarity == selectedRarity }
        }

        // Filter by item type
        if let selectedType = selectedType, !selectedType.isEmpty {
            result = result.filter { $0.type.lowercased() == selectedType.lowercased() }
        }

        // Filter by paint
        if let selectedPaint = selectedPaint, !selectedPaint.isEmpty {
            result = result.filter { item in
                guard let paint = item.paint else { return false }
                return paint.lowercased() == selectedPaint.lowercased()
            }
        }

        // Filter by search query
        let query = searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if !query.isEmpty {
            result = result.filter { item in
                let nameMatch = item.name.lowercased().contains(query)
                let typeMatch = item.type.lowercased().contains(query)
                let rarityMatch = item.rarity.displayName.lowercased().contains(query) || item.rarity.rawValue.lowercased().contains(query)
                let paintMatch = item.paint?.lowercased().contains(query) ?? false
                return nameMatch || typeMatch || rarityMatch || paintMatch
            }
        }

        // Sorting
        switch sortOption {
        case .defaultOrder:
            break
        case .rarityDesc:
            result.sort { $0.rarity.sortOrder < $1.rarity.sortOrder }
        case .priceAsc:
            result.sort { $0.price < $1.price }
        case .priceDesc:
            result.sort { $0.price > $1.price }
        case .nameAsc:
            result.sort { $0.name.localizedCompare($1.name) == .orderedAscending }
        }

        return result
    }

    public var availableTypes: [String] {
        let allTypes = Set(items.map { $0.type })
        return Array(allTypes).sorted()
    }

    public var availablePaints: [String] {
        let allPaints = Set(items.compactMap { $0.paint })
        return Array(allPaints).sorted()
    }

    public var featuredHeroItem: ShopItem? {
        featuredItems.first { $0.rarity == .blackMarket } ?? featuredItems.first ?? items.first
    }

    private let trademarkCollabShops: Set<String> = [
        "cadillac-blackwing",
        "lamborghini-doja-cat",
        "jeep-wrangler-tomb-raider",
        "chrysler-pacifica",
        "cybertruck",
        "beskar",
        "bttf",
        "mclaren"
    ]

    public var featuredItems: [ShopItem] {
        items.filter { ($0.shop?.lowercased() ?? "") == "featured" }
    }

    public var dailyItems: [ShopItem] {
        items.filter { ($0.shop?.lowercased() ?? "") == "supersonic" }
    }

    public var customItems: [ShopItem] {
        dailyItems
    }

    public var collabItems: [ShopItem] {
        items.filter { item in
            guard let s = item.shop?.lowercased() else { return false }
            return trademarkCollabShops.contains(s)
        }
    }

    public var bundleItems: [ShopItem] {
        items.filter { item in
            let s = item.shop?.lowercased() ?? ""
            if s == "featured" || s == "supersonic" || s == "rlcs" || trademarkCollabShops.contains(s) {
                return false
            }
            return !item.contents.isEmpty || s == "bundles"
        }
    }

    public var rlcsItems: [ShopItem] {
        items.filter { ($0.shop?.lowercased() ?? "") == "rlcs" }
    }

    public var wishlistedItems: [ShopItem] {
        items.filter { wishlistIDs.contains($0.id) }
    }

    public var wishlistTotalCredits: Int {
        wishlistedItems.reduce(0) { $0 + $1.price }
    }

    public var sections: [ShopSection] {
        var result: [ShopSection] = []

        let featured = items.filter { ($0.category?.lowercased() == "featured") || ($0.featured == true) || ($0.rarity == .blackMarket) }
        if !featured.isEmpty {
            result.append(ShopSection(title: "FEATURED", category: .featured, items: featured))
        }

        let customs = customItems
        if !customs.isEmpty {
            result.append(ShopSection(title: "SUPERSONIC CUSTOMS", category: .customs, items: customs))
        }

        let daily = items.filter { ($0.category?.lowercased() == "daily") || (!$0.isBundle && $0.featured != true) }
        if !daily.isEmpty {
            result.append(ShopSection(title: "DAILY ITEMS", category: .featured, items: daily))
        }

        let bundles = bundleItems
        if !bundles.isEmpty {
            result.append(ShopSection(title: "BUNDLES", category: .bundles, items: bundles))
        }

        return result
    }

    // MARK: - Data Fetching & Multi-Tier Fallback Hierarchy

    /// Fetches the shop observing the fallback hierarchy:
    /// 1. Remote (Primary CDN / GitHub Pages)
    /// 2. Disk Cache FileManager (if offline)
    /// 3. Bundle shop.json (embedded local resource)
    /// 4. Hardcoded seed data
    public func fetchShop() async {
        isLoading = true
        errorMessage = nil
        networkError = nil

        // Always check authentic local shop data first
        if let localData = loadLocalShopData(), !localData.items.isEmpty {
            self.items = localData.items
            self.lastUpdated = Date()
            self.isOffline = false
            self.isUsingCache = false
            self.errorMessage = nil
            self.networkError = nil
            self.isLoading = false
            return
        }

        // 1. Attempt remote fetch via URLSession
        var lastCaughtError: Error?
        for endpoint in remoteEndpoints {
            do {
                let data = try await fetchFromURL(endpoint)
                let decoder = JSONDecoder()
                let decoded = try decoder.decode(ShopData.self, from: data)

                if !decoded.items.isEmpty {
                    self.items = decoded.items
                    self.lastUpdated = Date()
                    self.isOffline = false
                    self.isUsingCache = false
                    self.errorMessage = nil
                    self.networkError = nil

                    // Save to disk with FileManager for offline mode
                    saveToDiskCache(data: data)
                    updateDiskCacheSize()

                    self.isLoading = false
                    return
                }
            } catch {
                lastCaughtError = error
            }
        }

        // Fallback: Disk Cache with FileManager (offline mode)
        if let cachedData = loadFromDiskCache(), !cachedData.items.isEmpty {
            self.items = cachedData.items
            self.lastUpdated = Date()
            self.isOffline = true
            self.isUsingCache = true
            self.isLoading = false
            return
        }

        // Ultimate fallback: Hardcoded seed data
        self.items = fallbackSeedItems()
        self.lastUpdated = Date()
        self.isOffline = true
        self.isUsingCache = true
        self.isLoading = false
    }

    private func loadLocalShopData() -> ShopData? {
        if let bundleURL = Bundle.main.url(forResource: "shop", withExtension: "json"),
           let data = try? Data(contentsOf: bundleURL),
           let decoded = try? JSONDecoder().decode(ShopData.self, from: data),
           !decoded.items.isEmpty {
            return decoded
        }

        let devPaths = [
            "/Users/batyass/projects/rl-companion/ios/RLCompanion/shop.json",
            "/Users/batyass/projects/rl-companion/data/shop.json"
        ]
        for path in devPaths {
            if let data = try? Data(contentsOf: URL(fileURLWithPath: path)),
               let decoded = try? JSONDecoder().decode(ShopData.self, from: data),
               !decoded.items.isEmpty {
                return decoded
            }
        }
        return nil
    }

    private func fetchFromURL(_ url: URL) async throws -> Data {
        let sessionConfig = URLSessionConfiguration.default
        sessionConfig.requestCachePolicy = .reloadIgnoringLocalCacheData
        sessionConfig.timeoutIntervalForRequest = 8.0
        sessionConfig.timeoutIntervalForResource = 12.0
        let session = URLSession(configuration: sessionConfig)

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return data
    }

    // MARK: - Disk Cache with FileManager

    private var diskCacheFileURL: URL {
        let fileManager = FileManager.default
        let urls = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)
        let cacheDirectory = urls.first ?? URL(fileURLWithPath: NSTemporaryDirectory())
        return cacheDirectory.appendingPathComponent(cacheFileName)
    }

    public var hasDiskCache: Bool {
        FileManager.default.fileExists(atPath: diskCacheFileURL.path)
    }

    private func saveToDiskCache(data: Data) {
        do {
            let fileURL = diskCacheFileURL
            try data.write(to: fileURL, options: .atomic)
        } catch {
            print("Disk cache write error (FileManager): \(error.localizedDescription)")
        }
    }

    private func loadFromDiskCache() -> ShopData? {
        let fileManager = FileManager.default
        let path = diskCacheFileURL.path
        guard fileManager.fileExists(atPath: path) else { return nil }

        do {
            let data = try Data(contentsOf: diskCacheFileURL)
            let decoded = try JSONDecoder().decode(ShopData.self, from: data)
            return decoded
        } catch {
            print("Disk cache read error (FileManager): \(error.localizedDescription)")
            return nil
        }
    }

    public func clearDiskCache() {
        let fileManager = FileManager.default
        let path = diskCacheFileURL.path
        if fileManager.fileExists(atPath: path) {
            do {
                try fileManager.removeItem(at: diskCacheFileURL)
            } catch {
                print("Disk cache delete error (FileManager): \(error.localizedDescription)")
            }
        }
        URLCache.shared.removeAllCachedResponses()
        updateDiskCacheSize()
    }

    public func updateDiskCacheSize() {
        let fileManager = FileManager.default
        let path = diskCacheFileURL.path
        if let attributes = try? fileManager.attributesOfItem(atPath: path),
           let fileSize = attributes[.size] as? Int64 {
            let formatter = ByteCountFormatter()
            formatter.allowedUnits = [.useKB, .useMB]
            formatter.countStyle = .file
            diskCacheSizeFormatted = formatter.string(fromByteCount: fileSize)
        } else {
            diskCacheSizeFormatted = "0 KB"
        }
    }

    // MARK: - Rotation Countdown (21h00 CET / 19h00 UTC)

    private func startRotationCountdown() {
        updateRotationTime()
        countdownTimer = Timer.publish(every: 1.0, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.updateRotationTime()
            }
    }

    private func updateRotationTime() {
        let calendar = Calendar.current
        let now = Date()

        var targetComponents = calendar.dateComponents([.year, .month, .day], from: now)
        targetComponents.hour = 21
        targetComponents.minute = 0
        targetComponents.second = 0

        guard var targetDate = calendar.date(from: targetComponents) else { return }

        if now >= targetDate {
            targetDate = calendar.date(byAdding: .day, value: 1, to: targetDate) ?? targetDate
        }

        let timeInterval = targetDate.timeIntervalSince(now)

        if timeInterval <= 0 {
            timeUntilRotation = "00:00:00"
            isRotationEndingSoon = true
            return
        }

        let hours = Int(timeInterval) / 3600
        let minutes = (Int(timeInterval) % 3600) / 60
        let seconds = Int(timeInterval) % 60

        timeUntilRotation = String(format: "%02dh %02dm %02ds", hours, minutes, seconds)
        isRotationEndingSoon = hours < 2
    }

    // MARK: - Wishlist Management

    public func isWishlisted(_ item: ShopItem) -> Bool {
        wishlistIDs.contains(item.id)
    }

    public func isWishlisted(id: String) -> Bool {
        wishlistIDs.contains(id)
    }

    public func toggleWishlist(_ item: ShopItem) {
        toggleWishlist(for: item.id)
    }

    public func toggleWishlist(for id: String) {
        if wishlistIDs.contains(id) {
            wishlistIDs.remove(id)
            RLHaptics.lightImpact()
        } else {
            wishlistIDs.insert(id)
            RLHaptics.success()
        }
        saveWishlistToStorage()
    }

    public func refreshShop() async {
        await fetchShop()
    }

    public static var sampleItems: [ShopItem] {
        ShopViewModel().fallbackSeedItems()
    }

    public func removeFromWishlist(id: String) {
        wishlistIDs.remove(id)
        RLHaptics.lightImpact()
        saveWishlistToStorage()
    }

    public func clearWishlist() {
        wishlistIDs.removeAll()
        RLHaptics.warning()
        saveWishlistToStorage()
    }

    private func loadWishlistFromStorage() {
        if let stored = UserDefaults.standard.array(forKey: wishlistStorageKey) as? [String] {
            wishlistIDs = Set(stored)
        }
    }

    private func saveWishlistToStorage() {
        UserDefaults.standard.set(Array(wishlistIDs), forKey: wishlistStorageKey)
    }

    public func resetFilters() {
        selectedCategory = .all
        selectedRarity = nil
        selectedType = nil
        selectedPaint = nil
        searchQuery = ""
        sortOption = .defaultOrder
        RLHaptics.selection()
    }

    // MARK: - Fallback Seed Data

    public func fallbackSeedItems() -> [ShopItem] {
        [
            ShopItem(
                id: "draco-multichrome",
                name: "Draco: Multichrome",
                paint: nil,
                type: "Animated Decal",
                category: "daily",
                rarity: .blackMarket,
                price: 2000,
                image: "data/img/draco-multichrome.png",
                visual: "◈",
                contents: [],
                shop: "supersonic"
            ),
            ShopItem(
                id: "purple-sparkles",
                name: "Sparkles",
                paint: "Purple",
                type: "Rocket Boost",
                category: "daily",
                rarity: .importRarity,
                price: 600,
                image: "data/img/purple-sparkles.png",
                visual: "✦",
                contents: [],
                shop: "supersonic"
            ),
            ShopItem(
                id: "heavy-metal",
                name: "Heavy Metal",
                paint: nil,
                type: "Animated Decal",
                category: "daily",
                rarity: .exotic,
                price: 700,
                image: "data/img/heavy-metal.png",
                visual: "⬡",
                contents: [],
                shop: "supersonic"
            ),
            ShopItem(
                id: "oem-infinite",
                name: "OEM",
                paint: "Purple",
                type: "Wheels",
                category: "daily",
                rarity: .exotic,
                price: 900,
                image: "data/img/oem-infinite.png",
                visual: "◉",
                contents: [],
                shop: "supersonic"
            ),
            ShopItem(
                id: "fslb-flare",
                name: "FSL-B",
                paint: "Saffron",
                type: "Wheels",
                category: "daily",
                rarity: .veryRare,
                price: 300,
                image: "data/img/fslb-flare.png",
                visual: "◎",
                contents: [],
                shop: "supersonic"
            ),
            ShopItem(
                id: "cold-front",
                name: "Cold Front",
                paint: nil,
                type: "Goal Explosion",
                category: "daily",
                rarity: .exotic,
                price: 800,
                image: "data/img/cold-front.png",
                visual: "✵",
                contents: [],
                shop: "supersonic"
            ),
            ShopItem(
                id: "prism-schism",
                name: "Prism Schism",
                paint: "Saffron",
                type: "Goal Explosion",
                category: "daily",
                rarity: .exotic,
                price: 1000,
                image: "data/img/prism-schism.png",
                visual: "✧",
                contents: [],
                shop: "supersonic"
            ),
            ShopItem(
                id: "lightning-gilded",
                name: "Lightning: Gilded",
                paint: nil,
                type: "Trail",
                category: "daily",
                rarity: .veryRare,
                price: 200,
                image: "data/img/lightning-gilded.png",
                visual: "Ϟ",
                contents: [],
                shop: "supersonic"
            ),
            ShopItem(
                id: "octane-vertebrate",
                name: "Octane: Vertebrate",
                paint: nil,
                type: "Animated Decal",
                category: "daily",
                rarity: .importRarity,
                price: 300,
                image: "data/img/octane-vertebrate.png",
                visual: "⬢",
                contents: [],
                shop: "supersonic"
            ),
            ShopItem(
                id: "sunset-1986",
                name: "Sunset 1986",
                paint: nil,
                type: "Player Banner",
                category: "daily",
                rarity: .limited,
                price: 150,
                image: "data/img/sunset-1986.png",
                visual: "✵",
                contents: [],
                shop: "supersonic"
            ),
            ShopItem(
                id: "neo-thermal",
                name: "Neo-Thermal",
                paint: nil,
                type: "Rocket Boost",
                category: "daily",
                rarity: .importRarity,
                price: 600,
                image: "data/img/neo-thermal.png",
                visual: "〰",
                contents: [],
                shop: "supersonic"
            ),
            ShopItem(
                id: "halo-purple",
                name: "Halo: Purple",
                paint: "Purple",
                type: "Topper",
                category: "daily",
                rarity: .uncommon,
                price: 200,
                image: "data/img/halo-purple.png",
                visual: "◌",
                contents: [],
                shop: "supersonic"
            )
        ]
    }

    // MARK: - Preview Mock Factory

    public static func previewMock() -> ShopViewModel {
        let vm = ShopViewModel(autoFetch: false)
        vm.items = vm.fallbackSeedItems()
        vm.wishlistIDs = ["draco-multichrome", "purple-sparkles"]
        vm.lastUpdated = Date()
        return vm
    }
}

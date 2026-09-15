//
//  Views.swift
//  RLCompanion
//
//  Authentic Rocket League Item Shop SwiftUI Views:
//  - All Shop Sections in Native Bottom TabBar (Featured, Daily, Customs, Collabs, Bundles)
//  - Wishlist & Settings as Top Navigation Toolbar Buttons (Liquid Glass Modals)
//  - 100% Vertical 2-Column Grid on every page
//  - Pure Liquid Glass (.ultraThinMaterial) surfaces with RL hexagon CR badges
//

import SwiftUI
import UIKit

// MARK: - In-Memory Image Cache (Instant 60fps scrolling)

final class RLImageCache {
    static let shared = RLImageCache()
    private var cache = NSCache<NSString, UIImage>()

    private init() {
        cache.countLimit = 250
    }

    func image(forKey key: String) -> UIImage? {
        cache.object(forKey: key as NSString)
    }

    func setImage(_ image: UIImage, forKey key: String) {
        cache.setObject(image, forKey: key as NSString)
    }
}

// MARK: - Tab Content Wrappers (Required for TabContent conformance in complex files)

struct FeaturedTabContent: View {
    @EnvironmentObject var viewModel: ShopViewModel
    @Binding var isWishlistPresented: Bool
    @Binding var isSettingsPresented: Bool

    var body: some View {
        NavigationStack {
            ShopSectionGridView(
                sectionTitle: "FEATURED SHOP",
                subtitle: "48h exclusive spotlight",
                badge: "48H",
                badgeColor: RLColor.rarityColor(for: .blackMarket),
                items: viewModel.featuredItems
            )
            .navigationTitle("Featured")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchQuery, placement: .navigationBarDrawer(displayMode: .automatic), prompt: "Search Featured...")
            .toolbar { SharedToolbarContent(viewModel: viewModel, isWishlistPresented: $isWishlistPresented, isSettingsPresented: $isSettingsPresented) }
            .sheet(item: $viewModel.selectedDetailItem) { item in
                ItemDetailSheet(item: item)
                    .presentationDetents([.fraction(0.80), .large])
                    .presentationDragIndicator(.visible)
                    .presentationBackground(.clear)
            }
        }
    }
}

struct DailyTabContent: View {
    @EnvironmentObject var viewModel: ShopViewModel
    @Binding var isWishlistPresented: Bool
    @Binding var isSettingsPresented: Bool

    var body: some View {
        NavigationStack {
            ShopSectionGridView(
                sectionTitle: "DAILY ITEMS",
                subtitle: "24h rotation · Resets 21:00 UTC",
                badge: "24H",
                badgeColor: RLColor.rlOrange,
                items: viewModel.dailyItems
            )
            .navigationTitle("Daily")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchQuery, placement: .navigationBarDrawer(displayMode: .automatic), prompt: "Search Daily...")
            .toolbar { SharedToolbarContent(viewModel: viewModel, isWishlistPresented: $isWishlistPresented, isSettingsPresented: $isSettingsPresented) }
            .sheet(item: $viewModel.selectedDetailItem) { item in
                ItemDetailSheet(item: item)
                    .presentationDetents([.fraction(0.80), .large])
                    .presentationDragIndicator(.visible)
                    .presentationBackground(.clear)
            }
        }
    }
}

struct CustomsTabContent: View {
    @EnvironmentObject var viewModel: ShopViewModel
    @Binding var isWishlistPresented: Bool
    @Binding var isSettingsPresented: Bool

    var body: some View {
        NavigationStack {
            ShopSectionGridView(
                sectionTitle: "SUPERSONIC CUSTOMS",
                subtitle: "Curated car presets & tuning kits",
                badge: "CUSTOM",
                badgeColor: RLColor.rlBlue,
                items: viewModel.customItems
            )
            .navigationTitle("Customs")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchQuery, placement: .navigationBarDrawer(displayMode: .automatic), prompt: "Search Customs...")
            .toolbar { SharedToolbarContent(viewModel: viewModel, isWishlistPresented: $isWishlistPresented, isSettingsPresented: $isSettingsPresented) }
            .sheet(item: $viewModel.selectedDetailItem) { item in
                ItemDetailSheet(item: item)
                    .presentationDetents([.fraction(0.80), .large])
                    .presentationDragIndicator(.visible)
                    .presentationBackground(.clear)
            }
        }
    }
}

struct CollabsTabContent: View {
    @EnvironmentObject var viewModel: ShopViewModel
    @Binding var isWishlistPresented: Bool
    @Binding var isSettingsPresented: Bool

    var body: some View {
        NavigationStack {
            CollabsView()
                .navigationTitle("Collabs")
                .navigationBarTitleDisplayMode(.large)
                .searchable(text: $viewModel.searchQuery, placement: .navigationBarDrawer(displayMode: .automatic), prompt: "Search Collabs...")
                .toolbar { SharedToolbarContent(viewModel: viewModel, isWishlistPresented: $isWishlistPresented, isSettingsPresented: $isSettingsPresented) }
                .sheet(item: $viewModel.selectedDetailItem) { item in
                    ItemDetailSheet(item: item)
                        .presentationDetents([.fraction(0.80), .large])
                        .presentationDragIndicator(.visible)
                        .presentationBackground(.clear)
                }
        }
    }
}

// MARK: - Collabs Structured View

public struct CollabGroup: Identifiable, Hashable, Sendable {
    public let id: String
    public let title: String
    public let bundles: [ShopItem]
    public let singles: [ShopItem]

    public init(id: String, title: String, bundles: [ShopItem], singles: [ShopItem]) {
        self.id = id
        self.title = title
        self.bundles = bundles
        self.singles = singles
    }
}

public struct CollabGroupSectionView: View {
    @EnvironmentObject private var viewModel: ShopViewModel
    public let group: CollabGroup

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(group.title.uppercased())
                    .font(.system(size: 13, weight: .black))
                    .foregroundStyle(RLColor.rlOrange)
                    .tracking(0.5)

                Spacer()

                Text("\(group.bundles.count + group.singles.count) ITEMS")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(RLColor.labelSecondary)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(RLColor.rlOrange.opacity(0.12), in: Capsule())
            }
            .padding(.horizontal, 16)

            if !group.bundles.isEmpty {
                BundlesSectionView(
                    bundles: group.bundles,
                    onSelect: { bundle in
                        viewModel.selectedBundle = bundle
                        RLHaptics.lightImpact()
                    }
                )
                .padding(.horizontal, 16)
            }

            if !group.singles.isEmpty {
                if !group.bundles.isEmpty {
                    Text("INDIVIDUAL ITEMS & ACCESSORIES")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(RLColor.labelTertiary)
                        .padding(.horizontal, 16)
                        .padding(.top, 4)
                }

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(group.singles) { item in
                        ItemCardView(
                            item: item,
                            isWishlisted: viewModel.isWishlisted(id: item.id),
                            onCardTap: {
                                viewModel.selectedDetailItem = item
                                RLHaptics.lightImpact()
                            },
                            onWishlistTap: {
                                viewModel.toggleWishlist(for: item.id)
                            }
                        )
                    }
                }
                .padding(.horizontal, 16)
            }
        }
    }
}

public struct CollabsView: View {
    @EnvironmentObject private var viewModel: ShopViewModel
    @State private var selectedCollabFilter: String = "all"

    private var collabGroups: [CollabGroup] {
        let items = viewModel.collabItems

        let shopTitles: [String: String] = [
            "cadillac-blackwing": "Cadillac CT5-V Blackwing",
            "lamborghini-doja-cat": "Lamborghini + Doja Cat",
            "jeep-wrangler-tomb-raider": "Jeep Wrangler · Tomb Raider",
            "chrysler-pacifica": "Chrysler Pacifica",
            "cybertruck": "Tesla Cybertruck",
            "beskar": "Star Wars · Beskar",
            "bttf": "Back to the Future",
            "mclaren": "McLaren"
        ]

        var grouped: [String: [ShopItem]] = [:]
        for it in items {
            let s = it.shop?.lowercased() ?? "other"
            grouped[s, default: []].append(it)
        }

        var result: [CollabGroup] = []
        for (slug, shopItems) in grouped {
            if selectedCollabFilter != "all" && slug != selectedCollabFilter {
                continue
            }
            let bundles = shopItems.filter { $0.isBundle || $0.category?.lowercased() == "bundles" || !$0.contents.isEmpty }
            let singles = shopItems.filter { !bundles.contains($0) }
            let title = shopTitles[slug] ?? slug.replacingOccurrences(of: "-", with: " ").capitalized
            result.append(CollabGroup(id: slug, title: title, bundles: bundles, singles: singles))
        }
        return result.sorted { $0.title < $1.title }
    }

    public var body: some View {
        ZStack {
            LiquidGlassBackgroundView()

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Picker("Partner", selection: $selectedCollabFilter) {
                        Text("All").tag("all")
                        Text("Lambo").tag("lamborghini-doja-cat")
                        Text("Cadillac").tag("cadillac-blackwing")
                        Text("Jeep").tag("jeep-wrangler-tomb-raider")
                        Text("Chrysler").tag("chrysler-pacifica")
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 16)
                    .padding(.top, 6)
                    .onChange(of: selectedCollabFilter) { _ in
                        RLHaptics.selection()
                    }

                    ForEach(collabGroups) { group in
                        CollabGroupSectionView(group: group)
                    }

                    Spacer(minLength: 30)
                }
                .padding(.vertical, 8)
            }
        }
    }
}

struct BundlesTabContentWrapper: View {
    @EnvironmentObject var viewModel: ShopViewModel
    @Binding var isWishlistPresented: Bool
    @Binding var isSettingsPresented: Bool

    var body: some View {
        NavigationStack {
            BundlesTabContent()
                .navigationTitle("Bundles")
                .navigationBarTitleDisplayMode(.large)
                .searchable(text: $viewModel.searchQuery, placement: .navigationBarDrawer(displayMode: .automatic), prompt: "Search Bundles...")
                .toolbar { SharedToolbarContent(viewModel: viewModel, isWishlistPresented: $isWishlistPresented, isSettingsPresented: $isSettingsPresented) }
                .sheet(item: $viewModel.selectedDetailItem) { item in
                    ItemDetailSheet(item: item)
                        .presentationDetents([.fraction(0.80), .large])
                        .presentationDragIndicator(.visible)
                        .presentationBackground(.clear)
                }
        }
    }
}

struct RLCSTabContent: View {
    @EnvironmentObject var viewModel: ShopViewModel
    @Binding var isWishlistPresented: Bool
    @Binding var isSettingsPresented: Bool

    var body: some View {
        NavigationStack {
            ShopSectionGridView(
                sectionTitle: "RLCS ESPORTS",
                subtitle: "Official team decals & goal explosions",
                badge: "RLCS",
                badgeColor: RLColor.rlBlue,
                items: viewModel.rlcsItems
            )
            .navigationTitle("RLCS")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchQuery, placement: .navigationBarDrawer(displayMode: .automatic), prompt: "Search RLCS...")
            .toolbar { SharedToolbarContent(viewModel: viewModel, isWishlistPresented: $isWishlistPresented, isSettingsPresented: $isSettingsPresented) }
            .sheet(item: $viewModel.selectedDetailItem) { item in
                ItemDetailSheet(item: item)
                    .presentationDetents([.fraction(0.80), .large])
                    .presentationDragIndicator(.visible)
                    .presentationBackground(.clear)
            }
        }
    }
}

// MARK: - Shared Toolbar Content (Native iOS SF Symbols for Wishlist + Settings)

struct SharedToolbarContent: ToolbarContent {
    @ObservedObject var viewModel: ShopViewModel
    @Binding var isWishlistPresented: Bool
    @Binding var isSettingsPresented: Bool

    @Environment(\.themeTokens) private var themeTokens

    var body: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            Button {
                isWishlistPresented = true
                RLHaptics.selection()
            } label: {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: viewModel.wishlistIDs.isEmpty ? "heart" : "heart.fill")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(viewModel.wishlistIDs.isEmpty ? themeTokens.labelPrimary : Color.red)
                        .frame(width: 32, height: 32)

                    if !viewModel.wishlistIDs.isEmpty {
                        Text("\(viewModel.wishlistIDs.count)")
                            .font(.system(size: 9, weight: .black))
                            .foregroundStyle(Color.white)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 1.5)
                            .background(Color.red)
                            .clipShape(Capsule())
                            .offset(x: 6, y: -4)
                    }
                }
            }
            .accessibilityLabel("Wishlist")
        }

        ToolbarItem(placement: .topBarTrailing) {
            Button {
                isSettingsPresented = true
                RLHaptics.selection()
            } label: {
                Image(systemName: "gearshape")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(themeTokens.labelPrimary)
                    .frame(width: 32, height: 32)
            }
            .accessibilityLabel("Settings")
        }
    }
}

// MARK: - Main Tab View (All Sections in Bottom Native Bar)

public struct MainTabView: View {
    @EnvironmentObject private var viewModel: ShopViewModel
    @State private var isWishlistPresented: Bool = false
    @State private var isSettingsPresented: Bool = true
    @State private var selectedTab: Int = 0

    public init() {}

    public var body: some View {
        TabView(selection: $selectedTab) {
            FeaturedTabContent(isWishlistPresented: $isWishlistPresented, isSettingsPresented: $isSettingsPresented)
                .tag(0)
                .tabItem { Label("Featured", systemImage: "flame.fill") }

            DailyTabContent(isWishlistPresented: $isWishlistPresented, isSettingsPresented: $isSettingsPresented)
                .tag(1)
                .tabItem { Label("Daily", systemImage: "clock.fill") }

            CollabsTabContent(isWishlistPresented: $isWishlistPresented, isSettingsPresented: $isSettingsPresented)
                .tag(2)
                .tabItem { Label("Collabs", systemImage: "car.2.fill") }

            BundlesTabContentWrapper(isWishlistPresented: $isWishlistPresented, isSettingsPresented: $isSettingsPresented)
                .tag(3)
                .tabItem { Label("Bundles", systemImage: "square.stack.3d.up.fill") }

            RLCSTabContent(isWishlistPresented: $isWishlistPresented, isSettingsPresented: $isSettingsPresented)
                .tag(4)
                .tabItem { Label("RLCS", systemImage: "trophy.fill") }
        }
        .environmentObject(viewModel)
        .withTheme(viewModel.currentTheme)
        .fullScreenCover(isPresented: $isWishlistPresented) {
            WishlistFullPageView()
                .environmentObject(viewModel)
                .withTheme(viewModel.currentTheme)
        }
        .fullScreenCover(isPresented: $isSettingsPresented) {
            SettingsFullPageView()
                .environmentObject(viewModel)
                .withTheme(viewModel.currentTheme)
        }
        .fullScreenCover(item: $viewModel.selectedBundle) { bundle in
            BundleDetailFullView(bundle: bundle)
                .environmentObject(viewModel)
                .withTheme(viewModel.currentTheme)
        }
        .task {
            await viewModel.fetchShop()
            try? await Task.sleep(nanoseconds: 300_000_000)
            viewModel.currentTheme = .dark
        }
    }
}

// MARK: - Shop Section Content View (No NavigationStack, plain content for each tab)

public struct ShopSectionGridView: View {
    @EnvironmentObject private var viewModel: ShopViewModel

    public let sectionTitle: String
    public let subtitle: String
    public let badge: String
    public let badgeColor: Color
    public let items: [ShopItem]

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    public init(
        sectionTitle: String,
        subtitle: String,
        badge: String,
        badgeColor: Color,
        items: [ShopItem]
    ) {
        self.sectionTitle = sectionTitle
        self.subtitle = subtitle
        self.badge = badge
        self.badgeColor = badgeColor
        self.items = items
    }

    public var body: some View {
        ZStack {
            LiquidGlassBackgroundView()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    ShopHeaderBar(viewModel: viewModel)
                        .padding(.horizontal, 16)
                        .padding(.top, 4)

                    SectionHeaderRow(
                        title: sectionTitle,
                        subtitle: subtitle,
                        badge: badge,
                        badgeColor: badgeColor
                    )
                    .padding(.horizontal, 16)

                    if items.isEmpty {
                        VStack(spacing: 12) {
                            Spacer().frame(height: 60)
                            Image(systemName: "sparkles")
                                .font(.system(size: 36, weight: .light))
                                .foregroundStyle(RLColor.labelTertiary)
                            Text("No items in this section")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(RLColor.labelSecondary)
                            Spacer()
                        }
                        .frame(maxWidth: .infinity)
                    } else {
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(items) { item in
                                ItemCardView(
                                    item: item,
                                    isWishlisted: viewModel.isWishlisted(id: item.id),
                                    onCardTap: {
                                        viewModel.selectedDetailItem = item
                                        RLHaptics.lightImpact()
                                    },
                                    onWishlistTap: {
                                        viewModel.toggleWishlist(for: item.id)
                                    }
                                )
                            }
                        }
                        .padding(.horizontal, 16)
                    }

                    Spacer(minLength: 30)
                }
                .padding(.vertical, 8)
            }
        }
    }
}

// MARK: - Bundles Tab Content (Plain content, no NavigationStack)

public struct BundlesTabContent: View {
    @EnvironmentObject private var viewModel: ShopViewModel

    public init() {}

    public var body: some View {
        ZStack {
            LiquidGlassBackgroundView()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    ShopHeaderBar(viewModel: viewModel)
                        .padding(.horizontal, 16)
                        .padding(.top, 4)

                    SectionHeaderRow(
                        title: "FEATURED BUNDLES",
                        subtitle: "Special limited-time bundles with all contents",
                        badge: "BUNDLES",
                        badgeColor: RLColor.rlOrange
                    )
                    .padding(.horizontal, 16)

                    BundlesSectionView(
                        bundles: viewModel.bundleItems,
                        onSelect: { bundle in
                            viewModel.selectedBundle = bundle
                            RLHaptics.lightImpact()
                        }
                    )
                    .padding(.horizontal, 16)

                    Spacer(minLength: 30)
                }
                .padding(.vertical, 8)
            }
        }
    }
}

// MARK: - Section Header Row

public struct SectionHeaderRow: View {
    public let title: String
    public let subtitle: String
    public var badge: String? = nil
    public var badgeColor: Color = RLColor.rlBlue

    public var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .black))
                    .foregroundStyle(RLColor.labelBase)
                    .tracking(0.6)

                Text(subtitle)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(RLColor.labelSecondary)
            }

            Spacer()

            if let badge = badge {
                Text(badge)
                    .font(.system(size: 10, weight: .black))
                    .foregroundStyle(badgeColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule())
                    .overlay(Capsule().strokeBorder(badgeColor.opacity(0.4), lineWidth: 1))
            }
        }
    }
}

// MARK: - Shop Header Bar (RL Theme & Status)

public struct ShopHeaderBar: View {
    @ObservedObject public var viewModel: ShopViewModel

    public var body: some View {
        HStack(spacing: 10) {
            HStack(spacing: 6) {
                Circle()
                    .fill(RLColor.rlBlue)
                    .frame(width: 7, height: 7)
                    .shadow(color: RLColor.rlBlue.opacity(0.8), radius: 4)

                Text("LIVE ITEM SHOP")
                    .font(.system(size: 11, weight: .black))
                    .foregroundStyle(RLColor.rlBlue)
                    .tracking(0.5)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
            .overlay(Capsule().strokeBorder(RLColor.rlBlue.opacity(0.35), lineWidth: 1))

            Spacer()

            HStack(spacing: 5) {
                Image(systemName: "timer")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(RLColor.rlOrange)

                Text("RESETS 21:00 UTC")
                    .font(.system(size: 11, weight: .black))
                    .foregroundStyle(RLColor.rlOrange)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
            .overlay(Capsule().strokeBorder(RLColor.rlOrange.opacity(0.35), lineWidth: 1))
        }
    }
}

// MARK: - Item Card View (Vertical 2-Column Grid)

public struct ItemCardView: View {
    public let item: ShopItem
    public let isWishlisted: Bool
    public let onCardTap: () -> Void
    public let onWishlistTap: () -> Void

    public var body: some View {
        Button(action: onCardTap) {
            VStack(alignment: .leading, spacing: 0) {
                ZStack(alignment: .topTrailing) {
                    ZStack {
                        RadialGradient(
                            colors: [
                                RLColor.rarityColor(for: item.rarity).opacity(0.30),
                                Color(hex: "13161C").opacity(0.75)
                            ],
                            center: .center,
                            startRadius: 5,
                            endRadius: 95
                        )

                        ItemImageView(item: item, maxDimension: 110)
                            .padding(8)
                            .shadow(color: RLColor.rarityColor(for: item.rarity).opacity(0.45), radius: 10)
                    }
                    .frame(height: 130)
                    .frame(maxWidth: .infinity)
                    .clipped()

                    Button {
                        onWishlistTap()
                    } label: {
                        Image(systemName: isWishlisted ? "heart.fill" : "heart")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(isWishlisted ? Color.red : Color.white.opacity(0.85))
                            .padding(6)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                            .overlay(Circle().strokeBorder(Color.white.opacity(0.2), lineWidth: 0.8))
                    }
                    .buttonStyle(.plain)
                    .padding(6)

                    if let paint = item.paint {
                        HStack {
                            PaintChipView(paint: paint)
                                .padding(6)
                            Spacer()
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(item.name)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(RLColor.labelBase)
                        .lineLimit(1)

                    HStack(spacing: 4) {
                        Circle()
                            .fill(RLColor.rarityColor(for: item.rarity))
                            .frame(width: 5, height: 5)
                        Text(item.type)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(RLColor.labelSecondary)
                            .lineLimit(1)
                    }

                    HStack {
                        Text(item.rarity.displayName.uppercased())
                            .font(.system(size: 9, weight: .black))
                            .foregroundStyle(RLColor.rarityColor(for: item.rarity))
                        Spacer()
                        CreditBadgeView(price: item.price, fontSize: 12, iconSize: 10)
                    }
                    .padding(.top, 2)
                }
                .padding(10)
                .background(.ultraThinMaterial)
            }
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(
                        LinearGradient(
                            colors: [
                                RLColor.rarityColor(for: item.rarity).opacity(0.65),
                                Color.white.opacity(0.06)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
            .shadow(color: Color.black.opacity(0.35), radius: 6, y: 3)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Bundles Section View (Vertical with Content Preview)

public struct BundlesSectionView: View {
    public let bundles: [ShopItem]
    public let onSelect: (ShopItem) -> Void

    public var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            ForEach(bundles) { bundle in
                Button {
                    onSelect(bundle)
                } label: {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 14) {
                            ItemImageView(item: bundle, maxDimension: 70)
                                .frame(width: 70, height: 70)
                                .background(Color.white.opacity(0.04))
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Color.white.opacity(0.1), lineWidth: 1))

                            VStack(alignment: .leading, spacing: 4) {
                                Text(bundle.name)
                                    .font(.system(size: 15, weight: .black))
                                    .foregroundStyle(RLColor.labelBase)
                                    .lineLimit(1)

                                HStack(spacing: 5) {
                                    Text("BUNDLE")
                                        .font(.system(size: 9, weight: .black))
                                        .foregroundStyle(RLColor.rlOrange)
                                    Text("·")
                                        .foregroundStyle(RLColor.labelTertiary)
                                    Text("\(bundle.contents.count) items included")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundStyle(RLColor.labelSecondary)
                                }

                                CreditBadgeView(price: bundle.price, fontSize: 13, iconSize: 11)
                                    .padding(.top, 2)
                            }

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(RLColor.labelTertiary)
                        }

                        if !bundle.contents.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(bundle.contents) { subItem in
                                        BundleContentChip(subItem: subItem)
                                    }
                                }
                            }
                        }
                    }
                    .padding(14)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .strokeBorder(Color.white.opacity(0.12), lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Bundle Content Chip

public struct BundleContentChip: View {
    public let subItem: BundleSubItem

    public init(subItem: BundleSubItem) {
        self.subItem = subItem
    }

    public var body: some View {
        HStack(spacing: 6) {
            if let imageName = subItem.image, UIImage(named: imageName) != nil {
                Image(imageName)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 22, height: 22)
            } else if let img = subItem.image,
                      let cleanName = cleanImageName(img),
                      UIImage(named: cleanName) != nil {
                Image(cleanName)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 22, height: 22)
            } else {
                Circle()
                    .fill(subItem.rarity.map { RLColor.rarityColor(for: $0) } ?? RLColor.rlOrange)
                    .frame(width: 8, height: 8)
            }

            Text(subItem.name)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(RLColor.labelBase)
                .lineLimit(1)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(Color.white.opacity(0.06))
        .clipShape(Capsule())
        .overlay(
            Capsule().strokeBorder(
                (subItem.rarity.map { RLColor.rarityColor(for: $0) } ?? RLColor.rlOrange).opacity(0.35),
                lineWidth: 0.8
            )
        )
    }

    private func cleanImageName(_ path: String?) -> String? {
        guard let path = path else { return nil }
        let filename = (path as NSString).lastPathComponent
        return (filename as NSString).deletingPathExtension
    }
}

// MARK: - Item Image View

public struct ItemImageView: View {
    public let item: ShopItem
    public var maxDimension: CGFloat? = nil

    public init(item: ShopItem, maxDimension: CGFloat? = nil) {
        self.item = item
        self.maxDimension = maxDimension
    }

    public var body: some View {
        if let uiImg = resolveLocalImage() {
            Image(uiImage: uiImg)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(maxWidth: maxDimension, maxHeight: maxDimension)
        } else if let url = item.resolvedImageURL {
            AsyncImage(url: url) { phase in
                switch phase {
                case .empty:
                    ProgressView().tint(RLColor.rlBlue)
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: maxDimension, maxHeight: maxDimension)
                case .failure:
                    placeholderGraphic
                @unknown default:
                    placeholderGraphic
                }
            }
        } else {
            placeholderGraphic
        }
    }

    private func resolveLocalImage() -> UIImage? {
        if let img = item.image, !img.isEmpty {
            if let uiImg = UIImage(named: img) { return uiImg }
            let base = (img as NSString).lastPathComponent
            let clean = (base as NSString).deletingPathExtension
            if let uiImg = UIImage(named: clean) { return uiImg }
            if let uiImg = UIImage(named: "img-\(clean)") { return uiImg }
            if let uiImg = UIImage(named: "art-\(clean)") { return uiImg }
            let pid = clean.split(separator: ".").first.map(String.init) ?? clean
            if let uiImg = UIImage(named: pid) { return uiImg }
            if let uiImg = UIImage(named: "img-\(pid)") { return uiImg }
            if let uiImg = UIImage(named: "art-\(pid)") { return uiImg }
        }
        if let uiImg = UIImage(named: item.id) { return uiImg }
        return nil
    }

    private var placeholderGraphic: some View {
        ZStack {
            Circle()
                .fill(RLColor.rarityColor(for: item.rarity).opacity(0.2))
                .frame(width: 48, height: 48)
            Image(systemName: "sparkles")
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(RLColor.rarityColor(for: item.rarity))
        }
    }

    private func cleanImageName(_ path: String?) -> String? {
        guard let path = path else { return nil }
        let filename = (path as NSString).lastPathComponent
        return (filename as NSString).deletingPathExtension
    }
}

// MARK: - Wishlist Sheet Modal (Pure Liquid Glass)

// MARK: - Wishlist Full Page View (Native NavigationStack + Back button)

public struct WishlistFullPageView: View {
    @EnvironmentObject private var viewModel: ShopViewModel
    @Environment(\.dismiss) private var dismiss

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackgroundView(theme: viewModel.currentTheme)

                if viewModel.wishlistedItems.isEmpty {
                    VStack(spacing: 16) {
                        Spacer()
                        Image(systemName: "heart.slash")
                            .font(.system(size: 54, weight: .light))
                            .foregroundStyle(RLColor.labelTertiary)

                        Text("Your Wishlist is Empty")
                            .font(.system(size: 20, weight: .black))
                            .foregroundStyle(RLColor.labelBase)

                        Text("Tap the heart on any item or bundle sub-item in the shop to track price and rotation alerts.")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(RLColor.labelSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 36)

                        Spacer()
                    }
                    .padding(24)
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 18) {
                            // Total Credits Value Card
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("TOTAL CREDITS NEEDED")
                                        .font(.system(size: 10, weight: .black))
                                        .foregroundStyle(RLColor.labelSecondary)
                                        .tracking(0.6)

                                    Text("\(viewModel.wishlistedItems.count) items tracked")
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundStyle(RLColor.labelTertiary)
                                }

                                Spacer()

                                CreditBadgeView(price: viewModel.wishlistTotalCredits, fontSize: 16, iconSize: 13)
                            }
                            .padding(14)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(Color.white.opacity(0.12), lineWidth: 1))
                            .padding(.horizontal, 16)
                            .padding(.top, 8)

                            // 2-Column Grid of Wishlisted Items
                            LazyVGrid(columns: columns, spacing: 12) {
                                ForEach(viewModel.wishlistedItems) { item in
                                    ItemCardView(
                                        item: item,
                                        isWishlisted: true,
                                        onCardTap: {
                                            viewModel.selectedDetailItem = item
                                            RLHaptics.lightImpact()
                                        },
                                        onWishlistTap: {
                                            viewModel.toggleWishlist(for: item.id)
                                            RLHaptics.selection()
                                        }
                                    )
                                }
                            }
                            .padding(.horizontal, 16)

                            Spacer(minLength: 40)
                        }
                        .padding(.vertical, 8)
                    }
                }
            }
            .navigationTitle("Wishlist")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        RLHaptics.selection()
                        dismiss()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 17, weight: .semibold))
                            Text("Back")
                                .font(.system(size: 17, weight: .regular))
                        }
                        .foregroundStyle(RLColor.rlBlue)
                    }
                }

                if !viewModel.wishlistedItems.isEmpty {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Clear All") {
                            RLHaptics.mediumImpact()
                            for item in viewModel.wishlistedItems {
                                viewModel.toggleWishlist(for: item.id)
                            }
                        }
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Color.red)
                    }
                }
            }
            .sheet(item: $viewModel.selectedDetailItem) { item in
                ItemDetailSheet(item: item)
                    .presentationDetents([.fraction(0.80), .large])
                    .presentationDragIndicator(.visible)
                    .presentationBackground(.clear)
            }
        }
        .preferredColorScheme(viewModel.colorScheme)
    }
}

// MARK: - Settings Full Page View (Native Apple HIG Inset Grouped List + Segmented Theme Selector)

public struct SettingsFullPageView: View {
    @EnvironmentObject private var viewModel: ShopViewModel
    @Environment(\.dismiss) private var dismiss

    @AppStorage("notif_rotation_alert") private var notifRotationAlert: Bool = true
    @AppStorage("notif_wishlist_alert") private var notifWishlistAlert: Bool = true
    @AppStorage("haptic_feedback_enabled") private var hapticsEnabled: Bool = true

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackgroundView(theme: viewModel.currentTheme)

                List {

                    // 1. APPEARANCE & THEME SECTION
                    Section {
                        VStack(alignment: .leading, spacing: 12) {
                            Picker("Appearance", selection: $viewModel.currentTheme) {
                                ForEach(AppTheme.allCases) { theme in
                                    Text(theme.displayName).tag(theme)
                                }
                            }
                            .pickerStyle(.segmented)
                        }
                        .listRowInsets(EdgeInsets(top: 10, leading: 12, bottom: 10, trailing: 12))
                    } header: {
                        Text("APPEARANCE")
                    }
                    .listRowBackground(viewModel.currentTheme.listRowBackground(colorScheme: nil))

                    // 2. SHOP NOTIFICATIONS SECTION
                    Section {
                        Toggle(isOn: $notifRotationAlert) {
                            HStack(spacing: 12) {
                                Image(systemName: "clock.badge.checkmark.fill")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(Color.orange)
                                    .frame(width: 28, height: 28)
                                    .background(Color.orange.opacity(0.12))
                                    .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))

                                VStack(alignment: .leading, spacing: 1) {
                                    Text("Daily Reset Alert")
                                        .font(.system(size: 15, weight: .regular))
                                    Text("Alert at 21:00 UTC")
                                        .font(.system(size: 12, weight: .regular))
                                        .foregroundStyle(RLColor.labelSecondary)
                                }
                            }
                        }

                        Toggle(isOn: $notifWishlistAlert) {
                            HStack(spacing: 12) {
                                Image(systemName: "heart.badge.bolt.fill")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(Color.red)
                                    .frame(width: 28, height: 28)
                                    .background(Color.red.opacity(0.12))
                                    .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))

                                VStack(alignment: .leading, spacing: 1) {
                                    Text("Wishlist Alerts")
                                        .font(.system(size: 15, weight: .regular))
                                    Text("Notify when items enter rotation")
                                        .font(.system(size: 12, weight: .regular))
                                        .foregroundStyle(RLColor.labelSecondary)
                                }
                            }
                        }

                        Toggle(isOn: $hapticsEnabled) {
                            HStack(spacing: 12) {
                                Image(systemName: "iphone.radiowaves.left.and.right")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(RLColor.rlBlue)
                                    .frame(width: 28, height: 28)
                                    .background(RLColor.rlBlueSoft)
                                    .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))

                                Text("Haptic Feedback")
                                    .font(.system(size: 15, weight: .regular))
                            }
                        }
                    } header: {
                        Text("NOTIFICATIONS & ALERTS")
                    }
                    .listRowBackground(viewModel.currentTheme.listRowBackground(colorScheme: nil))

                    // 3. SHOP CONFIGURATION SECTION
                    Section {
                        HStack {
                            HStack(spacing: 12) {
                                Image(systemName: "calendar.badge.clock")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(RLColor.rlOrange)
                                    .frame(width: 28, height: 28)
                                    .background(RLColor.rlOrangeSoft)
                                    .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))

                                Text("Daily Reset Schedule")
                                    .font(.system(size: 15, weight: .regular))
                            }
                            Spacer()
                            Text("21:00 UTC")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(RLColor.rlOrange)
                        }

                        HStack {
                            HStack(spacing: 12) {
                                Image(systemName: "network")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(Color.green)
                                    .frame(width: 28, height: 28)
                                    .background(Color.green.opacity(0.12))
                                    .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))

                                Text("Data Feed")
                                    .font(.system(size: 15, weight: .regular))
                            }
                            Spacer()
                            Text("rlshop.gg API")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(RLColor.labelSecondary)
                        }
                    } header: {
                        Text("SHOP CONFIGURATION")
                    }
                    .listRowBackground(viewModel.currentTheme.listRowBackground(colorScheme: nil))

                    // 4. STORAGE & SYNC SECTION
                    Section {
                        HStack {
                            HStack(spacing: 12) {
                                Image(systemName: "internaldrive.fill")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(Color.gray)
                                    .frame(width: 28, height: 28)
                                    .background(Color.gray.opacity(0.12))
                                    .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))

                                Text("Catalog Cache")
                                    .font(.system(size: 15, weight: .regular))
                            }
                            Spacer()
                            Text(viewModel.diskCacheSizeFormatted)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(RLColor.labelSecondary)
                        }

                        Button {
                            Task {
                                await viewModel.refreshShop()
                                RLHaptics.success()
                            }
                        } label: {
                            HStack {
                                Text("Force Refresh Shop Data")
                                    .foregroundStyle(RLColor.rlBlue)
                                Spacer()
                                Image(systemName: "arrow.clockwise")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(RLColor.rlBlue)
                            }
                        }
                    } header: {
                        Text("STORAGE & CACHE")
                    }
                    .listRowBackground(viewModel.currentTheme.listRowBackground(colorScheme: nil))

                    // 5. ABOUT SECTION
                    Section {
                        HStack {
                            Text("Version")
                            Spacer()
                            Text("2.4.0 (Build 2026.09)")
                                .foregroundStyle(RLColor.labelSecondary)
                        }
                        HStack {
                            Text("Architecture")
                            Spacer()
                            Text("100% Native SwiftUI")
                                .foregroundStyle(RLColor.labelSecondary)
                        }
                    } header: {
                        Text("ABOUT")
                    }
                    .listRowBackground(viewModel.currentTheme.listRowBackground(colorScheme: nil))
                }
                .scrollContentBackground(.hidden)
                .listStyle(.insetGrouped)
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        RLHaptics.selection()
                        dismiss()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 17, weight: .semibold))
                            Text("Back")
                                .font(.system(size: 17, weight: .regular))
                        }
                        .foregroundStyle(RLColor.rlBlue)
                    }
                }
            }
        }
        .preferredColorScheme(viewModel.colorScheme)
    }
}

// MARK: - Bundle Sub Item Detail Card

public struct BundleSubItemDetailCard: View {
    public let subItem: BundleSubItem

    public init(subItem: BundleSubItem) {
        self.subItem = subItem
    }

    public var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill((subItem.rarity.map { RLColor.rarityColor(for: $0) } ?? RLColor.rlOrange).opacity(0.15))
                    .frame(width: 48, height: 48)

                if let img = subItem.image, let uiImg = resolveSubImage(img) {
                    Image(uiImage: uiImg)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 42, height: 42)
                } else {
                    Image(systemName: "sparkles")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(subItem.rarity.map { RLColor.rarityColor(for: $0) } ?? RLColor.rlOrange)
                }
            }
            .frame(width: 50, height: 50)
            .background(Color.white.opacity(0.04))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            VStack(alignment: .leading, spacing: 3) {
                Text(subItem.name)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(RLColor.labelBase)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    if let type = subItem.type {
                        Text(type.uppercased())
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(RLColor.labelSecondary)
                    }

                    if let rarity = subItem.rarity {
                        Text("•")
                            .font(.system(size: 9))
                            .foregroundStyle(RLColor.labelTertiary)
                        Text(rarity.displayName)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(RLColor.rarityColor(for: rarity))
                    }
                }

                if let paint = subItem.paint, !paint.isEmpty && paint.lowercased() != "none" {
                    PaintChipView(paint: paint)
                        .padding(.top, 1)
                }
            }

            Spacer()
        }
        .padding(10)
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(
                    (subItem.rarity.map { RLColor.rarityColor(for: $0) } ?? Color.white.opacity(0.1)).opacity(0.3),
                    lineWidth: 0.8
                )
        )
    }

    private func resolveSubImage(_ path: String) -> UIImage? {
        if let cached = RLImageCache.shared.image(forKey: path) {
            return cached
        }
        var resolved: UIImage? = nil
        if let uiImg = UIImage(named: path) { resolved = uiImg }
        else {
            let base = (path as NSString).lastPathComponent
            let clean = (base as NSString).deletingPathExtension
            if let uiImg = UIImage(named: clean) { resolved = uiImg }
            else if let uiImg = UIImage(named: "img-\(clean)") { resolved = uiImg }
            else if let uiImg = UIImage(named: "art-\(clean)") { resolved = uiImg }
            else {
                let pid = clean.split(separator: ".").first.map(String.init) ?? clean
                if let uiImg = UIImage(named: pid) { resolved = uiImg }
                else if let uiImg = UIImage(named: "img-\(pid)") { resolved = uiImg }
                else if let uiImg = UIImage(named: "art-\(pid)") { resolved = uiImg }
            }
        }
        if let resolved = resolved {
            RLImageCache.shared.setImage(resolved, forKey: path)
        }
        return resolved
    }
}

// MARK: - Bundle Sub-Item Rich Grid Card (Clickable + Wishlistable + Big Art)

public struct BundleSubItemGridCard: View {
    public let subItem: BundleSubItem
    public let isWishlisted: Bool
    public let onCardTap: () -> Void
    public let onWishlistTap: () -> Void

    public var body: some View {
        Button(action: onCardTap) {
            VStack(alignment: .leading, spacing: 0) {
                // Top Art Container with dynamic rarity glow + Wishlist Heart
                ZStack(alignment: .topTrailing) {
                    ZStack {
                        RadialGradient(
                            colors: [
                                (subItem.rarity.map { RLColor.rarityColor(for: $0) } ?? RLColor.rlOrange).opacity(0.32),
                                Color(hex: "13161C").opacity(0.85)
                            ],
                            center: .center,
                            startRadius: 5,
                            endRadius: 90
                        )

                        if let img = subItem.image, let uiImg = resolveSubImage(img) {
                            Image(uiImage: uiImg)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(height: 100)
                                .padding(8)
                                .shadow(color: (subItem.rarity.map { RLColor.rarityColor(for: $0) } ?? RLColor.rlOrange).opacity(0.4), radius: 8)
                        } else {
                            Image(systemName: "sparkles")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundStyle(subItem.rarity.map { RLColor.rarityColor(for: $0) } ?? RLColor.rlOrange)
                                .frame(height: 100)
                        }
                    }
                    .frame(height: 125)
                    .frame(maxWidth: .infinity)
                    .clipped()

                    // Heart Wishlist Button
                    Button {
                        onWishlistTap()
                    } label: {
                        Image(systemName: isWishlisted ? "heart.fill" : "heart")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(isWishlisted ? Color.red : Color.white.opacity(0.85))
                            .padding(7)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                            .overlay(Circle().strokeBorder(Color.white.opacity(0.25), lineWidth: 0.8))
                    }
                    .buttonStyle(.plain)
                    .padding(8)

                    // Paint Swatch Badge
                    if let paint = subItem.paint, !paint.isEmpty && paint.lowercased() != "none" {
                        VStack {
                            Spacer()
                            HStack {
                                PaintChipView(paint: paint)
                                    .padding(8)
                                Spacer()
                            }
                        }
                    }
                }

                // Sub-Item Metadata Row
                VStack(alignment: .leading, spacing: 4) {
                    Text(subItem.name)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(RLColor.labelBase)
                        .lineLimit(1)

                    if let type = subItem.type {
                        HStack(spacing: 4) {
                            Circle()
                                .fill(subItem.rarity.map { RLColor.rarityColor(for: $0) } ?? RLColor.rlOrange)
                                .frame(width: 5, height: 5)
                            Text(type.uppercased())
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(RLColor.labelSecondary)
                                .lineLimit(1)
                        }
                    }

                    if let rarity = subItem.rarity {
                        HStack {
                            Text(rarity.displayName.uppercased())
                                .font(.system(size: 9, weight: .black))
                                .foregroundStyle(RLColor.rarityColor(for: rarity))
                            Spacer()
                            Text("INCLUDED")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(RLColor.rlOrange)
                        }
                        .padding(.top, 2)
                    }
                }
                .padding(10)
                .background(.ultraThinMaterial)
            }
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(
                        LinearGradient(
                            colors: [
                                (subItem.rarity.map { RLColor.rarityColor(for: $0) } ?? Color.white.opacity(0.15)).opacity(0.6),
                                Color.white.opacity(0.06)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
            .shadow(color: Color.black.opacity(0.4), radius: 6, y: 3)
        }
        .buttonStyle(.plain)
    }

    private func resolveSubImage(_ path: String) -> UIImage? {
        if let cached = RLImageCache.shared.image(forKey: path) {
            return cached
        }
        var resolved: UIImage? = nil
        if let uiImg = UIImage(named: path) { resolved = uiImg }
        else {
            let base = (path as NSString).lastPathComponent
            let clean = (base as NSString).deletingPathExtension
            if let uiImg = UIImage(named: clean) { resolved = uiImg }
            else if let uiImg = UIImage(named: "img-\(clean)") { resolved = uiImg }
            else if let uiImg = UIImage(named: "art-\(clean)") { resolved = uiImg }
            else {
                let pid = clean.split(separator: ".").first.map(String.init) ?? clean
                if let uiImg = UIImage(named: pid) { resolved = uiImg }
                else if let uiImg = UIImage(named: "img-\(pid)") { resolved = uiImg }
                else if let uiImg = UIImage(named: "art-\(pid)") { resolved = uiImg }
            }
        }
        if let resolved = resolved {
            RLImageCache.shared.setImage(resolved, forKey: path)
        }
        return resolved
    }
}

// MARK: - Bundle Full Page Detail View (Replaces small popup with full page + return button)

public struct BundleDetailFullView: View {
    public let bundle: ShopItem
    @EnvironmentObject private var viewModel: ShopViewModel
    @Environment(\.dismiss) private var dismiss

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    public init(bundle: ShopItem) {
        self.bundle = bundle
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                LiquidGlassBackgroundView()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Hero Bundle Art Banner
                        ZStack {
                            RoundedRectangle(cornerRadius: 22, style: .continuous)
                                .fill(Color.white.opacity(0.04))

                            RadialGradient(
                                colors: [
                                    RLColor.rlOrange.opacity(0.20),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 20,
                                endRadius: 160
                            )

                            ItemImageView(item: bundle, maxDimension: 220)
                                .padding(16)
                        }
                        .frame(height: 220)
                        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 22, style: .continuous)
                                .strokeBorder(Color.white.opacity(0.12), lineWidth: 1)
                        )
                        .padding(.horizontal, 16)
                        .padding(.top, 8)

                        // Bundle Title & Price
                        VStack(alignment: .leading, spacing: 6) {
                            Text(bundle.name)
                                .font(.system(size: 26, weight: .black))
                                .foregroundStyle(RLColor.labelBase)

                            HStack {
                                CreditBadgeView(price: bundle.price, fontSize: 18, iconSize: 14)

                                Spacer()

                                Text("\(bundle.contents.count) Included Items")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(RLColor.labelSecondary)
                            }
                        }
                        .padding(.horizontal, 16)

                        Divider()
                            .background(Color.white.opacity(0.1))
                            .padding(.horizontal, 16)

                        // Included Items Section Header
                        HStack {
                            Text("ALL ITEMS INCLUDED")
                                .font(.system(size: 12, weight: .black))
                                .foregroundStyle(RLColor.labelBase)
                                .tracking(0.6)

                            Spacer()

                            Text("INDIVIDUAL VALUE: \(calculateTotalValue()) CR")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(RLColor.labelTertiary)
                        }
                        .padding(.horizontal, 16)

                        // Full 2-Column Grid of Large Clickable & Wishlistable Items
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(bundle.contents) { subItem in
                                BundleSubItemGridCard(
                                    subItem: subItem,
                                    isWishlisted: viewModel.isWishlisted(id: subItem.effectiveID),
                                    onCardTap: {
                                        viewModel.selectedDetailItem = subItem.asShopItem
                                        RLHaptics.lightImpact()
                                    },
                                    onWishlistTap: {
                                        viewModel.toggleWishlist(for: subItem.effectiveID)
                                        RLHaptics.selection()
                                    }
                                )
                            }
                        }
                        .padding(.horizontal, 16)

                        // Wishlist / Action Button
                        VStack(spacing: 12) {
                            Button {
                                viewModel.toggleWishlist(for: bundle.id)
                                RLHaptics.mediumImpact()
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: viewModel.isWishlisted(id: bundle.id) ? "heart.slash.fill" : "heart.fill")
                                        .font(.system(size: 15, weight: .bold))

                                    Text(viewModel.isWishlisted(id: bundle.id) ? "Remove Bundle from Wishlist" : "Add Bundle to Wishlist")
                                        .font(.system(size: 15, weight: .bold))
                                }
                                .foregroundStyle(Color.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 52)
                                .background(
                                    LinearGradient(
                                        colors: viewModel.isWishlisted(id: bundle.id) ?
                                        [Color.red.opacity(0.85), Color.red.opacity(0.65)] :
                                        [RLColor.rlOrange, RLColor.rlOrange.opacity(0.8)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                                .shadow(color: RLColor.rlOrange.opacity(0.35), radius: 10, y: 4)
                            }
                            .buttonStyle(SpringCardButtonStyle())
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 10)
                        .padding(.bottom, 32)
                    }
                    .padding(.vertical, 8)
                }
            }
            .navigationTitle("Bundle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        RLHaptics.selection()
                        dismiss()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 17, weight: .semibold))
                            Text("Back")
                                .font(.system(size: 17, weight: .regular))
                        }
                        .foregroundStyle(RLColor.rlBlue)
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        viewModel.toggleWishlist(for: bundle.id)
                        RLHaptics.selection()
                    } label: {
                        Image(systemName: viewModel.isWishlisted(id: bundle.id) ? "heart.fill" : "heart")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(viewModel.isWishlisted(id: bundle.id) ? Color.red : RLColor.labelBase)
                    }
                }
            }
            .sheet(item: $viewModel.selectedDetailItem) { item in
                ItemDetailSheet(item: item)
                    .presentationDetents([.fraction(0.80), .large])
                    .presentationDragIndicator(.visible)
                    .presentationBackground(.clear)
            }
        }
    }

    private func calculateTotalValue() -> Int {
        bundle.price + (bundle.contents.count * 200)
    }
}

// MARK: - Item Detail Sheet (Pure Liquid Glass Modal)

public struct ItemDetailSheet: View {
    public let item: ShopItem
    @EnvironmentObject private var viewModel: ShopViewModel
    @Environment(\.dismiss) private var dismiss

    public init(item: ShopItem) {
        self.item = item
    }

    public var body: some View {
        ZStack {
            LiquidGlassBackgroundView()

            VStack(spacing: 0) {
                HStack {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(RLColor.rarityColor(for: item.rarity))
                            .frame(width: 8, height: 8)

                        Text(item.rarity.displayName.uppercased())
                            .font(.system(size: 11, weight: .black))
                            .foregroundStyle(RLColor.rarityColor(for: item.rarity))
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule())
                    .overlay(Capsule().strokeBorder(RLColor.rarityColor(for: item.rarity).opacity(0.4), lineWidth: 1))

                    if let paint = item.paint {
                        PaintChipView(paint: paint)
                    }

                    Spacer()

                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 22))
                            .foregroundStyle(RLColor.labelTertiary)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)

                ScrollView {
                    VStack(spacing: 20) {
                        ZStack {
                            RadialGradient(
                                colors: [
                                    RLColor.rarityColor(for: item.rarity).opacity(0.45),
                                    Color.clear
                                ],
                                center: .center,
                                startRadius: 10,
                                endRadius: 140
                            )
                            .frame(height: 220)

                            ItemImageView(item: item, maxDimension: 180)
                                .shadow(color: RLColor.rarityColor(for: item.rarity).opacity(0.6), radius: 20)
                        }
                        .frame(height: 220)

                        VStack(spacing: 4) {
                            Text(item.name)
                                .font(.system(size: 22, weight: .black))
                                .foregroundStyle(RLColor.labelBase)

                            Text(item.type.uppercased())
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(RLColor.labelSecondary)
                                .tracking(1)

                            CreditBadgeView(price: item.price, fontSize: 16, iconSize: 13)
                                .padding(.top, 6)
                        }

                        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                            attributeCard(title: "SECTION", value: item.category?.uppercased() ?? "ITEM SHOP")
                            attributeCard(title: "RESET", value: "Today 21:00 UTC")
                            attributeCard(title: "SLOT TYPE", value: item.type)
                            attributeCard(title: "RARITY", value: item.rarity.displayName)
                        }
                        .padding(.horizontal, 16)

                        // Bundle Contents Breakdown Section
                        if !item.contents.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Text("ITEMS INCLUDED IN THIS BUNDLE")
                                        .font(.system(size: 11, weight: .black))
                                        .foregroundStyle(RLColor.rlOrange)
                                        .tracking(0.5)

                                    Spacer()

                                    Text("\(item.contents.count) ITEMS")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(RLColor.labelSecondary)
                                        .padding(.horizontal, 7)
                                        .padding(.vertical, 3)
                                        .background(RLColor.rlOrange.opacity(0.12), in: Capsule())
                                }

                                VStack(spacing: 8) {
                                    ForEach(item.contents) { subItem in
                                        BundleSubItemDetailCard(subItem: subItem)
                                    }
                                }
                            }
                            .padding(.horizontal, 16)
                        }

                        VStack(spacing: 12) {
                            Button {
                                viewModel.toggleWishlist(for: item.id)
                                RLHaptics.mediumImpact()
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: viewModel.isWishlisted(id: item.id) ? "heart.slash.fill" : "heart.fill")
                                        .font(.system(size: 14, weight: .bold))

                                    Text(viewModel.isWishlisted(id: item.id) ? "Remove from Wishlist" : "Add to Wishlist")
                                        .font(.system(size: 15, weight: .bold))
                                }
                                .foregroundStyle(Color.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(
                                    LinearGradient(
                                        colors: viewModel.isWishlisted(id: item.id) ?
                                        [Color.red.opacity(0.85), Color.red.opacity(0.65)] :
                                        [RLColor.rlBlue, RLColor.rlBlue.opacity(0.75)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .shadow(color: (viewModel.isWishlisted(id: item.id) ? Color.red : RLColor.rlBlue).opacity(0.4), radius: 8)
                            }
                            .buttonStyle(.plain)

                            Button {
                                dismiss()
                            } label: {
                                Text("Close")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(RLColor.labelSecondary)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 44)
                                    .background(.ultraThinMaterial)
                                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                    .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Color.white.opacity(0.12), lineWidth: 1))
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                        .padding(.bottom, 24)
                    }
                }
            }
        }
    }

    private func attributeCard(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 10, weight: .black))
                .foregroundStyle(RLColor.labelTertiary)
                .tracking(0.5)

            Text(value)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(RLColor.labelBase)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(Color.white.opacity(0.12), lineWidth: 1)
        )
    }
}



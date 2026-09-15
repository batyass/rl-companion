//
//  Models.swift
//  RLCompanion
//
//  Data models for Rocket League shop, rarities, categories, and filters.
//

import Foundation

// MARK: - Rarity

public enum Rarity: String, CaseIterable, Identifiable, Codable, Sendable, Hashable {
    case blackMarket = "Black Market"
    case exotic = "Exotic"
    case importRarity = "Import"
    case veryRare = "Very Rare"
    case rare = "Rare"
    case limited = "Limited"
    case uncommon = "Uncommon"
    case common = "Common"
    case unknown = "Unknown"

    public var id: String { rawValue }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let raw = try container.decode(String.self)
        let normalized = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        
        switch normalized.lowercased() {
        case "black market", "blackmarket", "bm":
            self = .blackMarket
        case "exotic":
            self = .exotic
        case "import":
            self = .importRarity
        case "very rare", "veryrare", "vr":
            self = .veryRare
        case "rare":
            self = .rare
        case "limited":
            self = .limited
        case "uncommon":
            self = .uncommon
        case "common":
            self = .common
        default:
            self = Rarity(rawValue: normalized) ?? .unknown
        }
    }

    public var displayName: String {
        switch self {
        case .blackMarket:
            return "Black Market"
        case .exotic:
            return "Exotic"
        case .importRarity:
            return "Import"
        case .veryRare:
            return "Very Rare"
        case .rare:
            return "Rare"
        case .limited:
            return "Limited"
        case .uncommon:
            return "Uncommon"
        case .common:
            return "Common"
        case .unknown:
            return "Other"
        }
    }

    public var colorHex: String {
        switch self {
        case .blackMarket:
            return "FF2D94" // RL Black Market Magenta
        case .exotic:
            return "FFB84D" // RL Exotic Gold
        case .importRarity:
            return "EB4B4B" // RL Import Crimson
        case .veryRare:
            return "8847FF" // RL Very Rare Purple
        case .rare:
            return "3A86FF" // RL Rare Cobalt Blue
        case .limited:
            return "FF7700" // RL Limited Bright Orange (Not green)
        case .uncommon:
            return "80E0FF" // RL Uncommon Light Cyan (Not green)
        case .common:
            return "98989D" // RL Common Slate
        case .unknown:
            return "636366"
        }
    }

    public var glowOpacity: Double {
        switch self {
        case .blackMarket:
            return 0.45
        case .exotic:
            return 0.40
        case .importRarity:
            return 0.35
        case .veryRare:
            return 0.35
        case .rare:
            return 0.30
        case .limited:
            return 0.30
        case .uncommon:
            return 0.20
        case .common, .unknown:
            return 0.0
        }
    }

    public var hasBorder: Bool {
        switch self {
        case .blackMarket, .exotic, .importRarity, .veryRare, .rare:
            return true
        case .limited, .uncommon, .common, .unknown:
            return false
        }
    }

    public var sortOrder: Int {
        switch self {
        case .blackMarket: return 1
        case .exotic: return 2
        case .importRarity: return 3
        case .veryRare: return 4
        case .rare: return 5
        case .limited: return 6
        case .uncommon: return 7
        case .common: return 8
        case .unknown: return 9
        }
    }
}

// MARK: - Category

public enum Category: String, CaseIterable, Identifiable, Codable, Sendable, Hashable {
    case all = "all"
    case featured = "featured"
    case customs = "customs"
    case collabs = "collabs"
    case bundles = "bundles"
    case rlcs = "rlcs"

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .all:
            return "All"
        case .featured:
            return "Featured Shop"
        case .customs:
            return "Supersonic Customs"
        case .collabs:
            return "Special Collabs"
        case .bundles:
            return "Bundles"
        case .rlcs:
            return "RLCS Esports"
        }
    }

    public var iconName: String {
        switch self {
        case .all:
            return "square.grid.2x2"
        case .featured:
            return "sparkles"
        case .customs:
            return "gauge.with.dots.needle.bottom.50percent"
        case .collabs:
            return "car.side.fill"
        case .bundles:
            return "shippingbox.fill"
        case .rlcs:
            return "trophy.fill"
        }
    }
}

// MARK: - Paint Color

public enum PaintColor: String, CaseIterable, Identifiable, Codable, Sendable, Hashable {
    case titaniumWhite = "Titanium White"
    case crimson = "Crimson"
    case skyBlue = "Sky Blue"
    case cobalt = "Cobalt"
    case saffron = "Saffron"
    case purple = "Purple"
    case lime = "Lime"
    case forestGreen = "Forest Green"
    case orange = "Orange"
    case pink = "Pink"
    case burntSienna = "Burnt Sienna"
    case grey = "Grey"
    case black = "Black"
    case gold = "Gold"

    public var id: String { rawValue }

    public var hex: String {
        switch self {
        case .titaniumWhite: return "FFFFFF"
        case .crimson: return "FF3B30"
        case .skyBlue: return "5AC8FA"
        case .cobalt: return "007AFF"
        case .saffron: return "FFCC00"
        case .purple: return "AF52DE"
        case .lime: return "34C759"
        case .forestGreen: return "28CD41"
        case .orange: return "FF9500"
        case .pink: return "FF2D55"
        case .burntSienna: return "A2845E"
        case .grey: return "8E8E93"
        case .black: return "1C1C1E"
        case .gold: return "FFD700"
        }
    }

    public var displayName: String {
        switch self {
        case .titaniumWhite: return "Titanium White"
        case .crimson: return "Crimson"
        case .skyBlue: return "Sky Blue"
        case .cobalt: return "Cobalt"
        case .saffron: return "Saffron"
        case .purple: return "Purple"
        case .lime: return "Lime"
        case .forestGreen: return "Forest Green"
        case .orange: return "Orange"
        case .pink: return "Pink"
        case .burntSienna: return "Burnt Sienna"
        case .grey: return "Grey"
        case .black: return "Black"
        case .gold: return "Gold"
        }
    }

    public static func from(string: String?) -> PaintColor? {
        guard let string = string, !string.isEmpty else { return nil }
        let lower = string.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        switch lower {
        case "blanc titane", "white", "titanium white", "tw": return .titaniumWhite
        case "carmin", "crimson": return .crimson
        case "bleu ciel", "sky blue", "sb": return .skyBlue
        case "cobalt": return .cobalt
        case "safran", "saffron": return .saffron
        case "violet", "purple": return .purple
        case "lime": return .lime
        case "vert forêt", "vert foret", "forest green", "fg": return .forestGreen
        case "orange": return .orange
        case "rose", "pink": return .pink
        case "terre de sienne", "burnt sienna", "bs": return .burntSienna
        case "gris", "grey", "gray": return .grey
        case "noir", "black": return .black
        case "or", "gold": return .gold
        default:
            return PaintColor.allCases.first {
                $0.rawValue.lowercased() == lower || $0.displayName.lowercased() == lower
            }
        }
    }
}

// MARK: - Bundle Content Item

public struct BundleSubItem: Identifiable, Codable, Sendable, Hashable {
    public var id: String
    public var name: String
    public var type: String?
    public var paint: String?
    public var rarity: Rarity?
    public var image: String?

    public init(
        id: String = UUID().uuidString,
        name: String,
        type: String? = nil,
        paint: String? = nil,
        rarity: Rarity? = nil,
        image: String? = nil
    ) {
        self.id = id
        self.name = name
        self.type = type
        self.paint = paint
        self.rarity = rarity
        self.image = image
    }

    public var effectiveID: String {
        if !id.isEmpty && id != "null" { return id }
        let cleanName = name.lowercased().replacingOccurrences(of: " ", with: "-").replacingOccurrences(of: ":", with: "")
        let cleanPaint = (paint ?? "").lowercased().replacingOccurrences(of: " ", with: "-")
        return "sub-\(cleanName)-\(cleanPaint)"
    }

    public var asShopItem: ShopItem {
        ShopItem(
            id: effectiveID,
            name: name,
            paint: paint,
            type: type ?? "Item",
            category: type ?? "Item",
            rarity: rarity ?? .rare,
            price: 0,
            image: image,
            shop: "bundle-item"
        )
    }
}

// MARK: - Price

public struct Price: Codable, Sendable, Hashable, Comparable, CustomStringConvertible {
    public let credits: Int

    public init(_ credits: Int = 0) {
        self.credits = credits
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let intVal = try? container.decode(Int.self) {
            self.credits = intVal
        } else if let strVal = try? container.decode(String.self), let intVal = Int(strVal) {
            self.credits = intVal
        } else {
            self.credits = 0
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(credits)
    }

    public var description: String {
        "\(credits)"
    }

    public var formatted: String {
        "\(credits)"
    }

    public static func < (lhs: Price, rhs: Price) -> Bool {
        lhs.credits < rhs.credits
    }
}

// MARK: - Shop Item

public struct ShopItem: Identifiable, Codable, Sendable, Hashable {
    public let id: String
    public let name: String
    public let paint: String?
    public let type: String
    public let category: String?
    public let rarity: Rarity
    public let price: Int
    public let image: String?
    public let visual: String?
    public let contents: [BundleSubItem]
    public let shop: String?
    public let featured: Bool?
    public let endDate: Date?

    public init(
        id: String,
        name: String,
        paint: String? = nil,
        type: String,
        category: String? = nil,
        rarity: Rarity,
        price: Int,
        image: String? = nil,
        visual: String? = nil,
        contents: [BundleSubItem] = [],
        shop: String? = nil,
        featured: Bool? = nil,
        endDate: Date? = nil
    ) {
        self.id = id
        self.name = name
        self.paint = paint
        self.type = type
        self.category = category
        self.rarity = rarity
        self.price = price
        self.image = image
        self.visual = visual
        self.contents = contents
        self.shop = shop
        self.featured = featured
        self.endDate = endDate
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case paint
        case type
        case category
        case rarity
        case price
        case image
        case visual
        case contents
        case shop
        case featured
        case endDate = "end_date"
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        self.id = try container.decodeIfPresent(String.self, forKey: .id) ?? UUID().uuidString
        self.name = try container.decodeIfPresent(String.self, forKey: .name) ?? "Unnamed Item"
        self.paint = try container.decodeIfPresent(String.self, forKey: .paint)
        self.type = try container.decodeIfPresent(String.self, forKey: .type) ?? "Item"
        self.category = try container.decodeIfPresent(String.self, forKey: .category)
        self.rarity = (try? container.decodeIfPresent(Rarity.self, forKey: .rarity)) ?? .unknown
        
        if let priceInt = try? container.decodeIfPresent(Int.self, forKey: .price) {
            self.price = priceInt
        } else if let priceString = try? container.decodeIfPresent(String.self, forKey: .price),
                  let priceInt = Int(priceString) {
            self.price = priceInt
        } else {
            self.price = 0
        }

        self.image = try container.decodeIfPresent(String.self, forKey: .image)
        self.visual = try container.decodeIfPresent(String.self, forKey: .visual)
        self.shop = try container.decodeIfPresent(String.self, forKey: .shop)
        self.featured = try container.decodeIfPresent(Bool.self, forKey: .featured)

        // Contents may be objects or strings in different JSON dumps
        if let decodedContents = try? container.decodeIfPresent([BundleSubItem].self, forKey: .contents) {
            self.contents = decodedContents
        } else if let stringContents = try? container.decodeIfPresent([String].self, forKey: .contents) {
            self.contents = stringContents.map { BundleSubItem(name: $0) }
        } else {
            self.contents = []
        }

        if let dateString = try? container.decodeIfPresent(String.self, forKey: .endDate) {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            self.endDate = formatter.date(from: dateString) ?? ISO8601DateFormatter().date(from: dateString)
        } else {
            self.endDate = nil
        }
    }

    // MARK: - Computed Properties

    public var isBundle: Bool {
        if category?.lowercased() == "bundles" { return true }
        if shop?.lowercased() == "bundles" { return true }
        return !contents.isEmpty
    }

    public var displayTitle: String {
        if isBundle && (name == "ROCKET LEAGUE" || name.isEmpty) {
            if id.contains("world-championship") {
                return "World Championship Pack"
            }
            if id.contains("worlds-legacy-bundle-0") || contents.contains(where: { $0.name.lowercased().contains("looperstar") }) {
                return "Worlds Legacy: Looperstar Pack"
            }
            if id.contains("worlds-legacy-bundle-1") || contents.contains(where: { $0.name.lowercased().contains("tesseract") }) {
                return "Worlds Legacy: Tesseract Pack"
            }
            if id.contains("worlds-legacy-bundle-2") || contents.contains(where: { $0.name.lowercased().contains("crystalline") }) {
                return "RLCS Crystalline Pack"
            }
            if id.contains("worlds-legacy") {
                return "Worlds Legacy Championship Pack"
            }
            return "Championship Pack"
        }
        return name
    }

    public var bundleCategoryTag: String {
        guard let s = shop?.lowercased() else { return "BUNDLE" }
        if s == "electric-wave" { return "ELECTRIC WAVE" }
        if s.contains("world-championship") || s.contains("worlds-legacy") { return "CHAMPIONSHIP" }
        if s == "bundles" { return "FEATURED" }
        return "BUNDLE"
    }

    public var rlcsTeamName: String? {
        guard shop?.lowercased() == "rlcs" else { return nil }
        var clean = name
        if let colonIdx = clean.firstIndex(of: ":") {
            clean = String(clean[clean.index(after: colonIdx)...]).trimmingCharacters(in: .whitespaces)
        }
        clean = clean
            .replacingOccurrences(of: "(2026)", with: "")
            .replacingOccurrences(of: "(2025)", with: "")
            .replacingOccurrences(of: "(2024)", with: "")
            .trimmingCharacters(in: .whitespaces)
        return clean.isEmpty ? nil : clean
    }

    public var isEsportsTeamItem: Bool {
        shop?.lowercased() == "rlcs"
    }

    public var formattedPrice: String {
        "\(price)"
    }

    public var priceValue: Price {
        Price(price)
    }

    public var isPainted: Bool {
        guard let paint = paint else { return false }
        return !paint.isEmpty && paint.lowercased() != "none" && paint.lowercased() != "default"
    }

    public var parsedPaint: PaintColor? {
        PaintColor.from(string: paint)
    }

    public var resolvedImageURL: URL? {
        guard let image = image, !image.isEmpty else { return nil }
        if image.hasPrefix("http://") || image.hasPrefix("https://") {
            return URL(string: image)
        }
        
        let cleaned = image.hasPrefix("/") ? String(image.dropFirst()) : image
        let path: String
        if cleaned.hasPrefix("data/") || cleaned.hasPrefix("img/") {
            path = cleaned
        } else if cleaned.hasPrefix("img-") {
            path = "data/img/\(cleaned).png"
        } else {
            path = "data/img/\(cleaned)"
        }
        let baseURL = "https://batyass.github.io/rl-companion/"
        return URL(string: baseURL + path)
    }
}

// MARK: - Shop Data Container

public struct ShopData: Codable, Sendable {
    public let source: String?
    public let count: Int?
    public let items: [ShopItem]
    public let lastUpdated: String?

    enum CodingKeys: String, CodingKey {
        case source
        case count
        case items
        case lastUpdated = "last_updated"
    }

    public init(source: String? = nil, count: Int? = nil, items: [ShopItem] = [], lastUpdated: String? = nil) {
        self.source = source
        self.count = count
        self.items = items
        self.lastUpdated = lastUpdated
    }
}

// MARK: - Shop Section

public struct ShopSection: Identifiable, Sendable, Hashable {
    public let id: String
    public let title: String
    public let category: Category
    public let items: [ShopItem]

    public init(id: String = UUID().uuidString, title: String, category: Category, items: [ShopItem]) {
        self.id = id
        self.title = title
        self.category = category
        self.items = items
    }
}

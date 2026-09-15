import Foundation

struct TestSubItem: Codable {
    let id: String?
    let name: String
    let paint: String?
    let type: String?
    let rarity: String?
    let image: String?
}

struct TestItem: Codable {
    let id: String
    let name: String
    let paint: String?
    let type: String?
    let category: String?
    let rarity: String?
    let price: Int?
    let shop: String?
    let bundle: Bool?
    let is_bundle: Bool?
    let contents: [TestSubItem]?
    
    var isBundle: Bool {
        if category?.lowercased() == "bundles" { return true }
        if bundle == true || is_bundle == true { return true }
        return !(contents?.isEmpty ?? true)
    }
}

struct TestShopData: Codable {
    let items: [TestItem]
}

let data = try! Data(contentsOf: URL(fileURLWithPath: "/Users/batyass/projects/rl-companion/ios/RLCompanion/shop.json"))
let shopData = try! JSONDecoder().decode(TestShopData.self, from: data)

let trademarkCollabShops: Set<String> = [
    "cadillac-blackwing",
    "lamborghini-doja-cat",
    "jeep-wrangler-tomb-raider",
    "chrysler-pacifica",
    "cybertruck",
    "beskar",
    "bttf",
    "mclaren",
    "porsche",
    "ford",
    "fast-and-furious",
    "batman",
    "transformers",
    "star-wars",
    "avatar",
    "tmnt"
]

let nonCollabBundleShops: Set<String> = [
    "bundles",
    "electric-wave",
    "rocket-league-world-championship",
    "rocket-league-worlds-legacy"
]

let rlcs = shopData.items.filter { ($0.shop?.lowercased() ?? "") == "rlcs" }
let collabs = shopData.items.filter { item in
    guard let s = item.shop?.lowercased() else { return false }
    return trademarkCollabShops.contains(s)
}
let bundles = shopData.items.filter { item in
    let s = item.shop?.lowercased() ?? ""
    if nonCollabBundleShops.contains(s) { return true }
    if item.isBundle && !trademarkCollabShops.contains(s) && s != "rlcs" {
        return true
    }
    return false
}
let featured = shopData.items.filter { ($0.shop?.lowercased() ?? "") == "featured" }
let daily = shopData.items.filter { ($0.shop?.lowercased() ?? "") == "supersonic" }

print("RLCS count: \(rlcs.count)")
print("Collabs count: \(collabs.count)")
print("Bundles count: \(bundles.count)")
print("Featured count: \(featured.count)")
print("Daily/Customs count: \(daily.count)")
print("Total sum: \(rlcs.count + collabs.count + bundles.count + featured.count + daily.count)")

print("\n--- Bundles detail ---")
for b in bundles {
    print("[\(b.shop ?? "")] \(b.name) - type: \(b.type ?? "") - isBundle: \(b.isBundle) - price: \(b.price ?? 0) - contents: \(b.contents?.count ?? 0)")
}

//
//  RLCompanionApp.swift
//  RLCompanion
//
//  Main entry point for the native iOS RL Companion app.
//

import SwiftUI

@main
struct RLCompanionApp: App {
    @StateObject private var viewModel = ShopViewModel()

    init() {
        // Configure native appearance for tab bar and navigation bar
        let appearance = UITabBarAppearance()
        appearance.configureWithDefaultBackground()
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance

        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithTransparentBackground()
        navAppearance.largeTitleTextAttributes = [
            .foregroundColor: UIColor.label
        ]
        navAppearance.titleTextAttributes = [
            .foregroundColor: UIColor.label
        ]
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
    }

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(viewModel)
                .withTheme(viewModel.currentTheme)
                .tint(RLColor.rlBlue)
                .background(viewModel.currentTheme.canvasColor(colorScheme: nil))
                .onOpenURL { url in
                    handleDeepLink(url: url)
                }
        }
    }

    private func handleDeepLink(url: URL) {
        // Deep link scheme support: rlcompanion://shop/item/<id>
        guard url.scheme == "rlcompanion" else { return }
        let pathComponents = url.pathComponents
        if pathComponents.contains("item"), let itemId = pathComponents.last {
            if let matchedItem = viewModel.items.first(where: { $0.id == itemId }) {
                print("Deep link to item: \(matchedItem.name)")
            }
        }
    }
}

// MARK: - UIColor Helper

extension UIColor {
    convenience init(hex: String, alpha: CGFloat = 1.0) {
        let hexClean = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hexClean).scanHexInt64(&int)
        let r, g, b: CGFloat
        switch hexClean.count {
        case 3:
            r = CGFloat((int >> 8) * 17) / 255.0
            g = CGFloat((int >> 4 & 0xF) * 17) / 255.0
            b = CGFloat((int & 0xF) * 17) / 255.0
        case 6:
            r = CGFloat((int >> 16) & 0xFF) / 255.0
            g = CGFloat((int >> 8) & 0xFF) / 255.0
            b = CGFloat(int & 0xFF) / 255.0
        default:
            r = 1.0
            g = 1.0
            b = 1.0
        }
        self.init(red: r, green: g, blue: b, alpha: alpha)
    }
}

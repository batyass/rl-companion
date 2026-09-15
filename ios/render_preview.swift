import Cocoa
import SwiftUI

// MARK: - Standalone Render Runner

@MainActor
func renderAndSave() {
    let vm = ShopViewModel(autoFetch: false)
    vm.items = ShopViewModel.sampleItems
    
    let rootView = MainTabView()
        .environmentObject(vm)
        .preferredColorScheme(.dark)
        .frame(width: 393, height: 852)
        .background(Color(hex: "090B0E"))

    let hostingView = NSHostingView(rootView: rootView)
    hostingView.frame = NSRect(x: 0, y: 0, width: 393, height: 852)
    hostingView.layoutSubtreeIfNeeded()
    
    guard let bitmapRep = hostingView.bitmapImageRepForCachingDisplay(in: hostingView.bounds) else {
        print("Failed to create bitmapImageRep")
        exit(1)
    }
    
    hostingView.cacheDisplay(in: hostingView.bounds, to: bitmapRep)
    
    guard let pngData = bitmapRep.representation(using: .png, properties: [:]) else {
        print("Failed to get PNG data")
        exit(1)
    }
    
    let outPath = "/Users/batyass/projects/rl-companion/ios/screenshots/rl_shop_preview.png"
    do {
        try pngData.write(to: URL(fileURLWithPath: outPath))
        print("Saved preview to:", outPath)
    } catch {
        print("Error saving PNG:", error)
        exit(1)
    }
    
    exit(0)
}

// Run inside AppKit runloop
let app = NSApplication.shared
DispatchQueue.main.async {
    renderAndSave()
}
app.run()

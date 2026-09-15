//
//  DesignSystem.swift
//  RLCompanion
//
//  Native iOS Design System: RL Blue #00A3FF, RL Orange #FF6B00,
//  translucent materials, rarity borders, SF Pro and SF Mono typography,
//  haptics, and visual modifiers.
//

import SwiftUI
import UIKit

// MARK: - Color Hex Initializer

extension Color {
    public init(hex: String, opacity: Double = 1.0) {
        let hexClean = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hexClean).scanHexInt64(&int)
        let r, g, b, a: Double
        switch hexClean.count {
        case 3: // RGB (12-bit)
            r = Double((int >> 8) * 17) / 255.0
            g = Double((int >> 4 & 0xF) * 17) / 255.0
            b = Double((int & 0xF) * 17) / 255.0
            a = opacity
        case 6: // RGB (24-bit)
            r = Double((int >> 16) & 0xFF) / 255.0
            g = Double((int >> 8) & 0xFF) / 255.0
            b = Double(int & 0xFF) / 255.0
            a = opacity
        case 8: // ARGB (32-bit)
            r = Double((int >> 16) & 0xFF) / 255.0
            g = Double((int >> 8) & 0xFF) / 255.0
            b = Double(int & 0xFF) / 255.0
            a = Double((int >> 24) & 0xFF) / 255.0 * opacity
        default:
            r = 1.0
            g = 1.0
            b = 1.0
            a = opacity
        }
        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}

// MARK: - App Theme (Apple HIG Compliant Themes)

public enum AppTheme: String, CaseIterable, Identifiable, Codable, Sendable {
    case dark = "dark"
    case light = "light"
    case system = "system"

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .dark: return "Dark"
        case .light: return "Light"
        case .system: return "System"
        }
    }

    public var iconName: String {
        switch self {
        case .dark: return "moon.fill"
        case .light: return "sun.max.fill"
        case .system: return "gearshape"
        }
    }

    public func colorScheme(colorScheme: ColorScheme?) -> ColorScheme? {
        switch self {
        case .dark: return .dark
        case .light: return .light
        case .system: return colorScheme
        }
    }

    public func isLight(colorScheme: ColorScheme?) -> Bool {
        switch self {
        case .light: return true
        case .dark: return false
        case .system: return colorScheme == .light
        }
    }

    public func canvasColor(colorScheme: ColorScheme?) -> Color {
        if isLight(colorScheme: colorScheme) {
            return Color(hex: "F2F2F7")
        } else {
            return Color(hex: "07090E")
        }
    }

    public func listRowBackground(colorScheme: ColorScheme?) -> Color {
        if isLight(colorScheme: colorScheme) {
            return Color.white.opacity(0.95)
        } else {
            return Color(hex: "161B22").opacity(0.85)
        }
    }
}

// MARK: - Theme Tokens (Colors, Canvases, Glows & Surfaces)

public struct ThemeTokens: Sendable, Equatable {
    public let theme: AppTheme
    public let isLight: Bool

    // Canvases and Surface Backgrounds
    public let canvas: Color
    public let listRowBackground: Color
    public let bgBase: Color
    public let bgElev1: Color
    public let bgElev2: Color
    public let glassBackground: Color
    public let glassBorder: Color
    public let cardBorder: Color
    public let cardBackdrop: Color

    // Ambient Glows
    public let glowBlue: Color
    public let glowOrange: Color

    // Typography and Labels
    public let labelPrimary: Color
    public let labelSecondary: Color
    public let labelTertiary: Color
    public let labelQuaternary: Color

    // Separators
    public let separator: Color
    public let separatorSubtle: Color

    // Accents
    public let accentBlue: Color
    public let accentBlueSoft: Color
    public let accentOrange: Color
    public let accentOrangeSoft: Color

    // Semantics
    public let semanticSuccess: Color
    public let semanticWarning: Color
    public let semanticDanger: Color

    public init(theme: AppTheme, colorScheme: ColorScheme? = nil) {
        self.theme = theme
        let resolvedIsLight = theme.isLight(colorScheme: colorScheme)
        self.isLight = resolvedIsLight

        if resolvedIsLight {
            self.canvas = Color(hex: "F2F2F7")
            self.listRowBackground = Color.white.opacity(0.95)
            self.bgBase = Color(hex: "FFFFFF")
            self.bgElev1 = Color(hex: "FFFFFF")
            self.bgElev2 = Color(hex: "F0F2F5")
            self.glassBackground = Color.white.opacity(0.85)
            self.glassBorder = Color.black.opacity(0.08)
            self.cardBorder = Color.black.opacity(0.06)
            self.cardBackdrop = Color(hex: "E8ECEF").opacity(0.85)
            self.glowBlue = RLColor.rlBlue.opacity(0.08)
            self.glowOrange = RLColor.rlOrange.opacity(0.06)
            self.labelPrimary = Color(hex: "0D1117")
            self.labelSecondary = Color(hex: "57606A")
            self.labelTertiary = Color(hex: "8C959F")
            self.labelQuaternary = Color(hex: "AFB8C1")
            self.separator = Color.black.opacity(0.12)
            self.separatorSubtle = Color.black.opacity(0.06)
        } else {
            self.canvas = Color(hex: "07090E")
            self.listRowBackground = Color(hex: "161B22").opacity(0.85)
            self.bgBase = Color(hex: "0B0E14")
            self.bgElev1 = Color(hex: "161B22")
            self.bgElev2 = Color(hex: "1C2128")
            self.glassBackground = Color(hex: "161B22").opacity(0.72)
            self.glassBorder = Color.white.opacity(0.12)
            self.cardBorder = Color.white.opacity(0.08)
            self.cardBackdrop = Color(hex: "13161C").opacity(0.75)
            self.glowBlue = RLColor.rlBlue.opacity(0.18)
            self.glowOrange = RLColor.rlOrange.opacity(0.14)
            self.labelPrimary = Color(hex: "F0F6FC")
            self.labelSecondary = Color(hex: "8B949E")
            self.labelTertiary = Color(hex: "484F58")
            self.labelQuaternary = Color(hex: "30363D")
            self.separator = Color.white.opacity(0.15)
            self.separatorSubtle = Color.white.opacity(0.08)
        }

        self.accentBlue = RLColor.rlBlue
        self.accentBlueSoft = RLColor.rlBlueSoft
        self.accentOrange = RLColor.rlOrange
        self.accentOrangeSoft = RLColor.rlOrangeSoft
        self.semanticSuccess = RLColor.semanticSuccess
        self.semanticWarning = RLColor.semanticWarning
        self.semanticDanger = RLColor.semanticDanger
    }
}

// MARK: - Environment Keys & Theme Provider

public struct ThemeTokensKey: EnvironmentKey {
    public static let defaultValue = ThemeTokens(theme: .dark)
}

public struct AppThemeKey: EnvironmentKey {
    public static let defaultValue: AppTheme = .dark
}

extension EnvironmentValues {
    public var appTheme: AppTheme {
        get { self[AppThemeKey.self] }
        set { self[AppThemeKey.self] = newValue }
    }

    public var themeTokens: ThemeTokens {
        get { self[ThemeTokensKey.self] }
        set { self[ThemeTokensKey.self] = newValue }
    }
}

public struct ThemeProvider<Content: View>: View {
    public let theme: AppTheme
    @Environment(\.colorScheme) private var systemColorScheme
    private let content: Content

    public init(theme: AppTheme, @ViewBuilder content: () -> Content) {
        self.theme = theme
        self.content = content()
    }

    public var body: some View {
        let tokens = ThemeTokens(theme: theme, colorScheme: systemColorScheme)
        content
            .environment(\.appTheme, theme)
            .environment(\.themeTokens, tokens)
            .preferredColorScheme(theme.colorScheme(colorScheme: systemColorScheme))
    }
}

extension View {
    public func withTheme(_ theme: AppTheme) -> some View {
        ThemeProvider(theme: theme) {
            self
        }
    }

    public func rlListRowBackground(_ tokens: ThemeTokens? = nil) -> some View {
        modifier(RLListRowBackgroundModifier(tokens: tokens))
    }
}

public struct RLListRowBackgroundModifier: ViewModifier {
    @Environment(\.themeTokens) private var envTokens
    public let tokens: ThemeTokens?

    public init(tokens: ThemeTokens? = nil) {
        self.tokens = tokens
    }

    public func body(content: Content) -> some View {
        let activeTokens = tokens ?? envTokens
        content
            .listRowBackground(activeTokens.listRowBackground)
    }
}

// MARK: - Dynamic UIColors for Trait Collection

extension UIColor {
    public static let rlBgBase = UIColor { traitCollection in
        traitCollection.userInterfaceStyle == .light ? UIColor(hex: "FFFFFF") : UIColor(hex: "0B0E14")
    }
    public static let rlBgElev1 = UIColor { traitCollection in
        traitCollection.userInterfaceStyle == .light ? UIColor(hex: "FFFFFF") : UIColor(hex: "161B22")
    }
    public static let rlBgElev2 = UIColor { traitCollection in
        traitCollection.userInterfaceStyle == .light ? UIColor(hex: "F0F2F5") : UIColor(hex: "1C2128")
    }
}

// MARK: - RL Theme

public enum RLTheme {
    // OLED Dark backgrounds
    public static let bgOLED = RLColor.bgOLED
    public static let bgBase = RLColor.bgBase
    public static let bgElev1 = RLColor.bgElev1
    public static let bgElev2 = RLColor.bgElev2
    
    // Accents
    public static let rlBlue = RLColor.rlBlue
    public static let rlBlueSoft = RLColor.rlBlueSoft
    public static let rlOrange = RLColor.rlOrange
    public static let rlOrangeSoft = RLColor.rlOrangeSoft
    
    // Labels
    public static let labelBase = RLColor.labelBase
    public static let labelSecondary = RLColor.labelSecondary
    public static let labelTertiary = RLColor.labelTertiary
    
    // Separator and semantics
    public static let separator = RLColor.separator
    public static let semanticSuccess = RLColor.semanticSuccess
    public static let semanticWarning = RLColor.semanticWarning
    public static let semanticDanger = RLColor.semanticDanger
    
    // Rarity and paint colors
    public static func rarityColor(for rarity: Rarity) -> Color {
        RLColor.rarityColor(for: rarity)
    }
    
    public static func paintColor(for paint: PaintColor) -> Color {
        RLColor.paintColor(for: paint)
    }
    
    // Namespaces
    public typealias Haptics = RLHaptics
    public typealias Spacing = RLSpacing
    public typealias Radius = RLRadius
    public typealias Fonts = RLFontModifiers
}

// MARK: - RL Color Tokens

public enum RLColor {
    // Backgrounds (Dynamic + OLED)
    public static let bgOLED = Color(hex: "06080C")
    public static let bgBase = Color(uiColor: .rlBgBase)
    public static let bgElev1 = Color(uiColor: .rlBgElev1)
    public static let bgElev2 = Color(uiColor: .rlBgElev2)
    
    // Accents (Rocket League Electric Blue & Orange)
    public static let rlBlue = Color(hex: "00A3FF")
    public static let rlBlueSoft = Color(hex: "00A3FF", opacity: 0.12)
    public static let rlOrange = Color(hex: "FF6B00")
    public static let rlOrangeSoft = Color(hex: "FF6B00", opacity: 0.12)
    
    // Labels
    public static let labelBase = Color(uiColor: .label)
    public static let labelSecondary = Color(uiColor: .secondaryLabel)
    public static let labelTertiary = Color(uiColor: .tertiaryLabel)
    
    // Separator
    public static let separator = Color(uiColor: .separator)
    
    // Semantics (Rocket League Theme)
    public static let semanticSuccess = Color(hex: "00A3FF") // RL Blue
    public static let semanticWarning = Color(hex: "FF6B00") // RL Orange
    public static let semanticDanger = Color(hex: "FF453A")
    
    // Rarity Colors
    public static func rarityColor(for rarity: Rarity) -> Color {
        Color(hex: rarity.colorHex)
    }
    
    public static func paintColor(for paint: PaintColor) -> Color {
        Color(hex: paint.hex)
    }
}

// MARK: - Spacing & Radii

public enum RLSpacing {
    public static let space2: CGFloat = 8
    public static let space3: CGFloat = 12
    public static let space4: CGFloat = 16
    public static let space5: CGFloat = 20
    public static let space6: CGFloat = 24
}

public enum RLRadius {
    public static let sm: CGFloat = 10
    public static let md: CGFloat = 14
    public static let lg: CGFloat = 18
    public static let xl: CGFloat = 28
}

// MARK: - Haptics

@MainActor
public enum RLHaptics {
    public static func selection() {
        let generator = UISelectionFeedbackGenerator()
        generator.prepare()
        generator.selectionChanged()
    }

    public static func lightImpact() {
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.prepare()
        generator.impactOccurred()
    }

    public static func mediumImpact() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.prepare()
        generator.impactOccurred()
    }

    public static func heavyImpact() {
        let generator = UIImpactFeedbackGenerator(style: .heavy)
        generator.prepare()
        generator.impactOccurred()
    }

    public static func success() {
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(.success)
    }

    public static func warning() {
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(.warning)
    }

    public static func error() {
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(.error)
    }
}

// MARK: - Typography Modifiers

public struct RLFontModifiers {
    public static let largeTitle = Font.system(size: 34, weight: .bold, design: .default)
    public static let title2 = Font.system(size: 22, weight: .semibold, design: .default)
    public static let title3 = Font.system(size: 20, weight: .semibold, design: .default)
    public static let headline = Font.system(size: 17, weight: .semibold, design: .default)
    public static let body = Font.system(size: 17, weight: .regular, design: .default)
    public static let callout = Font.system(size: 16, weight: .medium, design: .default)
    public static let subheadline = Font.system(size: 15, weight: .regular, design: .default)
    public static let footnote = Font.system(size: 13, weight: .regular, design: .default)
    public static let caption = Font.system(size: 12, weight: .medium, design: .default)
    public static let caption2Mono = Font.system(size: 11, weight: .medium)
    public static let timerMono = Font.system(size: 14, weight: .bold)
    public static let priceNumeric = Font.system(size: 18, weight: .bold)
}

// MARK: - Spring Press Button Style (Tactile Premium Feel)

public struct SpringCardButtonStyle: ButtonStyle {
    public init() {}
    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.965 : 1.0)
            .animation(.spring(response: 0.28, dampingFraction: 0.72), value: configuration.isPressed)
    }
}

// MARK: - Reusable Visual Components

public struct CreditBadgeView: View {
    public let price: Int
    public var fontSize: CGFloat = 14
    public var iconSize: CGFloat = 13

    public init(price: Int, fontSize: CGFloat = 14, iconSize: CGFloat = 13) {
        self.price = price
        self.fontSize = fontSize
        self.iconSize = iconSize
    }

    public var body: some View {
        HStack(spacing: 4.5) {
            // RL Credits Blue Icon
            RLCreditsIcon(size: iconSize)

            Text("\(price)")
                .font(.system(size: fontSize, weight: .bold))
                .foregroundStyle(Color(hex: "389BFF"))
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 5)
        .background(
            Capsule()
                .fill(Color(hex: "167CFF").opacity(0.18))
        )
        .overlay(
            Capsule()
                .strokeBorder(Color(hex: "389BFF").opacity(0.40), lineWidth: 1)
        )
        .accessibilityLabel("Price: \(price) credits")
    }
}

// MARK: - RL Credits Icon (Official Exact Emblem Image from rlshop.gg)

public struct RLCreditsIcon: View {
    public var size: CGFloat = 14

    public init(size: CGFloat = 14) {
        self.size = size
    }

    public var body: some View {
        if let uiImg = UIImage(named: "rl-credits") {
            Image(uiImage: uiImg)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
        } else {
            Image("rl-credits")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
        }
    }
}

// MARK: - Hexagon Shape

public struct HexagonShape: Shape {
    public func path(in rect: CGRect) -> Path {
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = min(rect.width, rect.height) / 2
        let points = (0..<6).map { i in
            let angle = (Double(i) - 0.5) * .pi / 3.0
            return CGPoint(
                x: center.x + radius * CGFloat(cos(angle)),
                y: center.y + radius * CGFloat(sin(angle))
            )
        }
        var path = Path()
        path.move(to: points[0])
        for i in 1..<6 {
            path.addLine(to: points[i])
        }
        path.closeSubpath()
        return path
    }
}

public struct RarityBadgeView: View {
    public let rarity: Rarity

    public init(rarity: Rarity) {
        self.rarity = rarity
    }

    public var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(RLColor.rarityColor(for: rarity))
                .frame(width: 7, height: 7)
                .shadow(
                    color: RLColor.rarityColor(for: rarity).opacity(rarity.glowOpacity),
                    radius: 4,
                    x: 0,
                    y: 0
                )

            Text(rarity.displayName.uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(RLColor.rarityColor(for: rarity))
                .tracking(0.6)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill(RLColor.bgElev2.opacity(0.85))
        )
        .overlay(
            Capsule()
                .strokeBorder(RLColor.rarityColor(for: rarity).opacity(0.4), lineWidth: 1)
        )
    }
}

public struct PaintChipView: View {
    @Environment(\.themeTokens) private var themeTokens
    public let paint: String

    public init(paint: String) {
        self.paint = paint
    }

    public var body: some View {
        let parsed = PaintColor.from(string: paint)
        HStack(spacing: 4) {
            if let parsed = parsed {
                Circle()
                    .fill(RLColor.paintColor(for: parsed))
                    .frame(width: 8, height: 8)
                    .overlay(Circle().strokeBorder(themeTokens.isLight ? Color.black.opacity(0.2) : Color.white.opacity(0.3), lineWidth: 0.5))
            }

            Text(parsed?.displayName ?? paint)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(themeTokens.labelPrimary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill(themeTokens.bgElev2.opacity(0.9))
        )
        .overlay(
            Capsule()
                .strokeBorder(themeTokens.separator, lineWidth: 0.8)
        )
    }
}

public struct CountdownChipView: View {
    @Environment(\.themeTokens) private var themeTokens
    public let timeString: String
    public var isEndingSoon: Bool = false

    public init(timeString: String, isEndingSoon: Bool = false) {
        self.timeString = timeString
        self.isEndingSoon = isEndingSoon
    }

    public var body: some View {
        HStack(spacing: 5) {
            Image(systemName: isEndingSoon ? "exclamationmark.triangle.fill" : "clock.fill")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(isEndingSoon ? RLColor.semanticWarning : RLColor.rlBlue)

            Text(timeString)
                .font(RLFontModifiers.caption2Mono)
                .foregroundStyle(isEndingSoon ? RLColor.semanticWarning : themeTokens.labelPrimary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill(isEndingSoon ? RLColor.semanticWarning.opacity(0.15) : themeTokens.bgElev2.opacity(0.85))
        )
        .overlay(
            Capsule()
                .strokeBorder(
                    isEndingSoon ? RLColor.semanticWarning.opacity(0.4) : themeTokens.separator,
                    lineWidth: 1
                )
        )
    }
}

// MARK: - RLCS Team Badge View

public struct RLCSTeamBadgeView: View {
    @Environment(\.themeTokens) private var themeTokens
    public let teamName: String

    public init(teamName: String) {
        self.teamName = teamName
    }

    public var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "shield.fill")
                .font(.system(size: 8, weight: .bold))
                .foregroundStyle(RLColor.rlBlue)

            Text(teamName.uppercased())
                .font(.system(size: 9, weight: .black))
                .foregroundStyle(themeTokens.labelPrimary)
                .tracking(0.4)
                .lineLimit(1)
        }
        .padding(.horizontal, 7)
        .padding(.vertical, 3.5)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .overlay(
            Capsule().strokeBorder(RLColor.rlBlue.opacity(0.4), lineWidth: 0.8)
        )
    }
}

// MARK: - Bundle Category Badge View

public struct BundleCategoryBadgeView: View {
    public let tag: String

    public init(tag: String) {
        self.tag = tag
    }

    public var body: some View {
        let accentColor: Color = {
            switch tag.uppercased() {
            case "ELECTRIC WAVE":
                return RLColor.rlBlue
            case "CHAMPIONSHIP":
                return Color(hex: "FFD700") // Trophy Gold
            default:
                return RLColor.rlOrange
            }
        }()

        Text(tag.uppercased())
            .font(.system(size: 9, weight: .black))
            .foregroundStyle(accentColor)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(accentColor.opacity(0.12))
            .clipShape(Capsule())
            .overlay(
                Capsule().strokeBorder(accentColor.opacity(0.35), lineWidth: 0.8)
            )
    }
}

// MARK: - Filter Chip Button

public struct FilterChipButton: View {
    @Environment(\.themeTokens) private var themeTokens
    public let title: String
    public let isSelected: Bool
    public let count: Int?
    public let action: () -> Void

    public init(title: String, isSelected: Bool, count: Int? = nil, action: @escaping () -> Void) {
        self.title = title
        self.isSelected = isSelected
        self.count = count
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Text(title)
                    .font(.system(size: 12, weight: isSelected ? .bold : .medium))
                    .foregroundStyle(isSelected ? Color.white : themeTokens.labelSecondary)

                if let count = count {
                    Text("\(count)")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(isSelected ? Color.white.opacity(0.85) : themeTokens.labelTertiary)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 1)
                        .background(isSelected ? Color.black.opacity(0.2) : (themeTokens.isLight ? Color.black.opacity(0.06) : Color.white.opacity(0.06)))
                        .clipShape(Capsule())
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(isSelected ? RLColor.rlOrange : (themeTokens.isLight ? Color.black.opacity(0.06) : Color.white.opacity(0.06)))
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .strokeBorder(isSelected ? Color.white.opacity(0.3) : themeTokens.separatorSubtle, lineWidth: 0.8)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - View Modifiers

public struct RarityBorderModifier: ViewModifier {
    @Environment(\.themeTokens) private var themeTokens
    public let rarity: Rarity
    public let cornerRadius: CGFloat

    public init(rarity: Rarity, cornerRadius: CGFloat = RLRadius.lg) {
        self.rarity = rarity
        self.cornerRadius = cornerRadius
    }

    public func body(content: Content) -> some View {
        content
            .background(themeTokens.bgElev1)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(
                        rarity.hasBorder ? RLColor.rarityColor(for: rarity) : themeTokens.separator.opacity(0.6),
                        lineWidth: rarity.hasBorder ? 1.5 : 1
                    )
            )
            .shadow(
                color: rarity.hasBorder ? RLColor.rarityColor(for: rarity).opacity(rarity.glowOpacity) : (themeTokens.isLight ? Color.black.opacity(0.06) : Color.black.opacity(0.4)),
                radius: rarity.hasBorder ? 8 : 4,
                x: 0,
                y: 2
            )
    }
}

public struct RLGlassBackgroundModifier: ViewModifier {
    @Environment(\.themeTokens) private var themeTokens
    public let cornerRadius: CGFloat

    public init(cornerRadius: CGFloat = RLRadius.lg) {
        self.cornerRadius = cornerRadius
    }

    public func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial)
            .background(themeTokens.glassBackground)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(themeTokens.glassBorder, lineWidth: 1)
            )
    }
}

extension View {
    public func rlRarityCard(rarity: Rarity, cornerRadius: CGFloat = RLRadius.lg) -> some View {
        modifier(RarityBorderModifier(rarity: rarity, cornerRadius: cornerRadius))
    }

    public func rlGlassBackground(cornerRadius: CGFloat = RLRadius.lg) -> some View {
        modifier(RLGlassBackgroundModifier(cornerRadius: cornerRadius))
    }
}

// MARK: - Ambient Liquid Glass Background

public struct LiquidGlassBackgroundView: View {
    @Environment(\.themeTokens) private var envTokens
    public var theme: AppTheme?

    public init(theme: AppTheme? = nil) {
        self.theme = theme
    }

    public var body: some View {
        let activeTokens = theme.map { ThemeTokens(theme: $0) } ?? envTokens

        ZStack {
            activeTokens.canvas
                .ignoresSafeArea()
            
            if true {
                Color.clear

                // Subtle top-trailing RL Blue ambient glow
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                activeTokens.glowBlue,
                                Color.clear
                            ],
                            center: .center,
                            startRadius: 20,
                            endRadius: 280
                        )
                    )
                    .frame(width: 420, height: 420)
                    .offset(x: 140, y: -260)
                    .blur(radius: 50)
                
                // Subtle bottom-leading RL Orange ambient glow
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                activeTokens.glowOrange,
                                Color.clear
                            ],
                            center: .center,
                            startRadius: 20,
                            endRadius: 260
                        )
                    )
                    .frame(width: 380, height: 380)
                    .offset(x: -140, y: 320)
                    .blur(radius: 50)
            }
        }
        .ignoresSafeArea()
    }
}

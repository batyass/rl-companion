# RLCompanion iOS · UI/UX Spec & Design System

## 1 · Visual Identity & OLED Dark Theme
- Canvas: pure black #000000 (OLED) with #0B0E14 for scroll zones. True blacks never gray haze; glows pop on real black.
- Accents (RL electric, never cyan):
  - RL Blue #0088FF: interactive, links, active tab, live status, selection.
  - RL Orange #FF6B00: credits, prices, countdowns, primary CTAs.
- Elevation ladder: base #000000 -> card #161B22 -> raised #1C1C1E -> overlay #242426. Hairline borders (white 8-12%) over heavy shadows; OLED = light not ink.
- Labels: #F5F5F7 primary, #98989D secondary, #636366 tertiary. SF Pro; rounded headers/prices, monospaced timers.

## 2 · Rarity Hierarchy & Glow
Rarity color = identity; glow = tier rank. Tier >= Rare gets 1.5pt border + halo shadow; soft radial in card art all tiers.
- Black Market #FF2D94: glow 0.45, widest halo, subtle pulse.
- Exotic #FFB84D: glow 0.40. Import #EB4B4B: glow 0.35.
- Very Rare #8847FF: glow 0.35. Rare #3A86FF: glow 0.30.
- Limited #FF7700: glow 0.30, borderless. Uncommon #80E0FF: glow 0.20, borderless.
- Common #98989D: no glow, no border.
Pill: 7pt glowing dot + uppercase 10pt bold, capsule bg #1C1C1E 85%, stroke rarity 40%.

## 3 · Component UX
- Sheets: native glass (.ultraThinMaterial), 0.80 detent, clear bg, drag indicator. Cards: .thinMaterial over #161B22 72%.
- Haptics: selection on filters; light on card open; medium on wishlist; success on add; warning/error on refresh failure.
- Badges: capsule pills, 8h/4v padding, rarity/blue/orange variants, accent stroke 40%.
- Grid: 2-col LazyVGrid 12pt gap phones; 3-col >= 700pt; featured horizontal snap carousel 250pt.
- Empty: centered 72pt glass circle icon, headline, #98989D helper, orange CTA; ambient blue/orange glow, no skeleton.

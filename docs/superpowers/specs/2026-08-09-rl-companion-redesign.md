# RL Companion Redesign — Design Specification

**Date:** 2026-08-09  
**Project:** rl_companion (Rocket League item shop companion)  
**Scope:** Complete visual + motion redesign of the React app (`app/src`)  
**Approach:** Hybrid — RL Soul + Apple Craft

---

## 1. Color & Light System

| Token | Value | Role |
|-------|-------|------|
| `--bg` | `#141416` | Charcoal base, warm undertone |
| `--surface` | `#1A1D21` | Primary card/panel surface |
| `--surface-2` | `#21252B` | Elevated surface (modals, hero card) |
| `--surface-3` | `#2A2F38` | Highest elevation (popovers, dropdowns) |
| `--line` | `rgba(255,255,255,0.06)` | Hairline borders |
| `--line-strong` | `rgba(255,255,255,0.12)` | Stronger borders, focus rings |
| `--text` | `#F5F5F7` | Primary text |
| `--text-2` | `#A1A1A6` | Secondary text |
| `--text-3` | `#6E6E73` | Tertiary / caption text |
| `--accent` | `#4DA3FF` | RL Blue — primary interactive |
| `--accent-soft` | `rgba(77,163,255,0.12)` | Blue soft fills |
| `--accent-line` | `rgba(77,163,255,0.45)` | Blue borders, focus |
| `--orange` | `#FF9F2E` | RL Orange — semantic (time, live) |
| `--orange-soft` | `rgba(255,159,46,0.12)` | Orange soft fills |
| `--orange-line` | `rgba(255,159,46,0.45)` | Orange borders |
| `--green` | `#30D158` | Apple Green — success, live dot |
| `--radius` | `18px` | Card / panel radius |
| `--radius-sm` | `12px` | Small element radius |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | Card inset highlight |
| `--shadow-md` | `0 10px 32px rgba(0,0,0,0.5)` | Elevated panels |
| `--shadow-lg` | `0 32px 80px rgba(0,0,0,0.65)` | Modal, full-screen overlays |

**Depth glows** (subtle radial gradients on body/hero/modal art):
- Blue glow: `radial-gradient(42% 30% at 82% -6%, rgba(77,163,255,0.05), transparent 62%)`
- Orange glow: `radial-gradient(38% 28% at 12% 108%, rgba(255,159,46,0.04), transparent 60%)`

**Reduced transparency:** surfaces become solid (`--surface` opacity 1), `backdrop-filter: none`, background loses radial glows.

---

## 2. Typography

**Stack:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif`

| Role | Size | Weight | Tracking | Leading | Notes |
|------|------|--------|----------|---------|-------|
| Display (hero h1) | `clamp(36px, 5vw, 56px)` | 700 | `-0.03em` | 1.04 | `font-optical-sizing: auto` |
| Section heading (h2) | `20px` | 700 | `-0.02em` | 1.2 | Sentence case |
| Body | `15px` | 400 | `0` | 1.5 | |
| Caption / label | `12px` | 500 | `0.06em` | 1.3 | Uppercase for filter labels |
| Data (price, countdown) | `13–22px` | 700 | `-0.02em` | 1.0 | `font-variant-numeric: tabular-nums` |
| Button / chip | `13px` | 500 | `0` | 1 | |

**Dynamic Type:** All spacing in `rem`/`em` so layout scales with user text size preference.

---

## 3. Layout & Navigation

### Desktop (≥1024px)
- **Persistent left sidebar:** 260px expanded → 72px collapsed (icon rail)
- **Material:** `rgba(20,20,22,0.7)` + `backdrop-filter: blur(20px) saturate(180%)`
- **Border:** right edge `1px solid var(--line)`
- **Sections (top → bottom):**
  1. Featured / Daily Shops (Supersonic, etc.)
  2. Brand Shops (BMW, Valhalla, Lamborghini, Corvette)
  3. Bundles
  4. RLCS
- **Active section:** highlighted with accent left border (3px) + blue text
- **Collapse toggle:** top of sidebar, spring animation 300ms
- **Main content:** `max-width: 1120px` centered in remaining space

### Tablet (768–1023px)
- Sidebar auto-collapses to 72px on load
- Expand on hover/focus (spring 250ms)
- Touch-friendly hit areas (44px minimum)

### Mobile (<768px)
- **Fixed bottom tab bar:** 5 tabs max (Featured, Daily, Brands, Bundles, RLCS)
- **Material:** same translucent as sidebar
- **Safe-area inset:** `padding-bottom: env(safe-area-inset-bottom)`
- **Active tab:** filled accent background + white icon/label
- **Swipe gesture:** horizontal swipe on content area switches tabs (spring, velocity-based)
- **Sidebar:** accessible via hamburger → sheet (spring from left)

### Grid System
| Breakpoint | Columns | Gap |
|------------|---------|-----|
| ≥1200px | 5 | 16px |
| 900–1199px | 4 | 14px |
| 600–899px | 3 | 12px |
| <600px | 2 | 10px |

---

## 4. Motion System

### Easing Tokens
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* UI interactions */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* On-screen movement */
--ease-spring: cubic-bezier(0.32, 0.72, 0, 1);   /* iOS-like drawer */
```

### Parallax Background (Desktop only)
Three layers, all `transform: translate3d(...)` with spring physics (stiffness 80, damping 15), following cursor position normalized to viewport center. Paused when tab hidden.

| Layer | Content | Opacity | Spring Range |
|-------|---------|---------|--------------|
| 1 (back) | Hex grid pattern (RL arena) | 3% | ±12px |
| 2 (mid) | Dual radial orbs — blue 4%, orange 3% | 4% / 3% | ±24px |
| 3 (front) | Fine dot grid | 2% | ±6px |

**Reduced-motion:** All parallax layers `display: none` / transform frozen.

### UI Springs & Transitions

| Interaction | Motion | Duration | Easing |
|-------------|--------|----------|--------|
| Sidebar expand/collapse | `translateX` + width | 300ms | Spring (damping 1, response 0.35) |
| Bottom bar show/hide | `translateY(100%)` | 280ms | Spring |
| Modal enter | `scale(0.96) translateY(8px) + opacity` | 240ms | `--ease-out` |
| Modal exit | Mirror enter (reverse path) | 200ms | `--ease-in-out` |
| Card grid entrance | Stagger 30ms, `translateY(8px) + opacity` | 300ms | `--ease-out` |
| Filter panel | `opacity + translateY(-4px) scale(0.985)` | 180ms | `--ease-out` |
| Tab content switch | Cross-fade (opacity only) | 160ms | `--ease-out` |
| Press feedback (buttons, cards, chips) | `scale(0.97)` | 160ms | `ease-out` |
| Favorite heart pop (save) | `scale(1 → 1.05 → 1)` | 300ms | `--ease-out` |
| Bundle collapse/expand | `grid-template-rows: 0fr ↔ 1fr` + opacity | 250ms | `--ease-in-out` |
| Toast enter/exit | `translateY(16px) ↔ 0` + opacity | 240ms | `--ease-out` |

**All animations:** `transform` + `opacity` only. Hardware-accelerated.

**Reduced-motion:** Parallax disabled. All springs → cross-fade 150ms. No transform motion. Press feedback kept at 160ms scale.

---

## 5. Components

### Hero (always visible above shop)
- RL brand mark (skewed bars, blue/orange)
- Headline: "What's in the shop today?"
- Subtext: "Today's Rocket League rotation, refreshed daily."
- Live indicator: green dot + "Live item shop"
- Countdown chip: tabular nums, `fmtTime(heroSeconds, true)` — "5h 42m"
- Background: `surface` card with inset highlight, blue accent icon

### Item Card
- **Visual:** `aspect-ratio: 1.2`, `surface-2` bg, rarity radial glow 14% at bottom
- **Chips:** Paint (top-left), Time (top-right, orange)
- **Image/Glyph:** centered, `drop-shadow(0 8px 16px rgba(0,0,0,0.5))`
- **Details:** Name (tracking -0.01em), Type (caption), Price (tabular + credit diamond)
- **Press:** `scale(0.97)` 160ms
- **Hover:** `translateY(-2px)` + `border-color: var(--line-strong)` + `shadow-sm`

### Modal (Item Details)
- **Desktop:** Split 50/50 — art panel left, details right
- **Mobile:** Single column, art panel min-height 220px
- **Art panel:** `surface-2` + rarity radial glow 20%, image with strong drop-shadow
- **Details:** Rarity pill (colored), Name (h2), Type, Price row (divider lines), Favorite pill
- **Favorite pill:** Blue fill → Pink fill when saved, heart-pop 300ms on toggle
- **Enter/Exit:** Symmetric spring (see Motion System)
- **Backdrop:** `rgba(0,0,0,0.6)` + `blur(12px)`, fade 240ms

### Bottom Tab Bar (Mobile)
- 5 tabs max, translucent material
- Active: `background: var(--accent-soft)`, `color: var(--accent)`, icon filled
- Inactive: `color: var(--text-2)`
- Spring slide on show/hide (280ms)

### Toast
- Bottom center, `surface-2` + `border: 1px solid var(--line-strong)`
- Enter/exit same edge (bottom), 240ms ease-out
- Auto-dismiss 2500ms

### Empty State
- Centered, dashed border, icon + headline + subtext + Clear button

### Footer
- Minimal: brand + disclaimer + © year

---

## 6. Accessibility

| Preference | Behavior |
|------------|----------|
| `prefers-reduced-motion: reduce` | Parallax disabled. All transform animations → cross-fade 150ms. Press scale kept. Stagger removed. |
| `prefers-reduced-transparency: reduce` | All `backdrop-filter: none`. Surfaces solid. Background radial glows removed. |
| `prefers-contrast: more` | `--line` → 0.18, `--line-strong` → 0.3. Focus ring 3px solid accent. |
| `prefers-color-scheme: light` | Not supported (dark-only companion app). |

**Keyboard:** All interactive elements reachable, visible focus ring (`--accent-line`, 3px, offset 2px). Modal traps focus, Escape closes.

**Touch:** 44×44px minimum hit areas. Bottom bar safe-area inset. Swipe gesture on mobile content area for tab switching.

---

## 7. Implementation Notes

- **Stack:** React 18 + Vite, CSS custom properties, no motion library (CSS transitions + `@starting-style` + minimal JS for parallax springs)
- **Parallax:** Custom `useParallax` hook using `requestAnimationFrame` + spring interpolation (stiffness 80, damping 15). Runs only on desktop (`matchMedia('(pointer: fine)')`).
- **Sidebar state:** `localStorage` persists collapsed/expanded.
- **Tab state:** `localStorage` persists last active section.
- **Favorites:** `localStorage` (existing).
- **Theme:** Dark-only, but respects system preference for initial load (then locked).
- **Build output:** `app/dist` served by existing `server.js`.

---

## 8. Self-Review (Spec Check)

- [x] No TBD/TODO placeholders
- [x] Internal consistency: colors match across all sections, motion tokens reused
- [x] Scope focused: single app redesign, no unrelated features
- [x] Ambiguity resolved: exact values for all tokens, durations, easings, breakpoints
- [x] Accessibility covered for all three media queries
- [x] Reduced-motion strategy explicit and complete
- [x] Responsive behavior defined for all breakpoints
- [x] Existing data contracts (items, shops, favorites) unchanged

---

## 9. Next Steps

Upon approval: invoke `writing-plans` skill to create detailed implementation plan covering:
1. CSS token system + base styles
2. Parallax hook + background component
3. Sidebar + bottom bar navigation components
4. Hero, ItemCard, Modal, Toast, EmptyState components
5. App shell integration + responsive logic
6. Accessibility media query handling
7. Build verification + smoke test
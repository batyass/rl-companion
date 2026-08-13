# RL Companion Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the RL Companion React app with a hybrid "RL Soul + Apple Craft" design: charcoal-warm dark surfaces, system typography, mouse-parallax background, sidebar/bottom-bar navigation, and spring-following UI motion.

**Architecture:** Component split — `ParallaxBackground` (pure CSS layers, ref-driven transforms), `Sidebar` (desktop/tablet nav), `BottomBar` (mobile nav), and a reworked `App` shell (hero, toolbar, cards, modal, toast). Motion is CSS transitions + a tiny rAF spring loop; no motion library. Data/nav grouping lives in `data.js`.

**Tech Stack:** React 18, Vite 5, vanilla CSS custom properties, Web Animations-free (CSS only).

**Spec:** `docs/superpowers/specs/2026-08-09-rl-companion-redesign.md`

## Global Constraints

- Colors: `--bg: #141416`, `--surface: #1A1D21`, `--surface-2: #21252B`, `--surface-3: #2A2F38`, `--accent: #4DA3FF`, `--orange: #FF9F2E`, `--green: #30D158`. Lines: `rgba(255,255,255,0.06)` / `0.12`.
- Font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif`. Display `clamp(36px,5vw,56px)` / 700 / `-0.03em` / 1.04. Captions 12px / 500 / `0.06em` / uppercase. Data uses `tabular-nums`.
- Easing tokens: `--ease-out: cubic-bezier(0.23,1,0.32,1)`, `--ease-in-out: cubic-bezier(0.77,0,0.175,1)`, `--ease-spring: cubic-bezier(0.32,0.72,0,1)`.
- Durations: press 160ms, filter 180ms, modal 240/200ms, toast 240ms, card stagger 30ms × 300ms, tab cross-fade 160ms, bundle collapse 250ms, sidebar 300ms, bottom bar 280ms.
- Parallax: 3 layers — hex grid ±12px @ 3%, dual orbs ±24px @ 4%/3%, dot grid ±6px @ 2%. Spring stiffness 80 / damping 15 equivalent (lerp k=0.06/frame). Desktop `(pointer: fine)` only.
- Parallax layers must animate via refs (`style.transform`), never React state.
- Reduced motion: parallax hidden, springs → 150ms cross-fade, press scale kept. Reduced transparency: solid surfaces, no blur. Contrast more: line alphas 0.18/0.3.
- Breakpoints: sidebar visible ≥1024px (260px → 72px collapsed); tablet 768–1023px auto-collapsed, expands on hover; <768px bottom bar (5 tabs) + hamburger sheet. Grid: 5 cols ≥1200, 4 @900–1199, 3 @600–899, 2 <600.
- Persistence: sidebar collapsed state + last active shop in `localStorage`. Existing favorites key `rlshop-favorites` untouched.
- Dark-only. No light theme.

---

### Task 1: Data model + design tokens

**Files:**
- Modify: `app/src/data.js`
- Rewrite: `app/src/styles.css`

**Interfaces:**
- Produces: `NAV_GROUPS` export — array of `{ id, label, shops[] }`; `MOBILE_TABS` export — array of `{ shop, label, glyph }`; all CSS classes consumed by Tasks 2–4.

- [ ] **Step 1: Add nav groups to `data.js`**

```js
export const NAV_GROUPS = [
  { id: "daily", label: "Daily Shops", shops: ["featured", "supersonic"] },
  { id: "brands", label: "Brand Shops", shops: ["bmw", "valhalla", "lamborghini", "corvette"] },
  { id: "bundles", label: "Bundles", shops: ["bundles"] },
  { id: "rlcs", label: "RLCS", shops: ["rlcs"] },
];
export const MOBILE_TABS = [
  { shop: "featured", label: "Featured", glyph: "✧" },
  { shop: "supersonic", label: "Daily", glyph: "◷" },
  { shop: "bmw", label: "Brands", glyph: "◆" },
  { shop: "bundles", label: "Bundles", glyph: "▤" },
  { shop: "rlcs", label: "RLCS", glyph: "⚡" },
];
```

- [ ] **Step 2: Rewrite `app/src/styles.css`** with the full token system: `:root` vars (Global Constraints), base reset, focus/selection, press feedback (`button:active { transform: scale(0.97) }` with `transition: transform 160ms ease-out`), topbar, hero, toolbar/filter panel (opacity+translateY 180ms), item grid/cards (stagger, hover lift), rarity/paint chips, bundles + animated collapse (grid-rows), empty state, footer, toast, modal (symmetric 240/200ms), plus the four accessibility blocks and responsive queries from the spec. Tokens drive every value; no hardcoded colors outside `:root`.

- [ ] **Step 3: Build + verify**

Run: `cd app && npm run build`
Expected: build succeeds, no CSS/JS errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/data.js app/src/styles.css
git commit -m "feat: add nav groups and redesign design tokens"
```

---

### Task 2: Parallax background

**Files:**
- Create: `app/src/hooks/useParallax.js`
- Create: `app/src/components/ParallaxBackground.jsx`

**Interfaces:**
- Produces: `<ParallaxBackground />` — self-contained fixed layer, `aria-hidden`, exports nothing else.

- [ ] **Step 1: Create the spring loop hook**

```js
import { useEffect } from "react";

export function useParallax(refs, range, k = 0.06) {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;
    const state = { tx: 0, ty: 0, cx: 0, cy: 0, raf: 0 };
    const apply = () => refs.forEach((r, i) => {
      const el = r.current;
      if (el) el.style.transform = `translate3d(${state.cx * range[i]}px, ${state.cy * range[i]}px, 0)`;
    });
    const loop = () => {
      state.cx += (state.tx - state.cx) * k;
      state.cy += (state.ty - state.cy) * k;
      apply();
      if (Math.abs(state.tx - state.cx) < 0.001 && Math.abs(state.ty - state.cy) < 0.001) { state.raf = 0; return; }
      state.raf = requestAnimationFrame(loop);
    };
    const onMove = (e) => {
      state.tx = (e.clientX / window.innerWidth) * 2 - 1;
      state.ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!state.raf) state.raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(state.raf); };
  }, [refs, range, k]);
}
```

- [ ] **Step 2: Create the background component**

```jsx
import { useRef } from "react";
import { useParallax } from "../hooks/useParallax.js";

export default function ParallaxBackground() {
  const hex = useRef(null);
  const orbs = useRef(null);
  const dots = useRef(null);
  useParallax([hex, orbs, dots], [12, 24, 6]);
  return (
    <div className="parallax" aria-hidden="true">
      <div className="parallax-layer parallax-hex" ref={hex} />
      <div className="parallax-layer parallax-orbs" ref={orbs} />
      <div className="parallax-layer parallax-dots" ref={dots} />
    </div>
  );
}
```

- [ ] **Step 3: Add parallax CSS** to `styles.css` — `.parallax` fixed inset 0, `z-index: -1`, `pointer-events: none`; hex layer via stacked `linear-gradient` honeycomb pattern `background-size: 42px 74px` at `opacity: 0.03`; orbs layer as two radial gradients (blue top-right, orange bottom-left); dots via `radial-gradient(white 1px, transparent 1px)` `background-size: 28px 28px` at `opacity: 0.02`. `will-change: transform`.

- [ ] **Step 4: Build + commit**

```bash
cd app && npm run build && cd ..
git add app/src/hooks app/src/components app/src/styles.css
git commit -m "feat: add spring parallax background"
```

---

### Task 3: Sidebar + bottom bar

**Files:**
- Create: `app/src/components/Sidebar.jsx`
- Create: `app/src/components/BottomBar.jsx`

**Interfaces:**
- Consumes: `NAV_GROUPS`, `MOBILE_TABS`, `SHOP_LABELS`, `shopItems(key)` (passed as props).
- Produces: `<Sidebar shops={[]} counts={{}} active shop onSelect collapsed onToggle mobileOpen onClose} />` — props: `groups` (NAV_GROUPS filtered to non-empty), `counts` (shop → item count), `active`, `onSelect(shop)`, `collapsed`, `onToggle`, `mobileOpen`, `onClose`. `<BottomBar tabs={[]} active onSelect />` — props: `tabs` (MOBILE_TABS with counts), `active`, `onSelect`.

- [ ] **Step 1: `Sidebar.jsx`** — brand row (BrandMark + name), collapse chevron (desktop), nav groups: group label (12px uppercase caption) + shop rows (label + count pill, active = accent left bar 3px + accent text). `aria-current="page"` on active. Mobile: sheet behavior via `mobile-open` class + close button; backdrop div rendered when open.

- [ ] **Step 2: `BottomBar.jsx`** — 5 tabs, each `button.tab-item` with glyph + label + count, active = `--accent-soft` fill + accent text, `aria-current="page"`. Translucent material + `padding-bottom: env(safe-area-inset-bottom)`.

- [ ] **Step 3: Add CSS** — `.sidebar` fixed left, width 260px / `.collapsed` 72px, `transition: width 300ms var(--ease-spring)`, material `rgba(20,20,22,0.7) + blur(20px) saturate(180%)`, right border line; group/shop row styles; `.bottom-bar` fixed bottom, `translateY(110%)` when `.hidden`, 280ms spring; tab styles. Responsive: sidebar visible ≥1024px, auto-collapsed 768–1023px with hover expand, <768px off-canvas sheet `translateX(-100%) → 0`.

- [ ] **Step 4: Build + commit**

```bash
cd app && npm run build && cd ..
git add app/src/components app/src/styles.css
git commit -m "feat: add sidebar and bottom bar navigation"
```

---

### Task 4: App shell rework

**Files:**
- Rewrite: `app/src/App.jsx`

**Interfaces:**
- Consumes: everything from Tasks 1–3.
- Produces: the full app — no new exports.

- [ ] **Step 1: Rewrite `App.jsx`** — shell:
  - `<ParallaxBackground />` first child.
  - Persist active shop (`rl-shop-active`) + sidebar collapsed (`rl-sidebar-collapsed`).
  - Compute `counts` from `shopItems`.
  - Desktop: `<Sidebar>` + `<main>` with margin-left.
  - Mobile topbar: hamburger (opens sheet), brand, bell.
  - Content wrapper `key={currentShop}` + class `shop-content` (CSS cross-fade 160ms).
  - Keep: hero + countdown (`heroSeconds` from earliest endDate), toolbar/search/filters (panel toggles `.open`), item grid, bundle shops (collapse), bundles tab, empty state, modal (closing state, symmetric), toast, footer.
  - `<BottomBar>` rendered <768px via CSS (component always mounted, hidden by media query CSS class toggled by `useMediaQuery` hook inline or CSS `display` — use CSS-only: `.bottom-bar { display: none }` default, `@media (max-width: 767px) { display: flex }`; same for `.topbar` vs sidebar).

- [ ] **Step 2: Add shell CSS** — `main` margin-left 260px/72px transitions with sidebar spring; `shop-content` fade keyframe 160ms; mobile topbar styles; `padding-bottom` for bottom bar clearance on mobile.

- [ ] **Step 3: Build + commit**

```bash
cd app && npm run build && cd ..
git add app/src/App.jsx app/src/styles.css
git commit -m "feat: rework app shell with sidebar, parallax, cross-fade"
```

---

### Task 5: Verification

- [ ] **Step 1: Smoke test** — start `node server.js`, curl `/` (200, HTML), `/api/shop` (200 JSON). Kill server.
- [ ] **Step 2: A11y check** — confirm CSS contains `prefers-reduced-motion` (parallax hidden, cross-fades), `prefers-reduced-transparency` (solid surfaces), `prefers-contrast: more` (stronger lines). Confirm no `transition: all`.
- [ ] **Step 3: Final commit** if any stragglers.

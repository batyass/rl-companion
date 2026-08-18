# RL Companion

**GitHub:** <https://github.com/batyass/rl-companion> · **Live site:** <https://batyass.github.io/rl-companion/>

A fast, Apple-style **Rocket League daily item shop mirror**. See exactly what's in
the shop today — items, prices, paints, rarities, bundles, and live countdown
timers — without launching the game.

Built around a **liquid-glass** design language (React Bits `GlassSurface`,
`Beams`, `FluidGlass`, `SpecularButton`, `Counter`) on top of React + Three.js,
with real shop data fetched from Rocket League's own internal API.

---

## Features

- **Live daily shop** — item rotation with per-item countdown timers
  (`1d 5h 41m`, etc.), pulled from the real game data.
- **Real item art** — game thumbnails resolved through a multi-source asset
  pipeline (Psyonix CDN → community thumbnails → RL Garage).
- **In-game rarity glow** — each card is tinted with its authentic rarity color
  (Black Market, Exotic, Import, Limited, …).
- **Bundles** — expandable bundle cards showing every included item, paint and
  price.
- **Collab shops** — Cybertruck, Star Wars: Beskar, Playing with Fire, Back to
  the Future, McLaren x Daft Punk, RLCS and more (nav is derived from whatever
  is actually in today's rotation).
- **Search + filters** — filter by item type, paint, and rarity with the full
  game vocabulary (nothing becomes unfilterable).
- **Favorites** — save items locally and reopen them from a detail modal.
- **Live activity ticker** — an animated "… just grabbed …" marquee.
- **Animated counters** — items tracked / players notified / bot response.
- **Liquid-glass UI** — a WebGL `Beams` background, `GlassSurface` panels and
  pills, specular search/filter buttons, a **cursor-following fluid-glass lens**
  (toggle top-right, or press `g`), and a **draggable glass chat bubble**.
- **Responsive** — desktop sidebar + mobile bottom tab bar and top bar.

## Tech stack

| Layer | Tech |
| --- | --- |
| UI | React 18, Vite 5 |
| 3D / WebGL | three.js, @react-three/fiber, @react-three/drei |
| Glass effects | React Bits (`GlassSurface`, `Beams`, `FluidGlass`, `SpecularButton`, `Counter`) |
| Primitives | Base UI (`@base-ui/react`, shadcn/base-nova) |
| Motion | motion (Framer), GSAP |
| Tests | Vitest + Testing Library |

## Project structure

```
.
├── app/                     # React + Vite frontend
│   ├── public/
│   │   ├── rl-art/          # item artwork (webp)
│   │   ├── assets/3d/       # fluid-glass lens GLB models
│   │   ├── icons/, splash/  # PWA icons + iOS launch screens (generated)
│   ├── scripts/             # generate-pwa-assets.mjs (PNG icons from icon.svg)
│   ├── src/
│   │   ├── App.jsx          # main app
│   │   ├── data.js          # demo seed + shop/nav vocabulary
│   │   ├── components/      # Sidebar, BottomBar, InstallApp, ui/ (Select, Switch, Sidebar)
│   │   ├── hooks/           # useInstallPrompt, useNow, …
│   │   └── reactbits/       # GlassSurface, Beams, FluidGlass, GlassLens, …
│   └── vite.config.js
├── tools/fetch-shop/        # Go + Python data pipeline (RL internal API → shop.json)
├── data/                    # fallback demo data + item art index
└── server.js                # tiny production server (serves app/dist + /api/shop)
```

## Getting started

Prerequisites: **Node 18+**.

```bash
cd app
npm install
npm run dev
```

Open <http://127.0.0.1:5173/>. The dev server serves the app, `/api/shop`, and
the repo-static assets from disk.

> If `npm install` blocks the `esbuild` postinstall script, approve it:
> `npm install-scripts approve esbuild && npm rebuild esbuild`.

## Tests

```bash
cd app && npm test
```

Runs the Vitest suite (36 tests: layout, shop switching, search, filters,
favorites, modal, bottom bar, `/api/shop` fetch, and the install flow).

## PWA / installable app

The app is a **progressive web app**: on iPhone, tap **Share → Add to Home
Screen** to get a full-screen, offline-capable app icon (free — no App Store
needed). An in-app **Install app** button (hero pill on every viewport, plus a
topbar icon on mobile and a sidebar footer button on desktop) triggers the
native install prompt on Android/Chrome and shows step-by-step
Add-to-Home-Screen guidance on iOS — it hides automatically once the app is
installed. The offline service worker (Workbox, via
`vite-plugin-pwa`) precaches the app shell, fonts, and 3D models, and
runtime-caches the daily shop data (`/api/shop`, network-first) and item art —
so the last-loaded shop keeps working with no connection.

PNG icons and iOS splash screens are generated from `app/public/icon.svg` by
`app/scripts/generate-pwa-assets.mjs` (run automatically before every build):

```bash
cd app && npm run pwa-assets   # regenerate icons/splash from icon.svg
```

Deploys are installable too: `./tools/deploy-pages.sh` bakes the snapshot into
the build, and the service worker precaches it for offline use.

## Build & run (local production)

```bash
cd app && npm run build
cd .. && node server.js        # http://127.0.0.1:4173
```

`server.js` serves the built `app/dist` SPA **plus** a real `/api/shop` endpoint
and the repo-root assets, and starts the daily auto-refresh.

## Data pipeline

Live data comes from `tools/fetch-shop/`, which talks to Rocket League's own
internal API (`Shops/GetStandardShops` / `GetShopCatalogue` via the
`wss://ws.rlpp.psynet.gg` WebSocket, authenticated through Epic Online Services),
merges it with community name/quality dumps, and resolves item art. See
[`tools/fetch-shop/README.md`](tools/fetch-shop/README.md) for the full details.

One-time setup (needs a free Epic account login):

```bash
cd tools/fetch-shop
go run .          # prints an Epic login URL + code; saves a refresh token
./refresh.sh      # go run . → convert.py → resolve-art.py → out/shop.json
```

**Automatic daily refresh** — both `server.js` and the Vite dev middleware load
`tools/fetch-shop/auto-refresh.mjs`, which re-runs the pipeline whenever
`out/shop.json` is older than 20h. So as long as a server is running, the site
refreshes itself daily with **no cron and no manual steps**.

## GitHub Pages

The site is published to GitHub Pages from a **`gh-pages` branch** (the classic
"deploy from a branch" method) — no Actions workflow or `workflow` token scope
needed.

**Live URL:** <https://batyass.github.io/rl-companion/>

To (re)publish:

```bash
./tools/deploy-pages.sh
```

This bakes the latest fetched shop data + item art into the build, builds `app/`
at the `/rl-companion/` base, and force-pushes the result to the `gh-pages`
branch. GitHub Pages rebuilds automatically from that branch.

One-time setup (already done): in **Settings → Pages**, set **Build and
deployment → Source → Deploy from a branch → `gh-pages` → `/ (root)`**.

### Static-hosting caveat

Pages is a **snapshot**, not the live API. `deploy-pages.sh` bakes the current
`tools/fetch-shop/out/shop.json` into the site, so each deploy shows the shop as
of deploy time — it does **not** auto-refresh daily. Re-run
`./tools/deploy-pages.sh` to publish a new rotation. Per-day live updates happen
on the dev server / `node server.js`, where `/api/shop` is served directly.

## Disclaimer

Not affiliated with Psyonix or Epic Games. Rocket League and its assets are the
property of their respective owners. The data fetcher targets a
reverse-engineered community API (github.com/dank/rlapi) and is intended for
personal/educational use only.

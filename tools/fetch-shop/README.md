# fetch-shop — the real item shop fetcher

This is how rlshop.gg gets its data: it talks to Rocket League's own internal
API (`Shops/GetStandardShops` + `Shops/GetShopCatalogue v2` via the
`wss://ws.rlpp.psynet.gg` WebSocket, authenticated through Epic Online
Services). Bundle items carry an **`ImageURL`** (Psyonix CDN); individual
items come back as product IDs with paint/quality attributes.

There is no anonymous access — an Epic Games account is required (any free
account works).

## Setup (one-time, needs a browser login)

```bash
cd tools/fetch-shop
go run .
```

1. The tool prints an Epic login URL + code.
2. Open it, log in with your Epic account, enter the code.
3. It saves `out/catalogue.json` (the shop) and `out/catalog-full.json`
   (products owned by the account, used for quality/paint hints).
   The refresh token is stored in `.rlshops-token` (chmod 600) so later runs
   are non-interactive. **Never commit `.rlshops-token`.**

## Converting to display data

```bash
./refresh.sh
```

This runs the whole pipeline: `go run .` (fetch) → `convert.py` (merge with
community name/quality dumps) → `resolve-art.py` (resolve artwork).

`convert.py` merges the shop catalogue with `ref/products.json`,
`ref/paints.json`, `ref/qualities.json`, `ref/slots.json` — community dumps
(github.com/rocketleagueapi/items) that map product ids → names/quality/slot —
and writes `out/shop.json`.

## Asset pipeline (resolve-art.py)

`resolve-art.py` finds the best artwork for every item, in priority order:
1. game CDN `ImageURL` (credit bundles) — already in the catalogue
2. RocketLeague-Thumbnails repo
   (github.com/CodeRedModding/RocketLeague-Thumbnails) — thumbnails rendered
   from the game's own files, keyed by **product id** (this is what gives new
   cars their in-game art as soon as the community renders them)
3. RL Garage thumbnails (github.com/kaiserdj/rl-garage-assets), by name
4. local overrides in `img-map.json`

Resolved remote art is downloaded into `out/img/` so the site serves its own
copies. The RocketLeague-Thumbnails and RL Garage indexes are cached in
`ref/` after the first run.

## Serving

The site server (`server.js` at the project root) exposes:

- `GET /api/shop` — the converted shop (falls back to `data/shop.json` demo
  seed when the fetch hasn't run)
- static files for images and the app shell

Start it with `node server.js` (port 4173 by default; `PORT=4173` is
recommended if your environment sets a different `PORT`).

## Refreshing

Shop data rotates daily/48h. Re-run `go run . && python3 convert.py` (a cron
job works — the saved token makes it non-interactive).

### Automatic refresh

`auto-refresh.mjs` (loaded by `server.js` and `app/vite.config.js`) re-runs
`refresh.sh --no-login` in the background whenever `out/shop.json` is older
than 20h, so the site updates itself daily without cron. See `.freebuff/run.md`.

`--no-login` (`go run . --no-login` / `./refresh.sh --no-login`) makes the
fetcher fail fast with a clear message instead of starting the interactive
browser login — use it for cron/automation. To re-authenticate after the token
expires, run `go run .` once in a terminal and complete the device-code login.

## Current status / known gaps

- Live: real shop items, prices, paints, rarities, and bundle art.
- `convert.py` only keeps items currently on sale (StartDate/EndDate window),
  so past rotations never resurface. Live items the community product dump
  can't name yet are **kept** with a placeholder "Item {product_id}" name and
  glyph rather than silently dropped — add a `PRODUCT_OVERRIDES` entry (and a
  `NAME_PRODUCT_OVERRIDES` + `PRODUCT_ART_OVERRIDES` entry in `resolve-art.py`
  if needed) to give them real names and art.
- Bundles (`WHITE LIGHTNING`, etc.) and featured cars show game-CDN art.
- BMW M3 (E30) and Corvette ZR1 have no community artwork (released too
  recently for RocketLeague-Thumbnails / RL Garage). Their art comes from
  explicit `PRODUCT_ART_OVERRIDES` in `resolve-art.py` (renders keyed by
  product id on rlshop.gg's CDN), downloaded into `out/img/` on refresh.
  The one exception is the "ZR1 Stripes" decal, which rlshop.gg serves as an
  inline data-URI — it keeps a glyph placeholder.
- Newer cars (BMW, Corvette) aren't in the community product dump, so their
  names/slots/rarities come from `PRODUCT_OVERRIDES` in `convert.py`
  (rarity Exotic, like the other licensed cars).
- rlshop.gg serves item art from **its own private CDN** (the creator uploads
  thumbnails extracted from the game manually). There is no public API for
  item art; the asset pipeline above is the closest public equivalent.

## Caveats

- Not affiliated with Psyonix/Epic. The internal API is reverse-engineered by
  the community (github.com/dank/rlapi); using it may violate Epic's ToS.
  This is for personal/educational use.

# Item images

## What's here
`data/img/*.png` — real Rocket League item artwork for the 10 seeded items that
exist in the community dataset (transparent 220×220 icons scraped from
Rocket League Garage). The other 2 (`heavy-metal`, `prism-schism`) are not in
that dataset and keep the generated placeholder art from `tools/generate-item-art.py`.

## Source
https://github.com/kaiserdj/rl-garage-assets — a bot-scraped index of Rocket League
Garage item thumbnails. Its `output/data.json` maps every item to a thumbnail URL:

```
https://raw.githubusercontent.com/kaiserdj/rl-garage-assets/main/output/data.json
```

Each entry looks like:

```json
{
  "name": "OEM: Infinite",
  "Quality": "Exotic",
  "Type": "Wheels",
  "src": "https://rocket-league.com/content/media/items/avatar/220px/<hash>.png"
}
```

## How to fetch more images
1. Download `output/data.json` (6,299 items).
2. Match items by name (normalize: lowercase, strip punctuation) — painted items
   appear as separate entries under the base name.
3. Download each `src` (send a browser `User-Agent`; RL Garage's CDN blocks bare
   clients) into `data/img/<item-id>.png`.

## Proper long-term path
These are scraped third-party thumbnails — fine for a prototype. The sustainable
source is the game's own data: the internal `Shops/GetShopCatalogue` endpoint
(reverse-engineered by github.com/dank/rlapi) returns each shop item's asset
identifier, which maps to Psyonix's CDN image. That requires an Epic login and
is where the daily shop's real items + images come from.

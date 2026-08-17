#!/usr/bin/env python3
"""Fetch the live item shop straight from rlshop.gg — no Epic login needed.

rlshop.gg is a SvelteKit site that exposes every page's data as JSON at
``/<path>/__data.json`` (devalue format: a flat array where object fields
hold array indexes; -1 means "no value"). This script:

  1. reads https://rlshop.gg/__data.json for the active shops,
  2. fetches each shop page's data (items, bundle groups, RLCS teams),
  3. resolves paints/rarities via the community reference dumps in ref/,
  4. downloads each item's thumbnail (filename embeds the product id),
  5. writes out/shop.json in the same schema the app already consumes.

Because it needs no credentials, the auto-refresher can keep the site
current on its own; the authenticated game-API path remains as fallback.
"""
import json
import os
import re
import sys
import time
import urllib.request

BASE = "https://rlshop.gg"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "out")
IMG_DIR = os.path.join(OUT_DIR, "img")
UA = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) rl-companion/1.0 "
        "(personal shop mirror; contact via github.com/batyass)"
    )
}

# rlshop.gg shop names -> the slugs the app's navigation knows. Unknown
# collab names fall back to a slugified form and the sidebar auto-derives
# a tab for them, so new rotations need no code change.
SHOP_SLUGS = {
    "featured shop": "featured",
    "supersonic customs": "supersonic",
    "bundles": "bundles",
    "rlcs": "rlcs",
    "cybertruck": "cybertruck",
    "star wars: beskar": "beskar",
    "playing with fire": "playingfire",
    "back to the future": "bttf",
    "mclaren x daft punk": "mclaren",
}

FALLBACK_RARITY = {"rlcs": "Limited"}

# Newer shop items the community product dump doesn't know yet (the dump is
# refreshed less often than the shop rotates). Keyed by product id; `quality`
# maps to the rarity via ref/qualities.json. McLaren x Daft Punk crossfade and
# anthem set, confirmed against rlshop.gg's live shop.
PRODUCT_OVERRIDES = {
    "12049": {"quality": 5},  # Daft Punk — Goal Explosion, Exotic
    "12215": {"quality": 5},  # Daft Punk Eternal — Wheels, Exotic
    "12167": {"quality": 4},  # Daft Punk Vinyl — Wheels, Import
    "12123": {"quality": 4},  # Crossfade — Rocket Boost, Import
    "12278": {"quality": 3},  # Crossfade — Trail, Very Rare
    "12352": {"quality": 2},  # Get Lucky — Player Anthem, Rare
    "12371": {"quality": 2},  # I Feel It Coming / Starboy — Player Anthem, Rare
    "12396": {"quality": 2},  # One More Time — Player Anthem, Rare
}


def load_ref(name):
    with open(os.path.join(HERE, "ref", name)) as handle:
        return json.load(handle)


def http_get(url, binary=False):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as res:
        body = res.read()
    return body if binary else body.decode("utf-8")


def make_resolver(data):
    """Resolve a devalue field: >= 0 int is an index into the flat array,
    anything else (including the -1 sentinel) is the literal value."""
    def val(v):
        if isinstance(v, bool) or not isinstance(v, int) or v < 0 or v >= len(data):
            return v
        return data[v]
    return val


def fetch_json(path, want_key):
    """Return the node whose meta object holds `want_key` — the homepage
    layout data and the page-specific data live in different nodes."""
    payload = json.loads(http_get(BASE + path))
    for node in payload.get("nodes", []):
        data = node.get("data")
        if isinstance(data, list) and data and isinstance(data[0], dict) and want_key in data[0]:
            return data, make_resolver(data)
    raise RuntimeError(f"no node with '{want_key}' in {path}")


def decode_item(ref, val, paints, products, qualities):
    raw = ref if isinstance(ref, dict) else {}
    item = {k: val(v) for k, v in raw.items()}
    thumbnail = item.get("thumbnail") or ""
    pid = re.split(r"[./]", os.path.basename(thumbnail))[0] if thumbnail else ""
    product = {**products.get(pid, {}), **PRODUCT_OVERRIDES.get(pid, {})}
    quality = product.get("quality")
    return {
        "pid": pid,
        "name": item.get("label") or "Unknown item",
        "type": item.get("category") or "Item",
        "price": int(str(item.get("price") or 0).replace(",", "")),
        "paint": paints.get(str(item.get("paint"))) if item.get("paint") not in (None, -1) else None,
        "rarity": qualities.get(str(quality)) if quality is not None else None,
        "thumbnail": thumbnail,
        "endTime": item.get("endTime"),
    }


def download_art(thumbnail, products):
    """Download rlshop.gg's thumbnail once per product id; the hashed
    basename changes between their deploys, so reuse any file that already
    starts with the same product id."""
    if not thumbnail:
        return None
    pid = re.split(r"[./]", os.path.basename(thumbnail))[0]
    if not pid:
        return None
    os.makedirs(IMG_DIR, exist_ok=True)
    existing = [f for f in os.listdir(IMG_DIR) if f.startswith(pid + ".")]
    if existing:
        return os.path.join("tools", "fetch-shop", "out", "img", existing[0])
    basename = os.path.basename(thumbnail)
    try:
        blob = http_get(BASE + thumbnail, binary=True)
    except Exception as exc:  # noqa: BLE001 — a single failed image shouldn't kill the run
        print(f"  ! image download failed for {basename}: {exc}", file=sys.stderr)
        return None
    with open(os.path.join(IMG_DIR, basename), "wb") as handle:
        handle.write(blob)
    return os.path.join("tools", "fetch-shop", "out", "img", basename)


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def shop_slug(shop, page_name):
    if page_name and page_name.lower() == "rlcs":
        return "rlcs"
    for key, slug in SHOP_SLUGS.items():
        if key in (shop.get("Name") or "").lower() or key == (page_name or "").lower():
            return slug
    return slugify(shop.get("Name") or page_name or "shop")


def main():
    paints = load_ref("paints.json")
    products = load_ref("products.json")
    qualities = load_ref("qualities.json")

    print("== fetching active shops from rlshop.gg ==")
    home_data, home_val = fetch_json("/__data.json", "activeShops")
    # The Featured Shop's data rides on the homepage itself (its /52 page
    # 404s), so keep that node around as a per-shop fallback.
    home_payload = json.loads(http_get(BASE + "/__data.json"))
    home_shop_node = None
    for node in home_payload.get("nodes", []):
        nd = node.get("data")
        if isinstance(nd, list) and nd and isinstance(nd[0], dict) and "shopName" in nd[0]:
            home_shop_node = (nd, make_resolver(nd))
            break
    meta = home_data[0]
    shops_ref = home_val(meta["activeShops"])
    shops = []
    for idx in shops_ref:
        entry = home_data[idx] if isinstance(idx, int) and idx >= 0 else idx
        if isinstance(entry, dict):
            shops.append({k: home_val(v) for k, v in entry.items()})

    items_out = []
    for shop in shops:
        shop_id = shop.get("ID")
        name = shop.get("Name") or ""
        try:
            data, val = fetch_json(f"/{shop_id}/__data.json", "shopName")
        except Exception:
            if home_shop_node:
                data, val = home_shop_node
                print(f"  {name}: /{shop_id} unavailable, using homepage data")
            else:
                print(f"  ! shop '{name}' ({shop_id}) failed and no homepage fallback", file=sys.stderr)
                continue
        page_meta = data[0]
        page = {k: val(v) for k, v in page_meta.items()}
        page_name = page.get("shopName") or name
        slug = shop_slug(shop, page_name)
        is_rlcs = bool(page.get("isRLCS")) or slug == "rlcs"
        if is_rlcs:
            slug = "rlcs"
        print(f"  {name or page_name} -> shop '{slug}'")

        def resolve(ref):
            raw = data[ref] if isinstance(ref, int) and ref >= 0 else ref
            return decode_item(raw, val, paints, products, qualities)

        def to_item(dec, shop_key, suffix):
            image = download_art(dec["thumbnail"], products)
            rarity = dec["rarity"] or FALLBACK_RARITY.get(shop_key, "Very Rare")
            return {
                "id": f"rlshop-{shop_key}-{dec['pid'] or suffix}",
                "name": dec["name"],
                "paint": dec["paint"],
                "type": dec["type"],
                "category": shop_key,
                "shop": shop_key,
                "rarity": rarity,
                "price": dec["price"],
                "image": image,
                "visual": "✦",
                "endDate": dec["endTime"],
            }

        groups_ref = page.get("groups") or []
        groups = []
        for gref in groups_ref:
            raw = data[gref] if isinstance(gref, int) and gref >= 0 else gref
            if isinstance(raw, dict):
                groups.append({k: val(v) for k, v in raw.items()})

        if groups:
            for gi, group in enumerate(groups):
                contents = []
                for ci, iref in enumerate(group.get("items") or []):
                    dec = resolve(iref)
                    image = download_art(dec["thumbnail"], products)
                    contents.append({
                        "id": f"rlshop-{slug}-g{gi}-{dec['pid'] or ci}",
                        "name": dec["name"],
                        "paint": dec["paint"],
                        "type": dec["type"],
                        "rarity": dec["rarity"] or FALLBACK_RARITY.get(slug, "Very Rare"),
                        "image": image,
                        "visual": "✦",
                    })
                group_price = str(group.get("price") or "")
                if group_price.strip() and group_price != "0":
                    # priced group = purchasable bundle
                    items_out.append({
                        "id": f"rlshop-{slug}-bundle-{gi}",
                        "name": group.get("name") or page_name,
                        "type": "Bundle",
                        "shop": slug,
                        "rarity": "Very Rare",
                        "price": int(group_price.replace(",", "")),
                        "bundle": True,
                        "endDate": group.get("endTime"),
                        "image": contents[0]["image"] if contents else None,
                        "visual": "✦",
                        "contents": contents,
                    })
                else:
                    # unpriced groups (RLCS teams) flatten to plain items
                    for ci, iref in enumerate(group.get("items") or []):
                        items_out.append(to_item(resolve(iref), slug, f"g{gi}-{ci}"))
        # Standalone items ride alongside bundle groups on the same page —
        # e.g. McLaren x Daft Punk lists the car bundle *and* the individual
        # wheels/boosts/trails/anthems. Previously only the `else` branch read
        # them, so any shop with a priced bundle silently dropped every
        # non-bundle item.
        items_ref = page.get("items") or []
        for ii, iref in enumerate(items_ref):
            items_out.append(to_item(resolve(iref), slug, ii))
        time.sleep(0.4)  # stay polite between shop pages

    if not items_out:
        print("no items fetched — aborting without touching shop.json", file=sys.stderr)
        return 1

    missing_rarity = sum(1 for i in items_out if i.get("rarity") in (None, "Very Rare") and not i.get("bundle"))
    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, "shop.json")
    payload = {
        "source": "rlshop.gg",
        "count": len(items_out),
        "items": items_out,
        "generatedAt": int(time.time()),
    }
    with open(out_path, "w") as handle:
        json.dump(payload, handle, indent=1)
    print(f"== wrote {len(items_out)} items to out/shop.json "
          f"({missing_rarity} used a fallback rarity) ==")
    return 0


if __name__ == "__main__":
    sys.exit(main())

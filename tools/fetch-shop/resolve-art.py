#!/usr/bin/env python3
"""Resolve the best available artwork for every shop item and regenerate shop.json.

Sources, in priority order:
1. game CDN ImageURL (bundle art) — already in the catalogue
2. RocketLeague-Thumbnails repo (github.com/CodeRedModding/RocketLeague-Thumbnails)
   — thumbnails rendered from the game's own files, keyed by product id.
3. RL Garage thumbnails (github.com/kaiserdj/rl-garage-assets) — keyed by name.
4. Local downloaded art (img-map.json) — last resort overrides.

Resolved remote art is downloaded into out/img/ so the site serves its own
copies instead of hotlinking third-party CDNs.

Run after `go run .` + `python3 convert.py`:
    python3 resolve-art.py
"""
import json
import os
import re
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
IMG = os.path.join(OUT, "img")

GITHUB_RAW = "https://raw.githubusercontent.com/CodeRedModding/RocketLeague-Thumbnails/main"
# slot folder name -> item types we accept art from for that product
THUMB_FOLDERS = ["Body", "Decal", "Goal Explosion", "Goal Stinger", "Player Banner", "Rocket Boost", "Trail", "Wheels", "Topper", "Antenna", "Avatar Border"]

# Product-id -> art URL for items no community source covers yet (brand-new
# items the thumbnails repo / RL Garage haven't rendered). Resolved art is
# downloaded into out/img/, so the site never hotlinks the source.
PRODUCT_ART_OVERRIDES = {
    # 007's Aston Martin Valhalla: Solid Gold decal (Decal slot) — same render
    # rlshop.gg ships for the bundle.
    "12794": "https://rlshop.gg/_app/immutable/assets/12794.zIydDV2q.webp",
    # BMW M3 (E30) bundle — renders from rlshop.gg's CDN, keyed by product id.
    # Resolved art is downloaded into out/img/, so we never hotlink.
    "11534": "https://rlshop.gg/_app/immutable/assets/11534.D3HEZtTm.webp",  # Body
    "12877": "https://rlshop.gg/_app/immutable/assets/12877.Bb8-yj8s.webp",  # Brick Body
    "11942": "https://rlshop.gg/_app/immutable/assets/11942.Br6qRQjs.webp",  # N-Tro
    "11809": "https://rlshop.gg/_app/immutable/assets/11809.BUUGh7rv.webp",  # M Series
    "11843": "https://rlshop.gg/_app/immutable/assets/11843.DLpFBIc9.webp",  # Red Ranger
    "11848": "https://rlshop.gg/_app/immutable/assets/11848.C87RVNc3.webp",  # Black Ranger
    "11864": "https://rlshop.gg/_app/immutable/assets/11864.CekzrdY9.webp",  # Yellow Ranger
    "11833": "https://rlshop.gg/_app/immutable/assets/11833.Cez0vUm9.webp",  # Blue Ranger
    "11845": "https://rlshop.gg/_app/immutable/assets/11845.6VbaEbl1.webp",  # Pink Ranger
    "11855": "https://rlshop.gg/_app/immutable/assets/11855.BFfJs_sm.webp",  # Green Ranger
    "11890": "https://rlshop.gg/_app/immutable/assets/11890.Dp8DOYri.webp",  # White Ranger
    "11575": "https://rlshop.gg/_app/immutable/assets/11575.BTFX4nSM.webp",  # Wheels
    # Chevrolet Corvette ZR1 bundle
    "11677": "https://rlshop.gg/_app/immutable/assets/11677.Bk8kAjSq.webp",  # Body
    "12057": "https://rlshop.gg/_app/immutable/assets/12057.BAlpzTEs.webp",  # Wonderbot
    "11699": "https://rlshop.gg/_app/immutable/assets/11699.BOHQz1VT.webp",  # Fish Farewell
    # (11701 "ZR1 Stripes" is served as an inline data-URI on rlshop.gg — no
    # stable URL; it falls back to a glyph placeholder.)
    "11732": "https://rlshop.gg/_app/immutable/assets/11732.RGXhpuYd.webp",  # Sea Wolf Gray
    "11668": "https://rlshop.gg/_app/immutable/assets/11668.D2QWCP74.webp",  # Wheels
    # Credit-bundle contents — old items the thumbnails repo / RL Garage
    # don't render, served by rlshop.gg keyed by product id.
    "1286": "https://rlshop.gg/_app/immutable/assets/1286.w9gHpx2E.webp",  # Aftershock body
    "10507": "https://rlshop.gg/_app/immutable/assets/10507.DMi9VYnG.webp",  # So-Low wheels
    "1172": "https://rlshop.gg/_app/immutable/assets/1172.DXuToffL.webp",  # Marauder body
    "1980": "https://rlshop.gg/_app/immutable/assets/1980.kEcGek2p.webp",  # Pearlescent (Matte) finish
    "4384": "https://rlshop.gg/_app/immutable/assets/4384.FsCWksUs.webp",  # Creeper wheels
    "22": "https://rlshop.gg/_app/immutable/assets/22.C5eOJDFX.webp",  # Breakout body
    "2827": "https://rlshop.gg/_app/immutable/assets/2827.D1YBtcFV.webp",  # Hypnotik wheels
    "4284": "https://rlshop.gg/_app/immutable/assets/4284.pzWzjodx.webp",  # Fennec body
    "6019": "https://rlshop.gg/_app/immutable/assets/6019.D6Hdu2eF.webp",  # Astro-CSX wheels
    "11606": "https://rlshop.gg/_app/immutable/assets/11606.CPEYKdaT.webp",  # Dimensionator goal explosion
    "9024": "https://rlshop.gg/_app/immutable/assets/9024.CI1byFPK.webp",  # Hanami animated decal
    "11288": "https://rlshop.gg/_app/immutable/assets/11288.mIIsBe8B.webp",  # Hologlass goal explosion
    "11059": "https://rlshop.gg/_app/immutable/assets/11059.DeRllCm9.webp",  # Bob's Ramen Roller decal
}

# Bundle name -> body product id, for bundles whose body isn't in the
# community product database (they otherwise can't be matched by name).
NAME_PRODUCT_OVERRIDES = {
    "bmw m3 e30": "11534",
    "chevrolet corvette zr1": "11677",
    # Featured-shop items too new for the community product dump — needed so
    # their art resolves by product id (Puzzle Cube and 99 Octane have
    # RocketLeague-Thumbnails renders; Bob's Ramen Roller uses the override).
    "puzzle cube": "11067",
    "bobs ramen roller": "11059",  # norm() strips the apostrophe
    "99 octane": "11577",
}


def load(name):
    with open(os.path.join(HERE, name)) as handle:
        return json.load(handle)


def norm(s):
    return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()


def normalize_type(item_type):
    """Map a catalogue item type to a thumbnail folder / RL Garage Type.

    Keeps the art source consistent with the item's slot: a Wheels item must
    never pick up a Body render just because they share a name.
    """
    low = norm(item_type or "")
    if "decal" in low:
        return "Decal"
    if "goal explosion" in low:
        return "Goal Explosion"
    if "rocket boost" in low:
        return "Rocket Boost"
    if "player banner" in low:
        return "Player Banner"
    if "player anthem" in low:
        return "Player Anthem"
    if "engine audio" in low:
        return "Engine Audio"
    if "avatar border" in low:
        return "Avatar Border"
    if "paint finish" in low:
        return "Paint Finish"
    return (item_type or "").strip()


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def github_thumb_exists(product_id, preferred_folder=None):
    """Find <folder>/<product_id>_0.png in the thumbnails repo via the git tree index.

    When a preferred folder is given (the item's slot), it wins; the generic
    folder sweep is only a fallback.
    """
    idx_path = os.path.join(HERE, "ref", "thumbnails-index.json")
    if not os.path.exists(idx_path):
        print("  fetching thumbnails index...")
        tree = json.loads(fetch("https://api.github.com/repos/CodeRedModding/RocketLeague-Thumbnails/git/trees/main?recursive=1", 120))
        paths = [t["path"] for t in tree.get("tree", [])]
        with open(idx_path, "w") as f:
            json.dump(paths, f)
    else:
        paths = json.load(open(idx_path))
    if preferred_folder in THUMB_FOLDERS and f"{preferred_folder}/{product_id}_0.png" in paths:
        from urllib.parse import quote
        return f"{GITHUB_RAW}/{quote(preferred_folder)}/{product_id}_0.png"
    for folder in THUMB_FOLDERS:
        if f"{folder}/{product_id}_0.png" in paths:
            from urllib.parse import quote
            return f"{GITHUB_RAW}/{quote(folder)}/{product_id}_0.png"
    return None


def rl_garage_thumb(name, item_type=None):
    """Find a thumbnail URL for an item by name in the RL Garage dataset.

    RL Garage stores one entry per slot (Body, Wheels, Decal, ...) under the
    same name, so match the Type too — otherwise a Wheels item named like its
    body grabs the body render.
    """
    data_path = os.path.join(HERE, "ref", "rlgarage-data.json")
    if not os.path.exists(data_path):
        print("  fetching RL Garage dataset...")
        data = fetch("https://raw.githubusercontent.com/kaiserdj/rl-garage-assets/main/output/data.json", 120)
        with open(data_path, "wb") as f:
            f.write(data)
    else:
        with open(data_path, "rb") as f:
            data = f.read()
    entries = json.loads(data)
    key = norm(name)
    want = normalize_type(item_type) if item_type else None
    if want:
        for entry in entries:
            if norm(entry.get("name", "")) == key and norm(entry.get("Type", "")) == norm(want) and entry.get("src"):
                return entry["src"]
    # looser: same name, any type
    for entry in entries:
        if norm(entry.get("name", "")) == key and entry.get("src"):
            return entry["src"]
    # loosest: base name before ':' (e.g. "Breakout: Astaroth" -> "Breakout").
    # Only accept the same Type — otherwise a Decal named like its body would
    # grab the Body render.
    base = norm(name.split(":")[0].strip())
    if base != key:
        for entry in entries:
            if norm(entry.get("name", "")) == base and (not want or norm(entry.get("Type", "")) == norm(want)) and entry.get("src"):
                return entry["src"]
    return None


PROV = os.path.join(IMG, "provenance.json")


def load_provenance():
    if os.path.exists(PROV):
        with open(PROV) as f:
            return json.load(f)
    return {}


def save_provenance(prov):
    with open(PROV, "w") as f:
        json.dump(prov, f, indent=2)


def download(url, dest, key=None, prov=None):
    """Download a URL unless we already have this exact source on disk.

    Records the source URL per key so that stale art (e.g. a body image
    downloaded for a decal by an earlier buggy run) is re-downloaded as soon
    as the resolved source changes.
    """
    if os.path.exists(dest) and prov and prov.get(key) == url:
        return True
    try:
        data = fetch(url)
        with open(dest, "wb") as f:
            f.write(data)
        if prov is not None and key is not None:
            prov[key] = url
        return True
    except Exception as exc:
        print(f"    download failed {url[:80]}: {exc}")
        return False


def main():
    shop = load("out/shop.json")
    img_map = load("img-map.json")
    os.makedirs(IMG, exist_ok=True)
    prov = load_provenance()

    changed = 0
    for item in shop["items"]:
        image = item.get("image") or ""

        resolved = None
        product_id = None

        # 2) RocketLeague-Thumbnails by product id — the most precise source.
        #    (the daily items have no title in the catalogue, so map by name
        #    via the product database). Prefer the folder matching the slot
        #    so a Wheels item never picks up a Body render.
        product_id = find_product_id(item["name"], item.get("paint"))
        item_slot = normalize_type(item.get("type"))
        if product_id:
            resolved = github_thumb_exists(product_id, item_slot)

        # 3) RL Garage — type-aware first (a decal should match its own art,
        #    not the base body), then name-only
        if not resolved:
            resolved = rl_garage_thumb(item["name"], item.get("type"))

        # 3b) explicit product art overrides (brand-new licensed cars the
        #     community sources haven't rendered yet)
        if not resolved and product_id:
            resolved = PRODUCT_ART_OVERRIDES.get(product_id)

        # 4) local override — only for names that have NO product-id art;
        #    never let a generic body image win over a real decal
        if not resolved and product_id is None:
            local = img_map.get(norm(item["name"]))
            if local:
                # img-map.json paths are already relative to the project root
                resolved = local

        # Keep a previously-resolved art only when it's strictly more precise
        # (game CDN bundle art) than what we just found.
        keep_current = image.startswith("http") and not resolved
        if not resolved and not keep_current and image:
            resolved = image  # keep what we had

        if not resolved:
            print(f"  no art: {item['name']}")
        elif resolved.startswith("http"):
            # download remote art into out/img/
            ext = resolved.split("?")[0].rsplit(".", 1)[-1] if "." in resolved.split("?")[0] else "png"
            dest = os.path.join(IMG, f"{item['id']}.{ext}")
            if download(resolved, dest, key=item["id"], prov=prov):
                new_path = os.path.join("tools", "fetch-shop", "out", "img", os.path.basename(dest))
                if new_path != image:
                    item["image"] = new_path
                    changed += 1
                    print(f"  art ok: {item['name']} <- {os.path.basename(dest)}")
        else:
            if resolved != image:
                item["image"] = resolved
                changed += 1
                print(f"  art ok: {item['name']} <- {resolved}")

        # Bundle contents: resolve art by product id (and slot type) too, so
        # content cards (e.g. the BMW decals) show their own art instead of a
        # placeholder. This must run even when the bundle's own art didn't
        # resolve (credit bundles keep a CDN hotlink, so resolved is None and
        # we'd otherwise skip their contents entirely). Contents always
        # re-resolve — provenance decides whether the file actually needs
        # re-downloading, so stale body art on a Wheels entry gets replaced as
        # soon as a better source exists.
        for content in item.get("contents", []):
            cid = str(content.get("id", ""))
            if not cid or cid.startswith("Item"):
                continue
            c_url = (PRODUCT_ART_OVERRIDES.get(cid)
                     or github_thumb_exists(cid, normalize_type(content.get("type")))
                     or rl_garage_thumb(content.get("name", ""), content.get("type")))
            if not c_url:
                # no real, type-correct source: drop stale fallback art rather
                # than showing a wrong render (e.g. a Body on a Decal slot)
                if content.get("image"):
                    content["image"] = None
                    changed += 1
                    print(f"  content art dropped: {content.get('name', cid)}")
                continue
            c_ext = c_url.split("?")[0].rsplit(".", 1)[-1] if "." in c_url.split("?")[0] else "png"
            c_dest = os.path.join(IMG, f"content-{cid}.{c_ext}")
            if download(c_url, c_dest, key=f"content-{cid}", prov=prov):
                new_img = os.path.join("tools", "fetch-shop", "out", "img", os.path.basename(c_dest))
                if new_img != content.get("image"):
                    content["image"] = new_img
                    changed += 1
                    print(f"  content art ok: {content.get('name', cid)} <- {os.path.basename(c_dest)}")

    with open(os.path.join(OUT, "shop.json"), "w") as f:
        json.dump(shop, f, indent=2)
    save_provenance(prov)
    print(f"done — {changed} items updated, {sum(1 for i in shop['items'] if i.get('image'))}/{len(shop['items'])} have art")


def find_product_id(name, paint):
    """Map a shop item back to its catalogue product id.

    Shop items without a Title (the daily items) can't be matched by title,
    so fall back to the community product database: product name == item name.
    """
    catalogue = load("out/catalogue.json")
    for cat in catalogue["Catalogues"]:
        for si in cat.get("ShopItems", []):
            dps = si.get("DeliverableProducts", [])
            if not dps:
                continue
            pid = str(dps[0]["Product"]["ProductID"])
            title = (si.get("Title") or "").strip()
            if title and norm(title) == norm(name):
                return pid
    products = load("ref/products.json")
    for pid, info in products.items():
        if norm(info.get("name", "")) == norm(name):
            return str(pid)
    return NAME_PRODUCT_OVERRIDES.get(norm(name))


if __name__ == "__main__":
    main()

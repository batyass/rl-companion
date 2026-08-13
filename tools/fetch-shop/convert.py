#!/usr/bin/env python3
"""Convert the raw fetched shop catalogue into display-ready data for the app.

Reads:
  out/catalogue.json      - raw shop data fetched from the game API
  ref/products.json       - product id -> name/quality/slot (community dump)
  ref/paints.json         - paint id -> name
  ref/qualities.json      - quality id -> name

Writes:
  out/shop.json           - friendly items the frontend renders
"""
import json
import os
import re
import time

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name):
    with open(os.path.join(HERE, name)) as handle:
        return json.load(handle)


def norm(s):
    return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()


def main():
    catalogue = load("out/catalogue.json")
    products = load("ref/products.json")
    paints = load("ref/paints.json")
    qualities = load("ref/qualities.json")
    slots = load("ref/slots.json")

    # item name -> locally downloaded artwork (the game API only ships art
    # for bundles; item art comes from our community image collection).
    # Paths are relative to the project root, where the site server runs.
    img_map = load("img-map.json")

    # Products too new for the community reference database but confirmed in
    # the live shop (rlshop.gg shows them too). Keyed by product id.
    # BMW M3 (E30) and Corvette ZR1 are licensed-car bundles: names/slots come
    # from rlshop.gg's current shop, rarity is Exotic (like the other licensed
    # cars, e.g. Valhalla / Lamborghini).
    PRODUCT_OVERRIDES = {
        "11571": {"name": "Prism Schism", "slot": 15, "quality": 5},  # Goal Explosion, Saffron, Exotic
        "12794": {"name": "007's Aston Martin Valhalla: Solid Gold", "slot": 1, "quality": 5},  # Animated Decal
        # BMW M3 (E30) bundle
        "11534": {"name": "BMW M3 (E30)", "slot": 0, "quality": 5},  # Body
        "12877": {"name": "BMW M3 (E30): Brick Body", "slot": 1, "quality": 5},
        "11942": {"name": "BMW M3 (E30): N-Tro", "slot": 1, "quality": 5},
        "11809": {"name": "BMW M3 (E30): M Series", "slot": 1, "quality": 5},
        "11843": {"name": "BMW M3 (E30): Red Ranger", "slot": 1, "quality": 5},
        "11848": {"name": "BMW M3 (E30): Black Ranger", "slot": 1, "quality": 5},
        "11864": {"name": "BMW M3 (E30): Yellow Ranger", "slot": 1, "quality": 5},
        "11833": {"name": "BMW M3 (E30): Blue Ranger", "slot": 1, "quality": 5},
        "11845": {"name": "BMW M3 (E30): Pink Ranger", "slot": 1, "quality": 5},
        "11855": {"name": "BMW M3 (E30): Green Ranger", "slot": 1, "quality": 5},
        "11890": {"name": "BMW M3 (E30): White Ranger", "slot": 1, "quality": 5},
        "11575": {"name": "BMW M3 (E30)", "slot": 2, "quality": 5},  # Wheels
        # Chevrolet Corvette ZR1 bundle
        "11677": {"name": "Chevrolet Corvette ZR1", "slot": 0, "quality": 5},  # Body
        "12057": {"name": "Chevrolet Corvette ZR1: Wonderbot", "slot": 1, "quality": 5},  # Animated Decal
        "11699": {"name": "Chevrolet Corvette ZR1: Fish Farewell", "slot": 1, "quality": 5},  # Animated Decal
        "11701": {"name": "Chevrolet Corvette ZR1: ZR1 Stripes", "slot": 1, "quality": 5},
        "11732": {"name": "Chevrolet Corvette ZR1: Sea Wolf Gray", "slot": 1, "quality": 5},
        "11668": {"name": "Chevrolet Corvette ZR1", "slot": 2, "quality": 5},  # Wheels
        # Credit-bundle contents the game API doesn't name (rlshop.gg's shop
        # data shows these names/slots for the same product ids). Premium
        # shop items — quality 5 (Exotic) like the other premium contents.
        "11606": {"name": "Dimensionator", "slot": 15, "quality": 5},  # Goal Explosion
        "9024": {"name": "Hanami", "slot": 1, "quality": 5},  # Animated Decal
        "11288": {"name": "Hologlass", "slot": 15, "quality": 5},  # Goal Explosion
        # Lamborghini bundle contents (Mortal Kombat collab decals)
        "11477": {"name": "Lamborghini Countach LPI 800-4: Shirai Ryu Wrapped", "slot": 1, "quality": 5},  # Animated Decal
        "11508": {"name": "Lamborghini Countach LPI 800-4: Lin Kuei Wrapped", "slot": 1, "quality": 5},  # Animated Decal
        "11519": {"name": "Lamborghini Countach LPI 800-4: Opalescent", "slot": 1, "quality": 5},  # Decal
        # community DB says quality 0 for this wheels entry — same wheels as
        # the Exotic Countach 70's, so override to match
        "7516": {"name": "Lamborghini Countach LPI 800-4", "slot": 2, "quality": 5},  # Wheels
        # Featured-shop items too new for the community product dump; names
        # confirmed from rlshop.gg's shop data for the same product ids.
        "11067": {"name": "Puzzle Cube", "slot": 15, "quality": 5},  # Goal Explosion
        "11059": {"name": "Bob's Ramen Roller", "slot": 1, "quality": 4},  # Decal
        # 99 Octane lives in the Goal Stinger slot; "Player Anthem" is the
        # in-game label rlshop.gg uses, so show that as the type.
        "11577": {"name": "99 Octane", "slot": 18, "quality": 4, "type": "Player Anthem"},
    }

    # Shop items whose community reference name is shorter than the full
    # in-game title (rlshop.gg shows the game names). Applied on top of the
    # reference database, which only knows the base item.
    NAME_OVERRIDES = {
        "4646": "FSL-B: Flare",  # Saffron wheels
        "8917": "OEM: Infinite",  # Purple wheels
    }

    # Painted variants sell at a higher quality than the base item; the
    # community product dump only knows the base quality. These are the
    # product ids we've seen in the shop that are painted-upgraded.
    PAINTED_QUALITY = {
        "62": "Import",  # Sparkles
        "8917": "Exotic",  # OEM
        "4646": "Very Rare",  # FSL-B
        "23": "Import",  # Octane (painted)
        "22": "Import",  # Breakout (painted)
        "2679": "Rare",  # Breakout: Astaroth (painted)
        "4992": "Rare",  # Fennec: Hardline (painted)
    }

    # ShopID -> shop section, mirroring the in-game shop nav like rlshop.gg:
    # each featured car bundle is its own section, credit bundles share one,
    # 52/474 are the Supersonic Customs daily shops, 55 is RLCS esports.
    # 52 is the Featured Shop (spotlight items), 474 is Supersonic Customs
    # (the daily rotation) — rlshop.gg keeps them as separate nav sections.
    SHOP_SECTION = {
        52: "featured", 474: "supersonic", 55: "rlcs",
        477: "bundles", 411: "corvette", 487: "valhalla", 488: "bmw", 381: "lamborghini",
    }
    # bundle-type shops are shown as bundle cards, like rlshop.gg
    CATEGORY = {
        52: "daily", 474: "daily", 55: "esports",
        477: "bundles", 411: "bundles", 487: "bundles", 488: "bundles", 381: "bundles",
    }

    items = []
    seen = set()
    for cat in catalogue["Catalogues"]:
        shop_id = cat.get("ShopID")
        category = CATEGORY.get(shop_id, "featured")
        shop_section = SHOP_SECTION.get(shop_id, "featured")
        for shop_item in cat.get("ShopItems", []):
            # Only current items: the API returns every historical rotation,
            # and expired shops must never resurface in the app.
            now = int(time.time())
            start = shop_item.get("StartDate") or 0
            end = shop_item.get("EndDate") or 0
            if not (start <= now <= end):
                continue

            title = (shop_item.get("Title") or "").strip()
            price = 0
            for cost in shop_item.get("Costs", []):
                for p in cost.get("Price", []):
                    if p.get("ID") == 13:  # 13 = Credits
                        price = p["Amount"]
                        break
            if price <= 0:
                continue  # skip free/zero-credit placeholders
            image = shop_item.get("ImageURL") or ""
            product = (shop_item.get("DeliverableProducts") or [{}])[0].get("Product", {})
            product_id = str(product.get("ProductID", ""))
            attrs = {a["Key"]: a["Value"] for a in product.get("Attributes", [])}
            # PRODUCT_OVERRIDES wins per-field over the community DB (the DB
            # can hold wrong data for new items, e.g. quality 0 wheels).
            info = {**products.get(product_id, {}), **PRODUCT_OVERRIDES.get(product_id, {})}

            # Live items are always kept: brand-new products the community
            # database hasn't named yet fall back to a placeholder name and
            # glyph instead of silently disappearing (add a
            # PRODUCT_OVERRIDES entry to give them a real name).
            name = title or NAME_OVERRIDES.get(product_id) or info.get("name") or f"Item {product_id}"
            paint_id = str(attrs.get("Painted", "0"))
            paint = paints.get(paint_id, "")
            # paint prefix applies to product names, never to bundle titles
            if title:
                paint = ""

            if "Painted" in attrs and product_id in PAINTED_QUALITY:
                rarity = PAINTED_QUALITY[product_id]
            else:
                quality_id = str(attrs.get("Quality") or info.get("quality") or "0")
                rarity = qualities.get(quality_id, "Common")
            item_type = info.get("type") or slots.get(str(info.get("slot", "")), "Item")
            visual = "✦"
            # fuzzy match: exact normalized name, else any map key contained in the name
            local_art = ""
            item_name = norm(title or NAME_OVERRIDES.get(product_id) or info.get("name", ""))
            if item_name in img_map:
                local_art = img_map[item_name]
            else:
                for key, art in img_map.items():
                    if key in item_name:
                        local_art = art
                        break

            key = (name, paint, price)
            if key in seen:
                continue
            seen.add(key)

            contents = []
            if category == "bundles":
                for dp in shop_item.get("DeliverableProducts", []):
                    pid = str(dp["Product"]["ProductID"])
                    # per-field merge: override wins over the community DB
                    cinfo = {**products.get(pid, {}), **PRODUCT_OVERRIDES.get(pid, {})}
                    cattrs = {a["Key"]: a["Value"] for a in dp["Product"].get("Attributes", [])}
                    cpaint_id = str(cattrs.get("Painted", "0"))
                    # painted variants sell at a higher quality than the base
                    # item (same rule as top-level items)
                    if "Painted" in cattrs and pid in PAINTED_QUALITY:
                        crarity = PAINTED_QUALITY[pid]
                    else:
                        cquality_id = str(cattrs.get("Quality") or cinfo.get("quality") or "0")
                        crarity = qualities.get(cquality_id, "Common")
                    contents.append({
                        "id": pid,
                        "name": cinfo.get("name") or f"Item {pid}",
                        "paint": paints.get(cpaint_id, "") or None,
                        "rarity": crarity,
                        "type": slots.get(str(cinfo.get("slot", "")), "Item"),
                    })

            items.append({
                "id": f"shop-{shop_item.get('ShopItemID')}",
                "name": name,
                "paint": paint or None,
                "type": item_type,
                "category": category,
                "shop": shop_section,
                "rarity": rarity,
                "price": price,
                "image": image or local_art,
                "visual": visual,
                "bundle": category == "bundles",
                "endDate": shop_item.get("EndDate"),  # unix seconds, real rotation expiry
                "contents": contents,
            })

    # Sensible ordering: bundles, then daily items
    order = {"bundles": 0, "daily": 1, "esports": 2}
    items.sort(key=lambda it: (order.get(it["category"], 9), it["price"]))

    out = {"source": "game-api", "count": len(items), "items": items}
    with open(os.path.join(HERE, "out", "shop.json"), "w") as handle:
        json.dump(out, handle, indent=2)
    print(f"wrote out/shop.json with {len(items)} items")
    for it in items[:14]:
        print(f"  {it['paint'] + ' ' if it['paint'] else ''}{it['name']} | {it['rarity']} | {it['price']} | {it['category']} | img={bool(it['image'])}")


if __name__ == "__main__":
    main()

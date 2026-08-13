#!/usr/bin/env python3
"""Generate original, rarity-tinted item artwork for the RL Shop prototype.

All artwork is original (geometric shapes only) so we don't ship any
copyrighted Rocket League assets. Renders each item's SVG to a PNG in
data/img/ with rsvg-convert.
"""
import os
import subprocess

RARITY_COLORS = {
    "Common": "#b0b0b0", "Uncommon": "#5ea4c9", "Rare": "#4b8cd7",
    "Very Rare": "#6c3fa0", "Import": "#e34c3c", "Exotic": "#d29b3a",
    "Black Market": "#c23a2b", "Limited": "#3ac9c5", "Premium": "#b6c1ff",
    "Legacy": "#c6a97b",
}

# item-id: (type, rarity) -> drives the art + tint
ITEMS = {
    "purple-sparkles": ("boost", "Rare"),
    "draco-multichrome": ("decal", "Black Market"),
    "heavy-metal": ("decal", "Import"),
    "oem-infinite": ("wheel", "Exotic"),
    "fslb-flare": ("wheel", "Import"),
    "cold-front": ("explosion", "Black Market"),
    "prism-schism": ("explosion", "Black Market"),
    "lightning-gilded": ("trail", "Import"),
    "octane-vertebrate": ("decal", "Import"),
    "sunset-1986": ("banner", "Rare"),
    "neo-thermal": ("boost", "Import"),
    "halo-purple": ("topper", "Rare"),
}

ART = {
    "boost": (
        '<path d="M96 220 Q160 190 170 96 Q200 210 264 220 Q200 250 170 340 Q140 250 96 220 Z" '
        'fill="{c}" opacity=".95"/><path d="M96 220 Q160 190 170 96" stroke="#fff" stroke-width="10" '
        'stroke-opacity=".35" fill="none" stroke-linecap="round"/><ellipse cx="170" cy="226" rx="86" '
        'ry="12" fill="#fff" opacity=".25"/>'
    ),
    "decal": (
        '<path d="M60 60 L280 200 L200 60 L60 220 Z" fill="{c}" opacity=".9"/>'
        '<path d="M60 60 L280 200 M200 60 L60 220" stroke="#fff" stroke-width="8" '
        'stroke-opacity=".3" fill="none"/>'
    ),
    "wheel": (
        '<circle cx="170" cy="170" r="104" fill="none" stroke="{c}" stroke-width="20"/>'
        '<circle cx="170" cy="170" r="48" fill="none" stroke="{c}" stroke-width="16"/>'
        '<circle cx="170" cy="170" r="14" fill="{c}"/><g stroke="#fff" stroke-width="8" '
        'stroke-opacity=".3"><line x1="170" y1="24" x2="170" y2="66"/><line x1="316" y1="170" x2="274" '
        'y2="170"/><line x1="170" y1="316" x2="170" y2="274"/><line x1="24" y1="170" x2="66" y2="170"/></g>'
    ),
    "explosion": (
        '<g stroke="{c}" stroke-width="14" stroke-linecap="round">'
        '<line x1="170" y1="70" x2="170" y2="140"/><line x1="170" y1="200" x2="170" y2="270"/>'
        '<line x1="70" y1="170" x2="140" y2="170"/><line x1="200" y1="170" x2="270" y2="170"/>'
        '<line x1="102" y1="102" x2="150" y2="150"/><line x1="190" y1="190" x2="238" y2="238"/>'
        '<line x1="238" y1="102" x2="190" y2="150"/><line x1="150" y1="190" x2="102" y2="238"/>'
        '</g><circle cx="170" cy="170" r="26" fill="{c}"/>'
    ),
    "trail": (
        '<path d="M40 220 Q170 120 300 200" stroke="{c}" stroke-width="26" fill="none" '
        'stroke-linecap="round"/><path d="M40 220 Q170 120 300 200" stroke="#fff" stroke-width="8" '
        'stroke-opacity=".3" fill="none" stroke-linecap="round"/><circle cx="300" cy="200" r="26" fill="{c}"/>'
    ),
    "banner": (
        '<path d="M60 90 L170 60 L280 90 L280 250 L170 210 L60 250 Z" fill="{c}" opacity=".9"/>'
        '<path d="M60 90 L170 60 L280 90 M170 60 L170 210" stroke="#fff" stroke-width="8" '
        'stroke-opacity=".3" fill="none"/>'
    ),
    "topper": (
        '<path d="M170 60 C230 60 250 130 260 190 L80 190 C90 130 110 60 170 60 Z" fill="{c}"/>'
        '<ellipse cx="170" cy="200" rx="92" ry="18" fill="{c}" opacity=".8"/>'
        '<path d="M170 60 C150 100 140 150 130 190 M170 60 C190 100 200 150 210 190" stroke="#fff" '
        'stroke-width="7" stroke-opacity=".3" fill="none"/>'
    ),
}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "src")
OUT = os.path.join(ROOT, "data", "img")
os.makedirs(SRC, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

for item_id, (kind, rarity) in ITEMS.items():
    color = RARITY_COLORS[rarity]
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 340" width="340" height="340">'
        '<defs><radialGradient id="g" cx="50%" cy="42%" r="70%">'
        f'<stop offset="0%" stop-color="{color}" stop-opacity=".55"/>'
        '<stop offset="55%" stop-color="#141a2b" stop-opacity=".95"/>'
        '<stop offset="100%" stop-color="#0d1120"/></radialGradient></defs>'
        f'<rect width="340" height="340" fill="url(#g)"/>'
        f'<g transform="rotate(-10 170 170)">{ART[kind].format(c=color)}</g></svg>'
    )
    svg_path = os.path.join(SRC, f"{item_id}.svg")
    with open(svg_path, "w") as handle:
        handle.write(svg)
    png_path = os.path.join(OUT, f"{item_id}.png")
    subprocess.run(["rsvg-convert", "-w", "340", "-h", "340", svg_path, "-o", png_path], check=True)
    print(f"generated {os.path.relpath(png_path, ROOT)}")

print("done")

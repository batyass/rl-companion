#!/usr/bin/env node
// Rasterize app/public/icon.svg into the PNG set a PWA needs:
//   - manifest icons (192, 512)
//   - apple-touch-icon sizes for iOS home screen (152, 167, 180)
//   - apple-touch-startup-image splash screens for iOS < 15
//
// Usage: node tools/generate-pwa-assets.mjs
// Also wired in as the `prebuild` script of app/, so `npm run build`
// always regenerates these from the current icon.
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const publicDir = path.join(rootDir, "app", "public");
const svgPath = path.join(publicDir, "icon.svg");
const iconsDir = path.join(publicDir, "icons");
const splashDir = path.join(publicDir, "splash");

// App background color (manifest background_color / theme_color).
const BG = { r: 0x0b, g: 0x0e, b: 0x14 };

// Icons: filename -> pixel size.
const ICONS = {
  "icon-192.png": 192,
  "icon-512.png": 512,
  "apple-touch-icon-152.png": 152,
  "apple-touch-icon-167.png": 167,
  "apple-touch-icon-180.png": 180,
};

// iOS splash screens (portrait). Each entry is:
//   [filename, width, height, device-width (pt), device-height (pt), pixel ratio]
// Sizes follow Apple's historical launch-image table; iOS 15+ ignores these
// and renders its own splash from the manifest.
const SPLASHES = [
  ["splash-640x1136.png", 640, 1136, 320, 568, 2], // iPhone 5 / SE 1st
  ["splash-750x1334.png", 750, 1334, 375, 667, 2], // iPhone 6 / 7 / 8 / SE 2nd-3rd
  ["splash-1125x2436.png", 1125, 2436, 375, 812, 3], // iPhone X / XS / 11 Pro
  ["splash-1242x2688.png", 1242, 2688, 414, 896, 3], // iPhone XS Max / 11 Pro Max
  ["splash-828x1792.png", 828, 1792, 414, 896, 2], // iPhone XR / 11
  ["splash-1170x2532.png", 1170, 2532, 390, 844, 3], // iPhone 12 / 13 / 14
  ["splash-1284x2778.png", 1284, 2778, 428, 926, 3], // iPhone 12 / 13 / 14 Pro Max
  ["splash-1179x2556.png", 1179, 2556, 393, 852, 3], // iPhone 14 Pro / 15 Pro
  ["splash-1290x2796.png", 1290, 2796, 430, 932, 3], // iPhone 14 Pro Max / 15 Pro Max
  ["splash-1536x2048.png", 1536, 2048, 768, 1024, 2], // iPad mini / older iPad
  ["splash-1668x2224.png", 1668, 2224, 834, 1112, 2], // iPad Pro 10.5" / 11" (1-2)
  ["splash-1668x2388.png", 1668, 2388, 834, 1194, 2], // iPad Pro 11" (3rd gen)
  ["splash-2048x2732.png", 2048, 2732, 1024, 1366, 2], // iPad Pro 12.9"
];

async function main() {
  const svg = await readFile(svgPath);
  await mkdir(iconsDir, { recursive: true });
  await mkdir(splashDir, { recursive: true });

  for (const [name, size] of Object.entries(ICONS)) {
    await sharp(svg).resize(size, size).png().toFile(path.join(iconsDir, name));
    console.log(`icon   ${name} (${size}x${size})`);
  }

  for (const [name, width, height] of SPLASHES) {
    // Solid app-background canvas with the icon centered at ~40% of width.
    const iconSize = Math.round(Math.min(width, height) * 0.4);
    const icon = await sharp(svg).resize(iconSize, iconSize).png().toBuffer();
    await sharp({ create: { width, height, channels: 3, background: BG } })
      .composite([{ input: icon, gravity: "center" }])
      .png()
      .toFile(path.join(splashDir, name));
    console.log(`splash ${name} (${width}x${height})`);
  }

  console.log("\nGenerated PWA assets in app/public/icons/ and app/public/splash/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

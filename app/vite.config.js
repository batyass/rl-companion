import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installAutoRefresh } from "../tools/fetch-shop/auto-refresh.mjs";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(appDir, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json",
};

// During dev the app lives in app/, but shop data + item art live in the repo
// root (tools/fetch-shop/out/, data/). Serve those paths straight from disk.
function repoStatic() {
  return {
    name: "rl-repo-static",
    configureServer(server) {
      // Re-run the fetch pipeline in the background whenever the shop data
      // goes stale, so the dev site refreshes itself daily without cron.
      installAutoRefresh();

      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, "http://localhost");
        const pathname = url.pathname;

        if (pathname === "/api/shop") {
          const candidates = [
            path.join(rootDir, "tools", "fetch-shop", "out", "shop.json"),
            path.join(rootDir, "data", "shop.json"),
          ];
          for (const file of candidates) {
            if (fs.existsSync(file)) {
              const raw = JSON.parse(fs.readFileSync(file, "utf8"));
              raw.generatedAt = fs.statSync(file).mtimeMs;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.setHeader("Cache-Control", "no-cache");
              res.end(JSON.stringify(raw));
              return;
            }
          }
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "no fetched shop data yet" }));
          return;
        }

        if (pathname === "/api/catalogue") {
          const file = path.join(rootDir, "tools", "fetch-shop", "out", "catalogue.json");
          if (fs.existsSync(file)) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(fs.readFileSync(file));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "no catalogue yet" }));
          }
          return;
        }

        if (pathname === "/" || pathname === "/index.html") {
          // Let Vite serve the SPA shell.
          next();
          return;
        }

        // Static repo assets: tools/... and data/...
        const rel = pathname.replace(/^\/+/, "");
        if ((rel.startsWith("tools/") || rel.startsWith("data/")) && !rel.includes("..")) {
          const file = path.join(rootDir, rel);
          if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            const ext = path.extname(file).toLowerCase();
            res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.end(fs.readFileSync(file));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  root: appDir,
  plugins: [
    react(),
    repoStatic(),
    VitePWA({
      // Ship our own manifest.webmanifest (with PNG icons) from public/.
      manifest: false,
      registerType: "autoUpdate",
      // Offline-first service worker, generated with Workbox at build time.
      workbox: {
        // Precache the app shell, fonts, the baked shop.json snapshot, and the
        // install assets. Item art (rl-art/, shop-img/) is large and changes
        // daily, so it is runtime-cached instead of precached.
        globPatterns: [
          "**/*.{js,css,html,svg,json,woff2,ttf}",
          "icons/*.png",
          "splash/*.png",
          "assets/**/*.glb",
        ],
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Live shop data: network-first, falls back to the last good
            // response (or the precached baked snapshot) when offline.
            urlPattern: /\/api\/(shop|catalogue)/,
            handler: "NetworkFirst",
            options: {
              cacheName: "rl-api",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Item artwork + any other images: cache aggressively.
            urlPattern: /\.(webp|png|jpe?g|avif|gif|svg)(\?.*)?$/,
            handler: "CacheFirst",
            options: {
              cacheName: "rl-art",
              expiration: { maxEntries: 600, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: "127.0.0.1",
  },
  build: {
    outDir: path.join(appDir, "dist"),
    emptyOutDir: true,
  },
});

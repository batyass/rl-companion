// RL Shop - tiny static server with a /api/shop endpoint.
// Serves the built React app from app/dist when present, plus the fetched
// game data from tools/fetch-shop/out/. Falls back to bundled demo data
// if the fetch hasn't been run yet.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { installAutoRefresh } = require("./tools/fetch-shop/auto-refresh.mjs");

const ROOT = __dirname;
const APP_DIST = path.join(ROOT, "app", "dist");
const PORT = process.env.PORT || 4173;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

const SHOP_SOURCES = [
  path.join(ROOT, "tools", "fetch-shop", "out", "shop.json"),
  path.join(ROOT, "data", "shop.json"),
];

function readShop() {
  for (const file of SHOP_SOURCES) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (_) {
      /* try next source */
    }
  }
  return null;
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

    if (url.pathname === "/api/shop") {
      const shop = readShop();
      if (!shop) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "no fetched shop data yet — run tools/fetch-shop" }));
        return;
      }
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      });
      res.end(JSON.stringify(shop));
      return;
    }

    // Let the frontend hot-reload by serving the raw catalogue too.
    if (url.pathname === "/api/catalogue") {
      const file = path.join(ROOT, "tools", "fetch-shop", "out", "catalogue.json");
      try {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(fs.readFileSync(file));
      } catch (_) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "no catalogue yet" }));
      }
      return;
    }

    // Static files: serve the built React app from app/dist, falling back to
    // repo-root static files (demo assets, manifest, icon).
    // The shop data references repo-root paths (tools/fetch-shop/out/img/...,
    // data/img/...), so those must resolve outside app/dist even in prod.
    const hasApp = fs.existsSync(APP_DIST);
    const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
    const rel = pathname.replace(/^\/+/, "");
    let filePath;
    if (pathname === "/index.html") {
      filePath = hasApp ? path.join(APP_DIST, "index.html") : path.join(ROOT, "index.html");
    } else if (hasApp && (rel.startsWith("tools/") || rel.startsWith("data/"))) {
      filePath = path.join(ROOT, rel);
    } else {
      filePath = hasApp ? path.join(APP_DIST, pathname) : path.join(ROOT, pathname);
    }
    if (!filePath.startsWith(ROOT) || rel.includes("..")) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // SPA fallback to the app shell for unknown client routes.
        if (hasApp) {
          const shell = path.join(APP_DIST, "index.html");
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(fs.readFileSync(shell));
          return;
        }
        res.writeHead(404);
        res.end("not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    });
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log(`RL Shop server running at http://127.0.0.1:${PORT}`);
    // Re-run the fetch pipeline in the background whenever the shop data
    // goes stale, so the site refreshes itself daily without cron.
    installAutoRefresh();
  });

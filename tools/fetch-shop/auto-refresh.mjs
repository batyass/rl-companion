// Auto-refresh for the RL shop data pipeline.
//
// The in-game shop rotates daily, so this module watches
// tools/fetch-shop/out/shop.json and re-runs the fetch pipeline in the
// background whenever the data goes stale — the site then always shows
// today's items with no manual steps.
//
// Guardrails:
//  - a state file throttles failed attempts to one per hour, so an expired
//    Epic token logs a clear message instead of retrying in a tight loop
//  - the refresh child runs detached, so it survives the server process
//  - refresh.sh is invoked with --no-login, so a dead token fails fast
//    instead of blocking forever on the interactive browser login
//
// ESM so it bundles cleanly into Vite's config (a CJS sibling breaks
// esbuild's config bundling); server.js (CJS) loads it via require(esm),
// which Node >= 22.12 supports.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHOP_DIR = path.dirname(fileURLToPath(import.meta.url));
const SHOP_FILE = path.join(SHOP_DIR, "out", "shop.json");
const LOG_FILE = path.join(SHOP_DIR, "refresh.log");
const STATE_FILE = path.join(SHOP_DIR, ".auto-refresh-state");

// Refresh when the data is older than this. The shop rotates ~daily at a
// fixed hour, so a sub-day window means the site never lags more than this
// plus the hourly check interval behind rlshop.gg. Fetches are cheap: the
// rlshop.gg path is a handful of JSON requests with locally cached images.
const STALE_MS = 3 * 60 * 60 * 1000;
// Don't retry a failed refresh more than once an hour.
const RETRY_MS = 60 * 60 * 1000;

export function isStale() {
  try {
    return Date.now() - fs.statSync(SHOP_FILE).mtimeMs > STALE_MS;
  } catch {
    return true; // missing data counts as stale
  }
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch {
    /* best effort — a failed write just loses the throttle */
  }
}

let running = false;

export function maybeRefresh() {
  if (running) return false;
  if (!isStale()) return false;
  const state = readState();
  if (state.lastAttempt && Date.now() - state.lastAttempt < RETRY_MS) return false;

  running = true;
  writeState({ ...state, lastAttempt: Date.now() });

  let log;
  try {
    log = fs.openSync(LOG_FILE, "a");
  } catch {
    log = null;
  }
  const stamp = () => new Date().toISOString();
  const write = (msg) => {
    try {
      if (log) fs.writeSync(log, msg);
    } catch {
      /* keep going even if logging fails */
    }
  };

  write(`\n[${stamp()}] auto-refresh: shop data is stale, running refresh.sh --no-login\n`);

  const child = spawn("bash", [path.join(SHOP_DIR, "refresh.sh"), "--no-login"], {
    detached: true,
    stdio: ["ignore", log, log],
  });
  child.unref();
  child.on("exit", (code) => {
    write(`[${stamp()}] auto-refresh: refresh.sh finished (exit ${code})\n`);
    if (log) {
      try {
        fs.closeSync(log);
      } catch {
        /* already closed */
      }
    }
    running = false;
  });
  return true;
}

// Check shortly after startup, then on a timer (default hourly).
export function installAutoRefresh(intervalMs = 60 * 60 * 1000) {
  const first = setTimeout(maybeRefresh, 5 * 1000);
  const timer = setInterval(maybeRefresh, intervalMs);
  if (typeof first.unref === "function") first.unref();
  if (typeof timer.unref === "function") timer.unref();
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}

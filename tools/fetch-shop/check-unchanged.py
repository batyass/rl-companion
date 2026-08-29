#!/usr/bin/env python3
"""Tell the daily deploy workflow whether the freshly fetched shop differs
from what the live Pages site already serves.

The rlshop.gg pipeline re-fetches the shop on a schedule, but most runs see
the *same* rotation (the shop changes once a day). Rebuilding and
force-pushing gh-pages for an identical shop is wasted work, so this script
compares the two payloads and writes `changed=true|false` to $GITHUB_OUTPUT.
The workflow's publish step runs only when `changed` is true.

Comparison ignores the volatile parts of the payload:
  - `generatedAt` (top-level; every fetch re-stamps it)
  - `image` / `visual` fields (image filenames embed rlshop.gg's per-deploy
    hash, so they differ between fetches even for the same item)

On any uncertainty (live site unreachable, missing local data) it errs on
the side of deploying, so a failed comparison can never freeze the site.
Exits 0 either way — "unchanged" is a normal outcome, not an error.
"""
import json
import os
import sys
import urllib.request

LIVE_URL = os.environ.get(
    "LIVE_SHOP_URL", "https://batyass.github.io/rl-companion/shop.json"
)
HERE = os.path.dirname(os.path.abspath(__file__))
FRESH_FILE = os.path.join(HERE, "out", "shop.json")
IGNORED_KEYS = ("image", "visual")


def clean(value):
    """Recursively drop volatile fields so only meaningful shop data remains."""
    if isinstance(value, dict):
        return {
            k: clean(v) for k, v in value.items() if k not in IGNORED_KEYS
        }
    if isinstance(value, list):
        return [clean(v) for v in value]
    return value


def signature(payload):
    items = sorted(payload.get("items", []), key=lambda i: i.get("id", ""))
    return json.dumps(clean(items), sort_keys=True)


def main():
    changed = True
    try:
        with open(FRESH_FILE) as handle:
            fresh = json.load(handle)
        with urllib.request.urlopen(LIVE_URL, timeout=20) as res:
            live = json.load(res)
        if signature(fresh) == signature(live):
            changed = False
            print("shop unchanged since last deploy — skipping rebuild/push")
        else:
            print("shop changed — deploying")
    except FileNotFoundError:
        print("no fresh shop.json found — treating as changed", file=sys.stderr)
    except Exception as exc:  # noqa: BLE001 — never let the check kill a deploy
        print(f"could not compare with live site ({exc}) — deploying to be safe",
              file=sys.stderr)

    out_path = os.environ.get("GITHUB_OUTPUT")
    if out_path:
        with open(out_path, "a") as handle:
            handle.write(f"changed={'true' if changed else 'false'}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

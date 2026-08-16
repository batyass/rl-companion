#!/usr/bin/env bash
# Refresh the shop data.
#
# Primary source: rlshop.gg's public data endpoints (no login required), so
# the auto-refresher can keep the site current entirely on its own. If that
# is unreachable, fall back to the authenticated game API, which needs the
# Epic login to have been done once (see README.md).
set -euo pipefail
cd "$(dirname "$0")"

echo "== fetching shop from rlshop.gg =="
if python3 fetch-rlshop.py; then
  echo "done — site data is at out/shop.json (source: rlshop.gg)"
  exit 0
fi

echo "== rlshop.gg fetch failed, falling back to the game API ==" \
     "(a silent fallback needs a valid saved Epic token)"
go run . "$@"

echo "== converting to display data =="
python3 convert.py

echo "== resolving item artwork =="
python3 resolve-art.py

echo "done — site data is at out/shop.json (source: game API)"

#!/usr/bin/env bash
# Refresh the shop: fetch from the game API, convert to display data,
# resolve artwork, and regenerate shop.json.
#
# Needs the Epic login to have been done once (see README.md). Later runs
# re-authenticate silently with the saved token.
set -euo pipefail
cd "$(dirname "$0")"

echo "== fetching shop from the game API =="
go run . "$@"

echo "== converting to display data =="
python3 convert.py

echo "== resolving item artwork =="
python3 resolve-art.py

echo "done — site data is at out/shop.json"

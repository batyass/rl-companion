#!/usr/bin/env bash
# Build the static app and publish it to GitHub Pages via the gh-pages branch.
#
# Uses the "deploy from a branch" Pages method, so it only needs normal
# git-push permissions (no `workflow` token scope).
#
# Usage: ./tools/deploy-pages.sh
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE_URL="$(git config --get remote.origin.url || true)"
GIT_NAME="$(git config user.name || true)"
GIT_EMAIL="$(git config user.email || true)"

echo "==> Baking today's shop data into the static build"
mkdir -p app/public/shop-img
python3 - <<'PY'
import json, os, shutil, glob

src = "tools/fetch-shop/out/shop.json"
if not os.path.exists(src):
    src = "data/shop.json"

data = json.load(open(src))

PREFIX = "tools/fetch-shop/out/img/"

def rewrite(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, str) and v.startswith(PREFIX):
                o[k] = "shop-img/" + v[len(PREFIX):]
            else:
                rewrite(v)
    elif isinstance(o, list):
        for v in o:
            rewrite(v)

rewrite(data)
json.dump(data, open("app/public/shop.json", "w"))

for f in glob.glob("tools/fetch-shop/out/img/*"):
    if os.path.isfile(f):
        shutil.copy(f, "app/public/shop-img/")
print("baked", len(data.get("items", [])), "items")
PY

echo "==> Building"
(cd app && npm run build -- --base=/rl-companion/)

echo "==> Publishing gh-pages"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -a app/dist/. "$TMP"/
touch "$TMP/.nojekyll"
(
  cd "$TMP"
  git init -q
  git checkout -q -b gh-pages
  git add -A
  git -c user.name="${GIT_NAME:-RL Companion deploy}" \
      -c user.email="${GIT_EMAIL:-deploy@localhost}" \
      commit -q -m "deploy: $(date -u '+%Y-%m-%d %H:%M') UTC"
  git remote add origin "${REMOTE_URL:-https://github.com/batyass/rl-companion.git}"
  git push -f origin gh-pages:gh-pages
)

echo "==> Done: https://batyass.github.io/rl-companion/"

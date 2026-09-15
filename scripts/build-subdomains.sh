#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CACHE_ROOT="${HUGO_CACHE_DIR:-$ROOT/.hugo_cache/subdomains}"
HUGO_BIN="${HUGO_BIN:-hugo}"

echo "==> 构建 run.hulatu.com"
"$HUGO_BIN" \
  --source sites/run \
  --cacheDir "$CACHE_ROOT/run" \
  --gc \
  --minify \
  --destination "$ROOT/sites/run/public"

echo "==> 构建 shot.hulatu.com"
"$HUGO_BIN" \
  --source sites/shot \
  --cacheDir "$CACHE_ROOT/shot" \
  --gc \
  --minify \
  --destination "$ROOT/sites/shot/public"

echo "完成："
echo "  run   -> sites/run/public"
echo "  shot  -> sites/shot/public"

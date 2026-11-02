#!/usr/bin/env bash
# 检查已构建站点的内部链接与页内锚点。
#
# 用法：
#   ./scripts/check-links.sh public
#   ./scripts/check-links.sh                 # 临时构建后检查
#
# 外部链接不在这里检查：外站会限流、临时超时，不能作为发布阻断条件。
# 这里专门守两类本地可控故障：站内路径 404、#锚点失效。
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v lychee >/dev/null 2>&1; then
  echo "跳过链接检查：未安装 lychee（macOS: brew install lychee）" >&2
  exit 0
fi

build_dir="${1:-}"
owned_build=""
check_dir=""

cleanup() {
  if [ -n "$check_dir" ]; then
    rm -rf -- "$check_dir"
  fi
  if [ -n "$owned_build" ]; then
    rm -rf -- "$owned_build"
  fi
}
trap cleanup EXIT

if [ -z "$build_dir" ]; then
  owned_build=$(mktemp -d "${TMPDIR:-/tmp}/hb-link-build.XXXXXX")
  hugo --gc --minify --destination "$owned_build" >/dev/null
  build_dir="$owned_build"
fi

if [ ! -d "$build_dir" ]; then
  echo "构建目录不存在：$build_dir" >&2
  exit 1
fi
build_dir=$(cd "$build_dir" && pwd)

# lychee 的 --offline 不会把线上绝对地址映射到本地构建。
# 在副本里把本站绝对 URL 改成根路径，HTML 结构不变，只改变检查的解析方式。
check_dir=$(mktemp -d "${TMPDIR:-/tmp}/hb-link-check.XXXXXX")
cp -R "$build_dir/." "$check_dir/"
find "$check_dir" -type f -name '*.html' -exec \
  perl -pi -e 's#https://hulatu\.com/#/#g; s#https://hulatu\.com#/#g' {} +

echo "检查内部链接与锚点：$build_dir"
find "$check_dir" -type f -name '*.html' -print0 |
  xargs -0 lychee \
    --offline \
    --root-dir "$check_dir" \
    --index-files index.html \
    --include-fragments=anchor-only \
    --no-progress \
    --format compact \
    --max-concurrency 12

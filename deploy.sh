#!/usr/bin/env bash
# 生产构建并发布到 public/
# 用法：./deploy.sh
# 注意：本地预览的 `hugo server` 会把 livereload 调试脚本写进 public，
# 部署前请先停掉它，或直接用本脚本（它会做一次干净构建并自检）。
set -euo pipefail
cd "$(dirname "$0")"

if lsof -iTCP:1313 -sTCP:LISTEN -P >/dev/null 2>&1; then
  echo "警告：检测到 hugo server 正在 1313 端口运行，它会覆盖 public/ 的构建产物。" >&2
  echo "建议先停掉它再部署，否则构建完成后 public/ 可能又被写回调试内容。" >&2
fi

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

# macOS 的 .DS_Store 放在 static/ 里会被 hugo 原样拷进构建产物，构建前清掉。
#   用 find 而不是 rm 通配：zsh 遇到未匹配的 glob 会直接报错中止（本脚本虽用 bash，
#   但保持和 up() 里同一套写法，免得改的时候两边不一致）。
#   这里不需要 --cleanDestinationDir：本来就构建到空的临时目录，
#   后面那句 rsync -a --delete 已经把 public/ 里的陈旧文件删干净了。
find static sites -name .DS_Store -delete 2>/dev/null || true

hugo --gc --minify --destination "$STAGE"

if rg -q "livereload" "$STAGE/index.html" 2>/dev/null; then
  echo "构建异常：产物包含 livereload，已中止，请先停掉 hugo server。" >&2
  exit 1
fi

rsync -a --delete "$STAGE/" public/
echo "完成：已生成生产构建到 public/（无调试脚本）。"

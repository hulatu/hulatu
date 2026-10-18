#!/usr/bin/env bash
# 新建一篇文章，并立刻用**系统默认的 Markdown 应用**打开它。
#
# 为什么要有这个脚本
# ──────────────────
# `hugo new content posts/xxx.md` 建完文件就撒手了，还得自己去 Finder 里翻出来打开。
# 这个脚本把「建 + 开」并成一步，所以日常写作只需要：
#
#     new posts/我的新文章
#     new weekly/周刊-27
#
# 做四件事
# ────────
#   1. 规整参数：容忍带 `.md` 后缀、带 `content/` 前缀（从别处复制路径时常见）
#   2. 套模板：`hugo new content` 会读 archetypes/posts.md 或 archetypes/weekly.md，
#      自动填好 title / date / lastmod / draft: true 和那份「发布前检查」注释
#   3. 不覆盖：同名文件已存在就**直接打开**它，绝不覆盖（写作中的稿子比什么都重要）
#   4. 打开：`open` 走 macOS 的默认应用（Typora / Obsidian / VS Code 都行，跟着系统设置）
#
# ⚠️ 为什么不直接改 `hugo new`：那是 Hugo 的二进制，动不了；也不该在仓库里放一个
#    同名脚本去遮蔽它 —— 会让人以为 `hugo new` 自己就会打开文件。
# ⚠️ 这个脚本只负责「创建 + 打开」，**不碰 git**。提交仍然走 `up`（publish.sh）。
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

usage() {
  cat >&2 <<'EOF'
用法：new <posts|weekly>/<文件名>

  new posts/我的新文章
  new weekly/周刊-27
  new posts/my-new-post      # 文件名用英文更好：它是 slug 的兜底来源

  · 文件名里可以带 / 分子目录，比如 new posts/2026/10/我的文章
  · 已存在的文件不会被覆盖，只会被打开
EOF
}

raw="${1:-}"
if [ -z "$raw" ]; then
  usage
  exit 1
fi

# 容错：去掉 .md 后缀、去掉 content/ 前缀、去掉开头的 ./
raw="${raw%.md}"
raw="${raw#content/}"
raw="${raw#./}"

section="${raw%%/*}"
case "$section" in
  posts|weekly) ;;
  *)
    echo "!! 第一个路径段必须是 posts 或 weekly，你给的是「${section}」" >&2
    usage
    exit 1
    ;;
esac

# 只给了 `posts`、没给文件名
if [ "$raw" = "$section" ]; then
  echo "!! 缺少文件名。例如：new ${section}/我的新文章" >&2
  exit 1
fi

target="content/${raw}.md"

if [ -e "$target" ]; then
  echo "==> 已存在，不覆盖，直接打开：${target}"
  open "$target"
  exit 0
fi

mkdir -p "$(dirname "$target")" || exit 1

# PATH 里没有 hugo 时退回 Homebrew 的固定位置（和 scripts/gen-og.js 同一个约定）
HUGO_BIN="$(command -v hugo 2>/dev/null || true)"
[ -n "$HUGO_BIN" ] || HUGO_BIN="/opt/homebrew/bin/hugo"

if [ ! -x "$HUGO_BIN" ]; then
  echo "!! 找不到 hugo，无法套模板。装好后重试：brew install hugo" >&2
  exit 1
fi

if ! "$HUGO_BIN" new content "${raw}.md"; then
  echo "!! hugo new 失败，文件没有建出来" >&2
  exit 1
fi

if [ ! -e "$target" ]; then
  echo "!! hugo 报告成功，但 ${target} 不存在 —— 检查 archetypes/ 与 content/ 的路径" >&2
  exit 1
fi

echo "==> 已创建：${target}"
echo "    用系统默认应用打开中……"
open "$target" || {
  echo "!! open 失败（默认应用可能没配置 .md）。文件已经建好了，手动打开：${target}" >&2
  exit 0
}

cat <<EOF

接下来：
  1. 写正文
  2. 填 front matter 里的 slug / summary / description / categories / tags
  3. 把 draft 从 true 改成 false
  4. 终端跑 up —— 会自动补标题锚点、刷新 lastmod、生成分享卡、抓图片尺寸，再推送

EOF

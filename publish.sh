#!/usr/bin/env bash
# 手动发布博客（up 一键流程的第一段）：
#   1. git status 查看改动
#   2. 提交本地全部改动（没有改动就跳过）
#   3. 推送 GitHub
#   4. 拉取远端提交
#   5. 最后完整推送一次
# 用法：
#   在终端输入 up（已配置到 ~/.config/zsh/.zshrc，先跑本脚本，再构建并部署 Cloudflare）
#   也可以直接：cd ~/Blog && ./publish.sh
set -uo pipefail

cd "$(dirname "$0")" || exit 1

# 1. 先看状态
echo "==> 1/5 查看改动状态"
git status

# 2. 提交本地全部改动
echo "==> 2/5 提交本地改动"
PYTHON_BIN=""
for cand in "$(command -v python3 2>/dev/null)" \
  /opt/homebrew/Caskroom/miniforge/base/bin/python3 \
  /usr/local/bin/python3; do
  if [ -n "$cand" ] && [ -x "$cand" ]; then
    PYTHON_BIN="$cand"
    break
  fi
done

# ⚠️ 2026-10-11：这里原本还跑一句 `scripts/fetch-image-dims.py`（抓远程图尺寸到
#     data/image_dims.json，让 <img> 带上 width/height 避免加载时页面往下跳）。
#     那一步**已经整个删掉了**，连带脚本和 data/image_dims.json 一起 —— 因为上游
#     hugo-bearneo 的 render-image.html 根本不读那个文件，写了也进不去 <img>。
#     实测过 CLS ≈ 0（三个图片最多的页面：0 / 0 / 0.0087），本来也没在抖。
#     **别照旧文档把它加回来。**
if [ -n "$PYTHON_BIN" ]; then
  # ⚠️ 2026-10-12：这里原本还跑一句 `scripts/fetch-profile-content.py`（刷新
  #     profile.hulatu.com「花园页」的最新文章 / 精选瞬间快照）。那个子站已按用户
  #     要求**整体删除**（内容并入主站 `/about/`），脚本也一起删了 ——
  #     **别照旧文档把它加回来**。同日稍后四个子站（run / shot / share / profile）
  #     全部下线，仓库里连 `sites/` 目录都没有了。
  #
  # ⚠️⚠️ 2026-10-18：下面这几步是「**离线生成、提交进仓库的派生数据**」。
  #     它们都**没有构建期钩子**（Hugo 拿不到图床图片的尺寸、也算不出分享卡），
  #     只能在这里跑。漏跑的后果是**静默降级 + 构建 0 警告**：
  #       · 分享卡漏了 → 新文章分享出去是站点的兜底图（所有人长得一样）
  #       · 图片尺寸漏了 → 那张 <img> 没有 width/height，图片晚到时页面往下跳
  #     2026-10-18 实测过一次真实的漏：129 篇文章只有 127 张卡（`newsletter-26` 走了兜底）。
  #     **加新步骤时保持「失败只警告、不阻断发布」的约定** —— 网络抖动不该让人发不了文章。
  # 给新写的中文标题补上 {#pinyin} 锚点：不补的话分享链接是 #%e4%b9%a0%e6%83%af
  #     这种百分号编码，也没法在链接里一眼看出是哪个小节。只补缺的，已经写了 {#...}
  #     的标题不动；转写用 macOS 自带的拼音库，失败不阻断发布。
  if ! "$PYTHON_BIN" scripts/add-heading-anchors.py; then
    echo "    !! 锚点补全失败，这次新加的中文标题可能还是 #%e4... 这种链接（不影响发布）" >&2
  fi
  # 把这次改动过的文章的 front matter lastmod 刷成当前时间：文章页的「更新于」
  #     只在 lastmod 比 date 晚时才显示，靠人手改这个字段一定会忘。
  #     放在 add-heading-anchors 之后：锚点补全本身也算改动了正文，一起算进这次更新。
  if ! "$PYTHON_BIN" scripts/sync-lastmod.py; then
    echo "    !! 刷新 lastmod 失败，这次改过的文章页可能不显示「更新于」（不影响发布）" >&2
  fi
  # 补抓新图的像素尺寸到 data/image-dims.json：站点层 render-image.html 靠它给
  #     <img> 输出 width/height（预留版面、消除图片晚到时的 CLS）。只补缺的，不重抓。
  #     ⚠️ 这一步**要联网**（图片在图床 img.hulatu.com），断网就跳过 —— 所以它放在
  #        「构建零网络依赖」这条底线之外：构建本身仍然不联网，联网的只有发布前这一步。
  if ! "$PYTHON_BIN" scripts/sync-image-dims.py; then
    echo "    !! 图片尺寸同步失败（可能断网），这次新加的图会缺 width/height（不影响发布）" >&2
  fi
else
  echo "    !! 跳过发布前脚本（锚点补全 / lastmod 刷新 / 图片尺寸）：没找到可用的 python3" >&2
fi

# 派生数据之三：OG 分享卡（static/images/og/<slug>.png）
#   站点层 _partials/opengraph.html 按 slug 查磁盘文件（fileExists），查不到就走
#   hugo.toml 里的兜底图 —— 也就是说**漏生成不会报错，只会静默退回一张通用图**。
#   所以每次发布都全量重跑：改过标题的文章，卡片也会跟着变。
#   ⚠️ 唯一的依赖是 sharp（只用来把 SVG 光栅化成 PNG），它装在 WorkBuddy 的
#      node 工作区里、不在系统 node_modules —— 所以要显式给 NODE_PATH。
NODE_BIN=""
for cand in "$(command -v node 2>/dev/null)" \
  /opt/homebrew/bin/node \
  /Users/hulatu/.workbuddy-ai/binaries/node/versions/22.22.2-6/bin/node; do
  if [ -n "$cand" ] && [ -x "$cand" ]; then
    NODE_BIN="$cand"
    break
  fi
done

OG_NODE_PATH=""
for cand in "${NODE_PATH:-}" \
  /Users/hulatu/.workbuddy-ai/binaries/node/workspace/node_modules \
  "$(npm root -g 2>/dev/null)"; do
  if [ -n "$cand" ] && [ -d "$cand/sharp" ]; then
    OG_NODE_PATH="$cand"
    break
  fi
done

if [ -n "$NODE_BIN" ] && [ -n "$OG_NODE_PATH" ]; then
  if ! NODE_PATH="$OG_NODE_PATH" "$NODE_BIN" scripts/gen-og.js; then
    echo "    !! 分享卡生成失败，这次新加的文章会退回站点的兜底图（不影响发布）" >&2
  fi
else
  echo "    !! 跳过分享卡生成：没找到 node 或 sharp" >&2
  echo "       手动补跑：NODE_PATH=/Users/hulatu/.workbuddy-ai/binaries/node/workspace/node_modules node scripts/gen-og.js" >&2
fi

git add .
if git diff --cached --quiet; then
  echo "    没有需要提交的本地改动"
else
  if ! git commit -m "博客：新增/修改文章"; then
    echo "!! 本地提交失败，请先检查 git 配置" >&2
    exit 1
  fi
fi

# 3. 先推送 GitHub；远端有新提交导致被拒时不退出，留到最后一步补推
echo "==> 3/5 推送本地改动到 GitHub"
if ! git push origin main; then
  echo "    !! 推送失败（远端可能有新提交），先继续，稍后拉取后补推" >&2
fi

# 4. 从 GitHub 拉取（可能有其他设备的提交）
echo "==> 4/5 从 GitHub 拉取远端提交"
if ! git pull --rebase origin main; then
  echo "!! git pull 失败（可能有冲突）。本地改动已先提交，不会丢，处理完冲突后重试即可" >&2
  exit 1
fi

# 5. 完整推送
echo "==> 5/5 完整推送"
if ! git push origin main; then
  echo "!! git push 失败。改动已提交在本地，网络恢复后重试 ./publish.sh 即可" >&2
  exit 1
fi
echo "完成：已提交并推送到 GitHub，托管平台会自动重新构建"

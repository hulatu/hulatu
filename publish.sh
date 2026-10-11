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
  # 刷新 profile.hulatu.com（花园页）用的内容快照：最新文章 + 精选瞬间。
  #     它只依赖本地 content/，不联网；产物跟文章一起进这次提交，
  #     否则花园页的「最新文章」会一直停在上一次手动跑子站构建的时候。
  #     放在 git add 之前，失败也不阻断发布。
  if ! "$PYTHON_BIN" scripts/fetch-profile-content.py; then
    echo "    !! 花园页内容快照刷新失败，本次它的最新文章可能不是最新的（不影响发布）" >&2
  fi
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
else
  echo "    !! 跳过图片尺寸抓取：没找到可用的 python3" >&2
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

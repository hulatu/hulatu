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

# 抓取正文远程图片的尺寸到 data/image_dims.json，让 <img> 带上宽高，
#     避免图片加载完页面往下跳。只抓新增图片，已缓存的会跳过（很快）。
#     没网或失败时保留旧数据，不阻断发布。
if [ -n "$PYTHON_BIN" ]; then
  if ! "$PYTHON_BIN" scripts/fetch-image-dims.py; then
    echo "    !! 图片尺寸抓取失败，本次新增图片可能缺少宽高（不影响发布）" >&2
  fi
  # 刷新 profile.hulatu.com（花园页）用的内容快照：最新文章 + 精选瞬间。
  #     它只依赖本地 content/，不联网；产物跟文章一起进这次提交，
  #     否则花园页的「最新文章」会一直停在上一次手动跑子站构建的时候。
  #     同样放在 git add 之前，失败也不阻断发布。
  if ! "$PYTHON_BIN" scripts/fetch-profile-content.py; then
    echo "    !! 花园页内容快照刷新失败，本次它的最新文章可能不是最新的（不影响发布）" >&2
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

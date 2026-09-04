#!/usr/bin/env bash
# 手动发布博客（up 一键流程的第一段）：
#   1. git status 查看改动
#   2. 提交本地全部改动（没有改动就跳过）
#   3. 先推送 GitHub
#   4. 同步 Garmin 跑步数据（失败不阻断）
#   5. 从 GitHub 拉取远端提交
#   6. 最后完整推送一次，确保文章和跑步数据都上去
# 用法：
#   在终端输入 up（已配置到 ~/.config/zsh/.zshrc，先跑本脚本，再构建并部署 Cloudflare）
#   也可以直接：cd ~/Blog && ./publish.sh
set -uo pipefail

cd "$(dirname "$0")" || exit 1

# 1. 先看状态
echo "==> 1/6 查看改动状态"
git status

# 2. 提交本地全部改动
echo "==> 2/6 提交本地改动"
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
echo "==> 3/6 推送本地改动到 GitHub"
if ! git push origin main; then
  echo "    !! 推送失败（远端可能有新提交），先继续，稍后拉取后补推" >&2
fi

# 4. 同步跑步数据（优先用本机令牌 ~/.garminconnect，失败不阻断推送）
PY=""
for cand in "$(command -v python3 2>/dev/null)" \
  /opt/homebrew/Caskroom/miniforge/base/bin/python3 \
  /usr/local/bin/python3; do
  if [ -n "$cand" ] && "$cand" -c "import garminconnect" >/dev/null 2>&1; then
    PY="$cand"
    break
  fi
done

echo "==> 4/6 同步 Garmin 跑步数据"
if [ -n "$PY" ]; then
  if "$PY" scripts/sync-garmin.py; then
    git add data/runs.json
    if ! git diff --cached --quiet; then
      git commit -m "Update: 同步跑步数据 $(date '+%Y-%m-%d %H:%M:%S')"
    fi
  else
    echo "    !! 同步失败（令牌可能过期），跳过，继续推送其他内容" >&2
  fi
else
  echo "    !! 跳过跑步数据：未找到带 garminconnect 的 Python（可先 pip install --upgrade garminconnect）" >&2
fi

# 5. 从 GitHub 拉取（可能有其他设备的提交）
echo "==> 5/6 从 GitHub 拉取远端提交"
if ! git pull --rebase origin main; then
  echo "!! git pull 失败（可能有冲突）。本地改动已先提交，不会丢，处理完冲突后重试即可" >&2
  exit 1
fi

# 6. 完整推送
echo "==> 6/6 完整推送（文章 + 跑步数据）"
if ! git push origin main; then
  echo "!! git push 失败。改动已提交在本地，网络恢复后重试 ./publish.sh 即可" >&2
  exit 1
fi
echo "完成：已提交并推送到 GitHub，托管平台会自动重新构建"

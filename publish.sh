#!/usr/bin/env bash
# 手动发布博客：先提交本地内容 → git pull → 同步 Garmin（失败不阻断）→ 推送 GitHub
# 先把本地改动提交，这样即使后面网络或 Garmin 出问题，新文章也不会一直停留在未跟踪状态。
# 用法：
#   在终端输入 up（已配置到 ~/.config/zsh/.zshrc，先跑本脚本，再构建并部署 Cloudflare）
#   也可以直接：cd ~/Blog && ./publish.sh
set -uo pipefail

cd "$(dirname "$0")" || exit 1

# 1. 先把本地全部改动落成 commit（不依赖网络）
echo "==> 提交本地改动"
git add -A
if git diff --cached --quiet; then
  echo "    没有需要提交的本地改动"
else
  if ! git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"; then
    echo "!! 本地提交失败，请先检查 git 配置" >&2
    exit 1
  fi
fi

# 2. 拉取远端并变基（此时工作区干净，不需要 --autostash）
echo "==> git pull"
if ! git pull --rebase origin main; then
  echo "!! git pull 失败（可能有冲突）。本地改动已先提交，不会丢，处理完冲突后重试即可" >&2
  exit 1
fi

# 3. 同步跑步数据（优先用本机令牌 ~/.garminconnect，失败不阻断推送）
PY=""
for cand in "$(command -v python3 2>/dev/null)" \
  /opt/homebrew/Caskroom/miniforge/base/bin/python3 \
  /usr/local/bin/python3; do
  if [ -n "$cand" ] && "$cand" -c "import garminconnect" >/dev/null 2>&1; then
    PY="$cand"
    break
  fi
done

if [ -n "$PY" ]; then
  echo "==> 同步 Garmin 跑步数据"
  if "$PY" scripts/sync-garmin.py; then
    git add data/runs.json
    if ! git diff --cached --quiet; then
      git commit -m "Update: 同步跑步数据 $(date '+%Y-%m-%d %H:%M:%S')"
    fi
  else
    echo "    !! 同步失败（令牌可能过期），跳过，继续推送其他内容" >&2
  fi
else
  echo "==> 跳过跑步数据：未找到带 garminconnect 的 Python（可先 pip install --upgrade garminconnect）" >&2
fi

# 4. 推送 GitHub
echo "==> git push"
if ! git push origin main; then
  echo "!! git push 失败。改动已提交在本地，网络恢复后重试 ./publish.sh 即可" >&2
  exit 1
fi
echo "完成：已提交并推送到 GitHub，托管平台会自动重新构建"

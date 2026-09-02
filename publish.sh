#!/usr/bin/env bash
# 手动发布博客：同步 Garmin 跑步数据 → git pull → 提交全部改动 → 推送 GitHub
# 用法：
#   cd ~/Blog && ./publish.sh
# 之后在同一终端按 ↑ 即可重复执行（新文章、新修改、跑步数据一次搞定）。
set -uo pipefail

cd "$(dirname "$0")" || exit 1

# 1. 同步跑步数据（优先用本机令牌 ~/.garminconnect，失败不阻断提交）
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
    echo "    完成"
  else
    echo "    !! 同步失败（令牌可能过期），跳过，继续提交其他内容" >&2
  fi
else
  echo "==> 跳过跑步数据：未找到带 garminconnect 的 Python（可先 pip install --upgrade garminconnect）" >&2
fi

# 2. 拉取远端（--autostash 自动暂存本地未提交改动，拉取完成后恢复）
echo "==> git pull"
if ! git pull --rebase --autostash origin main; then
  echo "!! git pull 失败（可能有冲突），请先手动处理再重试" >&2
  exit 1
fi

# 3. 提交全部本地改动并推送
git add -A
if git diff --cached --quiet; then
  echo "没有需要提交的改动，已是最新"
  exit 0
fi

echo "==> git commit & push"
git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main
echo "完成：已提交并推送到 GitHub，托管平台会自动重新构建"

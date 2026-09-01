#!/usr/bin/env bash
# 每晚 22:30 自动完整提交博客内容：
#   1. 先 git pull（把 22:00 GitHub Actions 同步的跑步数据拉到本地）
#   2. 再 git add -A 完整提交所有本地改动并推送到 GitHub
# 由 LaunchAgent com.hulatuo.blog-auto-commit 触发；日志见 ~/.blog-auto-commit.log
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

LOG="$HOME/.blog-auto-commit.log"
{
  echo "==== $(date '+%Y-%m-%d %H:%M:%S') ===="
  echo "开始：先拉取，再完整提交"
} >> "$LOG"

# 1. 先拉取（--autostash 自动暂存本地未提交的改动，拉取完成后再恢复）
if ! git pull --rebase --autostash origin main >> "$LOG" 2>&1; then
  echo "拉取失败，中止本次提交（可能有冲突，需要手动处理）" >> "$LOG"
  exit 1
fi

# 2. 完整提交所有改动
git add -A >> "$LOG" 2>&1
if git diff --cached --quiet; then
  echo "没有需要提交的改动，完成" >> "$LOG"
  exit 0
fi

if ! git commit -m "Auto Update: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG" 2>&1; then
  echo "提交失败" >> "$LOG"
  exit 1
fi

if ! git push origin main >> "$LOG" 2>&1; then
  echo "推送失败" >> "$LOG"
  exit 1
fi

echo "已提交并推送到 GitHub" >> "$LOG"

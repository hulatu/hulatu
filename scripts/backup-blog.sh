#!/usr/bin/env bash
set -euo pipefail

# 生成博客的内容快照和 Git bundle，用于数字花园的 3-2-1 备份。
#
# 用法：
#   bash scripts/backup-blog.sh
#   BACKUP_DEST="/Volumes/SSD/hulatu-blog" bash scripts/backup-blog.sh
#   bash scripts/backup-blog.sh /path/to/backup
#   bash scripts/backup-blog.sh --dry-run

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ "${1:-}" == "--dry-run" ]]; then
  DEST="${2:-${BACKUP_DEST:-$HOME/Backups/hulatu-blog}}"
  echo "只检查，不写入。"
  echo "备份目录：$DEST"
  echo "将包含：content static layouts assets archetypes data scripts .github hugo.toml README.md MAINTENANCE.md docs"
  exit 0
fi

DEST="${1:-${BACKUP_DEST:-$HOME/Backups/hulatu-blog}}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"

TMP="$(mktemp -d "${TMPDIR:-/tmp}/hulatu-backup.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

SNAPSHOT="$TMP/snapshot"
mkdir -p "$SNAPSHOT"

for item in \
  content \
  static \
  layouts \
  assets \
  archetypes \
  data \
  scripts \
  docs \
  .github \
  hugo.toml \
  README.md \
  MAINTENANCE.md; do
  if [[ -e "$item" ]]; then
    cp -R "$item" "$SNAPSHOT/$item"
  fi
done

ARCHIVE="$DEST/hulatu-blog-content-$STAMP.tar.gz"
tar \
  --exclude='.DS_Store' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  -czf "$ARCHIVE" \
  -C "$SNAPSHOT" .

BUNDLE="$DEST/hulatu-blog-git-$STAMP.bundle"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git bundle create "$BUNDLE" --all >/dev/null
else
  echo "警告：当前目录不是 Git 仓库，已跳过 Git bundle。" >&2
fi

echo "内容备份：$ARCHIVE"
if [[ -f "$BUNDLE" ]]; then
  echo "Git 备份：$BUNDLE"
  shasum -a 256 "$ARCHIVE" "$BUNDLE"
else
  shasum -a 256 "$ARCHIVE"
fi

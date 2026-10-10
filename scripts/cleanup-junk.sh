#!/usr/bin/env bash
# 清理博客仓库里的垃圾 / 缓存 / 旧产物。
#
# 默认**只预览、不动手**。确认无误后再加 --yes 真正执行。
#
#   bash scripts/cleanup-junk.sh                        # 预览：列出会处理什么、各多大
#   bash scripts/cleanup-junk.sh --yes                  # 执行（评审页归档到 docs/reviews/）
#   bash scripts/cleanup-junk.sh --yes --purge-reviews  # 评审页也直接扔废纸篓
#   bash scripts/cleanup-junk.sh --yes --purge-build    # 连 public/ 构建产物一起清
#
# 铁律：删除一律走废纸篓（trash），绝不用 rm -rf；只在本仓库内动手，
#       不碰 ~/Documents、~/Desktop 等用户数据目录。
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

DRY=1
PURGE_REVIEWS=0
PURGE_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --yes|-y)        DRY=0 ;;
    --purge-reviews) PURGE_REVIEWS=1 ;;
    --purge-build)   PURGE_BUILD=1 ;;
    -h|--help)
      cat <<'HELP'
用法：bash scripts/cleanup-junk.sh [--yes] [--purge-reviews] [--purge-build]

  （无参数）        只预览，不删任何东西
  --yes, -y         真正执行
  --purge-reviews   根目录的评审页直接扔废纸篓（默认是归档到 docs/reviews/ 留档）
  --purge-build     连 public/ 主站构建产物也清掉（下次 deploy.sh 会重建）
HELP
      exit 0 ;;
    *) echo "未知参数：${arg}（用 --help 看用法）" >&2; exit 2 ;;
  esac
done

# ---------- 废纸篓 ----------
TRASH_BIN=""
for cand in "$(command -v trash 2>/dev/null)" /usr/bin/trash /opt/homebrew/bin/trash; do
  if [ -n "$cand" ] && [ -x "$cand" ]; then TRASH_BIN="$cand"; break; fi
done

if [ "$DRY" = 0 ] && [ -z "$TRASH_BIN" ]; then
  cat >&2 <<'EOF'
找不到 trash 命令，为安全起见不做删除。
  · 安装：brew install trash
  · 或者：手动把下面的路径拖进访达废纸篓
EOF
  exit 1
fi

if [ "$DRY" = 1 ]; then
  echo "==> 预览模式（不会删除任何东西）。确认后加 --yes 执行。"
else
  # ⚠️ 变量名必须加花括号：后面紧跟全角「）」，bash 会把那个多字节字符
  # 当成变量名的一部分（`$TRASH_BIN）` → 变量 `TRASH_BIN）`），配合 set -u
  # 直接报 unbound variable —— 这个 bug 只在 --yes（第一次真正执行）时才暴露，
  # 预览模式走的是上面那个分支，永远碰不到。
  echo "==> 执行模式：删除走废纸篓（${TRASH_BIN}）"
fi
echo

# ---------- 工具函数 ----------
REMOVED=0
SKIPPED=0

size_of() { du -sh "$1" 2>/dev/null | awk '{print $1}'; }

# 分批处理，每批 ≤10 项（mac-junk-cleanup 铁律 4）
BATCH=()
flush_batch() {
  [ "${#BATCH[@]}" -eq 0 ] && return
  for p in "${BATCH[@]}"; do
    if [ ! -e "$p" ]; then
      printf '  跳过(不存在) %s\n' "$p"; SKIPPED=$((SKIPPED+1)); continue
    fi
    sz=$(size_of "$p")
    if [ "$DRY" = 1 ]; then
      printf '  将删除 %-46s %s\n' "$p" "$sz"
      REMOVED=$((REMOVED+1))
    else
      # 删前确认没被占用（铁律 6）：lsof 命中说明有进程正拿着它
      if lsof -- "$p" >/dev/null 2>&1; then
        printf '  占用中，跳过  %s\n' "$p"; SKIPPED=$((SKIPPED+1)); continue
      fi
      if "$TRASH_BIN" "$p" >/dev/null 2>&1 && [ ! -e "$p" ]; then
        printf '  已移入废纸篓 %-42s %s\n' "$p" "$sz"
        REMOVED=$((REMOVED+1))
      else
        printf '  失败 %s\n' "$p"; SKIPPED=$((SKIPPED+1))
      fi
    fi
  done
  BATCH=()
}

section() { echo "── $1"; }
done_section() { flush_batch; echo; }

# ---------- 1. macOS Finder 元数据 .DS_Store ----------
# 仓库里到处都是，纯本地噪音；static/ 和 sites/ 下的大概率已被 deploy.sh 清过。
section "1. .DS_Store（macOS 文件夹元数据，全站忽略、永不部署）"
while IFS= read -r f; do
  BATCH+=("$f")
  [ "${#BATCH[@]}" -ge 10 ] && flush_batch
done < <(find . -name '.DS_Store' -not -path './.git/*' -print 2>/dev/null)
[ "${#BATCH[@]}" -eq 0 ] && echo "  （没有）"
done_section

# ---------- 2. Python 字节码缓存 ----------
# scripts/ 下的同步脚本跑过就会生成，删了下次自动重建。
section "2. Python 字节码缓存 __pycache__/"
while IFS= read -r d; do BATCH+=("$d"); done \
  < <(find . -type d -name '__pycache__' -not -path './.git/*' -print 2>/dev/null)
[ "${#BATCH[@]}" -eq 0 ] && echo "  （没有）"
done_section

# ---------- 3. Hugo 构建缓存 ----------
section "3. Hugo 构建缓存 .hugo_cache/"
BATCH+=(".hugo_cache")
done_section

# ---------- 4. 空的 resources/ ----------
# Hugo 的资源缓存目录；现在是空的，空目录留着也没用。
section "4. 空的 resources/"
if [ -d resources ] && [ -z "$(ls -A resources 2>/dev/null)" ]; then
  BATCH+=("resources")
else
  echo "  （不存在，或非空——非空时请自己看一眼再决定）"
fi
done_section

# ---------- 5. .hugo_build.lock ----------
# 空文件，Hugo 每次构建自己重建；已在 .gitignore 里，删不删都行。
section "5. .hugo_build.lock（空文件，构建时自动重建）"
[ -e .hugo_build.lock ] && BATCH+=(".hugo_build.lock") || echo "  （没有）"
done_section

# ---------- 6. 根目录的评审 / 报告页 ----------
# 这些是历次改造前生成的独立 HTML 评审页，全站没有任何地方引用它们。
# 关键风险：.gitignore 没盖住它们，而 publish.sh 用的是 `git add .`
# —— 下次跑 up 就会被提交并推上公开仓库。
#
# 2026-10-09 改成**按文件名扫**（glob `*-review.html`）。原先这里写死了 5 个名字
# （design-review / archive-review / bearneo-borrow-review / perf-interaction-review /
# search-improvement），那批早就不在了，于是脚本一直报「都不在了」——
# 而真正躺在根目录的那 3 个（archive-series-review / minimal-review / noise-review）
# 它一个都不认识，其中 2 个甚至**已经被提交进仓库了**。
# 以后新生成评审页不用回来改脚本，只要文件名以 -review.html 结尾。
section "6. 根目录评审 / 报告页（全站无引用，但 publish.sh 的 git add . 会把它们推上公开仓库）"
REVIEW_EXIST=""
while IFS= read -r f; do
  [ -n "$f" ] || continue
  REVIEW_EXIST="$REVIEW_EXIST $f"
  printf '  %-34s %s\n' "$f" "$(size_of "$f")"
done < <(find . -maxdepth 1 -name '*-review.html' -print 2>/dev/null | sed 's|^\./||' | sort)

if [ -z "$REVIEW_EXIST" ]; then
  echo "  （没有）"
else
  # 已被 git 跟踪的，光移走文件不够 —— 仓库里那份还在，得 git rm --cached。
  TRACKED=$(git ls-files -- $REVIEW_EXIST 2>/dev/null | wc -l | tr -d ' ')
  if [ "$TRACKED" != "0" ]; then
    echo "  ⚠️  其中 $TRACKED 个**已被 git 跟踪**（已经在公开仓库里了）："
    echo "     移走文件后还要跑 git rm --cached <文件> 才会从仓库里消失。"
  fi
fi

if [ -z "$REVIEW_EXIST" ]; then
  :
elif [ "$PURGE_REVIEWS" = 1 ]; then
  echo "  → --purge-reviews：直接扔废纸篓"
  for f in $REVIEW_EXIST; do BATCH+=("$f"); done
  flush_batch
else
  echo "  → 归档到 docs/reviews/（保留备查），并让 .gitignore 盖住它"
  if [ "$DRY" = 1 ]; then
    echo "     将创建 docs/reviews/ 并把上面这些移进去"
  else
    mkdir -p docs/reviews
    for f in $REVIEW_EXIST; do
      if mv "$f" "docs/reviews/$f" 2>/dev/null; then
        printf '  已归档 docs/reviews/%s\n' "$f"
      else
        printf '  归档失败 %s\n' "$f"
      fi
    done
  fi
  if grep -qE '^docs/reviews/?$' .gitignore 2>/dev/null; then
    echo "     .gitignore 已有 docs/reviews/ 规则"
  elif [ "$DRY" = 1 ]; then
    echo "     将往 .gitignore 追加一行：docs/reviews/"
  else
    printf '\n# 历次改造的评审页（本地留档，不进公开仓库）\ndocs/reviews/\n' >> .gitignore
    echo "     已追加 docs/reviews/ 到 .gitignore"
  fi
fi
BATCH=()
echo

# ---------- 7. 构建产物（默认不动） ----------
section "7. 构建产物 public/（默认不动，属于可重建但正在用的东西）"
if [ "$PURGE_BUILD" = 1 ]; then
  BATCH+=("public")
  while IFS= read -r d; do BATCH+=("$d"); done \
    < <(find sites -maxdepth 2 -type d -name public -print 2>/dev/null)
  flush_batch
  echo "  ⚠️  清掉后请立刻跑 ./deploy.sh 重建，否则 up 会部署一个空的 public/"
else
  for d in public sites/*/public; do
    [ -d "$d" ] && printf '  保留 %-28s %s\n' "$d" "$(size_of "$d")"
  done
  echo "  （想连它一起清，加 --purge-build）"
fi
echo

# ---------- 汇总 ----------
echo "────────────────────────────────────────"
if [ "$DRY" = 1 ]; then
  echo "预览结束：共 $REMOVED 项待处理，$SKIPPED 项跳过。"
  echo "确认无误后执行：bash scripts/cleanup-junk.sh --yes"
else
  echo "完成：$REMOVED 项已移入废纸篓，$SKIPPED 项跳过。"
  echo "注意：「移到废纸篓」不会立刻释放磁盘空间，要清空废纸篓才行。"
  echo "接下来：cd ~/Blog && git status  看改动，再跑 up 发布。"
fi

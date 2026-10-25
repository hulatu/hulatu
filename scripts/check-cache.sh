#!/usr/bin/env bash
# ============================================================================
#  自查：首页是否被 Cloudflare 边缘缓存锁住
#
#  为什么需要它：改完 CSS / 首页文案，本地构建和源站都对了，访客却还看旧页 ——
#  根因是后台的 Cache Rule / Edge TTL 覆盖了 static/_headers 里的
#  `max-age=0, must-revalidate`。这个现象 2026-09-29、10-18、10-25 各出现过一次，
#  而且**构建和部署都不会报错**，只能主动查。
#
#  用法：  bash scripts/check-cache.sh
#  退出码：0 = 首页未被锁；1 = 首页被锁（需要去后台 Purge / 改 Edge TTL）
#          2 = 网络拿不到响应（**不要当成「没上线」**）
#
#  ⚠️ 本机到该 POP 经常 timeout。每个 URL 只请求一次、超时 15 s，总共 5 个请求；
#     拿不到就报网络问题，别据此判断「没上线」。
#  ⚠️ 走代理时响应里会多一行 `HTTP/1.1 200 Connection Established`，
#     下面用 `grep -v` 排掉，否则「取最后一个 HTTP 状态」会取错。
# ============================================================================

set -uo pipefail

HOST="https://hulatu.com"
TIMEOUT=15

# fetch <url>  →  打印清洗过的响应头（不含 Connection Established）
fetch() {
  curl -s -m "$TIMEOUT" -D - -o /dev/null "$1" 2>/dev/null \
    | tr -d '\r' \
    | grep -vi 'connection established'
}

# val <headers> <header-name>  →  取某个头的值（小写名，含冒号）
val() {
  printf '%s\n' "$1" | grep -i "^$2" | head -1 | sed 's/^[^:]*:[[:space:]]*//'
}

header() { printf '\n\033[1m%s\033[0m\n' "$1"; }

header "① 首页 /（走边缘缓存）"
H_ROOT=$(fetch "$HOST/")
if [ -z "$H_ROOT" ]; then
  echo "    ⚠️  拿不到响应 —— 网络问题，稍后重试，**别当成「没上线」**"
  exit 2
fi
printf '%s\n' "$H_ROOT" | grep -iE '^(HTTP/[0-9.]+ |cf-cache-status:|age:|cache-control:|last-modified:)' | sed 's/^/    /'

header "② 首页 /?cb=随机（绕过缓存，看源站真实版本）"
H_CB=$(fetch "$HOST/?cb=$RANDOM$RANDOM")
printf '%s\n' "$H_CB" | grep -iE '^(HTTP/[0-9.]+ |cf-cache-status:|age:|cache-control:|last-modified:)' | sed 's/^/    /'

header "③ 其它页面（对照组，正常应该都是 DYNAMIC）"
for p in /posts/ /archive/; do
  st=$(val "$(fetch "$HOST$p")" 'cf-cache-status:')
  printf '    %-12s %s\n' "$p" "${st:-无响应}"
done

ST_ROOT=$(val "$H_ROOT" 'cf-cache-status:')
AGE_ROOT=$(val "$H_ROOT" 'age:')

# 内容指纹：DYNAMIC 响应**不带** last-modified，所以「边缘是否比源站旧」只能比内容。
# ⚠️ macOS 是 md5、Linux 是 md5sum，两个都兜一下（这脚本可能被 CI 复用）。
hash_of() {
  if command -v md5 >/dev/null 2>&1; then printf '%s' "$1" | md5 -q
  else printf '%s' "$1" | md5sum | awk '{print $1}'; fi
}
BODY_ROOT=$(curl -s -m "$TIMEOUT" "$HOST/" 2>/dev/null)
BODY_CB=$(curl -s -m "$TIMEOUT" "$HOST/?cb=$RANDOM$RANDOM" 2>/dev/null)
HASH_ROOT=$(hash_of "$BODY_ROOT")
HASH_CB=$(hash_of "$BODY_CB")

header "结论"
if [ -z "$BODY_CB" ]; then
  echo "    ⚠️  源站那一次没拿到响应（网络抖动），只报缓存状态、不比对内容。"
else
  echo "    边缘副本指纹：${HASH_ROOT:-?}"
  echo "    源站当前指纹：${HASH_CB:-?}"
fi

if [ "$ST_ROOT" = "HIT" ] && [ -n "${AGE_ROOT:-}" ] && [ "$AGE_ROOT" -gt 60 ] 2>/dev/null; then
  echo
  echo "    ❌ 首页被边缘缓存锁住了（cf-cache-status: HIT, age: ${AGE_ROOT}s）"
  if [ -n "$BODY_ROOT" ] && [ -n "$BODY_CB" ] && [ "$HASH_ROOT" != "$HASH_CB" ]; then
    echo "       ⚠️ 两边内容不一致 —— 访客此刻看到的就是过期页面。"
  elif [ -n "$BODY_CB" ]; then
    echo "       （两边内容暂时一致，但缓存策略仍是错的：下次一改就会看到旧页）"
  fi
  echo
  echo "    临时：Cloudflare 后台 → Caching → Purge Cache → Custom Purge"
  echo "          填 https://hulatu.com/"
  echo "    根治：Caching → Cache Rules → 新建 bypass_cache_for_html"
  echo "          条件 = 主机名等于 hulatu.com And (URI 路径等于 / Or URI 路径结尾为 /)"
  echo "          动作 = 缓存资格 → 绕过缓存（生效后这里会显示 BYPASS）"
  echo "    （完整说明见 MAINTENANCE.md 第 5 节「首页 / 被边缘缓存锁住」）"
  exit 1
elif [ "$ST_ROOT" = "DYNAMIC" ] || [ "$ST_ROOT" = "MISS" ] || [ "$ST_ROOT" = "EXPIRED" ] || [ "$ST_ROOT" = "BYPASS" ]; then
  # BYPASS = Cache Rule 里给 HTML 设了「绕过缓存」，这是**目标状态**，不是异常。
  echo "    ✅ 首页没被边缘锁住（cf-cache-status: ${ST_ROOT}）"
  exit 0
else
  echo "    ⚠️  状态不明：cf-cache-status=${ST_ROOT:-空} age=${AGE_ROOT:-空}"
  echo "       可能是刚 Purge 过或边缘正在刷新，过一分钟再跑一次。"
  exit 0
fi

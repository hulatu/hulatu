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
    | grep -vi 'connection established' \
    | grep -v '^HTTP/[0-9.]* 1[0-9][0-9]' \
    | grep -v '^link: <https://img\.hulatu\.com>; rel=preconnect'
}
# ⚠️ 上面第 3 行滤掉 **1xx 中间响应**：Cloudflare 开着 Early Hints，
#    首页会先回一条 `HTTP/2 103` + `link: rel=preconnect`，再回 200。
#    不滤掉的话输出里会冒出一行 `HTTP/2 103`，看着像出错，其实是**好事**
#    （提前一个 RTT 把图床 preconnect 推给浏览器）。

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
hash_stdin() {
  if command -v md5 >/dev/null 2>&1; then md5 -q
  else md5sum | awk '{print $1}'; fi
}
# ⚠️⚠️ 必须先把 Cloudflare 注入的 bot 检测脚本剥掉再算指纹。
# 那段 `<script>(function(){function c(){…}})();</script>` 里嵌着**每次请求都不同**的
# `window.__CF$cv$params={r:'<ray id>',t:'<时间戳>'}` —— 不剥掉的话两次指纹永远不相等，
# 会稳定误报成「边缘给的是旧页」（2026-10-25 实测：同一份内容两次 md5 分别是 3ba3679…/2473d5e…）。
# 匹配串刻意写得够窄（`(function(){function c(){` 开头），不会误伤站内自己的内联脚本。
strip_cf() {
  perl -0pe 's{<script>\(function\(\)\{function c\(\).*?</script>}{}gs'
}
BODY_ROOT=$(curl -s -m "$TIMEOUT" "$HOST/" 2>/dev/null)
BODY_CB=$(curl -s -m "$TIMEOUT" "$HOST/?cb=$RANDOM$RANDOM" 2>/dev/null)
HASH_ROOT=$(printf '%s' "$BODY_ROOT" | strip_cf | hash_stdin)
HASH_CB=$(printf '%s' "$BODY_CB" | strip_cf | hash_stdin)

header "结论"
# ⚠️ 两个 body 都要非空才比指纹：只判 BODY_CB 时，BODY_ROOT 空掉会打印
#    d41d8cd9…（空串的 md5），看着像「边缘给了个空页面」，其实是那次请求 timeout 了。
if [ -z "$BODY_CB" ] || [ -z "$BODY_ROOT" ]; then
  echo "    ⚠️  有一边没拿到响应（网络抖动），只报缓存状态、不比对内容。"
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
  echo
  if [ "$ST_ROOT" = "BYPASS" ]; then
    echo "    BYPASS = 规则确实在生效，以后不会再被锁。"
  else
    # DYNAMIC 有两个来源，光看这一次**分不出来**：
    #   (a) 根本没匹配到任何缓存规则 —— 这是 max-age=0 的天然结果；
    #       但如果之前让它变 HIT 的那个设置还在，过一阵会**重新变 HIT**。
    #   (b) 规则在，但设的是「符合缓存条件 + 边缘 TTL = 0 / Respect origin」。
    # 所以真正的验收是「下一次发布之后**仍然是** DYNAMIC」，不是这一次。
    echo "    ⚠️  注意：${ST_ROOT} ≠ BYPASS。它只说明「这一次没走缓存」，"
    echo "       不代表那个让它变 HIT 的设置已经改掉 —— Purge 后的空窗期也是 ${ST_ROOT}。"
    echo "       真验收：等下一次发布（或 1–2 小时）再跑一次，age 头一直不出现才算根治。"
  fi
  exit 0
else
  echo "    ⚠️  状态不明：cf-cache-status=${ST_ROOT:-空} age=${AGE_ROOT:-空}"
  echo "       可能是刚 Purge 过或边缘正在刷新，过一分钟再跑一次。"
  exit 0
fi

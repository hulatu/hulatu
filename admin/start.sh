#!/usr/bin/env bash
# 启动博客后台。给「博客后台.command」调用，也可以直接在终端里跑：./admin/start.sh
#
# 这个脚本只干一件事：找一个可用的 python3，把 admin/server.py 跑起来。
# 后台本身零第三方依赖（只用标准库），所以不需要建虚拟环境、不需要 pip install。
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

# 补上 Homebrew 的路径：Finder 双击 .command 时拿到的 PATH 有时不含 /opt/homebrew/bin，
# 那会导致 hugo 找不到。
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

PY=""
for cand in "$(command -v python3 2>/dev/null)" \
            /opt/homebrew/bin/python3 \
            /usr/local/bin/python3 \
            /opt/homebrew/Caskroom/miniforge/base/bin/python3 \
            /usr/bin/python3; do
  if [ -n "$cand" ] && [ -x "$cand" ]; then PY="$cand"; break; fi
done

if [ -z "$PY" ]; then
  echo "找不到 python3。装一个再来：brew install python" >&2
  read -r -p "按回车关闭…" _
  exit 1
fi

if ! command -v hugo >/dev/null 2>&1; then
  echo "提醒：没找到 hugo 命令。后台能打开、能编辑，但「本地预览」和「新建」会不可用。" >&2
  echo "      装法：brew install hugo" >&2
  echo
fi

exec "$PY" admin/server.py "$@"

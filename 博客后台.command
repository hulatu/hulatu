#!/usr/bin/env bash
# 双击这个文件就能打开博客后台（macOS 会用终端跑它）。
# 等价于在终端里执行：cd ~/Blog && ./admin/start.sh
cd "$(dirname "$0")" || exit 1

./admin/start.sh
code=$?

# 起不来的时候别让窗口一闪而过 —— 把原因留在屏幕上给人看
if [ "$code" -ne 0 ]; then
  echo
  echo "后台已退出（退出码 $code）。按回车关闭这个窗口…"
  read -r _
fi

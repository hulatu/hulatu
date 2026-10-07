#!/usr/bin/env bash
# 双击这个文件就能打开博客后台（macOS 会用终端跑它）。
# 等价于在终端里执行：cd ~/Blog && ./admin/start.sh
cd "$(dirname "$0")" || exit 1
exec ./admin/start.sh

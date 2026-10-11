---
title: "归档"
description: "胡拉图说的全部文章归档，按年倒序排列。涵盖读书与思考、跑步与运动、工具折腾、生活观察、成长体会，以及每周更新的周刊，方便按时间回溯。"
date: 2026-08-01T00:00:00+08:00
draft: false
# 站点层模板 layouts/_default/archive.html 认这个键（Hugo 的 layout 查找顺序：
# layouts/page/archive.html → layouts/_default/archive.html）。
# ⚠️ 别删这一行：删了就会回落到 _default/single.html，这一页会变成「只渲染正文」的空页。
layout: "archive"
# 下面两行是防御性的：万一哪天 archive.html 被删，这一页回落到 single.html 时，
# 它们能保证它仍然是一页「没有日期行、没有右侧目录」的纯列表。
# 正常情况下用不到 —— archive.html 根本不读这两个键。
hideDate: true
toc: false
---

<!--
这一页没有正文。全部内容由 layouts/_default/archive.html 渲染：
  搜索框（postSearch）→ 「共 N 篇。」→ 按年分组的 .blog-posts 列表。
文章和周刊混在一起（`where site.RegularPages "Type" "in" (slice "posts" "weekly")`），
因为「归档」的语义就是「全部内容按时间回溯」。
-->

---
title: "订阅"
# ⚠️ 这一页**不是**给人从导航点进来的页面，而是「浏览器直接打开 /index.xml 时
#    看到的那一页」（由 functions/_middleware.js 内容协商过来）。所以：
#      · 不进导航、不进页脚 —— 真正的入口仍是导航最右的 RSS 与页脚那行
#        Subscribe via RSS，两者都指 /index.xml（地址一个字没变）；
#      · noindex —— 它和 /archive/ 是同一批内容，重复内容没必要进索引
#        （旧版由 XSLT 渲染时它根本不是 HTML 页，本来就进不了索引）。
noindex: true
# 页面集合口径：site = 全站文章（posts + weekly）。见 partials/feed-view.html。
feedScope: "site"
# ⚠️ date 要留着：og:article:published_time 这类 meta 会用它，
#    不给的话产物里会出现 0001-01-01 这种零值日期。
date: 2026-10-15
---

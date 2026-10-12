---
title: "跑步"
description: "来自 Garmin 的跑步数据：累计里程、配速、心率、月度趋势与每一年的完整记录。"
# 独立页不挂「某天」的日期，页面上的日期行关掉（站点层 single.html 识别）。
# ⚠️ date 本身保留：RSS / og:article:published_time 等 meta 还要用。
date: 2026-09-15
hideDate: true
# 这一页的正文由 layouts/_default/run.html 从 data/runs.json 渲染出来，
# 不是 Markdown 写的 —— 所以单独指一个模板（与 /archive/ 的 `layout: "archive"` 同一个做法）。
# ⚠️ 别删这一行，删了就落回 single.html，只剩下面那段导语、数据全没了。
layout: "run"
draft: false
---

来自 Garmin 的跑步数据：累计里程、配速、心率、月度趋势，以及每一年的完整记录。

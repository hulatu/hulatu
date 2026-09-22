---
# ===== 文章设置（写完正文后，在这里调整）=====
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
lastmod: {{ .Date }}
slug: ""
summary: ""
description: ""
categories: [""]
tags: [""]
comments: true
draft: true
---

<!-- 发布前检查：

1. 把 draft 从 true 改成 false
2. 填好 slug / summary / description / categories / tags
   - summary：首页和列表里的短摘要，建议 1 句话、90 字以内
   - description：搜索结果和社交卡片上显示的描述，建议 60–90 字（中文搜索结果大约只显示 78 字，写长了会被截断）。
     别留空——留空会退回用 summary，而 summary 通常只有十几个字，分享出去就是一句没头没尾的短句
   - tags：从已有标签里挑（标签页 `/tags/` 能看到全部），别为此造新词，否则标签云会越来越碎
3. 本地预览：hugo server -D；正式发布：hugo
-->

在这里开始写作……

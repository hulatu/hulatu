---
# ===== 文章设置（写完正文后，在这里调整）=====
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
lastmod: {{ .Date }}
slug: ""
summary: ""
description: ""
cover: ""
coverAlt: ""
categories: [""]
tags: [""]
featured: false
comments: true
series: ""
draft: true
---

<!-- 发布前检查：

1. 把 draft 从 true 改成 false
2. 填好 slug / summary / description / cover / coverAlt / categories / tags
   - summary：首页和列表里的短摘要，建议 1 句话、90 字以内
   - description：搜索引擎和社交分享使用的描述，建议 100–160 字
3. 本地预览：hugo server -D；正式发布：hugo
-->

在这里开始写作……

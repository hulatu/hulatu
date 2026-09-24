---
# ===== 周刊设置（写完正文后，在这里调整）=====
title: "{{ .Name }}"
date: {{ .Date }}
lastmod: {{ .Date }}
slug: ""
summary: ""
description: ""
categories: ["周刊"]
issue:      # 期号：填阿拉伯数字（23、24…），文章顶部显示「周刊 · 第 N 期」徽章；不填就没有徽章
tags: [""]
comments: true
draft: true
---

<!-- 发布前检查：

1. 把 draft 从 true 改成 false
2. 填好 slug / summary / description / tags
   - summary：周刊列表里的短摘要，建议 1 句话、90 字以内
   - description：搜索结果和社交卡片上显示的描述，建议 60–90 字（中文搜索结果大约只显示 78 字，写长了会被截断）。别留空，留空会退回用 summary
   - tags：从已有标签里挑（标签页 `/tags/` 能看到全部），别为此造新词
   - categories 已默认「周刊」，一般不用改
3. 本地预览：hugo server -D；正式发布：hugo
-->

## 卷首语

两三句闲话，交代这一周的状态。

## 值得一读

- [文章标题](https://…) —— 一句话推荐理由。

## 工具与资源

- **工具名** —— 是什么、我怎么用。

## 只言片语

> 引文内容。 —— 《出处》

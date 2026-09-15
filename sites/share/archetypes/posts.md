---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
category: "数码"
item: "产品名"
verdict: "推荐"
score: 4.5
bought: "自购"
image: "https://img.hulatu.com/share/文件名.webp"
author: "投稿人"
affiliate: false
pros:
  - "优点一"
  - "优点二"
cons:
  - "缺点一"
draft: true
---

<!--
发布前把 draft 改成 false。
verdict 用：推荐 / 一般 / 避雷
bought 用：自购 / 送测 / 借测
affiliate 为 true 时，正文里若包含返利链接，页面会显示利益披露提示。
-->

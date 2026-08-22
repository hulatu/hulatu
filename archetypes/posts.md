---
# ===== 文章设置（写完正文后，在这里调整）=====
title: "{{ replace .Name "-" " " | title }}"   
date: {{ .Date }}                              
lastmod: {{ .Date }}                      
slug: ""                                         
summary: ""                                      
cover: ""                           
categories: []                           
tags: []                                 
featured: false                                  
comments: true                                   
draft: true                                      
---

<!-- 发布前检查：

1. 把上面的 draft 从 true 改成 false
2. 确认 title / summary / cover / categories / slug 都已填好
3. 本地预览：hugo server -D   正式发布：hugo
-->

在这里开始写作……

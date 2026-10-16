---
title: "支持"
description: "支持胡拉图说：如果这个网站对你有帮助，可以通过微信或支付宝请我喝杯咖啡。页面里是两个收款码。"
# 独立页不挂「某天」的日期（站点层 single.html 识别这个键，关掉页面上的日期行）。
# ⚠️ date 本身保留：RSS / og:article:published_time 等 meta 还要用。
hideDate: true
# 一屏到底的短页，右侧目录栏是纯噪音（与 /now/ 同一套做法）。
toc: false
# 站点家具页，不进搜索引擎 —— 与 /privacy/ 一致（两者都是「不是内容」的页面）。
noindex: true
date: 2026-10-11T00:00:00+08:00
draft: false
---

如果本站对你有帮助，可以请我喝杯咖啡。谢谢你的支持。

<div class="donate-qrs">
  <figure class="donate-qr">
    <img src="/images/donate/wechat.webp" alt="微信赞赏码" width="220" height="220" decoding="async">
    <figcaption>微信</figcaption>
  </figure>
  <figure class="donate-qr">
    <img src="/images/donate/alipay.webp" alt="支付宝赞赏码" width="220" height="220" decoding="async">
    <figcaption>支付宝</figcaption>
  </figure>
</div>

收款方均为 `(**朋)`，请核对后再付款。

<!--
  这一页是 2026-10-11 从「旧自建主题」搬回来的。

  旧站里打赏块是 layouts/partials/donate.html + hugo.toml 的 [params.donate]
  （标题「支持」、hint「如果本站对你有帮助，可以请我喝杯咖啡」、收款方
  hututu(**朋)），挂在**关于页**正文里。迁移到上游 hugo-bearneo 时那一整块
  连同 [params.donate] 一起被删了，只剩 static/images/donate/ 两张图没删。

  这次用户要求「首页的『支持』链接里放之前赞赏我的二维码」，选的是
  **独立 /donate/ 页**（不是首页就地展开）。所以：

  · 两个收款码直接常显 —— 这一页本身就是内容，没有「折叠起来别抢戏」的问题
    （旧版折在 <details> 里，是因为它挤在关于页的自我介绍和栏目导航之间）。
  · 收款码仍是**站内静态资源** /images/donate/*.webp（440×440 / 435×435，
    自带白静区、无损 WebP）。**没有**改回图床，也**没有**套 Cloudflare 变换。
    ⚠️ 换码的正确姿势：把新图裁成「二维码本体 + 白静区」的正方形 webp
       覆盖同名文件，然后去 Cloudflare 后台 Purge 一次 /images/donate/*
       —— 那条路径配了 30 天缓存，不 purge 的话老访客看到的还是旧码。
  · width/height 写 220 是**渲染尺寸**（不是素材的 440）：只影响首屏占位，
    写对了图片加载完不会跳一下。改 max-width 要回来改这两个数
    （CSS 在 layouts/partials/custom_head.html 的 08 段）。

  ⚠️ 收款方那串 `hututu(**朋)` 用反引号包住是**故意的**：裸写 `**` 在 Markdown 里
     是强调符，容易被解析成粗体（现在恰好不会，因为后面没有配对的 `**`，
     但这是巧合，不值得赌）。反引号让它稳定地按字面显示。
-->

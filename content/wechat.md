---
title: "公众号"
description: "胡拉图说的微信公众号 —— 分享数字生活、学习与个人成长。扫描二维码或长按识别即可关注。"
# 独立页不挂「某天」的日期（站点层 single.html 识别这个键，关掉页面上的日期行）。
# ⚠️ date 本身保留：RSS / og:article:published_time 等 meta 还要用。
hideDate: true
# 一屏到底的短页，右侧目录栏是纯噪音（与 /donate/ 同一套做法）。
toc: false
# 站点家具页，不进搜索引擎 —— 与 /donate/ /privacy/ 一致。
noindex: true
date: 2026-11-07T00:00:00+08:00
draft: false
---

<div class="oa-wrap">
  <img class="oa-qr" src="/images/wechat/qrcode.webp" alt="胡拉图说 微信公众号二维码" width="256" height="256">
  <p class="oa-tip">微信扫一扫，或长按识别二维码</p>
  <div class="oa-profile">
    <img class="oa-avatar" src="/images/wechat/avatar.webp" alt="" width="48" height="48" decoding="async">
    <div class="oa-meta">
      <p class="oa-name">胡拉图说</p>
      <p class="oa-desc">分享数字生活、学习与个人成长</p>
    </div>
  </div>
</div>

<!--
  ── 这一页的来历 ────────────────────────────────────────────────────────
  2026-11-07 新增。此前首页那行平台链接里的「公众号」直接指向
  /images/gzh.webp —— 一张 1200×848 的绿色横版卡片，点开是浏览器缩放的裸图，
  既不像「一个页面」，也没法承载公众号名 / 简介。

  改法参考了 zhheo/Wechat-Official-Account-Web（微信公众号关注界面）的
  **信息架构**：二维码卡片 + 「扫描关注」提示 + 公众号信息条。
  但**没有**照搬它的代码和视觉 —— 原项目是 428px 卡片 / 16px 圆角 /
  微信绿 #1ba059 / 系统字体 / 独立 footer（还带作者自己的 ICP 备案号），
  与本站的 Verdana + 4px 圆角 + 链接蓝 #0066cc + 无投影是两套语言。
  这里用本站的 token 重写，类名统一加 `oa-` 前缀（Official Account）。

  ── 为什么没有「关注并回复 XX」那一段 ──────────────────────────────────
  原项目支持 ?replyText= 参数，关注后回复某关键词领资源。用户 2026-11-07
  明确**不要**这个功能，所以页面**零 JS**（原项目的 main.js 整段没有引进来）。
  ⚠️ 以后若要加回来：它的实现只是读 URL 参数 + clipboard.writeText，
     不需要外部库；但要注意本站 partial 里的内联 <script> 在**调用点**执行，
     而 querySelectorAll 返回的是静态列表，元素在模板里更靠后时会永远空。
     照 assets/js/giscus.js 那样包一层 boot() 再挂。

  ── 素材 ────────────────────────────────────────────────────────────────
  · static/images/wechat/qrcode.webp —— 512×512，无损 WebP（29 KB）。
    由旧的 static/images/gzh.webp 加工而来：把绿色底（srgb 26,173,25）刷成白，
    裁到二维码本体（383×383 @ 658,131），再补 38px 均匀静区，最后缩到 512。
    旧 gzh.webp **没有删**（可能被外部引用过），但它已不被本站任何页面引用。
    ⚠️ 换码：拿公众号后台的原始二维码（干净方图）覆盖同名文件即可，
       不需要再做「去绿底」这一步；尺寸保持 512×512、白底、四周留白 ≥4 个模块。
  · static/images/wechat/avatar.webp —— 192×192，无损 WebP（3.8 KB）。
    **目前是 static/icon-512.png（站点标识「H」）缩放而来，不是公众号真实头像。**
    要换成公众号头像：导出 192×192 方图覆盖同名文件即可，CSS 里已按圆形裁切。

  ── 布局 ────────────────────────────────────────────────────────────────
  `.oa-wrap` / 二维码 / 信息条**三者都是 256px、严格同宽**（2026-11-07 用户要求）。
  第一版照原项目的比例做过「信息条比二维码宽」（356px），当天就被否掉改成等宽。
  窄屏（375px 视口的内容宽约 295px）下 256 仍然放得下，不会溢出。
  ⚠️ 信息条收窄后 padding/gap 压到 8/8，才刚好让那句简介保持一行 ——
     具体余量算在 `assets/css/custom.css` 第 38 段 `.oa-profile` 的注释里，
     **改尺寸前先读那一段**，别只看截图是一行就以为有余量。

  样式在 assets/css/custom.css 第 38 段。
-->

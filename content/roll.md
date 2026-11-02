---
title: "收藏"
description: "胡拉图的收藏页：常读的中文博客、认识的博主朋友，以及常逛的博客聚合站、目录与年鉴。清单不定期增补，发现值得逛的站就会加进来。"
# ── 这一页的两个「藏起来」开关 ────────────────────────────────────────
# hideTitle：**整行标题都不出现**（标题只留在 <title> 和导航高亮里）。
#   ⚠️ 开关本身写在站点层 layouts/_default/single.html，上游主题没有这个键。
# hideDate：不出现「某天」的日期行。独立页挂日期没有意义。
#   ⚠️ 两者互不影响；本页两个都开。
hideTitle: true
hideDate: true
# 短页面不挂右侧目录（键名与上游主题一致，见 content/now.md）。
toc: false
# ⚠️ date 要留着（RSS / og meta 用）；页面上不显示日期行 —— 非文章页本来就没有。
date: 2026-10-10T00:00:00+08:00
draft: false
# ── 这一页的来历（三段，别只看最后一段就动手）─────────────────────────
#
# 【第一次，2026-10-10】用户要求按 yinji.org 的 /roll 做一页「收藏/书签」。
#   本站原先没有这一页，而「博客圈与组织」那 11 个站原本挂在 /friends/ 的
#   front matter 里 —— 它们本来就是**收藏**（我逛的地方），不是**友链**
#   （和我有来往的人）。所以那次是把它们从 /friends/ 搬过来，而不是新写一份。
#
# 【第二次，2026-10-11】把友链页并进本页，全站只剩这一份链接清单。
#   用户：「那 3 个人的链接……也给我放到 Links 页面里，与那些博客聚合平台区分一下」
#   于是新增「## 朋友」一组（花墨 / Cytrogen / 梁某银的博客），
#   原来那 11 个站归到「## 博客聚合平台」一组；
#   `/links/` 这一页**删除**，旧地址 301 到本页（见 static/_redirects）。
#
# 【第三次，2026-10-11 当天稍后】**两组小标题又删掉了，改成一条平铺。**
#   用户：「我的 Roll 页面，参考 yinji 是一条平铺、连页面标题都没有」
#   —— 所以本次做了三件事：
#     · front matter 加 `hideTitle: true`（页面标题整行不出现）；
#     · 删掉「## 朋友」「## 博客聚合平台」两个小标题，14 条并成**一个 <ul>**；
#     · 结尾照 yinji 补一行 `&hellip;更新中`。
#   ⚠️ **排序保留了原来的分组**：前 3 条是朋友，后面 11 条是聚合平台。
#      分组信息现在只体现在**顺序**上，页面上没有视觉分隔 ——
#      如果哪天想把这个区分重新显形，别再加 `##` 小标题（那会破坏平铺），
#      在两组之间插一条不带文字的分隔即可。
#   ⚠️ **别再拆回两页**（DESIGN.md 第 6 节）。也**别把 14 条并成两页/两栏**。
#
# 【第四次，2026-11-02】页面底部加十年之约「虫洞」按钮（正文末尾那个 `<p>`）。
#   用户收到十年之约站内信，要求挂虫洞按钮。官方给 4 种代码（按钮 ×2 主题、
#   挂件 ×2 主题），这里只用了按钮，挂在「收藏页」而不是全站页脚 ——
#   理由写在正文末尾那段 HTML 注释里（徽章 293 KB，页脚每页都出现）。
#   全站页脚另外补了一个 0 字节的文字入口「🌀 虫洞」，见 layouts/partials/footer.html。
#   ⚠️ 「今天读什么」挂件**没有采用**：它是 360×260 的 iframe，且主题只能靠
#      `?theme=` 固定，没法跟随本站的 `prefers-color-scheme` 自动切换。
#      以后要加，得配一段内联脚本按 `matchMedia` 改 `src`，别直接贴官方那段。
#
# ⚠️ **条目格式照 yinji.org/roll**：`- [名称](地址)：一句话点评`。
#   冒号后面是作者自己写的点评，助手编不了 —— 要补就直接接一句话，不用改别处。
#   ⚠️ 列表项里**不要**在 `</a>` 和中文冒号之间手动加空格：
#      layouts/_default/_markup/render-link.html 已经把行内链接后的换行吃掉了，
#      源文件里贴紧写就对了。
---
这里是我常读、常逛的地方，还有几个我认识的朋友。随手记下来，方便自己也方便别人。
想交换友链，[写信给我](mailto:hello@hulatu.com?subject=友链申请)。

- [花墨](https://flowersink.com)：一个很有设计感、很温暖的网站。
- [Cytrogen](https://blog.cytrogen.icu/)：一个在美国上学的中国女孩，网站的首页同样很有个性，很有想象力的城堡。
- [梁某银的博客](https://liangmouyin.com/)：日更的小梁，网站很清爽、简约，我很喜欢。

<hr>

- [博友圈](https://www.boyouquan.com)：博友圈是博客人的专属朋友圈！
- [有个站](https://www.ygz.ink/)：每一本书都是一座思想的花园。
- [笔墨迹](https://blogscn.fun/)：链接博客，也保留博客本来的样子。
- [博客集](https://bloginc.cn/)：为优秀的博客提供一个展示的窗口，同时也为喜爱阅读的朋友们搭一座发现的桥梁。
- [个站商店](https://storeweb.cn/)：一个精致的，带社交元素的个人网站发布平台，博客收录网站
- [十年之约](https://www.foreverblog.cn)：不为流量写的博客，值得被人好好读。
- [Blogfinder](https://bf.zzxworld.com/)：每个博客都是一座宝藏。
- [iblogroll](https://iblogroll.com/blog/125)：一个简约、排版美观的博客聚合站。
- [BlogsClub](https://www.blogsclub.org/)：你在互联网上并不孤独，你还有我们~
- [博客大联盟](https://bo.ke/tags/blog/?sort=weight)：一个属于写作者的博客联盟。慢一点，写长一点，读认真一点。
- [中文博客琅琊榜](https://github.com/qianguyihao/blog-list/tree/main)：中文博客琅琊榜，只收录优质的中文独立博客，全网最精品。

&hellip;更新中

<!-- ── 十年之约「虫洞」按钮（2026-11-02 新增）─────────────────────────────
     官方代码见 https://www.foreverblog.cn/about.html#ab-8
     官方给的是**两张固定图**：`wormhole_v2_dark.webp`（深色文字，配浅背景）
     和 `wormhole_v2_light.webp`（浅色文字，配深背景）。

     ⚠️ 本站是**纯 `prefers-color-scheme` 双主题**，没有手动开关。直接贴官方那段
        会在另一半场景下看不见文字，所以这里改成 `<picture>` + `media` 自动换图：
          · 深色模式 → `_light`（浅色文字）
          · 浅色模式 → `_dark`（深色文字，即默认 src）
        `<picture>` 只会下载**命中的那一张**，不会两张都拉。
     ⚠️ 徽章放在这一页而不是全站页脚：官方图是 163×64 **动画 WebP，293 KB / 67 帧**，
        本站首页整页才 6 KB。页脚每页都出现，这里只在收藏页付一次成本。
     ⚠️ `loading="lazy"`：本页在页面底部，不进视口就不下载。
     ⚠️ 尺寸用 40px 高（官方示例是 32px）。原生 163×64 缩到 32px 时，「虫洞 WORMHOLE」
        那行小字只剩 4.5px 高，糊成一团；40px 是能看清「十年之约」的最小值。
        `width`/`height` 属性给的是原生尺寸，只为让浏览器提前算出 163:64 的比例、
        避免图片到达时页面跳动；实际显示尺寸由 `style` 决定。
     ⚠️ 必须写 `border:0;border-radius:0`：上游 style.html 给**所有** `img` 都加了
        `border:1px solid var(--border-color)` + `border-radius:4px`。徽章是**透明背景**
        （四角 alpha=0），套上那个边框就变成一个灰色圆角空盒子，像个卡片。
     ⚠️ 居中保留（上游 `img{display:block;margin:auto}`）—— 全站图片都这样，
        这里不破例；它正好是页面收尾的装饰位。 -->
<p><a href="https://www.foreverblog.cn/go.html" target="_blank" rel="noopener noreferrer" title="随机访问十年之约成员博客"><picture><source srcset="https://www.foreverblog.cn/assets/logo/wormhole_v2_light.webp" media="(prefers-color-scheme: dark)"><img src="https://www.foreverblog.cn/assets/logo/wormhole_v2_dark.webp" alt="十年之约虫洞" width="163" height="64" style="width:auto;height:40px;border:0;border-radius:0" loading="lazy" decoding="async"></picture></a></p>

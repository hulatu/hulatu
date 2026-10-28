# 维护手册 —— hulatu.com

> 2026-10-10 晚整份重写：本站从自建主题迁移到上游 hugo-bearneo。
> 旧版手册描述的整套东西（6 个 CSS 模块、6 个 JS、按页型分档内联、
> 纸账 + 印章设计系统、`_redirects` 之外的 50 个模板）**已经不存在了**。
> 设计相关在 [DESIGN.md](DESIGN.md)，两边同一次改动里同步。
> 2026-10-12 四个子站（run / profile / shot / share）全部下线、`sites/` 已从仓库删除，
> 本版已清掉所有子站内容，只在第 1 节末留一条取回办法。

---

## 0. 现状速览（2026-10-14 实测，2026-10-15 补入订阅源浏览器视图）

| 项 | 值 |
| --- | --- |
| Hugo | `0.167.0+extended`（本机 / GitHub Actions / Cloudflare 三边一致） |
| 主题 | `themes/hugo-bearneo/`，27 个文件，**上游逐字节未改**（`diff -r` 验过） |
| 代码高亮 | `[markup.highlight] noClasses = false`（**必须是 false**）+ 站点层第 12 段配色 |
| 站点层 | **35 个文件** = `layouts/` × 33 + `assets/js/` × 2（另有 `data/inline-links.json` 词表），全站所有自定义都在这里（2026-10-17 新增 `layouts/sitemap.xml`、`layouts/_partials/opengraph.html`、`layouts/_partials/twitter_cards.html`；2026-10-18 新增 `layouts/partials/header.html`；2026-10-25 新增 `layouts/partials/favicon.html`；2026-10-26 新增 `layouts/partials/og-image.html`、`layouts/partials/noindex.html` —— 两个都是**把原本复制在 2–3 处的逻辑收成一份**；同日再新增 `layouts/index.json`、`layouts/partials/search-box.html` 与 `layouts/partials/inline-links.html` + `data/inline-links.json` —— 见第 17 节） |
| 页面 | **369 页 HTML** + `/index.json`（搜索索引，不是 HTML）。2026-10-28 撤销标签归并后从 256 涨回来（+113 个词条页） |
| 内容 | 108 篇文章 + 27 期周刊 = 135 个内容页 + 7 个根级独立页（`about`/`now`/`roll`/`privacy`/`archive`/`donate`/`run`）+ `/feed/` 与 `/feed/weekly/`（订阅源浏览器视图，`noindex`） |
| 订阅源 | `/index.xml`（文章 20 条）+ `/weekly/index.xml`（周刊 20 条），**都只收文章页**；浏览器直开由 `functions/_middleware.js` 分派到 `/feed/` 那两页，订阅器照旧拿 XML |
| 站内搜索 | 列表页的搜索框，**2026-10-26 起标题 + 正文都搜**：索引 `/index.json`（`layouts/index.json` 生成，135 条，**1.05 MB / gzip 447 KB**），前端 `layouts/partials/search-box.html`，**聚焦搜索框即预取索引**（进页面不拉）。⚠️ 它只过滤**当前页已有的条目**（`/archive/` 一页装 135 篇 = 全站检索）；子集页 0 命中时补一条指向 `/archive/` 的链接。⚠️⚠️ **2026-10-26 傍晚修过一次「搜索完全无效」**：脚本物理位置在 `.blog-posts` **之前**，内联脚本解析到就立即执行，而 `querySelectorAll` 返回**静态** NodeList → `posts` 是空列表、`countEl` 是 `null`，打字毫无反应且**零报错**（回车自然也没反应）。现在整段包进 `boot()`，等 `DOMContentLoaded`。**这类 bug 用 DOM stub 测不出来**（stub 里 DOM 是完整的），必须拿真浏览器加载真页面验 |
| 词条页 | 标签 **213**（`noindex, follow`；2026-10-26 曾归并成 98，**2026-10-28 已全部还原**）+ 分类 8（2026-10-26 起全部放行，可索引、进 sitemap，各配 `content/categories/<词>/_index.md`）。索引页 `/tags/` `/categories/` 已关 |
| sitemap | **150 条** = 135 个内容页（108 文章 + 27 周刊）+ 7 个根级/列表页 + 8 个分类页；与 219 个 noindex 页**零交集** |
| CSS | **全部内联**，无 `/css/` 目录 |
| JS | 两个：giscus（指纹化长缓存）+ 代码块复制按钮 |
| 构建 | 干净构建 **0 警告** |
| URL | 与迁移前逐条一致（135 个 `/posts/…` 全保留）；301 共 **16 条**（`static/_redirects`）= 6 条 slug 兜底（4 条句点 + 2 条大小写）+ 4 条分页 + `/friends/` `/links/` + `/media/` `/stats/` + `/tags/` `/categories/` 两个索引页。⚠️ 2026-10-26 标签归并时曾多出 113 条「旧标签→新标签」，**2026-10-28 已随归并一起撤销** |

内联 CSS 分档（口径：把该页**所有 `<style>` 合并后**一次 `gzip.compress(d,9)`；「补丁」= 合计减去主题固定的 6424 B）：

| 档 | 页数 | raw / gzip | 补丁 |
| --- | --- | --- | --- |
| 普通页（首页 / `/about/` `/now/` `/roll/` `/privacy/` `/weekly/` `/posts/`） | 7 | 12027 / 3428 | 5603 B（+00 +00c +14 +17 +20 +21 +22 +23 +26 +29 +30 +31 +32 +33 段，**含 2026-10-27 的段间距**） |
| 词条页（213 标签 + 8 分类） | 221 | 12027 / 3428 | 同上 —— **CSS 与普通页逐字节相同**，只是走的守卫分支不同 |
| 长文页（108 文章 + 27 周刊，无代码块） | 129 | 16522 / 4266 | 10098 B（再 +09 +10 +13 +16 +19 段，**含 2026-10-25 的 `.post-related`**） |
| 长文页 + 代码块 | 6 | 18773 / 4759 | 12349 B（再 +12 +18 段） |
| `/archive/` | 1 | 13756 / 3782 | 7332 B |
| `/donate/` | 1 | 12453 / 3523 | 6029 B（+08 段） |
| `/run/` | 1 | 14208 / 3894 | 7784 B（+25 段；含 2026-10-26 的柱状图滚动条规则，+347 B / +71 B） |
| `/404.html` | 1 | 13441 / 3695 | 7017 B（+15 段） |
| 订阅源浏览器视图（`/feed/` `/feed/weekly/`） | 2 | 12406 / 3510 | 5982 B（+28 段） |

合计 369 页，与 `os.walk` 数出的 HTML 数一致。

⚠️ **页数口径随标签归并/撤销变过两次**：10-26 归并前 366 页（词条页 220 = 212 标签 + 8 分类）→
归并后 253 页（词条页 106 = 98 标签 + 8 分类）→ **2026-10-28 撤销归并后 369 页**（词条页 221 = 213 标签 + 8 分类，
另有 2 篇 10-26 之后新增的文章）。
**体积逐值不受影响** —— 每一档的 CSS 与页数无关，只是同一份 CSS 被多少页引用。
下次重测这张表时把页数列一起更新。
⚠️⚠️ **`raw` 列是字节数**（`css.encode()` 之后 `len`），**不是字符数**。
  2026-10-26 之前这张表记的是**字符数**，所以每档比实际少 **2 B**、`/run/` 少 **4 B** ——
  因为 CSS 里有两个非 ASCII 字符：`✕`（U+2715，图片放大遮罩的关闭符）和
  `−`（U+2212，第 26 段 `calc()` 里的减号），各占 3 字节，按字符数各少算 2。
  `/run/` 两个都有，其余页只有 `✕`。**gzip 列从来没错**（`gzip.compress` 只吃 bytes）。
  下文所有**增量**（每档 +562 / +1345 / +1089 / +164 / +243 …）不受影响 —— 两边同口径。
  自查口径：`len(css) != len(css.encode())` 就说明这一页含非 ASCII。
⚠️ 上面每一档的**逐值都是 2026-10-26 下午的实测值**（第 34 段撤回后）。
当天上午曾短暂出现「每档 +55 B raw / +11～15 B gzip」的第 34 段
（`content h1.term-head`，用来把词条页标题从 2em 压回 1.17em），**下午已整条删除**
—— 词条页标题改成干净的 `{{ .Title }}` 之后它就是正常页面标题，不需要补偿。
删除后逐值回到 10-25 晚的水平，一个字节不差。
⚠️ 词条页这次**单独成档**（221 页）：CSS 与普通页逐字节相同，只是页数口径更清楚。
  10-25 的表把 214 个词条页混在「普通页 221」里。
⚠️ **页数口径**：`7 + 221 + 129 + 6 + 1 + 1 + 1 + 1 + 2 = 369`；
  长文页 129 + 带代码块的 6 = **135 个内容页**（108 文章 + 27 周刊）。
⚠️ **2026-10-26 第三轮（OG `article:*` / 「更新于」/ manifest / 搜索正文 / JSON-LD 三字段 / 71 张 alt）
一条 CSS 都没加**，所以上表逐值**不变**，不需要重测。那一轮增加的是 HTML：
gzip 首页 **+28 B**、文章页 **+195 B**、`/archive/` **+387 B**、`/weekly/` **+369 B**、`/about/` **+25 B**
（列表页涨得多是因为搜索脚本变长，且它从两个模板收进了一个 partial）。
⚠️ **词条页 221 = 213 标签 + 8 分类**。分类页 2026-10-26 起可索引。
⚠️ **第 29 段里约 300 B gzip 是打印样式**，对屏幕用户完全无用却每页都下载。没拆成外部 `media="print"` 样式表的原因：本站 CSS 全内联是既定架构（产物没有 `/css/` 目录），且 `media="print"` 的表浏览器**照样下载**，只是优先级低，省不下请求。

- 第 20–23 段是 2026-10-12 新增的 4 条全站规则（**+428 B raw / +115 B gzip**）：目录断点抬到 1200px、`img{height:auto}`、等宽字体令牌、TOC 链接 transition 收窄。
- **第 26 段是 2026-10-14 新增的 6 条全站规则，每档统一 +562 B raw / +124 B gzip**（① `input{font-size:16px}` ② `color-scheme` ③ `div.toc` 的 `100vw`→`100%` + `80dvh` ④⑤ 图片放大换背景 + checkbox 可聚焦）。改前基线是 8675 / 12610 / 14861 / 10404 / 9101 / 10509 / 10089，逐值 -562 就是当天之前的样子。
- **第 29 段（skip-link + 打印）与第 30 段（跨页转场）是 2026-10-17 新增的两条全站规则，加上 00 段末尾的导航高亮，每档统一 +1345 B raw / 约 +377 B gzip**。改前基线是 9237 / 13172 / 15423 / 10966 / 9663 / 11071 / 10651 / 9616，逐值 +1345 就是当天之前的样子。⚠️ 第 29 段里约 300 B gzip 是打印样式，屏幕用户用不到但每页都下载 —— 判断依据见 DESIGN.md 第 10.2 节。
- **第 31 段（手机端折叠目录）是 2026-10-17 新增的全站规则，每档统一 +1089 B raw / +701～792 B gzip**。改前基线就是上表逐值 −1089。构成：12 条规则本体约 1034 B + `@media screen and (max-width:1200px)` 外层包裹约 44 B + 第 29 段隐藏清单里补的 `.toc-mobile` 11 B。⚠️ 为什么 +1089 raw 只压掉约 370 B：`<style>` 是**每个块单独 gzip** 的，小块压缩率天然偏低，而且这一段里 `var(--…)` 与 `.toc-mobile` 前缀重复很多。
- **第 32 段（浅色三级文字色 `#6e6e6e`）+ 00c 段（页头站名 `<h1>`→`<p>` 的外观补偿）是 2026-10-18 新增的全站规则，每档统一 +164 B raw / +41～45 B gzip**。改前基线就是上表逐值 −164。两段都很短（minify 后 32 段约 73 B、00c 约 91 B），所以 gzip 只压掉约 42 B。
- **第 33 段（页面级 h1 配套，2026-10-25 新增）是 4 条全站规则，每档统一 +243 B raw / +62～65 B gzip**。改前基线就是上表逐值 −243。四条各自的用途：
  `33-a .sr-only`（视觉隐藏但仍进无障碍树，给 `/about/` `/now/` `/roll/` 的隐藏 h1）、
  `33-b #hi{font-size:1.5em}`（首页「Hi!」h2→h1 后补字号）、
  `33-c ul.blog-posts h2{font-size:1.17em;margin:1.9em 0 .6em}`（列表页年份 h3→h2 后还原字号**和**边距）、
  `33-d .recent-posts-head{font-size:1.17em}`（首页「Recent Posts:」h3→h2 后补字号）。
  ⚠️ **33-b / 33-d 其实只在首页生效，但 CSS 是全站内联的**，所以 358 页一起背上这 243 B —— 这是「CSS 全内联」架构的固有代价，不是写错了。
- **第 34 段（词条页标题 h3→h1 的字号补偿）2026-10-26 当天加了又撤，最终不存在。**
  上午的版本：`content h1.term-head{font-size:1.17em;margin:1.9em 0 0}`，每档 +55 B raw，
  用来让 `<h1>筛选：X</h1>` 看起来和原来的 `<h3>` 一样。
  下午的版本：标题文案改成干净的 `{{ .Title }}`（「思考」而不是「筛选：思考」），
  它从此就是**正常的页面标题**，与 `/archive/` 的「归档」同口径（2em + 主题的 `margin:16px 0`），
  补偿规则整条删掉、CSS 逐值回到 10-25 晚的水平。
  ⚠️ **别再把它加回来**：加回来 = 词条页标题比 `/archive/` 小一号，两页并排就能看出来。
  ⚠️ 注释里留了一段说明（`custom_head.html` 的 `</style>` 之前），但 **CSS 注释会被 minify 剥掉**，
  所以它不占体积 —— 已实测 raw 11994 / gzip 3419 与删除前一致。
- **2026-10-28（下午）：撤销标签归并，CSS 仍然一个字节没动。**
  100 → **213 个标签**、词条页 106 → **221**、HTML 253 → **369**。CSS 逐档不变
  （12027/3428、13756/3782、16522/4266… 全部一致），变的只有 HTML：

  | 页 | 改前 | 改后 | 差 |
  | --- | --- | --- | --- |
  | `/archive/`（标签平铺从 100 个回到 213 个） | 59622 / 14817 | **67643 / 16233** | +8021 / **+1416** |
  | 首页 | 18154 / 6047 | 18154 / 6047 | 0（首页不渲染标签） |
  | `/index.json`（`g` 字段带标签） | 1046058 / 447453 | 1046773 / 447772 | +715 / +319 |

  ⚠️ 归档页这 **+8 KB raw / +1.4 KB gzip** 全部来自标签平铺本身（113 个 `<a>` + `&nbsp;`），
  与 CSS 无关。要压就得改渲染方式（折叠 / 分字母段），但那与「全部显示」的诉求冲突。
- **2026-10-28：加载层体检后的 4 处改动，CSS 一个字节没动。**
  逐档重测确认 CSS 体积**完全不变**（12027/3428、13756/3782、16522/4266… 全部与上一版一致），
  只有 HTML 变了：

  | 改动 | 落点 | HTML 影响 |
  | --- | --- | --- |
  | Speculation Rules 预渲染 | `custom_head.html` 末尾 | +150 B raw / +36～66 B gzip |
  | 6 条图标 link 改 `relURL` | `partials/favicon.html` | −130 B raw |
  | 图床预连加 `<img` 判据 | `custom_head.html` 第 27 行附近 | 无图页 −110 B raw |
  | iframe `loading=lazy` | 两篇《投喂文献》正文 | +13 B（属性本身） |

  净效果：首页 **18253→18154** raw（−99）、**6011→6047** gzip（+36）；
  归档 **59621→59622**（+1）、**14751→14817**（+66）。
  ⚠️ **gzip 微增是必然的**：省掉的是 6 条重复前缀（压缩率极高），换来的是唯一性较强的 JSON。
  也就是说这 +36～66 B 买的是「站内跳转不用等一次导航」，不是白付。

- **2026-10-27：正文段间距，每档统一 +31 B raw / +9～11 B gzip。**
  只剩一条（搜索框那项当天加、当天撤，见下）：

  | 新增 | 规则 | 约 |
  | --- | --- | --- |
  | 段间距（第 02 段末尾） | `content > p { margin-bottom: 1.75em }` | 31 B |

  逐档实测（新值 → 撤回前的原值，差 31）：12027/3428 → 11996/3419、
  16522/4266 → 16491/4255、18773/4759 → 18742/4749、13756/3782 → 13725/3771、
  12453/3523 → 12422/3514、14208/3894 → 14177/3884、13441/3695 → 13410/3685、
  12406/3510 → 12375/3501。

  ⚠️ **同一天曾经还有第 35 段（搜索框尺寸，约 59 B），当天下午撤回**：
  加 `s-maxage` 那轮一并做的，用户看过效果后要求「恢复到之前的样子」。
  撤回后搜索框是纯 UA 默认（174×24 / `2px inset` / radius 0 / 白底），
  **CSS 逐值只比 10-26 多这 31 B**。完整理由与「真要再改要注意什么」写在
  `custom_head.html` 第 35 段的位置（现在是空号 + 说明注释）。
- **2026-10-26 傍晚：`/run/` 柱状图的横向滚动条改细，只影响这一页（+347 B raw / +71 B gzip）。**
  `.chart` 加 `scrollbar-width: thin` + 3 条 `::-webkit-scrollbar`（6px / 轨道透明 / 滑块 `--border-color` 圆角）、
  `padding-bottom:6px` 给滑块留一条独立槽；`.month` 的 `flex-basis` 与 `min-width` 48→**38px**、`gap` 6→**4px**
  （15 个月最少 804px→**626px** < 680px，桌面端不再溢出，滚动条直接消失）。
  ⚠️ 这是**按页守卫**的规则，**不并入任何一档**，上表只有 `/run/` 那一行动。
  ⚠️ 改完 `/run/` 实测 **14208 / 3894**（原 13830 / 3813），补丁 7753 B。
- 第 24 段（`/archive/` 的 `content-visibility`）评估后**撤回**，只留注释，运行时 +0 B。
- 第 25 段按 `.RelPermalink` 守卫，**其他页 0 字节**（实测：去掉它重构建，首页 `/now/` `/about/` 的 `<style>` 逐字节不变）。
- 03 / 06 / 11 三段**刻意留空**（只留注释保段号）；详见 DESIGN.md 第 5 节。

⚠️ **全页 gzip 不是「内联 CSS 那档」加 body**：删元数据让页面整体变小的幅度远大于 CSS 的 +562 B。
2026-10-14 实测（`gzip -c6` 全页）：首页 5941→5082（**−859**）、`/weekly/` 6153→5138（**−1015**）、
`/posts/` 10610→9868（**−742**）、404 5802→4962（**−840**）、`/tags/mac/` 5721→4802（**−919**）；
而 `/archive/` 13758→13921（+163）、`/about/` +201、`/now/` +197、`/run/` +193、`/roll/` +193、
`/donate/` +196、图最多的文章（周刊第 10 期，21 图）22167→22377（**+210**，`--zoom-src` 那条
独一无二的图片 URL 躲不掉 gzip 去重）。逐值与判断依据见 DESIGN.md 第 9 节。

---

## 1. 文件地图

```
hugo.toml                 站点配置（导航、参数、permalinks、输出格式、版本约束）
deploy.sh                 生产构建 → public/（干净构建 + livereload 自检 + rsync --delete）
publish.sh                提交 + 推送（git add 前跑 2 个脚本，见第 2 节）
DESIGN.md / MAINTENANCE.md / README.md

content/
  _index.md               首页正文（Hi! + 题记 + 简介 + 「支持」链接 + 四个平台链接行）
  about.md now.md roll.md privacy.md archive.md donate.md run.md    七个根级独立页
                          roll.md 是**唯一的链接页**：14 条平铺（前 3 条朋友、后 11 条
                            聚合站），页面上没有小标题、也没有页面标题。
                            ⚠️ links.md 2026-10-11 已删（友链并进 roll.md），别再加回来
                          run.md 2026-10-12 从子站搬入：`layout: "run"` →
                            layouts/_default/run.html，数据读 data/runs.json
  posts/                  101 篇文章 + _index.md（noindex，纯内部页）
  weekly/                 25 期周刊 + _index.md（单独开 RSS 输出）
  feed/                   /feed/ 与 /feed/weekly/ —— 订阅源的「浏览器视图」的两个壳
                          （_index.md + weekly.md，**只有 front matter**：noindex + feedScope；
                          内容全在 layouts/partials/feed-view.html。⚠️ 别挂进导航）

archetypes/
  posts.md weekly.md      新建文章的模板（含发布前检查清单）

layouts/                  ★ 站点层覆盖，33 个文件（另有 data/inline-links.json 词表）
  index.html                        首页（上游只有 {{ .Content }}；简介**不包 <content>**）
  sitemap.xml                       ★ 2026-10-17 新增：按 $noindex 过滤（336 → 134 条）
                                    ⚠️ 过滤条件必须与 _default/baseof.html 的 $noindex 逐字同口径
  _partials/opengraph.html          ★ 2026-10-17 新增：覆盖 Hugo **内置**的 _partials 命名空间
                                    —— 按 slug 取 images/og/<slug>.png，取不到回落 share.webp
  _partials/twitter_cards.html      ★ 同上（twitter:image 必须与 og:image 同源）
  _default/baseof.html              LanguageCode → Language.Locale + 补回 robots 分支
                                    + skip-link（2026-10-17）+ <main id="main" tabindex="-1">
                                    + 长文页的 .print-url
  _default/single.html              去掉 `if eq .Type "blog"` 门槛 + hideDate/hideTitle
                                    + 文末「系列坐标带」与「上一篇/下一篇」+ 评论区
                                    + 手机端折叠目录（2026-10-17，h2 ≥ 3 且 $tocEnabled 才出）
                                    ⚠️ `$tocEnabled` 在文件开头定义，末尾的侧栏目录复用它；
                                       别在末尾再声明一次（同层重复声明直接构建失败）
  _default/list.html                5 处文案英译中 + 删底部标签墙
  _default/rss.xml                  ★ 首页 feed 只收文章页 + atom:updated / category /
                                    摘要 description / 全文 content:encoded + pageLimit 20
                                    + <image> 站点图标（2026-10-25，144×144 PNG，走
                                    params.feedIcon；必须在 <item> 之前）
                                    ⚠️ 2026-10-15 起**不再输出 <?xml-stylesheet?>**（旧的
                                    static/rss.xsl 已删），浏览器视图改由 /feed/ 承担
  _default/archive.html             ★ /archive/ 列表页 + 顶部「系列」横向入口
                                    + 底部全部标签平铺（照 yinji）
  _default/run.html                 ★ /run/ 跑步数据页（2026-10-12 从子站搬入）
  feed/list.html                    ★ /feed/ —— 订阅源浏览器视图（section 页）
  feed/single.html                  ★ /feed/weekly/ —— 同一个视图（普通页）
                                    ⚠️ 两个文件名都要有，否则周刊那页会掉进
                                    _default/single.html 被渲染成「文章」
  _default/_markup/render-link.html ★ 只为去掉 `</a>` 后面那个换行
  _default/_markup/render-image.html ★ 给正文 <img> 补真实 width/height
                                    （读 data/image-dims.json）
                                    ⚠️ 2026-10-14：overlay 不再重复一个 <img>，
                                    URL 走 figure 上的 --zoom-src 画背景（省一半节点）
                                    ⚠️ 2026-10-25：加 srcset(400/720/1080) + 图床
                                    边缘转换(/cdn-cgi/image/width=W,format=auto,
                                    quality=82/) + 首图 fetchpriority=high。
                                    实测省 47–71%，详见 DESIGN.md 第 13 节
  partials/nav.html                 完全由 [[menu.main]] 驱动（7 项）
                                    + aria-current="page"（2026-10-17，精确匹配 RelPermalink）
  partials/header.html              ★ 2026-10-18 新增：站名从 <h1> 换成 <p class="title">
                                    —— 文章页原本有**两个 h1**（站名 + 文章标题，134/344 页）
                                    ⚠️ <p> 与 <h1> 的默认样式差四处（color/font-size/
                                       font-weight/margin），全靠 custom_head 第 00c 段补
                                    ⚠️ 别给 <a> 加 display:block，会改变点击区域
  partials/favicon.html             ★ 2026-10-25 新增：head 里输出 6 条 link
                                    （SVG / 512 / 192 / apple-touch / ico / manifest）
                                    ⚠️ 2026-10-28 起 href 用 **`relURL`**（原来 `absURL`）
                                       —— 这 6 条只服务当前这个 HTML 页，同源即可；
                                       绝对地址在将来做镜像域名时会把 6 个请求拽回慢域名
                                    ⚠️ 上游只输出 1 条 shortcut icon，且本站指向 SVG
                                       ⇒ 订阅端与图标聚合服务拿不到图（不吃 SVG、
                                       /favicon.ico 又是 404），表现为「订阅里的头像
                                       和网站不一样」，站内完全看不出来
                                    ⚠️ 光栅四件套全部由 static/favicon.svg 生成，
                                       改图标只改 SVG 再跑 DESIGN.md 第 12.3 节那几行
  partials/footer.html              版权独立成行 + 订阅行挪到第 3 行
                                    + copyrightNote/licenseName/licenseURL
  partials/custom_head.html         33 段补丁样式 + GoatCounter
                                    （03/06/11 刻意留空，24 撤回，**27/34/35 不占号**）
                                    ⚠️ <style> 之前还有两条 theme-color meta，不占段号
                                    ⚠️ 第 27 段号**刻意不占** —— 当天建当天撤，原因见 DESIGN.md
                                    ⚠️ 第 34 段号**也不占** —— 2026-10-26 加了又撤，见本文件第 0 节
                                    ⚠️ 第 35 段号**也不占** —— 2026-10-27 搜索框尺寸加了又撤，
                                       用户要求恢复原样；留下的说明注释里记着「真要再改要注意什么」
                                    ⚠️ 第 28 段是订阅源浏览器视图的样式，**只给 /feed/ 那两页**
                                    （守卫 `or (eq .Type "feed") (eq .Section "feed")`）
                                    ⚠️ 第 29 段 = skip-link + 打印；第 30 段 = 跨页转场（2026-10-17，全站）
                                    ⚠️ 第 31 段 = 手机端折叠目录（2026-10-17，`@media screen` 限定，
                                       打印时不显示；类名**不能**叫 `.toc-nav`，会抢走主题 JS 的选择器）
                                    ⚠️ 第 32 段 = 浅色三级文字色提亮到 #6e6e6e（2026-10-18，
                                       包在 `@media (prefers-color-scheme: light)` 里 ——
                                       裸 `:root` 会把深色主题一起覆盖）
                                    ⚠️ 00b = 导航当前页（只改颜色）、00c = 页头站名（2026-10-18），
                                       两者都没有独立段号，挂在 00 段之后
  partials/feed-view.html           ★ 订阅源浏览器视图（2026-10-15）：标题 + 简介 +
                                    订阅地址 + 条目「日期/标题/摘要」
                                    ⚠️ 页面集合口径必须与 _default/rss.xml 逐字一致
  partials/orphan-safe.html         孤行保护（标题末 2 字包 nowrap）
  partials/back-top.html            返回顶部（只长文页，纯 CSS、零 JS）
  partials/code-copy.html           代码块复制按钮的脚本引入（只含代码的页）
  partials/breadcrumbs.html         ★ 面包屑（+ BreadcrumbList JSON-LD），只给文章页
  partials/seo_tags.html            ★ SEO 头（2026-10-14 新增）：覆盖上游同名 partial
                                    —— 删 keywords / name=title / 整套微数据，
                                    换按页型分四类的 JSON-LD，补 og:image 宽高
  partials/giscus.html              评论区（2026-10-11 起无外框，只剩「评论」+ 一个实心三角）
  404.html                          ★ 404 页（上游只有两行字）

assets/js/giscus.js       评论区脚本（只在挂评论的页加载）
assets/js/code-copy.js    代码块复制按钮（只在含代码块的 5 页加载）

themes/hugo-bearneo/      ★ 上游逐字节副本，27 个文件，**不要改**

static/
  _headers _redirects     Cloudflare 的响应头 / 301 规则（_redirects 现有 129 条，见第 0 节「URL」行）
  manifest.webmanifest    ★ 2026-10-26 新增：PWA 清单（name/图标/主题色），head 的
                          <link rel=manifest> 在 favicon.html。⚠️ 手写 JSON 不能写注释（见第 17 节索引行）
  favicon.svg             ⚠️ 2026-10-13 删掉的旧 PWA 五件套与 2026-10-26 新加的 manifest
                          是**两回事**：现在有 static/manifest.webmanifest + head 里
                          <link rel=manifest>（favicon.html），别再照旧注释说「全站没有 manifest」
                          ⚠️ rss.xsl 2026-10-15 已删 —— 它是 XSLT 方案的一部分，
                            feed 顶部那行 xml-stylesheet 也一起去掉了（见第 2 节末）
  images/                 **三类在用**：share.webp（兜底 og:image，params.images 引用）
                          + og/（128 张按 slug 的分享卡，2026-10-17 起）
                          + donate/（2 张收款码，/donate/ 在用）
                          ⚠️ og/ 是**离线生成、提交进仓库**的派生数据，publish.sh 每次重画

functions/                ★ Cloudflare Pages Functions（2026-10-15 新增）
  _middleware.js            订阅源的内容协商：浏览器导航 /index.xml → /feed/ 的 HTML，
                            订阅器 → 原样 XML。⚠️ 这是整套方案唯一会**静默失效**的一环

data/                     runs.json（/run/ 页在读）+ image-dims.json（喂 render-image.html）
                          ⚠️ 两个都别当孤儿删
scripts/                  10 个脚本，见第 4 节
.github/workflows/        build.yml（构建校验）/ sync-garmin.yml（每日同步跑步数据）
```

> ⚠️ **2026-10-12：四个子站（run / profile / shot / share）全部下线，`sites/` 目录已从仓库整体删除。**
> - `profile` 的内容平台一节并入本站 `/about/`；跑步页并入本站 `/run/`；
>   `shot` / `share` **本来就是空壳**（各 2 个 `_index.md`、合计 <300 B、零篇实际内容），无需迁移。
> - 一并删掉的还有 `scripts/build-subdomains.sh`、`resources/`（旧主题图片处理缓存）、
>   `sync-garmin.yml` 的 `file_pattern` 里的 `sites/profile/data/run_summary.json`
>   （留着会让每日 git-auto-commit 报错）、`cleanup-junk.sh` 与 `deploy.sh` 里的 `find sites`。
> - ⚠️ `sites/README.md`（子站搭建细则：设计令牌表、Cloudflare Pages 配置、页头页脚约定）
>   **没有迁移到别处**，需要时 `git show <commit>:sites/README.md`。
> - ⚠️ 要整体恢复子站：`git log --all -- sites/` 定位删除那次提交逐文件取回
>   （删除前另有本地快照 `/tmp/blog-backup/subdomains-*.tar.gz`，只是临时的）。

> ⚠️ **2026-10-11 清掉的「迁移孤儿」**（自建主题时代遗留，删前逐个核对过零引用）：
> `static/images/og/`（125 张按 slug 的分享图）、`static/images/media/`（71 张封面）、
> `static/images/avatar.webp`、`data/media.json`、`data/image_dims.json`，以及 4 个失效脚本
> `sync-douban.py` / `gen-og.js` / `css-critical-coverage.py` / `fetch-image-dims.py`，
> 加仓库根的工作产物共约 8.2 MB。**要恢复任何一个都从 git 历史取**
> （`git log --diff-filter=D --name-only`），别凭记忆重写。
>
> ⚠️ **2026-10-15 删掉的**：`static/rss.xsl`（连带 `static/_headers` 里那条 `/rss.xsl` 规则）。
> 它服务的是「浏览器打开 `/index.xml` 时用 XSLT 渲染成一页 HTML」这个方案，随 Chromium 移除
> XSLT 整体撤掉，改由 `/feed/` 两页 + `functions/_middleware.js` 承担（见第 2 节「边缘函数」）。
> ⚠️ **别加回来** —— 加回来横幅就跟着回来；真要取：`git show <旧提交>:static/rss.xsl`。

---

## 2. 构建 / 预览 / 发布

```bash
hugo server -D          # 本地预览（-D 显示草稿）
```

⚠️ **`hugo server` 开着会持续覆盖 `public/`**。`deploy.sh` 会检测 1313 端口并警告，但**不会替你停** —— 要部署先停它。

### 干净构建（验收用）

```bash
hugo --gc --minify --cleanDestinationDir --destination /tmp/hb-check
```

四个坑：

- **本仓 `minifyOutput = true`** → **不存在「不压缩的构建」**，想拿未压缩产物做对照是浪费时间。
- **`hugo --gc --minify` 不删 `public/` 里的陈旧文件** → 表现像「改了没生效」。一律加 `--cleanDestinationDir` 或构建到临时目录。
- `--destination /tmp/xxx` **不碰 `public/`**，是唯一能在 server 开着时安全验收的办法。
- **别用 `hugo --quiet` 做验收** —— 它会把「构建失败」藏起来，而失败时 `--cleanDestinationDir` 不执行，你会读到上一次的产物。**必须看输出里有没有 `ERROR`。**

### 生产发布

```bash
./deploy.sh     # 干净构建到临时目录 → 查 livereload → rsync -a --delete 到 public/
./publish.sh    # git 提交 + 推送（终端敲 up 同效）
```

`publish.sh` 在 `git add` 前依次跑四个脚本（失败都不阻断发布）：

```
add-heading-anchors.py   中文标题补 {#pinyin}
sync-lastmod.py          刷改过的文章的 lastmod
sync-image-dims.py       补抓新图尺寸 → data/image-dims.json      ← 2026-10-18 接入
gen-og.js                全量重画分享卡 → static/images/og/       ← 2026-10-18 接入
```

⚠️ `sync-lastmod.py` 已无可见产出（`lastmod` 只喂 RSS / sitemap），保留调用而已。
⚠️ 后两个是「**离线生成、提交进仓库**」的派生数据，**没有构建期钩子**：Hugo 拿不到图床图片的尺寸，也算不出分享卡。漏跑时**构建 0 警告**，只是静默降级（分享卡退回通用图 / `<img>` 缺宽高）。2026-10-18 实测到过真实的漏：129 篇文章只有 127 张卡。
⚠️ 为什么**不**放进 `deploy.sh`：`sync-image-dims.py` 要联网抓图床，而「构建零网络依赖」是本站的架构底线（图床挂了也要能构建）。
⚠️ 2026-10-11 删掉了原来排最前的 `fetch-image-dims.py`（脚本也删了）—— 它抓的 `data/image_dims.json` 上游模板根本不读，**别照旧文档加回来**。注意它与现在在用的 `sync-image-dims.py` **不是同一个东西**（后者喂的是站点层 `render-image.html`，键名 `image-dims.json`）。
⚠️ 2026-10-12 删掉了 `fetch-profile-content.py`（随 profile 子站一起删）—— 它刷的「花园页」快照已不存在。

### 新建文章

```bash
new posts/我的新文章       # = bash scripts/new-post.sh posts/我的新文章
new weekly/周刊-27
```

`scripts/new-post.sh` 会套 `archetypes/` 模板（`draft: true`）、同名文件**不覆盖只打开**、然后用 `open` 走系统默认应用。
⚠️ 命令 `new` 是 `~/.config/zsh/.zshrc` 里的一个函数（不在仓库里）—— 换机器要重新加一次；脚本本体在仓库里，可以直接 `bash scripts/new-post.sh …`。

### 边缘函数（Cloudflare Pages Functions）

`functions/_middleware.js`（2026-10-15 新增）**不在 Hugo 构建里** —— 它由 Cloudflare Pages
在部署时打包，只在线上生效，`hugo server` 预览不到、本地也没有等价的测试环境。

```bash
# ① 浏览器视角：应返回 HTML 订阅页（这两个头缺一不可）
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Sec-Fetch-Dest: document' https://hulatu.com/index.xml
#   期望：200 text/html; charset=utf-8

# ② 订阅器视角：应原样返回 XML
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' \
  -H 'Accept: application/rss+xml, application/xml;q=0.9, */*;q=0.8' \
  https://hulatu.com/index.xml
#   期望：200 application/rss+xml

# ③ 周刊那一路同样要通
curl -s -H 'Sec-Fetch-Dest: document' -H 'Accept: text/html' \
  https://hulatu.com/weekly/index.xml | grep -c 'feed-view-title'
#   期望：>0（说明拿到的是 /feed/weekly/ 的 HTML，而不是 XML）
```

⚠️ **前提**：Cloudflare Pages 项目的 **Functions 目录**必须是默认的 `functions`（仓库根）。
被改过、或 Functions 被关掉，上面 ① 会返回 `application/rss+xml`（浏览器打开 feed 退回 raw XML），
而**部署与构建都不会报错** —— 这是整套方案唯一的静默故障点，改完务必跑一次上面的核对。
⚠️ 判据**只认 `Sec-Fetch-Dest: document`**（现代浏览器顶层导航才带的头），`Accept` 只是它缺席
时的退路。**别**改成「Accept 里含 text/html 就返回 HTML」：有些订阅器会带 text/html，
那样它们会拿到 HTML —— 静默坏掉，用户完全察觉不到。
⚠️ 两页在 Hugo 侧设了 `noindex`，函数响应又补了 `X-Robots-Tag: noindex, follow`；别去掉。
⚠️ 响应头（`Cache-Control` / `Vary`）写在函数代码里 —— `static/_headers` **不作用于函数响应**
（它只管静态资源）。改了别只改 `_headers` 那一份。

### CI

- `.github/workflows/build.yml`：push / PR 时用同一个 Hugo 版本**只构建主站**，并检查中文标题锚点是否补齐。周刊期号检查那一步 2026-10-10 已删（`issue` 字段 2026-10-13 已从全部周刊移除）。
- `.github/workflows/sync-garmin.yml`：每天 22:00（Asia/Taipei）拉跑步数据写 `data/runs.json`。

---

## 3. 内容约定

### 文章 front matter（`archetypes/posts.md`）

| 字段 | 状态 | 说明 |
| --- | --- | --- |
| `title` / `date` / `slug` | ✅ | |
| `lastmod` | ⚠️ 半废 | 只喂 RSS / sitemap；「更新于」一行已随迁移删除 |
| `summary` | ✅ | 列表 / 首页摘要；`description` 留空时兜底 |
| `description` | ✅ | `<meta name="description">` + OG/Twitter 卡片 |
| `categories` / `tags` | ✅ | 词条页仍生成；索引页已关 |
| `series` | ✅ | 文章页文末坐标带 + `/archive/` 横向入口。⚠️ 字符串语义（一篇只能属一个系列）；旧文档说它「已作废」是过时的 |
| `comments` | ✅ | `false` 关掉该篇评论区 |
| `draft` | ✅ | |
| `hidden` | ✅ | 列表页过滤掉（`list.html` / `archive.html` 都判） |
| `toc` | ✅ | `false` 关掉右侧目录。⚠️ 是「继承」不是「一律关」：闸门 `default .Site.Params.toc .Params.toc`，而 `hugo.toml` 的 `[params] toc = true` → **不写 `toc` 的页（`/about/` `/privacy/`）实际有目录** |
| `hideDate` | ✅ | `true` 藏掉页面日期行（`date` 字段仍要留） |
| `mermaid` | ✅ | `true` 才加载 Mermaid |
| `menu` | ✅ | 有值时 `single.html` 不输出 `<h1>` / 日期行 |

### 周刊 front matter（`archetypes/weekly.md`）

- `categories: ["周刊"]` 默认已填；`issue` 字段 2026-10-13 已全部移除（连同 archetype 里那一行）。
- 周刊 URL 也落在 `/posts/YYYY/MM/DD/slug/`（`[permalinks]` 里 `weekly` 与 `posts` 同规则）—— **刻意，不是 bug**。

### 三个必须记住的规矩

1. **加根级独立页时写 `hideDate: true` + `toc: false`**（短页面挂目录是纯噪音）；纯工具页再加 `noindex: true`；新页别忘了回 `static/_headers` 补一条缓存规则。
2. **中文标题显式写锚点** `## 习惯 {#xi-guan}`，否则分享链接是 `#%e4%b9%a0%e6%83%af`。漏了跑 `python3 scripts/add-heading-anchors.py`（需要 macOS 拼音库）。
3. **`noindex: true` 是生效的**（站点层 `baseof.html` 有 robots 分支，上游没有），覆盖 219 页 = 213 标签词条 + 8 分类词条 + `/privacy/` + `/posts/` + `/donate/` + 404。
   ✅ **2026-10-17 起 sitemap 也排除了**：`layouts/sitemap.xml` 的四个判据与 `baseof.html` 的 `$noindex` 同口径，336 条 → 134 条。
   ⚠️ 两处的判据**必须逐字一致** —— 漂移时构建 0 警告，只是「提交给爬虫的地址」和「页面上的 noindex」对不上。

---

## 4. 常见任务 → 改哪儿

| 想做的事 | 去哪儿 |
| --- | --- |
| 改导航（增删项 / 改标签 / 换落点） | `hugo.toml` 的 `[[menu.main]]`，**不用碰模板**（当前 7 项：Home / About / Now / Links→`/roll/` / Weekly→`/weekly/` / Posts→`/archive/` / RSS→`/index.xml`） |
| 改首页文案 | `content/_index.md` |
| 改首页列表条数 | `hugo.toml` 的 `homeRecentCount`（设 0 退回上游原样） |
| 改首页列表的对齐 / 间距 | `custom_head.html` 第 04 段。⚠️ 列表必须与 `Recent Posts:` 标题左对齐（`padding-left: 0`），失效时会缩进 40px；几何值（120px / .95rem / 1.2rem / 1.3 / 2rem）逐值照 yinji，改前想清楚 |
| 改关于页 /「内容平台」一节 | `content/about.md`（纯 Markdown，全站没有头像） |
| 改支持页 / 换收款码 | `content/donate.md`（结构 + 文案）+ `custom_head.html` 第 08 段（样式）。⚠️ 换码后要去 Cloudflare Purge `/images/donate/*`（30 天缓存） |
| 改页脚 | `hugo.toml` 的 `copyright` / `copyrightNote` / `licenseName` / `licenseURL` / `[params.footer]` 四个开关。⚠️ 订阅行末尾那个「🚇 开往」**不在配置里**，写在 `layouts/partials/footer.html` 的订阅块里（`safeHTML` 存成变量、三个互斥分支各引用一次） |
| 改**站内跳转预渲染** | `custom_head.html` 末尾那个 `<script type="speculationrules">`（2026-10-28）。⚠️ `eagerness` 是 `moderate`，**别改成 `eager`** —— 列表页一屏十几个链接会同时预渲染，把带宽吃光。⚠️ 规则里 `href_matches` 写 `/*` 是相对本文档解析的，只命中同源路径；别换成跨源全通配。⚠️ 模板注释里**绝不能出现星号加斜杠的连续两字符**（那就是注释结束符），我这次就写坏过一次，构建直接报 `comment ends before closing delimiter` |
| 改**图标 link 的绝对 / 相对** | `layouts/partials/favicon.html`（2026-10-28 起 6 条全用 `relURL`）。⚠️ 别改回 `absURL`：这 6 条只服务当前 HTML 页，绝对地址在镜像域名下会把请求拽回 hulatu.com。**需要绝对地址的是 feed 里的图标**（走 `params.feedIcon`） |
| 改**图床预连的触发条件** | `custom_head.html` 第 27 行附近，条件是 `and (strings.Contains .Content "img.hulatu.com") (strings.Contains .Content "<img")`。⚠️ **两个条件缺一不可**：只判主机名会误命中 `/`、`/about/`、`/privacy/`（那三页里是 `<a href>` 或纯文本）。⚠️ 验收别数 `rel=preconnect` —— giscus 的预连也长这样（135 个长文页都有），会把结论带偏 |
| 改**标签（增 / 删 / 合并）** | 标签只来自各篇的 `tags:` 行，模板一处都不用动 —— `/archive/` 底部那份平铺是 `layouts/_default/archive.html` 里 `range .Site.Taxonomies.tags` 自动生成的（**按字节序**：数字 → 英文 → 中文，不额外 sort）。⚠️ **删/合并标签必须同时处理 `static/_redirects`**：被删掉的 `/tags/<词>/` 会变成 404，得补 301；2026-10-26 归并时就是「改 tags + 补 113 条 301」一起做的，2026-10-28 撤销时也是「还原 tags + 删 113 条 301」一起做的。⚠️ 改完数一遍 `/archive/` 的 `class=tag-index` 里 `<a>` 个数，应等于 `tags/` 目录数（现在 **213**） |
| 改颜色 / 字体 / 宽度 / 圆角 | `themes/hugo-bearneo/layouts/partials/style.html` 的 `:root`（改上游，改完在 DESIGN.md 第 5 节登记）。全站只有这一份 —— 改一处即全站生效 |
| 改正文标题的上下间距 | `custom_head.html` 第 02 段（`text-autospace` 与 `content > :first-child` 两条已删 —— 后者是「首行贴导航栏」的元凶，见 DESIGN.md 第 5 节第 ③ 条） |
| 改**正文段落间距** | `custom_head.html` 第 02 段末尾的 `content > p { margin-bottom: 1.75em }`（2026-10-27）。⚠️ **必须写 `content > p`**：写成 `content p` 会覆盖上游的 `blockquote p { margin: 0 }`（同特异性、本文件后加载），引用块里凭空多出 28px。⚠️ **只写 `margin-bottom`**：写了 `margin-top` 会把「标题 → 正文」的 16.8px 一起改成 28px |
| 改**列表页搜索框尺寸** | ⚠️ **2026-10-27 加过又撤了，现在是纯 UA 默认（174×24）**。当时写的第 35 段是 `#search-input{box-sizing:border-box;width:100%;height:44px}`，用户看过效果后要求恢复原样。真要再改，先去 `custom_head.html` 第 35 段位置读那段说明注释（含四条技术事实，其中一条是我上一轮写错又更正过的：`type=search` 的 UA 默认**已经是** border-box，`type=text` 才是 content-box） |
| 改**正文行高** | `themes/hugo-bearneo/layouts/partials/style.html` 的 `content`（**改上游**，改完在 DESIGN.md 第 5 节登记）。⚠️ 上游 1.6，2026-10-14 已改成 **1.8**；`body` 那条 1.5 **不要动**（页头 / 导航 / 页脚是外壳，不是阅读面）。改完回读：`content p` 应 16px / 28.8px，`header nav a` 仍 24px。⚠️ `<content>` 里的**标题也继承这 1.8** |
| 改文末「系列坐标带」/「上一篇 / 下一篇」 | 模板 `layouts/_default/single.html`，样式 `custom_head.html` 第 09 / 10 段（**改类名要两边一起改**） |
| 改归档页顶部的「系列」横向入口 | 模板 `layouts/_default/archive.html`，样式 `custom_head.html` 第 09 段 |
| 改归档页底部的标签平铺 | 模板 `layouts/_default/archive.html`（`</ul>` 后那段）+ 样式第 09 段的 `.tag-index`<br>⚠️ 排序不是写出来的：`range` map 时 Go 按 key 字节序排 → 数字 → 英文 → 中文<br>⚠️ 别写成 `{{ with .Site.Taxonomies.tags }}` 再 `range .Site.…` —— `with` 重绑 `.`，静默 0 迭代、只留一个空 `<div>`，**构建 0 警告**<br>⚠️ 链接落 `/tags/<slug>/` 词条页；`/tags/` 索引页是关掉的，别改过去（会 404）<br>⚠️ 外层是 `<small>`（默认 inline），必须有 `.tag-index{display:block;margin-bottom:16px}`，否则页脚会贴住标签 |
| 改「系列」带里的序号对齐 | `custom_head.html` 第 09 段的 `.post-series-ord`（`min-width: 1.5em` + `text-align: right`）。不写的话「9」与「11」宽度不同（8.1 vs 16.3px），上下两行标题左端错开 8.1px；只兜得住 2 位 |
| ⚠️ 在 `custom_head.html` 写元素选择器前先数标签 | `grep -c '<nav' public/…/index.html`。2026-10-11 栽过：裸 `nav{display:flex}` 命中一页 5 个 `<nav>`，把 `.post-series` 挤成左右两栏（右边空 208px）、TOC 的 `<ul>` 撑出容器 92.8px。**必须写 `header nav`** |
| 改代码块配色 | `custom_head.html` 第 12 段（浅 / 深两套 `--code-*`）。⚠️ 前提是 `[markup.highlight] noClasses = false` —— 改回 `true` 代码块立刻变回「看不见」 |
| 改独立页是否显示标题 | front matter `hideTitle: true`。当前 `/roll/` `/about/` `/now/` 三页开着；`/privacy/` `/donate/` 保留标题 |
| 改 `/roll/` 两组之间的分隔线 | `content/roll.md` 里那条**裸 `<hr>`**，走主题样式，**没有专属 CSS**（第 11 段留空）。想改观感就改主题的 `hr`（全站生效） |
| 改 404 页 | `layouts/404.html`（结构）+ 第 15 段（样式）。⚠️「随便看一篇」是 `shuffle` 构建期抽签 |
| 改标题锚点 `#` | `layouts/_default/_markup/render-heading.html` + 第 19 段。⚠️ **只给文章页**（两边都判 `$longForm`，改一处要一起改） |
| 改孤行保护 | `layouts/partials/orphan-safe.html` + 四处调用；⚠️ **别信「HTML 里有 span 就等于生效」**，`content .nowrap` 那条规则必须有 |
| 改返回顶部 | `layouts/partials/back-top.html` + 第 16 段。⚠️ **零 JS**，靠 `animation-timeline: scroll()` |
| 改代码复制按钮 | `assets/js/code-copy.js` + 第 18 段 + `partials/code-copy.html` 的加载判断（三处类名 / 判据一致） |
| 改「系列」分组口径 | ⚠️ **两处必须同口径**（`series` 字段 + `.ByDate` 升序）：`single.html` 与 `archive.html` |
| 改评论区 | `layouts/partials/giscus.html` + `assets/js/giscus.js` + 第 07 段 |
| 改 robots / `noindex` | **`layouts/partials/noindex.html`**（2026-10-26 起是唯一判定处，`baseof.html` 与 `sitemap.xml` 都调它）。⚠️ 改完两处会同时生效，不需要再手动对齐；口径与理由见 DESIGN.md 第 15.1 节 |
| 改首页那行平台链接 | `content/_index.md`（**地址的真相在 `content/about.md` 的「内容平台」段，两边一起改**） |
| 改链接页（加朋友 / 加聚合站） | `content/roll.md` —— **全站唯一的链接页**，一条平铺<br>⚠️ 条目格式 `- [名称](地址)：一句话点评`<br>⚠️ `</a>` 和中文冒号之间**不要手写空格**（`render-link.html` 已处理）<br>⚠️ 两组之间那条全宽虚线是手写的裸 `<hr>`，**别删** |
| 加根级独立页 | `content/xxx.md`（`hideDate` + `toc: false`）+ 回 `static/_headers` 补缓存规则 |
| 加 301 | `static/_redirects`（**首条命中即生效**，splat 要排在精确路径之后） |
| 改响应头 / 缓存 | `static/_headers` |
| 换 favicon / 站点图标 / 分享图 | **只改 `static/favicon.svg`**，然后按 DESIGN.md 第 12.3 节重跑一遍 → 生成 `icon-512/192.png`、`apple-touch-icon.png`、`favicon.ico`、`images/feed-icon.png`（feed `<image>` 用，路径在 `hugo.toml` 的 `params.feedIcon`，宽高在 `rss.xml` 里写死 144）。⚠️ 光栅图**别手工裁**，会和 SVG 分叉；⚠️ 改完阅读器要手动刷新图标（订阅时抓一次就长期缓存）。分享图是 `static/images/share.webp`（只是**兜底** `og:image`，由 `params.images` 引用；文章页各有一张 `static/images/og/<slug>.png`，由 `scripts/gen-og.js` 生成，`publish.sh` 每次重画）。⚠️ 换兜底图后改 `hugo.toml` 的 `params.ogImageWidth` / `ogImageHeight` 跟上（`seo_tags.html` 读这两个参数输出 og 宽高） |
| 改 SEO 头（keywords / JSON-LD / og / referrer / theme-color） | `layouts/partials/seo_tags.html`（2026-10-14 新增，整份覆盖上游同名 partial）。⚠️ `theme-color` 那两条在 `custom_head.html` 的 `<style>` **之前**（不占段号）；`color-scheme` 与 `input{font-size}` 在第 26 段；`referrer` 在 `baseof.html`。⚠️ 上游那份是「HTML 规范还在 2015 年」的写法，**别回退** |
| 改分享卡片图 / JSON-LD 的 `image` | **`layouts/partials/og-image.html`**（2026-10-26 起是唯一取值处，`og:image` / `twitter:image` / JSON-LD `image` 三处都调它）。⚠️ 返回的是**绝对 URL**，调用方不要再套 `absURL` |
| 改分类页的标题 / 描述 | `content/categories/<词>/_index.md`（8 个，2026-10-26 新增）。⚠️ `title` 必须写，否则 `<title>` 会退化成「 \| 胡拉图说」；标签页没有对应文件（它们仍是 noindex） |
| 改站内搜索（索引内容 / 匹配规则 / 触发时机） | 索引 `layouts/index.json`（字段 `t/u/g/d`，`hugo.toml` 的 `[outputs] home` 含 `"JSON"`），前端 `layouts/partials/search-box.html`。⚠️ 索引 **1.03 MB / gzip 442 KB**，前端只在用户开始输入时 fetch，**别改成进页面就拉**；⚠️ 拿不到索引必须退回「只搜标题」，不能变成搜不出东西；⚠️ 它只过滤**当前页已有的条目**（`/archive/` = 全站）。理由见 DESIGN.md 第 16.4 节 |
| 改分享卡上的日期 / 作者 / 标签（`article:*`） | `layouts/_partials/opengraph.html`。⚠️ 只对 `posts` / `weekly` 输出，首页与列表页的 `og:type` 是 `website`，挂 `article:*` 非法；⚠️ `article:author` 按协议是**作者主页 URL**（本站指 `/about/`），不是名字 |
| 改「更新于」的显示条件 | `layouts/_default/single.html` 日期行（`$showUpdated`）。⚠️ 判据是「`lastmod` 晚于 `date` **且** 日历日不同」，不是「差 24 小时」——当天发当天改的两个日期长得一样，显示出来是噪音；⚠️ 这一行**没有配套 CSS**，改样式要自己在 `custom_head.html` 加段 |
| 改 Web App Manifest（名称 / 图标 / 主题色） | `static/manifest.webmanifest`。⚠️ 它是**手写 JSON、不能写注释**（加了整份解析失败且静默），所有取舍理由写在 `layouts/partials/favicon.html` 那段注释里；⚠️ `purpose` 别加 `maskable`（图标笔画贴边会被裁）；⚠️ `id` 一旦发布别再改 |
| 改正文内链（加 / 删锚点词） | **`data/inline-links.json`**（`{a: 锚点, u: 目标URL}`）+ 逻辑在 `layouts/partials/inline-links.html`（挂在 `single.html` 的 `$content` 管线末尾）。⚠️ 加词条前先确认 ① 锚点逐字出现在**其他**文章正文里、② 锚点之间**不互为子串**（否则嵌套 `<a>`）、③ 目标 URL 拿产物目录当真值核对 —— 三条都栽过（详见 DESIGN.md 第 17.3 节四个坑）。⚠️ 数据键带连字符，模板里必须 `index hugo.Data "inline-links"`，写成 `hugo.Data.inlineLinks` 会**静默 nil、0 警告**；⚠️ Hugo 0.168 没有 `strings.ReplaceAll`，用 `strings.Replace … -1` |
| 改图片放大（放大方式 / 键盘可达性） | 结构在 `layouts/_default/_markup/render-image.html`（`--zoom-src` 挂在 figure 上），样式在第 26 段 ④⑤。⚠️ overlay 是**空壳**（只有 `class`，没有 `<img>`）；`.image-zoom-toggle` 那条**必须带 `display`**，只写定位会让上游的 `display:none` 留下、checkbox 又变回不可聚焦 |
| 改文末「相关文章」 | 模板 `single.html` 的 ② 段 + 第 09 段的 `.post-related*` 六条规则 + **`hugo.toml` 的 `[related]`**（权重 / 阈值都在那）。⚠️ 改阈值前先数产物里 `.post-related` 有几个 —— 2026-10-05 那次就是吃默认 `threshold = 80` 导致**一条都推不出来**、构建 0 警告。现在 20，135/135 篇有推荐 |
| 改图片加载（srcset / 边缘转换 / 首图优先） | `layouts/_default/_markup/render-image.html`（一个文件搞定四件事，理由见 DESIGN.md 第 13 节）+ `custom_head.html` 顶部的 `preconnect`。⚠️ `quality=82` 是目视比过的，别往 70 以下调（截图类图片会出色带）；⚠️ 首图 `fetchpriority="high"` **不能同时带 `loading="lazy"`**，同时写 high 会被忽略；⚠️ `sizes` 里的 `680px` = `body` 的 720 减左右各 20 padding，改布局宽度要回来改它 |
| 改订阅源（feed 字段 / 浏览器打开 feed 时那一页） | ① feed 本身：`layouts/_default/rss.xml`；② 浏览器视图：`layouts/partials/feed-view.html` + `content/feed/`（只有 front matter）+ `custom_head.html` 第 28 段；③ 谁分派：`functions/_middleware.js`。⚠️ ①② 的**页面集合口径必须逐字一致**（`site` / `weekly` 两套），不一致就是「网页比订阅少一篇」且**构建 0 警告**；③ 改完按第 2 节「边缘函数」跑一遍线上核对 —— 它是**静默失效**的 |
| 改周刊页的计数行 / RSS 订阅入口 | `layouts/_default/list.html`（`$isWeekly` = Kind section + Section weekly；`#post-count` 是 `<span>`、订阅链接在它**外面**）。⚠️ 订阅入口是**普通文字链接，不要加样式**（2026-10-14 用户看过带边框 + 图标的徽章后要求简化）；想让链接在搜索后存活，**只能改 span 的 `textContent`**，用 `innerHTML` 会把它整个覆盖掉。⚠️ 2026-10-26 起过滤脚本不在这个文件里了 —— 它在 `layouts/partials/search-box.html`，本文件只传一个 `countLabel`（「篇。」/「期周刊内容」） |

### `scripts/` 现状

| 脚本 | 状态 |
| --- | --- |
| `add-heading-anchors.py` | ✅ 在用（CI 也跑 `--check`） |
| `sync-garmin.py` / `garmin-token.py` | ✅ 在用（每日 CI 同步跑步数据 → `data/runs.json`） |
| `sync-lastmod.py` | ⚠️ 半废（`lastmod` 只喂 RSS / sitemap） |
| `sync-image-dims.py` | ✅ 在用（HTTP 探测图床图片真实宽高 → `data/image-dims.json`，供 `render-image.html` 消费）。**2026-10-18 起在 `publish.sh` 里自动跑**，只补缺的 |
| `check-cache.sh` | ✅ 在用（2026-10-25 新增，**手动跑**）。自查线上首页是否被边缘缓存锁住：打 `/` 与 `/?cb=随机` 对比 `cf-cache-status` + 内容指纹，命中就打印后台 Purge / Edge TTL 的操作路径。退出码 0=正常 / 1=被锁 / 2=网络拿不到。⚠️ 不进 `publish.sh` —— 它依赖外网，而发布流程要能离线跑 |
| `gen-og.js` | ✅ 在用（2026-10-17 重写，2026-10-18 接入 `publish.sh`）：每篇文章一张 1200×630 分享卡 → `static/images/og/`。⚠️ 依赖 sharp，`publish.sh` 会自己找 `node` 与 `NODE_PATH`；**每次都全量重画**（改过标题的卡片要跟着变） |
| `new-post.sh` | ✅ 在用（2026-10-18）：`new posts/xxx` 建文件 + 用系统默认应用打开。配套的 `new()` 函数在 `~/.config/zsh/.zshrc`，不在仓库里 |
| `backup-blog.sh` / `cleanup-junk.sh` / `_frontmatter.py` | ✅ 工具 |

---

## 5. URL、重定向与缓存头

### URL 不变量（改任何东西之前先守住这几条）

- 文章 / 周刊：`/posts/YYYY/MM/DD/slug/`（126 条，由 `[permalinks]` 生成）
- 根级页：`/`、`/about/`、`/now/`、`/roll/`、`/privacy/`、`/archive/`、`/weekly/`、`/donate/`、`/run/`
- 订阅源浏览器视图：`/feed/`、`/feed/weekly/`（2026-10-15 新增，`noindex`，**不进导航**；
  线上由 `functions/_middleware.js` 把浏览器导航的 `/index.xml` 分派到这里，订阅器不受影响）
- 词条页：`/tags/<tag>/`（213）、`/categories/<cat>/`（8）
- `/posts/` 存在但 `noindex`，且全站没有页面链到它 —— 导航的 `Posts` 指的是 `/archive/`

**验收方式**：改完构建到 `/tmp`，`find . -name '*.html'` 排序后和迁移前基线 `comm` 对比（命令见第 7 节第 3 条）。基线 334 个、迁移后 332 个、2026-10-15 加上 `/feed/` 与 `/feed/weekly/` 又回到 334 个：多出来的是 `/donate/` `/run/` 与订阅源那两页，差的 9 个是刻意删除的。

### `_redirects`（Cloudflare，首条命中即生效）

| 规则 | 为什么 |
| --- | --- |
| 4 条带句点 / 大写的文章旧址 | 历史 URL 兜底 |
| `/page/1/` → `/`，`/page/*` → `/archive/` | 首页分页取消（2026-10-10） |
| `/weekly/page/1/`、`/weekly/page/*` → `/weekly/` | 周刊分页取消（2026-10-10 晚） |
| `/friends/` → `/roll/`、`/links/` → `/roll/` | 友链页并进收藏页（2026-10-11），两条都直接指终点，不串两跳 |
| `/categories/` `/tags/` → `/archive/` | 索引页用 `disableKinds` 关掉（精确匹配，不误伤词条页） |
| `/media/` → `/`，`/stats/` → `/archive/` | 两页随自建主题删除 |

⚠️ 加 splat 规则时，精确路径（`/x/1/`）必须写在 splat（`/x/*`）**前面**。
⚠️ `/running/` → `run.hulatu.com` 那条 **2026-10-12 已删**（子站入口只留在 `/about/`）—— `hulatu.com/running/` 现在 **404**，要恢复就把它加回 `static/_redirects`。

### `_headers`

- **HTML：`public, max-age=0, s-maxage=300, must-revalidate`**（2026-10-27 起）。
  `max-age=0` 管浏览器（每次条件请求，没变就 304 → 改完立刻能看到）；
  `s-maxage=300` 管 CDN（5 分钟内的重复访问由边缘直接给，不跨太平洋回源）。
  **故意不加 `stale-while-revalidate`** —— 2026-09-28 因此出现过「发了新文章首页还是旧的」。
  ⚠️ `s-maxage` 与 `stale-while-revalidate` **不是一回事**：前者过期后必须回源验证，
  后者允许 CDN 继续发旧页。别再混为一谈。
- `/images/*` 30 天、`/js/*` 一年 immutable（两个文件：giscus + code-copy，文件名带内容哈希）、favicon 7 天。
- **根级 5 个图标 / manifest 也是 7 天**（2026-10-28 补）：`/icon-192.png` `/icon-512.png`
  `/apple-touch-icon.png` `/favicon.ico` `/manifest.webmanifest`，逐个精确列出（没写通配）。
  ⚠️ 之前这 5 个**一条规则都没覆盖**，落到 Pages 平台默认 `max-age=0, must-revalidate`，
  每次导航都要条件请求一次（实测 `cf-cache-status: REVALIDATED`），三个 PNG 还带
  `warning: cf-images 299 "cache-control is too restrictive"`。
  ⚠️ **不能写 `immutable`**：这些文件名不带内容哈希，写了对老访客一年内换不掉图标。
- ⚠️ **`/css/*` 已删除**（产物里没有 `/css/` 目录了）。
- ⚠️ 新增根级内容页记得回来补一条缓存规则（2026-10-12 就为 `/run/` 补了一条）。
- ⚠️ `/rss.xsl` 那条 **2026-10-15 已删**（XSLT 方案整体撤掉）；新加的是 `/feed/` 与 `/feed/*` 两条 ——
  它们只对「直接访问 `/feed/`」和本地预览生效：线上主路径是浏览器打开 `/index.xml` 被
  `functions/_middleware.js` 改写的，**函数响应不吃 `_headers`**，那几条头写在函数代码里。
- ⚠️ **订阅源与索引保持 `max-age=0, must-revalidate`，没有 `s-maxage`**：`/index.xml`
  `/weekly/index.xml` `/index.json` `/sitemap.xml` 四条。`/index.json` 是 1 MB 的搜索索引，
  给它长缓存会让「发完新文章 5 分钟内搜不到」——与首页那个坑同源，不值得。

### ⚠️⚠️ HTML 边缘缓存：2026-10-27 从「Bypass」改成「300 秒」

**这一节是本次改动能否生效的关键。`_headers` 里那行 `s-maxage=300` 会被后台的
Cache Rule / Edge TTL 覆盖 —— 后台不改，仓库里写什么都不生效。**

**历史**：2026-10-18 / 10-25 两次出现「改了 CSS 或首页文案，源站已新、访客还是旧页」。
当时的处置是建一条 **`bypass_cache_for_html`** 规则（缓存资格 = **绕过缓存**），
让 HTML 完全不进边缘 —— 于是「发完立刻可见」，代价是**每次导航都回源**。
2026-10-27 实测这个代价是 TTFB **2.0–9.1 秒**（`cf-cache-status: DYNAMIC`、`cf-ray …-LAX`），
而页面本身只有 6 KB gzip、1 个请求 —— 等待全花在路上。用户当天选择接受
「新文章最多延迟 5 分钟可见」，换成边缘缓存。

**现在的目标状态（二选一，推荐 A）**：

| 方案 | 怎么做 | 说明 |
| --- | --- | --- |
| **A（推荐）** | Cloudflare → Caching → Cache Rules → **删掉 / 停用 `bypass_cache_for_html`** | 让源站的 `s-maxage=300` 生效。规则写在仓库里，可追溯、可 review |
| **B** | 保留规则，把「缓存资格」从「绕过缓存」改成「符合条件则缓存」，**边缘 TTL 填 300 秒** | 后台与仓库两处表达同一件事，容易漂移；只有 A 不方便时才用 |

**判据（改完必须复核）**：

```bash
bash scripts/check-cache.sh          # 退出码 0 才算过
curl -sI "https://hulatu.com/about/?cb=$RANDOM" | grep -iE "cf-cache-status|^age|cache-control"
#   cache-control: public, max-age=0, s-maxage=300, must-revalidate
#   cf-cache-status: HIT      ← 目标：命中边缘
#   age: 137                  ← 目标：< 300
```

- `DYNAMIC` = 还没进缓存 → 后台那条规则还在挡（或者刚 Purge 过，等第二次请求）
- `BYPASS` = 后台还是「绕过缓存」→ 方案 A 没做完
- `HIT` 且 `age` 是**几万秒** = 后台有别的规则在给它更长的 TTL → 回到上面那两次复发的排查

**为什么 300 秒这个值刻意不大**：它同时是「后台规则配错、首页又被锁成十几小时旧版」
那个老毛病的上限。想更激进可以调到 600，但**别超过 900**。

**顺序**：先改后台规则 → 点 **部署（Deploy）** → 再 **Purge** 一次 `/`。
旧副本不会因为新规则自动失效。
⚠️ 已有的那条 `img.hulatu.com` + `/cdn-cgi/image/` 规则**保持不动**：它是图片管线
（`/cdn-cgi/image/width=…`）能吃边缘缓存 1 年的前提，删了图片就退回直连原图。

**临时处置**：Caching → **Purge Cache → Custom Purge** → 填 `https://hulatu.com/`。

⚠️ 仓库里**没有** wrangler、没有 `CF_API_TOKEN`，`deploy.sh` / `publish.sh` 都**不 purge** ——
别指望「推上去就生效」。
⚠️ 本机到这个 POP 经常 timeout，**别把请求失败当成没上线**，用带随机查询串的方式才准。
⚠️ `functions/_middleware.js` 对这条**无能为力**：缓存命中时请求根本进不到函数层。

<details>
<summary>附：2026-10-18 / 10-25 那次排查的原始记录（Bypass 方案，现已作废，留作背景）</summary>

当时的规则配置与判据：

| 项 | 填什么 |
| --- | --- |
| 规则名称 | `bypass_cache_for_html` |
| 匹配条件 | `主机名` **等于** `hulatu.com` **And** `URI 路径` **等于** `/` **Or** `URI 路径` **结尾为** `/` |
| 缓存资格 | **绕过缓存**（Bypass cache）——**不要**去动下面的「边缘 TTL」 |

表达式预览应当正好长这样：

```
(http.host eq "hulatu.com" and (http.request.uri.path eq "/" or ends_with(http.request.uri.path, "/")))
```

**为什么用「结尾为 `/`」而不是 `text/html`**：Cache Rules 只能匹配**请求**，
匹配不到响应头，所以拿不到 Content-Type；而 Hugo 的产物是 `/posts/foo/index.html`，
浏览器请求的是 `/posts/foo/` —— 用路径结尾判据等价于「所有 HTML」。

**这条表达式的实测覆盖（2026-10-25 按 `public/` 全量核对）**：
命中 **358 / 359** 个 HTML，**非 HTML 误伤 0 个**；唯一漏掉的是 `/404.html`
（它没有结尾斜杠，本来就该让边缘缓存，**别去补**）。

⚠️ 规则生效后首页的 `cf-cache-status` 会从 `HIT` 变成 **`BYPASS`**，这在当时是目标状态；
**2026-10-27 起反过来 —— `BYPASS` 变成了「没改完」的信号。**

</details>

---

## 6. 坑

### Hugo / 构建

1. **`disableKinds` 必须写在任何 `[table]` 之前**，否则被并进那张表，只吐一句 `WARN Unknown kind "disablekinds"` 然后**静默失效**（关 `/tags/` 索引页就靠它；词条页 kind `term` 仍生成）。
2. **`hugo --config /tmp/x.toml` 会破坏主题解析**（`themesDir` 相对站点根），症状是**静默产出一个没有主题的站**。别这么干。
3. **`minify` 会剥属性引号**（`href=/about/`）、**去前导零**（`0.32s` → `.32s`）、**不压 `rgba()` 里的空格** → 按压缩后写法 grep 会**假阴性**。先 `findall` 打出真实写法再判。
4. **Go 模板注释里绝不能出现 C 风格注释收尾符**（星号紧跟斜杠）：`{{/* … */}}` 被提前收掉，后面跟右花括号时**不报错**，注释后半段当文字输出 → 落在 `<style>` 里就吞掉紧随其后的那条 CSS 规则（实例：吞掉 `.recent-posts{padding-left:0}` → 首页缩进 39px，已复发 2 次）。**哨兵：`<style>` 块里不该出现任何中文**（第 7 节第 4 条）。
5. **`hugo --quiet` 会把构建失败藏起来**，而失败时 `--cleanDestinationDir` 不执行 → 读到上一次产物（症状「改了没生效」，被骗过两次）。改完必须看输出里有没有 `ERROR`。

### 模板 / 布局查找

6. **`/archive/` 是普通内容页，不是 section**，要用 `layout: "archive"` 指到 `layouts/_default/archive.html`。⚠️ 别删 `content/archive.md` 里那一行（删了就回落到 `single.html`，变成「只有正文」的空壳）；也别改成 `content/archive/_index.md`（section 的 `.Pages` 是它自己的子页，空数组，列表渲染成「这里还没有内容」）。
7. **普通内容页的模板查找顺序是 `layouts/<type>/<layout>.html` → `layouts/_default/<layout>.html`**，根级 md 的 `type` 是 `page`。文件名本身不参与查找，必须靠 front matter 的 `layout` 指。
8. **`with` 重绑定 `.`** → 里面的 `.Site` 废掉、静默 0 迭代（产物空块、0 警告）。写法：先 `{{- $x := .Site.Taxonomies.tags }}`，再 `{{ if $x }}{{ range $k, $v := $x }}`。

### 内容 / 渲染

9. **Goldmark 默认丢裸 `<iframe>`**（文章里有腾讯视频嵌入）→ `unsafe = true` 已开。
10. **`{#pinyin}` 锚点是 Goldmark 原生语法**，不依赖自定义 heading 钩子 —— 删掉 `_markup/render-heading.html` 之后它照常工作。
11. **`{{ .Summary }}` 在 `<meta content>` 里带 `<h1>` 是假阳性**，`--minify` 会重选引号并反转义。判据是用真 HTML 解析器读两种产物比对解析后的值。

### 工具链（本项目用法，跨项目通用）

12. **BSD grep 不支持 `\|` 交替** —— `grep "a\|b"` 会**静默返回空、不报错**，据此得出「没有 X」的结论会错（本站被坑过两次）。用 `grep -E` 或 Grep 工具。
13. **`&&` 串的校验会静默跳过后面** —— 前面一个 `grep -c` 返回 0（退出码 1）就断链了。独立检查用 `;`。
14. **标签配平必须用 `html.parser.HTMLParser`**，别手写正则 —— 正则会把压缩产物里 `<a href=/about/>` 末尾那个 `/` 当成自闭合斜杠，于是每个 `<a>` 都不进栈，报出一堆 `stray </a>` 的假崩。
15. **数「N 处」必须从工具输出回读**（`len(re.findall(...))`），别凭印象。**报 ✗ 时先怀疑正则**：`re.search` 只取第一个同名选择器；`@media[^{]*\{(.*?)\n\}` 会停在第一个 `\n}`；压缩产物上 `@media print \{.*?\n\}` 一次都不匹配。验收脚本一律 `findall`。
16. **源码注释会引用旧值**，查「旧值还在不在」先 strip 注释（`re.sub(r'/\*.*?\*/', '', s, flags=re.S)`）。

---

## 7. 验收清单

改完之后至少跑这几条（全部实测过，命令可直接复制）。先跑第 1 条，**看输出里有没有 `ERROR`**（别用 `--quiet`）。

```bash
# 1) 干净构建（应 0 警告；有 ERROR 时 --cleanDestinationDir 不执行，读到的是旧产物）
hugo --gc --minify --cleanDestinationDir --destination /tmp/hb-check
```

```bash
# 2) 标签配平 + 缺 h1 + data-page-node-id 注入 + 图片宽高 / %!d 哨兵
#    用 html.parser.HTMLParser，不要用正则
python3 - <<'PY'
import glob, re
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class B(HTMLParser):
    def __init__(s): super().__init__(); s.st=[]; s.bad=[]
    def handle_starttag(s,t,a):
        if t not in VOID: s.st.append(t)
    def handle_endtag(s,t):
        if t in VOID: return
        if s.st and s.st[-1]==t: s.st.pop()
        else: s.bad.append(t)
bad=h1=inj=fig=img=dim=lazy=badd=0
for f in glob.glob('/tmp/hb-check/**/*.html',recursive=True):
    x=open(f,encoding='utf-8',errors='replace').read()
    p=B(); p.feed(x)
    if p.bad or p.st: bad+=1
    if '<h1' not in x: h1+=1
    if 'data-page-node-id' in x: inj+=1
    fig += x.count('<figure')
    for m in re.finditer(r'<img\b[^>]*>', x):
        t=m.group(0); img+=1
        if 'width=' in t and 'height=' in t: dim+=1
        if 'loading=lazy' in t.replace('"',''): lazy+=1
    if '%!d' in x: badd+=1   # Go 模板 %d 喂 float64：构建 0 警告的静默残缺
print(f"不配平={bad} 缺h1={h1} 注入={inj} (都应 0)")
print(f"figure={fig} img={img} 带宽高={dim} (=img) lazy={lazy} %!d页={badd} (应 0)")
PY
# ⚠️ 21 段 img{height:auto} 不在时，旧产物 21 张图会塌成 720x2px
# 期望值（2026-10-14 实测）：figure=323 img=323（**1:1**，overlay 已不重复 <img>）
#   带宽高=323 lazy=321（少的 2 个是 /donate/ 直接写在 Markdown 里的两张赞赏码，
#   不经 render-image.html，所以没有 lazy）
# ⚠️ 改前是 figure=323 img=644 —— img 应**恰好等于** figure，大于它就是
#   overlay 又渲染了第二个 <img>（2026-10-14 已删，见 DESIGN.md 第 5 节专条）
```

```bash
# 3) URL 未变（和迁移前基线对比）
cd /tmp/hb-check && find . -name '*.html' | sed 's#^\./##' | sort > /tmp/urls-now.txt
comm -23 /tmp/urls-before.txt /tmp/urls-now.txt   # 只应剩 8 个刻意删除的地址
```

```bash
# 4) 内联 CSS 体积（Python gzip 口径）+ 样式块中文哨兵（应 0 页）
python3 -c "
import re,glob,gzip
t=g=0; bad=[]
for f in glob.glob('/tmp/hb-check/**/*.html',recursive=True):
    s=open(f,encoding='utf-8',errors='replace').read()
    for b in re.findall(r'<style[^>]*>(.*?)</style>',s,re.S):
        t+=len(b.encode()); g+=len(gzip.compress(b.encode(),9))
        if re.search(r'[\u4e00-\u9fff]',b): bad.append(f)
print(f'{t/1024:.0f} KB / gzip {g/1024:.0f} KB   中文泄漏={len(bad)}')"
# 期望：总量与第 0 节分档表吻合；中文泄漏 0
# （模板注释提前收尾会泄漏中文并吞掉紧随的 CSS 规则，见第 6 节第 4 条）
```

```bash
# 5) 行内链接 / 系列 / 上下篇 / roll / 代码块配色哨兵
python3 - <<'PY'
import re, glob
r=[open(f,encoding='utf-8',errors='replace').read() for f in glob.glob('/tmp/hb-check/**/*.html',recursive=True)]
print('a) </a>+换行+中文标点 (0):',sum(len(re.findall(r'</a>\n[，。：；！？、）」』》〈【（]',s)) for s in r))
print('b) 系列坐标带页 (21):',sum(1 for s in r if re.search(r'<nav class=["\']?post-series',s)))
print('c) 上下篇页 (126):',sum(1 for s in r if re.search(r'<nav class=["\']?post-nav',s)))
a=open('/tmp/hb-check/archive/index.html',encoding='utf-8').read()
print('d) 归档页系列横向行 (3):',len(re.findall(r'<div class=series-row>',a)),
      '| <details class=series-row> 残留 (0):',len(re.findall(r'<details class=series-row',a)))
ro=open('/tmp/hb-check/roll/index.html',encoding='utf-8').read()
main=re.search(r'<main>(.*?)</main>',ro,re.S).group(1)
print('e) /roll/ h1 (0):',len(re.findall(r'<h1',main)),
      '| ul/li (2/14):',len(re.findall(r'<ul',main)),len(re.findall(r'<li',main)),
      '| 裸 hr (1):',re.findall(r'<hr[^>]*>',main))
print('f) 代码块配色页 (5):',sum(1 for s in r if '--code-keyword' in s),
      '| monokai 残留 (0):',sum(1 for s in r if '#f8f8f2' in s or '#272822' in s))
for n in ['roll','about','now','privacy','donate']:
    x=open('/tmp/hb-check/'+n+'/index.html',encoding='utf-8').read()
    body=re.search(r'<main>(.*?)</main>',x,re.S).group(1)
    print('   /'+n+'/ ->',re.findall(r"<h1[^>]*>(.*?)</h1>",body,re.S))
PY
# g) 期望：roll/about/now 为空（无页面标题）；privacy/donate 各有一个
# f) 是「代码块看不见」的哨兵：noClasses 被改回 true 时
#    #f8f8f2 / #272822 这两个 monokai 内联色会重新出现
```

```bash
# 6) 面包屑：可见段数 与 JSON-LD 段数必须自洽（JSON-LD = 可见段 + 当前文章）
#    ⚠️⚠️ 2026-10-14 起文章页有**两个** ld+json 块：seo_tags.html 的 BlogPosting 在前、
#    breadcrumbs.html 的 BreadcrumbList 在后。所以**必须按 @type 挑** BreadcrumbList 那一个，
#    不能用 re.search 拿「第一个」—— 拿到 BlogPosting 会全判不合格（构建 0 警告，静默）。
python3 - <<'PY'
import json, glob, re
from collections import Counter
n_ok=n_bad=0; shapes=Counter()
for f in glob.glob('/tmp/hb-check/posts/**/index.html',recursive=True):
    x=open(f,encoding='utf-8',errors='replace').read()
    nav=re.search(r'<nav class=breadcrumbs.*?</nav>',x,re.S)
    if not nav: continue
    seg=len(re.findall(r'<li>',nav.group(0))); shapes[seg]+=1
    blocks=[json.loads(b) for b in re.findall(r'<script type=application/ld\+json>(.*?)</script>',x,re.S)]
    ld=next((b for b in blocks if b.get('@type')=='BreadcrumbList'),None)
    ok=(ld is not None and len(ld['itemListElement'])==seg+1
        and [i['position'] for i in ld['itemListElement']]==list(range(1,seg+2))
        and ld['itemListElement'][0]['name']=='首页')
    n_ok+=ok; n_bad+=(not ok)
print('面包屑页面 (126):',n_ok+n_bad,'| JSON-LD 合格/不合格 (126/0):',n_ok,'/',n_bad)
print('可见段数分布 (应 {3:101, 2:25}；3 段=文章带分类，2 段=周刊):',dict(shapes))
PY
```

```bash
# 6b) ★ SEO 头哨兵（2026-10-14 新增；对应 DESIGN.md 第 9 节）
python3 - <<'PY'
import glob, re
from collections import Counter
kw=it=pd=ld=tc=og=ref=0; shapes=Counter()
for f in glob.glob('/tmp/hb-check/**/*.html',recursive=True):
    x=open(f,encoding='utf-8',errors='replace').read()
    kw += 'name=keywords' in x or 'name="keywords"' in x
    it += 'itemprop' in x
    pd += ' pubdate' in x or 'pubdate=' in x
    ld += 'application/ld+json' in x
    tc += 'theme-color' in x
    og += 'og:image:width' in x
    ref+= 'no-referrer-when-downgrade' in x
    for b in re.findall(r'<script type=application/ld\+json>(.*?)</script>',x,re.S):
        import json
        try:
            d=json.loads(b); shapes[d.get('@type','?')]+=1
        except Exception: shapes['PARSE-FAIL']+=1
print('keywords 页 (应 0):',kw,'| itemprop 页 (应 0):',it,'| pubdate 页 (应 0):',pd)
print('ld+json 覆盖 (应 334):',ld,'| theme-color (应 334):',tc,'| og:image:width (应 334):',og)
print('旧 referrer 值残留 (应 0):',ref)
print('JSON-LD 类型分布:',dict(shapes))
# 期望（2026-10-15 实测）：WebSite 1、WebPage 9（7 个根级独立页 + /feed/weekly/ + 404）、
#   CollectionPage 224（213 标签 + 8 分类 + /posts/ + /weekly/ + /feed/）、BlogPosting 135、
#   BreadcrumbList 126（文章页每页 2 块，所以块总数 460 > 页数 334，正常）
#   **零 PARSE-FAIL**（JSON-LD 语法错会让整块失效且构建 0 警告）
PY
```

```bash
# 7) ★「首行贴导航栏」的哨兵：/roll/ /about/ /now/ 三页的正文首行到导航文字下沿
#    应都在 ~28 CSS px（与 yinji 一致；12.5px 就是 content > :first-child 被加回来了）
#    ⚠️ 三页必须在**同一批截图**里量：--window-size 高度不同会得出不同数字
#    （实测过 46px vs 57px 的假差异）；量法：2x 截图后逐行取最暗像素找文本带，换算回 CSS px

# 8) ★ 订阅源：只收文章页 + **顶部没有 XSL 样式表** + 浏览器视图与 feed 逐条对齐
python3 - <<'PY'
import re, html, pathlib
def xml_items(f):
    s = pathlib.Path(f).read_text()
    return ([html.unescape(t) for t in re.findall(r'<item>\s*<title>(.*?)</title>', s, re.S)],
            re.findall(r'<item>.*?<link>(.*?)</link>', s, re.S),
            s)
def html_items(f):
    s = pathlib.Path(f).read_text()
    # ⚠️ minify 会剥属性引号 → 引号写成可选，否则恒报 0 条（假阴性）
    pairs = re.findall(r'<p class=feed-view-title><a href="?([^">]+)"?>(.*?)</a></p>', s, re.S)
    return ([html.unescape(re.sub(r'<[^>]+>', '', t)) for _, t in pairs], [l for l, _ in pairs])

for xf, hf in [('/tmp/hb-check/index.xml', '/tmp/hb-check/feed/index.html'),
               ('/tmp/hb-check/weekly/index.xml', '/tmp/hb-check/feed/weekly/index.html')]:
    xt, xl, s = xml_items(xf)
    ht, hl = html_items(hf)
    items = s.split('<lastBuildDate>')[-1]        # 跳过 channel 自己的 <link>
    links = re.findall(r'<link>([^<]+)</link>', items)
    print(xf,
          '| 条目', len(links),
          '| 非文章', sum(1 for l in links if '/posts/' not in l),
          '| 样式表(应 False)', bool(re.search(r'<\?xml-stylesheet[^>]*\?>', s)),
          '| content:encoded', len(re.findall(r'<content:encoded>', items)),
          '| atom:updated', len(re.findall(r'<atom:updated>', items)),
          '| category', len(re.findall(r'<category>', items)),
          '| 视图条目', len(ht),
          '| 与 feed 标题一致', xt == ht,
          '| 与 feed 链接一致', [u.replace('https://hulatu.com', '') for u in xl] == hl)
PY
# 期望：两个文件都是 条目 20 / 非文章 0 / 样式表 False /
#       content:encoded 20 / atom:updated 20 / category > 0 /
#       视图条目 20 / 标题一致 True / 链接一致 True
# ⚠️ 最后三项是「网页视图与订阅口径一致」的哨兵：不一致时构建 0 警告、页面照常生成
# ⚠️ 视图那两页还要 `noindex`：grep -c 'name=robots' 应为 1（minify 会剥引号，别按
#    `name="robots"` 写）

# 9) ★ 归档页底部标签平铺 + 样式作用域哨兵
python3 - <<'PY'
import re, glob
st=lambda s:''.join(re.findall(r'<style[^>]*>(.*?)</style>',s,re.S))
r=[(f,open(f,encoding='utf-8',errors='replace').read()) for f in glob.glob('/tmp/hb-check/**/*.html',recursive=True)]
a=open('/tmp/hb-check/archive/index.html',encoding='utf-8').read()
blk=re.search(r'<small class=tag-index><div>(.*?)</div></small>',a,re.S)
tags=re.findall(r'>#([^<]+)</a>',blk.group(1)) if blk else []
kind=lambda x:'数字' if re.match(r'^[0-9]',x) else ('英文' if all(ord(c)<128 for c in x) else '中文')
seq=[kind(t) for t in tags]
print('a) 归档标签个数 (应 = 标签词条页数 213):',len(tags))
print('   三类顺序 (应 数字*→英文*→中文*，同类连续):',[k for i,k in enumerate(seq) if i==0 or seq[i-1]!=k])
print('b) 有 tag-index 块却缺 .tag-index 规则的页 (0):',
      sum(1 for f,s in r if 'class=tag-index' in s and '.tag-index' not in st(s)))
print('c) 含 header nav 规则的页 (应 = HTML 总数 369):',
      sum(1 for f,s in r if re.search(r'header\s+nav\s*\{',st(s))))
print('d) ★ 残留「裸 nav」选择器的页 (0):',
      sum(1 for f,s in r if re.search(r'(?<![\w.#\-\s])nav\s*\{',st(s))))
print('e) post-series-ord 带 min-width 的页 (应 136 = 135 长文 + /archive/):',
      sum(1 for f,s in r if re.search(r'\.post-series-ord\s*\{[^}]*min-width',st(s))))
PY
# 期望：a) 213，三类顺序 ['英文','中文']（本站没有数字标签），b) 0，c) 369，d) 0，e) 136
# ⚠️ 写断言时当心：`'header nav{' in css.replace(' ','')` 是错的
#    （把 needle 里的空格也去掉了）→ 永远 False；`(?<![\w.#-])nav\s*\{` 漏了空格，
#    会把 `header nav{` 也当成裸 nav → 永远报 334。**这两条我自己都踩过。**
```

> ⚠️ 原第 10 条「子站页头 / 导航 / 视觉残留」整段断言 **2026-10-12 删除** ——
> 它遍历 `sites/*/public/**/*.html`，而四个子站已全部下线。要恢复子站时连同那段断言
> 一起从 git 历史取回（`git log --all -- MAINTENANCE.md`）。

改完模板还要手工扫一眼这几处（回归面）：

- 首页：`h2#hi` → 引用 → 段落 → **含「支持」链接的段落** → 四个平台链接行 → 虚线 `<hr>` → `<h3>Recent Posts:</h3>` → 5 条
  ⚠️ 简介正文外面不该有 `<content>`（照 yinji 去掉的，行高走 body 的 1.5 —— 2026-10-14 正文行高改成 1.8 后这一层更要紧，留着简介会比正文还松）；列表左边界要和 `Recent Posts:` 标题对齐（实测都 x≈140），缩进 40px 就是 `.recent-posts{padding-left:0}` 被吞了 → 去跑第 4 条哨兵
- `/archive/`：搜索框 + 「共 **135** 篇。」+ **「系列」三条横向行**（居家流水账 4 / 综述写作 5 / 跑步 14）+ 年份分组 + 底部 **213 个标签**平铺；⚠️ 这块**不该有任何分割线 / 折叠三角**
- 导航 7 项；⚠️ 项多窄屏必折行，靠第 00 段 `header nav{flex-wrap:wrap;column-gap:8px}` 保证只在项与项之间折（没这段时 392px 把 `RSS` 拆成 `RS`/`S`）
- 页脚四行，顺序：Made with → Copyright → **订阅行（RSS / Say hello / 🚇 开往）** → 英文授权行（+ Privacy + Sitemap）
  ⚠️ **一个 `·` 都没有**（3 个全换成 `.`）：读作 `Say hello. 🚇 开往` 与 `…CC BY-NC-SA 4.0. Privacy. 🗺️ Sitemap.`；出现任何一个都是回退
  哨兵：`<footer>` 里 `<br>` 恰好 **3 个**、`go.html` 恰好 **1 次**、`·` **0 次**，且「Say hello」与「开往」在**同一个 `<br>` 分段**里
- 文章页：`<h1>`、日期行、标签行、**文末系列坐标带（仅 21 篇连载）+ 上一篇/下一篇（126 篇都有）**、TOC、评论区
  ⚠️ **「上一篇」= 更早、「下一篇」= 更晚**；两段相邻时只画一条发丝线；最新一篇没有「下一篇」、最早一篇没有「上一篇」（留不可见空槽，正常）
  ⚠️ 含代码的文章代码块必须「浅灰底 + 深字」（浅色）—— 大片文字发白就是 `noClasses` 被改回 `true`，跑第 5 条 f) 哨兵
- 文章页顶部面包屑：`首页 / 文章 / 分类`（周刊是 `首页 / 周刊`，**两段** —— 周刊的 `categories` 就是 `["周刊"]`，加了会变「首页 / 周刊 / 周刊」）；⚠️ 面包屑**不该**出现在 `/about/` `/now/` `/roll/` 或词条页上
- `/roll/`：**没有页面标题**（只在 `<title>` 与导航高亮），两个 `<ul>`：3 条朋友 + 11 条聚合站，中间一条全宽虚线 `<hr>`；结尾「…更新中」，无日期行 / 评论区 / TOC；正文首行到导航文字下沿约 **28 CSS px**（~12.5px 就是 `content > :first-child` 被加回来了）
- `/about/`：介绍块纯 Markdown，**没有头像**（全站一张头像都没有），**没有页面标题**，首行间距同 28px
- `/now/`：**没有页面标题**，无日期行 / 评论区 / TOC；⚠️ `/privacy/` 与 `/donate/` **仍保留页面标题**（用户只点名了 About 和 Now，别顺手统一）
- `/donate/`：两个收款码并排居中（窄屏一列），**没有**日期行 / TOC / 评论区（**有标题**）
- `/privacy/` `/posts/` `/donate/` `/404.html` 与全部词条页：`<meta name=robots content="noindex, follow">`（合计 **219 页**）。⚠️ 2026-10-15 起还要加上 `/feed/` 与 `/feed/weekly/` → **221 页**（那两页的 `noindex` 写在 `content/feed/*.md` 的 front matter 里，别删）
- `/run/`：`<h1>跑步</h1>` + 导语 + 4 个 `.stats` 格子 + 月度柱状图 + 按年 `<details>` 记录表 + 更新时间行；**没有**面包屑 / TOC / 评论区（走 `layouts/_default/run.html`，不经过 single.html）；数据每天由 CI 的 `sync-garmin.py` 刷新

---

## 8. 待办 / 已知缺口

1. **`scripts/sync-lastmod.py` 半废** → `lastmod` 只喂 RSS / sitemap，页面无可见产出。
2. **列表页没有页面级 `<h1>`**（有意接受上游行为；2026-10-18 起站名不再是 h1，所以**所有非文章页**都是 0 个 h1，见 DESIGN.md 第 11 节）。~~深色下正文图片描边几乎不可见~~ → 2026-10-17 复算判定不成立（ΔL\* 深色 16.85 > 浅色 13.66）。
3. ~~**sitemap 没排除 noindex 页**~~ → ✅ 2026-10-17 已解决，`layouts/sitemap.xml` 336 → 134 条（见第 3 节规矩 3）。
4. **Cloudflare 后台收尾**（仓库侧无法代劳）：`run.` / `profile.` / `shot.` / `share.` 四个子域名的 CNAME 已删，但 **Pages 项目本身**若还留在后台建议一并删掉 —— 它们指向的 `sites/` 目录已不存在，构建只会失败。
5. **⚠️ 确认 Pages 项目的 Functions 目录**（2026-10-15 新增的依赖，仓库侧同样无法代劳）：必须是默认的
   `functions`（仓库根）。被改过或 Functions 被关掉的话，浏览器打开 `/index.xml` 会退回 raw XML，
   而**构建与部署都不报错** —— 核对命令见第 2 节「边缘函数」那三条 `curl`。
6. **`~/bearneo-trial`** 可以留着做对照，也可以删（删除它不影响本站）。
7. **2026-10-14「加载 / 过时写法」审计的落地点已全部实施**（详见 DESIGN.md 第 9 节）：
   P0 删 `<meta name=keywords>`；P1 修 `input{font-size:14px}`（iOS 聚焦放大整页）与删死掉的微数据
   `itemprop`；P2 删 `pubdate` / `<meta name=title>`、`referrer` 换 `strict-origin-when-cross-origin`、
   补 `og:image:width/height`、`100vw`→`100%`、加两条 `theme-color` 与 `color-scheme`、
   GoatCounter 协议相对 URL 换绝对、`forEach.call` 换原生 `forEach`。
   **顺带做了两件没在清单里的**：`layouts/partials/seo_tags.html` 整份覆盖上游（换按页型分四类的
   JSON-LD，334 页全有 `ld+json`）、图片放大从「overlay 重复一个 `<img>`」换成「只画背景」
   （全站 `<img>` 节点 **644 → 323**，零回流）。
   ⚠️ **两个刻意不做的**（判断依据见 DESIGN.md 第 9.5 节）：① 删主题死 CSS —— 要么改 `themes/`
   违反硬规矩，要么复制等价选择器再否定，净负收益；② 替换非标准 `<content>` —— 全站 +约 600 B
   还留下 500 B 删不掉的死码，净负收益。
   ⚠️ **per-slug 的 og:image 仍然没做**（DESIGN.md 第 8 节第 1 条），现在改 `seo_tags.html`
   只需加一段，不用再加文件，但图片得先从 git 历史取回 `gen-og.js` 重跑。

> 2026-10-11 / 12 清理掉的孤儿资源与失效脚本清单见第 1 节末尾；**它们都在 git 历史里，要恢复就 `git log --diff-filter=D` 取回**，别照着旧待办去找已经不存在的文件。

---

## 9. 和 `~/bearneo-trial` 的关系

`~/bearneo-trial` 是同一套主题的试运行站（上游逐字节未改 + 站点层覆盖），本站的站点层覆盖从它搬过来。两边关系：

- **同源**：`index.html` / `baseof.html` / `single.html` / `list.html` / `rss.xml` / `nav.html` / `footer.html` / `custom_head.html` / `giscus.html` / `giscus.js`；内容页 `_index.md` / `about.md` / `privacy.md` / `now.md`。
- **本站多出来的**（试运行站没有）：`archive.html`（没有 `/archive/`）、`_markup/render-link.html`、系列与上下篇两段、`breadcrumbs.html`、`render-image.html`、`run.html`、`seo_tags.html`（2026-10-14）。
- **本站改过的**：`"blog"` → `"posts"`（4 处）；第 06 段删掉（TOC 保持上游「默认隐形」）；末尾补回 GoatCounter。
- **别反向同步**：试运行站没有第 11 / 12 / 13 段（`/roll/` 分隔线走裸 `<hr>`、代码块配色、面包屑样式）—— 它仍是 monokai 内联色，即「代码块看不见」那个状态；链接页形态也不同（本站 `/roll/` 一页平铺 14 项，试运行站没有这一页）。⚠️ **第 26 段与 `seo_tags.html` 同理** —— 上游原始写法，同步过去等于把「过时」那份搬回去。
- 试运行站的 `content/blog/` 对应本站的 `content/posts/`。

⚠️ 改完共享内容记得两边同步；只属于本站的改动**不要**反向同步过去。

# 维护手册 —— hulatu.com

> ⚠️ 2026-10-10 晚**整份重写**：本站从自建主题迁移到了上游 hugo-bearneo。
> 旧版这份手册描述的那套东西（6 个 CSS 模块、6 个 JS、按页型分档内联、
> 纸账 + 印章设计系统、`_redirects` 之外的 50 个模板）**已经不存在了**。
> 设计相关的内容在 [DESIGN.md](DESIGN.md)，两边同一次改动里同步。

---

## 0. 现状速览（2026-10-11，实测）

| 项 | 值 |
| --- | --- |
| Hugo | `0.167.0+extended`（本机 / GitHub Actions / Cloudflare 三边一致） |
| 主题 | `themes/hugo-bearneo/`，27 个文件，**上游逐字节未改**（`diff -r` 验过） |
| 代码高亮 | `hugo.toml` 的 `[markup.highlight] noClasses = false`（**必须是 false**）+ 站点层第 12 段配色 |
| 站点层 | **19 个文件**（见第 1 节）—— 全站所有自定义都在这里 |
| 页面 | 331 页 → **327 个 HTML** |
| 内容 | 101 篇文章 + 24 期周刊 = **125 个内容页**（+ 6 个根级独立页） |
| 订阅源 | **两个 `.xml`**：`/index.xml`（全站文章 20 条）+ `/weekly/index.xml`（周刊 20 条）。**都只收文章页** —— `/about/` `/now/` `/roll/` `/privacy/` `/donate/` `/archive/` 一条都没有。浏览器直开走 `static/rss.xsl` 渲染 |
| 词条页 | 标签 **184** 个 + 分类 **8** 个（索引页 `/tags/` `/categories/` 已关） |
| CSS | **全部内联**，普通页每页 8142 字节（gzip 2458）；长文页 11929 / 3227；含代码块的 5 页 14114 / 3706。没有 `/css/` 目录 |
| JS | **两个文件**：`/js/giscus.min.<hash>.js`（指纹化，长缓存）—— 分别只在评论区页 / 含代码块的 5 页加载 |
| 无警告 | 干净构建 **0 警告** |
| URL | 与迁移前**逐条一致**（125 个 `/posts/…` 全部保留），只有 8 个刻意删除的地址加了 301 |

内联 CSS 的构成（2026-10-11 第四批实测，Python `gzip.compress(d,9)` 口径；
下面「补丁」= 该档全页 `<style>` 合计 **减去**主题固定的 6424 B）：

| 档 | 页数 | 内联 CSS raw / gzip | 补丁 |
| --- | --- | --- | --- |
| 普通页（首页 / 独立页 / 词条页） | 199 | 8247 / 2495 | 1823 B（+00 +14 +17 段） |
| **文章页（125 篇）** | **120** | **12111 / 3274** | 5687 B（再 +09 +10 +13 +16 +19 五段） |
| **文章页 + 代码块** | **5** | **14296 / 3760** | 7872 B（再 +12 +18 两段） |
| `/archive/`（归档列表页） | 1 | 9976 / 2845 | 3552 B |
| `/donate/` | 1 | 8673 / 2589 | 2249 B（+08 段） |
| **`/404.html`** | 1 | **9661 / 2773** | 3237 B（+15 段） |
`/about/` 与普通页**完全一致** —— 关于页头像撤掉后，03 段不再输出任何 CSS。
⚠️ 第四批把第 00 段的选择器从裸 `nav` 改成 `header nav`（+14 B/页），
并把 `.tag-index` 加进 09 段（只影响 `/archive/` 一页）。
详见 DESIGN.md 第 5 节。

---

## 1. 文件地图

```
hugo.toml                 站点配置（导航、参数、permalinks、输出格式、版本约束）
deploy.sh                 生产构建 → public/（干净构建 + livereload 自检 + rsync --delete）
publish.sh                提交 + 推送（up 一键流程的第一段）
DESIGN.md / MAINTENANCE.md / README.md

content/
  _index.md               首页正文（Hi! + 引用 + 简介 + 支持链接 + 五个平台链接行）
  about.md now.md roll.md privacy.md archive.md donate.md            六个根级独立页
                          （roll.md 是**唯一的链接页**：14 条一条平铺，前 3 条是朋友、
                            后 11 条是聚合站；页面上没有小标题、也没有页面标题）
                          （donate.md 是 2026-10-11 从旧自建主题搬回的支持页）
                          ⚠️ links.md 2026-10-11 已删（友链并进 roll.md），别再加回来
  posts/                  101 篇文章 + _index.md（noindex，纯内部页）
  weekly/                 24 期周刊 + _index.md（单独开 RSS 输出）

archetypes/
  posts.md weekly.md      新建文章的模板（含发布前检查清单）

layouts/                  ★ 站点层覆盖，19 个文件
  index.html                        首页（上游只有 {{ .Content }}；简介**不包 <content>**）
  _default/baseof.html              LanguageCode → Language.Locale + 补回 robots 分支
  _default/single.html              去掉 `if eq .Type "blog"` 门槛 + hideDate/hideTitle
                                    + 文末「系列坐标带」与「上一篇/下一篇」+ 评论区
  _default/list.html                5 处文案英译中 + 删底部标签墙
  _default/rss.xml                  ★ 改三处：补回 <?xml-stylesheet?> 指向 /rss.xsl
                                    + 首页 feed 只收文章页（Type ∈ posts/weekly）
                                    + atom:updated / category / 摘要 description / 全文 content:encoded
                                    + pageLimit 上限（20）
  _default/archive.html             ★ 新增：/archive/ 列表页 + 顶部「系列」横向入口
                                    + 底部全部标签平铺（照 yinji，2026-10-11 补回）
  _default/_markup/render-link.html ★ 新增：只为去掉 `</a>` 后面那个换行
  partials/nav.html                 完全由 [[menu.main]] 驱动（8 项）
  partials/footer.html              版权独立成行 + 订阅行挪到第 3 行 + copyrightNote/licenseName/licenseURL
  partials/custom_head.html         19 段补丁样式 + GoatCounter（03/06/11 留空）
  partials/orphan-safe.html         孤行保护（标题末 2 字包 nowrap）
  partials/back-top.html            返回顶部（只长文页，纯 CSS、零 JS）
  partials/code-copy.html           代码块复制按钮的脚本引入（只含代码的页）
  404.html                          ★ 新增：404 页（上游只有两行字）
  _default/_markup/render-heading.html  ★ 新增：标题锚点 #（**只给文章页**）
  partials/breadcrumbs.html         ★ 新增：面包屑（+ BreadcrumbList JSON-LD），只给文章页
                                    （08 段按页输出；03/06 段留空；09+10 一起包守卫）
  partials/giscus.html              评论区（2026-10-11 起无外框，只剩「评论」+ 一个实心三角）

assets/js/giscus.js       评论区脚本（只在挂评论的页加载）
assets/js/code-copy.js    代码块复制按钮（只在含代码块的 5 页加载）

themes/hugo-bearneo/      ★ 上游逐字节副本，27 个文件，**不要改**

static/
  _headers _redirects     Cloudflare 的响应头 / 301 规则
  favicon.svg logo.svg apple-touch-icon.png icon-192.png icon-512.png site.webmanifest rss.xsl
                          ↑ rss.xsl 不是孤儿：layouts/_default/rss.xml 顶部那行
                            <?xml-stylesheet?> 指的就是它（浏览器直开 feed 时的渲染样式表）
  images/                 **只剩两个在用**：share.webp（全站唯一的 og:image，由 params.images 引用）
                          + donate/（2 张收款码，/donate/ 在用）

data/                     **只剩 runs.json**（run 子站挂载在读，见下）
scripts/                  10 个脚本，见第 4 节
sites/                    run / shot / share / profile 四个子站（各自独立 Hugo 站点）
.github/workflows/        build.yml（构建校验）/ sync-garmin.yml（每日同步跑步数据）

> ⚠️ **2026-10-11 清掉的一批「迁移孤儿」**（都是自建主题时代留下的，删前逐个核对过零引用）：
> `static/images/og/`（125 张按 slug 分的分享图）、`static/images/media/`（71 张书影音封面）、
> `static/images/avatar.webp`、`static/images/uploads/`（空目录）、
> `data/media.json`、`data/image_dims.json`，
> 以及 4 个失效脚本 `sync-douban.py` / `gen-og.js` / `css-critical-coverage.py` / `fetch-image-dims.py`。
> 加上仓库根目录那批工作产物（6 张截图 + `feature-review.html` + `bearneo-migration-assets/`），
> 一共约 **8.2 MB**。
> ⚠️ **`data/runs.json` 没动** —— `sites/run/hugo.toml` 用 `[[module.mounts]]` 把上层 `data/`
> 挂进了子站，删了跑步子站就没数据了。
> ⚠️ **`static/images/share.webp` 也没动** —— 它现在是全站唯一的 `og:image`。
> 想恢复「每篇文章一张分享图」得把 `gen-og.js` 从 git 历史里取回并重跑。
admin/                    本地 front matter 编辑器（Python + 单页 UI）
```

---

## 2. 构建 / 预览 / 发布

### 本地预览

```bash
hugo server -D          # -D 显示草稿
```

⚠️ **`hugo server` 开着会持续覆盖 `public/`**（写进 livereload 调试脚本）。
`deploy.sh` 会检测 1313 端口并警告，但**不会替你停**。要部署先停它。

### 干净构建（验收用，不碰 `public/`）

```bash
hugo --gc --minify --cleanDestinationDir --destination /tmp/hb-check
```

⚠️ 三个坑：
- **`[minify] minifyOutput = true` 写在 `hugo.toml` 里**，所以**没有「不压缩的构建」**。
  想拿未压缩产物做对照是不可能的，别在这上面浪费时间。
- **`hugo --gc --minify` 不删 `public/` 里的陈旧文件**（旧 `bundle.min.*.js` 会残留，
  表现像「改了没生效」）→ 一律加 `--cleanDestinationDir`，或构建到临时目录。
- `--destination /tmp/xxx` 不碰 `public/`，可以放心在 server 开着的时候跑。

### 生产发布

```bash
./deploy.sh     # 干净构建到临时目录 → 查 livereload → rsync -a --delete 到 public/
./publish.sh    # git 提交 + 推送（也可在终端敲 up）
```

`deploy.sh` 会先 `find static sites -name .DS_Store -delete`，
再用 `rg -q livereload` 拦住「server 没停」的情况。

`publish.sh` 在 `git add` 之前依次跑三个脚本（失败都不阻断发布）：
`fetch-profile-content.py` → `add-heading-anchors.py` → `sync-lastmod.py`。
⚠️ 其中 `sync-lastmod.py` 现在**已无可见产出**（见第 8 节），但保留调用不影响发布。
⚠️ 2026-10-11 删掉了原来排在最前面的 `fetch-image-dims.py`（脚本本身也删了）——
它抓的 `data/image_dims.json` 上游模板根本不读，**别照旧文档加回来**。

### CI

`.github/workflows/build.yml`：push / PR 时用同一个 Hugo 版本构建主站 + 四个子站，
另外检查「中文标题锚点」是否补齐。**周刊期号检查那一步已在 2026-10-10 删除**
（`issue` 字段不再渲染）。

---

## 3. 内容约定

### 文章 front matter（`archetypes/posts.md`）

| 字段 | 状态 | 说明 |
| --- | --- | --- |
| `title` / `date` / `slug` | ✅ 在用 | |
| `lastmod` | ⚠️ 半废 | 只喂 RSS / sitemap；「更新于」那一行已随迁移删除 |
| `summary` | ✅ 在用 | 列表 / 首页摘要；`description` 留空时兜底 |
| `description` | ✅ 在用 | `<meta name="description">` + OG/Twitter 卡片 |
| `categories` / `tags` | ✅ 在用 | 词条页仍生成；索引页已关 |
| `series` | ❌ **已作废** | 没有任何模板读它（老文章字段保留，新文章不用填） |
| `comments` | ✅ 在用 | `false` 关掉该篇评论区 |
| `draft` | ✅ 在用 | |
| `hidden` | ✅ 在用 | 列表页过滤掉（`list.html` / `archive.html` 都判） |
| `toc` | ✅ 在用 | `false` 关掉该篇右侧目录 |
| `hideDate` | ✅ 在用 | `true` 藏掉页面上的日期行（`date` 字段仍要留） |
| `mermaid` | ✅ 在用 | `true` 才加载 Mermaid |
| `menu` | ✅ 在用 | 有值时 `single.html` 不输出 `<h1>` / 日期行 |

### 周刊 front matter（`archetypes/weekly.md`）

- `issue` ❌ **已作废**（期号徽章随自建主题删除）。
- `categories: ["周刊"]` 默认已填。
- 周刊的 URL 也落在 `/posts/YYYY/MM/DD/slug/`（`[permalinks]` 里 `weekly` 与 `posts` 同规则），
  这是**刻意的**，不是 bug。

### 三个必须记住的 front matter 规矩

1. **`hideDate: true` + `toc: false`** —— 加根级独立页时都写上（短页面挂目录是纯噪音）。
2. **中文标题显式写锚点** `## 习惯 {#xi-guan}`，否则分享链接是 `#%e4%b9%a0%e6%83%af`。
   漏了跑 `python3 scripts/add-heading-anchors.py`（需要 macOS 拼音库）。
3. **`noindex: true` 是生效的**（站点层 `baseof.html` 有 robots 分支，上游主题没有）。
   ⚠️ 2026-10-11 才把它补回来 —— 整站迁移时那段实现被一起删掉了，字段一度**空转**。
   现在覆盖 **196 页** = 184 标签词条 + 8 分类词条 + `/privacy/` + `/posts/` + `/donate/` + 404。
   ⚠️ **但 `/privacy/`、`/posts/`、`/donate/` 仍然留在 sitemap 里**（当时只恢复了 meta，
   没恢复旧站的 `layouts/sitemap.xml`）—— 别以为 sitemap 也排除了，这是已知缺口。

---

## 4. 常见任务 → 改哪儿

| 想做的事 | 去哪儿 |
| --- | --- |
| 改导航（增删项 / 改标签 / 换落点） | `hugo.toml` 的 `[[menu.main]]`，**不用碰模板**<br>⚠️ **改完要同步四个子站**：`sites/{run,shot,share,profile}/hugo.toml` 里各有一份**同样的 8 项**（`url` 用绝对地址），漏改会出现「跨站导航缺项」。四处一起改 |
| 改首页文案 | `content/_index.md` |
| 改首页列表条数 | `hugo.toml` 的 `homeRecentCount`（设 0 退回上游原样） |
| 改首页列表的对齐 / 间距 | `custom_head.html` 第 04 段。⚠️ 列表必须与 `Recent Posts:` 标题**左对齐**（`padding-left: 0`），失效时会缩进 40px<br>几何值（120px / .95rem / 1.2rem / 1.3 / 2rem）**逐值照 yinji**，改前想清楚 |
| 改关于页的介绍块 | `content/about.md`（**纯 Markdown，全站没有头像**）|
| 改支持页 / 换收款码 | `content/donate.md`（结构 + 文案）+ `custom_head.html` 第 08 段（样式）<br>⚠️ **换码后要去 Cloudflare Purge `/images/donate/*`** —— 30 天缓存 |
| 改页脚 | `hugo.toml` 的 `copyright` / `copyrightNote` / `licenseName` / `licenseURL` / `[params.footer]` 四个开关<br>⚠️ 第 3 行末尾那个「🚇 开往」**不在配置里**，写在 `layouts/partials/footer.html` 的订阅块里（`safeHTML` 存成变量、三个互斥分支各引用一次）。改地址/换图标/删掉都去那儿 |
| 改颜色 / 字体 / 宽度 / 圆角 | `themes/hugo-bearneo/layouts/partials/style.html` 的 `:root`（改上游，改完在 DESIGN.md 第 5 节登记）<br>⚠️ **四个子站另有一份**（各自 `sites/*/static/style.css` 的 `:root`，外链不是内联）—— 要对齐就**四处一起改**，见 [sites/README.md](sites/README.md) |
| 改子站页头 / 页脚 | `sites/{run,shot,share,profile}/layouts/_default/baseof.html`（四份内容相同）+ 各自 `hugo.toml` 的菜单<br>⚠️ 子站 `baseof.html` 对菜单项**硬编码** `target="_blank" rel="noopener noreferrer"`（主站是靠 `nav.html` 按 `externalLinksNewTab` 自动加） |
| 改子站版式（统计格子 / 图片网格 / 筛选器 / profile 分区） | 各自的 `static/style.css` + `layouts/`。<br>⚠️ `share` 的筛选器类名 `.filter-chip` / `.is-active` 与 `static/share.js` 有契约，**改名要两边一起改** |
| 改正文标题的上下间距 | `layouts/partials/custom_head.html` 第 02 段（⚠️ 行高刻意保持上游的 1.6；`text-autospace` 与 `content > :first-child` 两条已删 —— 后者是「首行贴导航栏」的元凶，见 DESIGN.md 第 5 节第 ③ 条） |
| 改文末「系列坐标带」/「上一篇 / 下一篇」 | 模板 `layouts/_default/single.html`，样式 `custom_head.html` 第 09 / 10 段（**改类名要两边一起改**） |
| 改归档页顶部的「系列」横向入口 | 模板 `layouts/_default/archive.html`，样式 `custom_head.html` 第 09 段 |
| **改归档页底部的标签平铺** | 模板 `layouts/_default/archive.html`（`</ul>` 后面那段）+ 样式 `custom_head.html` 第 09 段的 `.tag-index`<br>⚠️ **排序不是写出来的**：`range` map 时 Go 按 key 的**字节序**排 → 数字 → 英文 → 中文，汉字内部按**码位**。想改「英文不分大小写」得自己 sort（下面单列一条）<br>⚠️ 别写成 `{{ with .Site.Taxonomies.tags }}` 再 `range .Site.…` —— `with` 会重绑 `.`，静默 0 迭代、只留一个空 `<div>`，**构建 0 警告**<br>⚠️ 链接落 `/tags/<slug>/` 词条页；**`/tags/` 索引页是关掉的**，别改过去（会 404）<br>⚠️ 外层是 `<small>`（默认 inline），页面**必须**有 `.tag-index{display:block;margin-bottom:16px}`，否则**页脚会贴住标签**（原来靠 `<ul>` 的 1em 下边距折叠穿透 main 顶开页脚） |
| 改「系列」文末带里的序号对齐 | `custom_head.html` 第 09 段的 `.post-series-ord`（`min-width: 1.5em` + `text-align: right`）。⚠️ 不写的话「9」与「11」宽度不同（8.1 vs 16.3px），上下两行**标题左端会错开 8.1px**。⚠️ 只兜得住 **2 位**，系列超过 99 篇要回来改 |
| ⚠️ **在 `custom_head.html` 写元素选择器前先数标签** | `grep -c '<nav' public/…/index.html` 这类。2026-10-11 栽过：裸 `nav { display:flex }` 命中一页上 **5 个** `<nav>`，把 `.post-series` 挤成左右两栏（右边空 208px）、把 TOC 的 `<ul>` 撑出容器 92.8px。**必须写 `header nav`** |
| **改代码块配色** | `custom_head.html` **第 12 段**（浅 / 深两套 `--code-*`）。⚠️ 前提是 `hugo.toml` 的 `[markup.highlight] noClasses = false` —— **改回 `true` 代码块会立刻变回「看不见」** |
| 改独立页是否显示标题 | front matter 的 `hideTitle: true`（站点层 `single.html` 识别）。当前 `/roll/` `/about/` `/now/` 三页开着；`/privacy/` `/donate/` 保留标题 |
| 改 `/roll/` 两组之间的分隔线 | `content/roll.md` 里那条**裸 `<hr>`** —— 走主题样式，**没有专属 CSS**（旧版 `.roll-break` 已删）。想改观感就改主题的 `hr`（全站生效） |
| 改 404 页 | `layouts/404.html`（结构）+ `custom_head.html` 第 15 段（样式）。⚠️ 「随便看一篇」是 `shuffle` 构建期抽签 |
| 改标题锚点 `#` | `layouts/_default/_markup/render-heading.html` + `custom_head.html` 第 19 段。⚠️ **只给文章页**（两边都判 `$longForm`，改一处要一起改） |
| 改孤行保护 | `layouts/partials/orphan-safe.html`（末 2 字的切法）+ 四处调用；⚠️ **别信「HTML 里有 span 就等于生效」**，`content .nowrap` 那条规则必须有 |
| 改返回顶部 | `layouts/partials/back-top.html` + `custom_head.html` 第 16 段。⚠️ **零 JS**，靠 `animation-timeline: scroll()` |
| 改代码复制按钮 | `assets/js/code-copy.js` + `custom_head.html` 第 18 段 + `partials/code-copy.html` 的加载判断（三处类名/判据一致） |
| 改「系列」的分组口径 | ⚠️ **两处必须同口径**（`series` 字段 + `.ByDate` 升序）：`single.html` 与 `archive.html`，改一处要回来对另一处 |
| 改评论区 | `layouts/partials/giscus.html` + `assets/js/giscus.js` + `custom_head.html` 第 07 段 |
| 改 robots / `noindex` | `layouts/_default/baseof.html` 的 robots 分支（改前先读 DESIGN.md 第 5 节） |
| 改首页那行平台链接 | `content/_index.md`（**地址的真相来源在 `content/about.md` 的「平台」段，两边一起改**） |
| 改链接页（加朋友 / 加聚合站 / 补点评） | `content/roll.md` —— **全站唯一的链接页**，**一条平铺**（前 3 条朋友、后 11 条聚合站，没有小标题）<br>⚠️ 条目格式 `- [名称](地址)：一句话点评`，**点评目前留空待填**<br>⚠️ `</a>` 和中文冒号之间**不要手写空格**（`render-link.html` 已处理）<br>⚠️ 两组之间那条**全宽虚线**是手写的裸 `<hr>`，**别删**（删了「朋友 / 聚合站」就没区分了）；它走主题自带的 `hr` 样式，**没有专属 CSS**（第 11 段留空） |
| 加根级独立页 | `content/xxx.md`（`hideDate` + `toc: false`）+ 回 `static/_headers` 补一条缓存规则 |
| 加 301 | `static/_redirects`（**首条命中即生效**，splat 要排在精确路径之后） |
| 改响应头 / 缓存 | `static/_headers` |
| 换 favicon / 分享图 | `static/favicon.svg` / `static/images/share.webp`（后者由 `params.images` 引用） |

### `scripts/` 现状

| 脚本 | 状态 |
| --- | --- |
| `add-heading-anchors.py` | ✅ 在用（CI 也跑 `--check`） |
| `fetch-profile-content.py` | ✅ 在用（刷新 profile.hulatu.com 的「最新文章」快照） |
| `sync-garmin.py` / `garmin-token.py` | ✅ 在用（每日 CI 同步跑步数据 → `data/runs.json`） |
| `sync-lastmod.py` | ⚠️ 半废（`lastmod` 只喂 RSS / sitemap 了） |
| `build-subdomains.sh` | ✅ 在用（构建四个子站） |
| `backup-blog.sh` / `cleanup-junk.sh` / `_frontmatter.py` | ✅ 工具 |

> ⚠️ **2026-10-11 删掉了 4 个失效脚本**：`fetch-image-dims.py` / `sync-douban.py` /
> `gen-og.js` / `css-critical-coverage.py`。它们分别对应自建主题时代的三条链路
> （图片宽高缓存、豆瓣书影音、按 slug 生成分享图、临界 CSS 覆盖率校验），
> 随主题迁移全部失去消费者。
> **要恢复任何一个都从 git 历史里取**（`git log --diff-filter=D --name-only -- scripts/`），
> 别凭记忆重写。`publish.sh` 里那句对 `fetch-image-dims.py` 的调用也已同步删掉。

---

## 5. URL、重定向与缓存头

### URL 不变量（**改任何东西之前先守住这几条**）

- 文章 / 周刊：`/posts/YYYY/MM/DD/slug/`（125 条，由 `[permalinks]` 生成）
- 根级页：`/`、`/about/`、`/now/`、`/roll/`、`/privacy/`、`/archive/`、`/weekly/`、`/donate/`
- 词条页：`/tags/<tag>/`（184）、`/categories/<cat>/`（8）
- `/posts/` 存在但 `noindex`，且全站没有页面链到它 —— 导航的 `Posts` 指的是 `/archive/`

**验收方式**：改完构建到 `/tmp`，`find . -name '*.html'` 排序后和迁移前的清单 `comm` 对比。
迁移前基线 334 个，现在 327 个 —— 差的 9 个是刻意删除的（见下），
多出来的是 `/donate/`（支持页，2026-10-11 补）。

### `_redirects`（Cloudflare，首条命中即生效）

| 规则 | 为什么 |
| --- | --- |
| `/running/` → `run.hulatu.com` | 跑步栏目独立成子站 |
| 4 条带句点 / 大写的文章旧址 | 历史 URL 兜底 |
| `/page/1/` → `/`，`/page/*` → `/archive/` | 首页分页取消（2026-10-10） |
| `/weekly/page/1/` → `/weekly/`，`/weekly/page/*` → `/weekly/` | 周刊分页取消（2026-10-10 晚） |
| `/friends/` → `/roll/`、`/links/` → `/roll/` | 友链页并进收藏页（2026-10-11），两条**都直接指终点**，不串两跳 |
| `/categories/` `/tags/` → `/archive/` | 索引页用 `disableKinds` 关掉（**精确匹配，不误伤词条页**） |
| `/media/` → `/`，`/stats/` → `/archive/` | 两页随自建主题删除 |

⚠️ 加 splat 规则时，精确路径（`/x/1/`）必须写在 splat（`/x/*`）**前面**。

### `_headers`

- HTML 一律 `public, max-age=0, must-revalidate`（**故意不加 stale-while-revalidate** ——
  2026-09-28 因此出现过「发了新文章首页还是旧的」）。
- `/images/*` 30 天、`/js/*` 一年 immutable（文件名带内容哈希）、
  favicon / logo / 图标 7 天、`site.webmanifest` 1 小时。
- ⚠️ **`/css/*` 已删除**（产物里没有 `/css/` 目录了）。
- ⚠️ 新增根级内容页记得回来补一条缓存规则。

---

## 6. 坑（按主题分组）

### Hugo / 构建

1. **`disableKinds` 必须写在任何 `[table]` 之前**，否则被并进那张表，
   只吐一句 `WARN Unknown kind "disablekinds"` 然后**静默失效**。
2. **`hugo --config /tmp/x.toml` 会破坏主题解析**（`themesDir` 相对站点根），
   症状是**静默产出一个没有主题的站**。别这么干。
3. **`minify` 会剥属性引号**（`href=/about/`）、**去前导零**（`0.32s` → `.32s`）、
   不压 `rgba()` 里的空格 → 按压缩后写法 grep 会**假阴性**。先 `findall` 打出真实写法再判。
4. **`--destination` 构建到临时目录不碰 `public/`**，是唯一能在 server 开着时安全验收的办法。

### 模板 / 布局查找

5. **`/archive/` 是普通内容页，不是 section**，所以要用 `layout: "archive"` 指到
   `layouts/_default/archive.html`。⚠️ **别删 `content/archive.md` 里那一行** ——
   删了就回落到 `single.html`，页面变成「只有正文」的空壳。
   ⚠️ 也**别改成 `content/archive/_index.md`** —— section 的 `.Pages` 是它自己的子页，
   空数组，列表会渲染成「这里还没有内容」。
6. **普通内容页的模板查找顺序是 `layouts/<type>/<layout>.html` → `layouts/_default/<layout>.html`**，
   根级 md 的 `type` 是 `page`。文件名本身不参与查找，必须靠 front matter 的 `layout` 指。

### 内容 / 渲染

7. **Goldmark 默认丢裸 `<iframe>`**（文章里有腾讯视频嵌入）→ `unsafe = true` 已开。
8. **`{#pinyin}` 锚点是 Goldmark 原生语法**，不依赖任何自定义 heading 钩子 ——
   所以删掉 `_markup/render-heading.html` 之后它照常工作。
9. **`{{ .Summary }}` 在 `<meta content>` 里带 `<h1>` 是假阳性**，
   `--minify` 会重选引号并反转义。判据是用真 HTML 解析器读两种产物比对解析后的值。

### 工具链（跨项目通用，这里只记本项目相关的）

10. **BSD grep 不支持 `\|` 交替** —— `grep "a\|b"` 会**静默返回空、不报错**，
    据此得出「没有 X」的结论会错。用 `grep -E` 或 Grep 工具。
11. **`&&` 串的校验会静默跳过后面** —— 前面一个 `grep -c` 返回 0（退出码 1）就断链了。
    独立检查用 `;`。
12. **标签配平必须用 `html.parser.HTMLParser`**，别手写正则 ——
    正则会把压缩产物里 `<a href=/about/>` 末尾那个 `/` 当成自闭合斜杠，
    于是**每个 `<a>` 都不进栈**，报出一堆 `stray </a>` 的假崩。
13. **数「N 处」必须从工具输出回读**（`len(re.findall(...))`），别凭印象。
14. **报 ✗ 时先怀疑正则**：`re.search` 只取第一个同名选择器；
    `@media[^{]*\{(.*?)\n\}` 会停在第一个 `\n}`；压缩产物上 `@media print \{.*?\n\}` 一次都不匹配。
    验收脚本一律 `findall`。
15. **源码注释会引用旧值**，查「旧值还在不在」先 strip 注释
    （`re.sub(r'/\*.*?\*/', '', s, flags=re.S)`）。

---

## 7. 验收清单

改完之后至少跑这几条（全部实测过，命令可直接复制）：

```bash
# 1) 干净构建，看警告数（应为 0）
hugo --gc --minify --cleanDestinationDir --destination /tmp/hb-check

# 2) 标签配平 + 缺 h1 + data-page-node-id 注入（都应为 0）
#    用 html.parser.HTMLParser，不要用正则
python3 - <<'PY'
import glob
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
bad=h1=inj=0
for f in glob.glob('/tmp/hb-check/**/*.html',recursive=True):
    x=open(f,encoding='utf-8',errors='replace').read()
    p=B(); p.feed(x)
    if p.bad or p.st: bad+=1
    if '<h1' not in x: h1+=1
    if 'data-page-node-id' in x: inj+=1
print(f"不配平={bad} 缺h1={h1} 注入={inj}  (都应为 0)")
PY

# 3) URL 未变（和迁移前基线对比）
cd /tmp/hb-check && find . -name '*.html' | sed 's#^\./##' | sort > /tmp/urls-now.txt
comm -23 /tmp/urls-before.txt /tmp/urls-now.txt   # 只应剩 8 个刻意删除的地址

# 4) 内联 CSS 体积（Python gzip 口径）
python3 -c "
import re,glob,gzip
t=g=0
for f in glob.glob('/tmp/hb-check/**/*.html',recursive=True):
    c=''.join(re.findall(r'<style[^>]*>(.*?)</style>',open(f,encoding='utf-8',errors='replace').read(),re.S))
    t+=len(c.encode()); g+=len(gzip.compress(c.encode(),9))
print(f'{t/1024:.0f} KB / gzip {g/1024:.0f} KB')"

# 5) ★ 样式块里不该有任何中文（模板注释「提前收尾」泄漏的哨兵，应为 0）
python3 -c "
import re,glob
bad=[f for f in glob.glob('/tmp/hb-check/**/*.html',recursive=True)
     if any(re.search(r'[\u4e00-\u9fff]',b) for b in re.findall(r'<style[^>]*>(.*?)</style>',open(f,encoding='utf-8',errors='replace').read(),re.S))]
print('样式块混入中文:',len(bad),bad[:3])"

# 6) 2026-10-11 新增：行内链接换行 bug / 系列 / 上下篇 / roll 两层分隔
python3 - <<'PY'
import re, glob
fs = glob.glob('/tmp/hb-check/**/*.html', recursive=True)
r = [open(f, encoding='utf-8', errors='replace').read() for f in fs]
print('a) </a>+换行+中文标点 (应 0):',
      sum(len(re.findall(r'</a>\n[，。：；！？、）」』》〈【（]', s)) for s in r))
print('b) 系列坐标带页面 (应 21):',
      sum(1 for s in r if re.search(r'<nav class=["\']?post-series', s)))
print('c) 上下篇页面 (应 125):',
      sum(1 for s in r if re.search(r'<nav class=["\']?post-nav', s)))
a = open('/tmp/hb-check/archive/index.html', encoding='utf-8').read()
print('d) 归档页系列横向行 (应 3):', len(re.findall(r'<div class=series-row>', a)))
print('   归档页不该再有 <details class=series-row> (应 0):',
      len(re.findall(r'<details class=series-row', a)))
ro = open('/tmp/hb-check/roll/index.html', encoding='utf-8').read()
main = re.search(r'<main>(.*?)</main>', ro, re.S).group(1)
print('e) /roll/ 页面级 h1 (应 0):', len(re.findall(r'<h1', main)))
print('   /roll/ 的 <ul>/<li> (应 2 / 14):',
      len(re.findall(r'<ul', main)), len(re.findall(r'<li', main)))
print('   /roll/ 的分隔线 (应 1 个裸 hr):', re.findall(r'<hr[^>]*>', main))
print('   .roll-break 残留 (应 0 页):',
      sum(1 for s in r if 'roll-break' in s))
print('f) 代码块配色页 (应 5):', sum(1 for s in r if '--code-keyword' in s))
print('   monokai 内联色残留 (应 0):',
      sum(1 for s in r if '#f8f8f2' in s or '#272822' in s))
print('g) 独立页页面级 h1（roll/about/now 应为空；privacy/donate 各有一个）:')
for n in ['roll', 'about', 'now', 'privacy', 'donate']:
    x = open('/tmp/hb-check/' + n + '/index.html', encoding='utf-8').read()
    body = re.search(r'<main>(.*?)</main>', x, re.S).group(1)
    print('      /' + n + '/ -> ' + str(re.findall(r"<h1[^>]*>(.*?)</h1>", body, re.S)))

# h) 面包屑：可见段数 与 JSON-LD 段数必须自洽（JSON-LD = 可见段 + 当前文章）
import json
from collections import Counter
n_ok = n_bad = 0
shapes = Counter()
for f in glob.glob('/tmp/hb-check/posts/**/index.html', recursive=True):
    x = open(f, encoding='utf-8', errors='replace').read()
    nav = re.search(r'<nav class=breadcrumbs.*?</nav>', x, re.S)
    if not nav:
        continue
    seg = len(re.findall(r'<li>', nav.group(0)))
    shapes[seg] += 1
    ld = json.loads(re.search(r'<script type=application/ld\+json>(.*?)</script>',
                              x, re.S).group(1))
    ok = (ld['@type'] == 'BreadcrumbList'
          and len(ld['itemListElement']) == seg + 1
          and [i['position'] for i in ld['itemListElement']] == list(range(1, seg + 2))
          and ld['itemListElement'][0]['name'] == '首页')
    n_ok += ok
    n_bad += (not ok)
print('h) 面包屑页面 (应 125):', n_ok + n_bad)
print('   JSON-LD 合格 / 不合格 (应 125 / 0):', n_ok, '/', n_bad)
print('   可见段数分布 (应 {3: 101, 2: 24}；3 段=文章带分类，2 段=周刊):', dict(shapes))
PY

# 7) ★「首行贴导航栏」的哨兵：/roll/ /about/ /now/ 三页的正文首行到导航文字下沿
#    应都在 ~28 CSS px（与 yinji 一致；12.5px 就是 content > :first-child 被加回来了）
#    ⚠️ 三页必须在**同一批截图**里量：--window-size 的高度不同会得出不同数字
#    （实测过 46px vs 57px 的假差异）；量法：2x 截图后逐行取最暗像素找文本带，换算回 CSS px
# 8) ★ 订阅源：只收文章页 + 带 XSL 样式表（2026-10-11 加）
python3 - <<'PY'
import re
for f in ['/tmp/hb-check/index.xml', '/tmp/hb-check/weekly/index.xml']:
    s = open(f, encoding='utf-8').read()
    items = s.split('<lastBuildDate>')[-1]          # 跳过 channel 自己的 <link>
    links = re.findall(r'<link>([^<]+)</link>', items)
    print(f, '| 条目', len(links),
          '| 非文章', sum(1 for l in links if '/posts/' not in l),
          '| 样式表', bool(re.search(r'<\?xml-stylesheet type="text/xsl" href="[^"]+/rss\.xsl"\?>', s)),
          '| content:encoded', len(re.findall(r'<content:encoded>', items)),
          '| atom:updated', len(re.findall(r'<atom:updated>', items)),
          '| category', len(re.findall(r'<category>', items)))
PY
# 期望：两个文件都是 条目 20 / 非文章 0 / 样式表 True /
#       content:encoded 20 / atom:updated 20 / category > 0

# 9) ★ 归档页底部标签平铺 + 样式作用域哨兵（2026-10-11 加）
python3 - <<'PY'
import re, glob
fs = glob.glob('/tmp/hb-check/**/*.html', recursive=True)
st = lambda s: ''.join(re.findall(r'<style[^>]*>(.*?)</style>', s, re.S))
r = [(f, open(f, encoding='utf-8', errors='replace').read()) for f in fs]

a = open('/tmp/hb-check/archive/index.html', encoding='utf-8').read()
blk = re.search(r'<small class=tag-index><div>(.*?)</div></small>', a, re.S)
tags = re.findall(r'>#([^<]+)</a>', blk.group(1)) if blk else []
kind = lambda x: '数字' if re.match(r'^[0-9]', x) else ('英文' if all(ord(c) < 128 for c in x) else '中文')
seq = [kind(t) for t in tags]
print('a) 归档标签个数 (应与标签词条页数相等):', len(tags))
print('   三类顺序 (应为 数字* → 英文* → 中文*，同类连续):',
      [k for i, k in enumerate(seq) if i == 0 or seq[i-1] != k])
print('b) 有 tag-index 块却缺 .tag-index 规则的页 (应 0):',
      sum(1 for f, s in r if 'class=tag-index' in s and '.tag-index' not in st(s)))
print('c) 含 header nav 规则的页 (应 = HTML 总数):',
      sum(1 for f, s in r if re.search(r'header\s+nav\s*\{', st(s))))
print('d) ★ 残留「裸 nav」选择器的页 (应 0):',
      sum(1 for f, s in r if re.search(r'(?<![\w.#\-\s])nav\s*\{', st(s))))
print('e) post-series-ord 带 min-width 的页 (应 126 = 125 长文 + /archive/):',
      sum(1 for f, s in r if re.search(r'\.post-series-ord\s*\{[^}]*min-width', st(s))))
PY
# 期望：a) 184，三类顺序 ['英文','中文']（本站没有数字标签），b) 0，c) 327，d) 0，e) 126
# ⚠️ 写这些断言时当心：`'header nav{' in css.replace(' ','')` 是错的
#    （把 needle 里的空格也去掉了）→ 永远 False；`(?<![\w.#-])nav\s*\{` 漏了空格，
#    会把 `header nav{` 也当成裸 nav → 永远报 327。**这两条我自己都踩过。**

# 10) ★ 四个子站：页头 9 个链接 + 导航 8 项绝对地址 + 无旧视觉残留（2026-10-12 加）
bash scripts/build-subdomains.sh    # 先重建（⚠️ 别加 --quiet）
python3 - <<'PY'
import re, pathlib
EXPECT = [("Home","https://hulatu.com/"),("Hub","https://profile.hulatu.com/"),
          ("About","https://hulatu.com/about/"),("Now","https://hulatu.com/now/"),
          ("Links","https://hulatu.com/roll/"),("Weekly","https://hulatu.com/weekly/"),
          ("Posts","https://hulatu.com/archive/"),("RSS","https://hulatu.com/index.xml")]
# ⚠️ minify 会剥掉属性引号（href=/），子站 CSS 是**外链**不是内联 —— 见下方注释
A = r'href=(?:"([^"]*)"|([^\s>]+))'
def hrefs(s):
    out=[]
    for m in re.finditer(r'<a\s([^>]*)>(.*?)</a>', s, re.S):
        hm=re.search(A,m.group(1)); out.append((hm.group(1) or hm.group(2)) if hm else "")
    return out
bad=0
for f in sorted(pathlib.Path("sites").glob("*/public/**/*.html")):
    t=f.read_text(encoding="utf-8"); r=[]
    h=re.search(r"<header>(.*?)</header>",t,re.S)
    if not h: r.append("无 header")
    else:
        if len(hrefs(h.group(1)))!=9: r.append(f"页头链接 {len(hrefs(h.group(1)))} 个")
        nav=re.search(r"<nav>(.*?)</nav>",h.group(1),re.S)
        if not nav or [u for u in hrefs(nav.group(1))]!= [u for _,u in EXPECT]:
            r.append("导航不符")
        if 'target=_blank' not in (nav.group(1) if nav else ""): r.append("缺 target=_blank")
    for p,n in [(r"box-shadow","box-shadow"),(r"c73e2f","印章红"),(r"f6f6f8","冷白纸"),
                (r"border-radius:\s*1[68]px","圆角卡片"),(r"Georgia","衬线")]:
        if re.search(p,t,re.I): r.append("HTML 残留 "+n)
    print(("OK " if not r else "NG "), f, r); bad+=len(r)
for c in sorted(pathlib.Path("sites").glob("*/public/style.css")):
    s=c.read_text(encoding="utf-8"); r=[]
    for p,n in [(r"#fdfdfd","底色"),(r"#0066cc","链接"),(r"#d0d7de","分割线"),
                (r"Verdana","字体"),(r"720px","宽度")]:
        if not re.search(p,s,re.I): r.append("缺 "+n)
    for p,n in [(r"box-shadow","box-shadow"),(r"c73e2f","印章红"),(r"f6f6f8","冷白纸")]:
        if re.search(p,s,re.I): r.append("残留 "+n)
    print(("OK " if not r else "NG "), c, r); bad+=len(r)
print("异常合计（应 0）：", bad)
PY
# ⚠️ 这一条我自己踩过两次假阳性，都写下来：
#   ① `href="…"` 在产物里是 `href=…`（minify 剥引号）→ 断言里必须同时兼容两种写法，
#      否则 6 个页面全部报「页头链接 0 个」，看着像全站崩了；
#   ② 子站的 CSS 是**外链** `static/style.css`，不在 HTML 的 `<style>` 里 ——
#      颜色令牌要去读 `sites/*/public/style.css`，在 HTML 里找永远找不到。
```

> 第 5 条是 2026-10-11 加的：Go 模板注释里如果出现 C 风格注释的收尾符，
> 注释会**提前结束**且**构建不报错**，后半段变成普通文字输出到页面上；
> 落在 `<style>` 里还会吞掉紧随其后的那条规则（当天把首页列表顶出 40px 缩进）。
> 模板注释一定会带中文，所以「样式块里有中文」是这类故障最灵敏的哨兵。
>
> 第 6 条里的 f) 是「代码块看不见」的哨兵：`noClasses` 若被改回 `true`，
> 产物里会重新出现 `#f8f8f2` / `#272822` 这两个 monokai 内联色。

再手工扫一眼这几处（模板改动的回归面）：

- 首页：`h2#hi` → 引用 → 段落 → **含「支持」链接的段落** → 五个平台链接行 → 虚线 `<hr>`
  → `<h3>Recent Posts:</h3>` → 5 条
  ⚠️ **简介正文外面不该有 `<content>`**（2026-10-11 照 yinji 去掉了那一层，
  行高走 body 的 1.5、`Hi!` 上方有 16px 空）；要退回上游就把它包回去
  ⚠️ **列表左边界要和 `Recent Posts:` 标题对齐**（实测都是 x≈140）；缩进 40px 就是
  `.recent-posts { padding-left: 0 }` 被吞了，去跑第 5 条哨兵
- `/archive/`：搜索框 + 「共 125 篇。」+ **「系列」三条横向行**（居家流水账 4 篇 / 综述写作 5 篇 /
  跑步 12 篇，每行左侧系列名、右侧篇目横向铺开）+ 年份分组（2026 / 2025）
  ⚠️ 这一块**不该有任何分割线 / 折叠三角**（2026-10-11 用户明确否掉了那一版）
- 导航：`Home / Hub(https://profile.hulatu.com/) / About / Now / Links(/roll/) / Weekly(/weekly/) / Posts(/archive/) / RSS(/index.xml)` —— 8 项
  ⚠️ 项数一多窄屏必折行：靠站点层第 00 段的 `nav{display:flex;flex-wrap:wrap;column-gap:8px}`
  保证只在**项与项之间**折（没有这段时 392px 会把 `RSS` 拆成 `RS`/`S`）
- 页脚四行，**顺序是**：Made with → Copyright → **订阅行（RSS / Say hello · 🚇 开往）**
  → 英文授权行（+ Privacy + Sitemap）。
  ⚠️ 订阅行是 2026-10-11 从第 1 行挪到第 3 行的，别按老印象看
  ⚠️ 「🚇 开往」是 2026-10-12 加的，**接在订阅行末尾**（不单独占行，页脚仍是 4 行）；
  指向 `https://www.travellings.cn/go.html`、新窗口打开。
  哨兵：`<footer>` 里 `<br>` 恰好 **3 个**、`go.html` 恰好出现 **1 次**、
  且「Say hello」与「开往」必须落在**同一个 `<br>` 分段**里（少了就是掉到第 4 行去了）
- 文章页：`<h1>`、日期行、标签行、**文末「系列坐标带」（只有 21 篇连载有）
  +「上一篇 / 下一篇」（125 篇都有）**、TOC、评论区
  ⚠️ **「上一篇」= 更早、「下一篇」= 更晚**，与系列带方向一致；两段相邻时只画一条发丝线
  ⚠️ 最新一篇（`engineering-students-use-macbook`）没有「下一篇」、
  最早一篇（`personal-profile`）没有「上一篇」—— 会留一个不可见空槽，正常
  ⚠️ **含代码的文章，代码块必须是「浅灰底 + 深字」**（浅色模式）或「深底 + 浅字」（深色）。
  若看到代码块里大片文字发白/发黄、几乎读不出来，就是 `noClasses` 被改回 `true` 了 ——
  去跑第 6 条的 f) 哨兵，并读 DESIGN.md 第 5 节第 12 段
- 文章页顶部：**`首页 / 文章 / 分类`**（周刊是 `首页 / 周刊`，**两段**）。
  ⚠️ 周刊**没有**第三段不是 bug —— 周刊的 `categories` 就是 `["周刊"]`，
  与栏目名重复，加了会变成「首页 / 周刊 / 周刊」
  ⚠️ 面包屑**不该**出现在 `/about/` `/now/` `/roll/` 或任何词条页上
- `/roll/`：**没有页面标题**（标题只在 `<title>` 与导航高亮），一条 14 项的平铺列表
  （**两个 `<ul>`**：3 条朋友 + 11 条聚合站，中间一条**全宽虚线 `<hr>`**，与首页那条同源）；
  结尾一行「…更新中」，无日期行、无评论区、无 TOC
  ⚠️ **正文首行到导航文字下沿应为约 28 CSS px**（与 yinji 一致）。
  若量到 ~12.5px，说明 `content > :first-child { margin-top: 0 }` 被加回来了 —— 删掉它
- `/about/`：介绍块是**纯 Markdown**，**没有头像**（2026-10-11 撤掉；页头那张更早就没了，
  所以现在**全站一张头像都没有**），也**没有页面标题**（2026-10-11 新增，与 `/roll/` 同一套开关），
  首行到导航文字下沿同样是约 **28 CSS px**。如果你看到头像或「关于」二字，说明改动被回滚了
- `/donate/`：两个收款码并排居中（窄屏一列），**没有**日期行、TOC、评论区（**有标题**）
- `/now/`：**没有页面标题**（与 `/about/` 同批），无日期行、无评论区、无 TOC，首行间距同 28px
  ⚠️ `/privacy/` 与 `/donate/` **仍然保留页面标题** —— 用户只点名了 About 和 Now，别顺手统一
- `/privacy/` `/posts/` `/donate/` `/404.html` 与全部词条页：
  `<meta name=robots content="noindex, follow">`（合计 **196 页**）
- **四个子站**（`run.` / `shot.` / `share.` / `profile.hulatu.com`，2026-10-12 改造后）：
  页头必须是「站名 `h1` + **同一套 8 项导航**（绝对地址、新窗口）」，
  视觉必须是 BearNeo（Verdana / 蓝链接 / 发丝线 / **没有圆角卡片与阴影**）。
  ⚠️ 子站的 CSS 是**外链** `static/style.css`（不是内联），改完要看 `sites/*/public/style.css`
  ⚠️ 子站内容很少：`shot` / `share` **一条内容都没有**（只有 `_index.md`），
  它们的列表页 / 单篇页是**空状态**，别以为「页面白屏 = 构建坏了」
  ⚠️ 想验证图片网格 / 筛选器版式要**临时造条目**（`_zz-` 前缀），验完**记得删**

---

## 8. 待办 / 已知缺口

优先级从高到低。

> ⚠️ **2026-10-11 清理后，下面第 1/2/3/7 条已经不再是「缺口」了** ——
> 用户决定「把旧的东西都清除干净」，那批孤儿资源与失效脚本已全部删除
> （清单见第 1 节末尾那段）。**它们仍在 git 历史里，要恢复就 `git log --diff-filter=D` 取回。**
> 保留原文是为了记住「当初为什么变成孤儿」，别照着它去找已经不存在的文件。

1. ~~**125 张 `og/<slug>.png` 成了孤儿**~~ → **2026-10-11 已删除**。
   现在每页 `og:image` 都是同一张 `share.webp`（那是全站唯一一张分享图，**在用，别删**）。
   要恢复「每篇文章一张分享图」：从 git 历史取回 `scripts/gen-og.js` 重跑，
   并按 DESIGN.md 第 8 节加**第 13 个**站点层文件 `layouts/partials/seo_tags.html`。
2. ~~**`/media/` 删除留下的孤儿链路**~~ → **2026-10-11 已删除**
   （`scripts/sync-douban.py`、`data/media.json`、`static/images/media/`）。
   ⚠️ **`sites/profile/data/profile.json` 的 `media_recent` 与「书影音」导览项还没处理** ——
   那一项仍指向不存在的页面。要不要把 `/media/` 作为朴素列表页加回来，**仍是用户的决定**
   （加回来要同时恢复同步脚本）。
3. ~~**`scripts/fetch-image-dims.py` 失效**~~ → **2026-10-11 已删除**（脚本 + `data/image_dims.json`
   + `publish.sh` 里的调用一起）。⚠️ 实测过 CLS ≈ **0**（三个图片最多的页面：0 / 0 / 0.0087），
   本来就没在抖 —— 所以「正文图片没有 width/height」并不构成实际问题，别再照旧说法去补。
4. **`scripts/sync-lastmod.py` 半废** → `lastmod` 只喂 RSS / sitemap。
5. ~~`admin/` 面板里的「系列 series」输入框已无消费者~~ —— **2026-10-11 已解决**：
   `series` 重新有了两个出口（文章页文末坐标带 + `/archive/` 横向入口），
   那个输入框现在**是有效的**。⚠️ 字段必须保持**字符串**语义（一篇只能属于一个系列）。
6. **列表页没有页面级 `<h1>`**（有意接受上游行为）；**深色下正文图片描边几乎不可见**。
7. ~~**`static/images/og/`（125 张）无引用**~~ → **2026-10-11 已删除**；`avatar.webp` 同日一并删除。
   ⚠️ **`static/images/` 现在只剩 `donate/`（两张赞赏码，`/donate/` 在用）和 `share.webp`
   （全站 og:image）** —— 两个都是**在用**的，别再当死资源删。
8. **`~/bearneo-trial`** 可以留着做对照，也可以删（删除它不影响本站）。

---

## 9. 和 `~/bearneo-trial` 的关系

`~/bearneo-trial` 是**同一套主题的试运行站**（上游 `hugo-bearneo` 逐字节未改 + 站点层覆盖），
本站这次的站点层覆盖文件就是从它搬过来的。两边的关系：

- **模板件**：`index.html` / `baseof.html` / `single.html` / `list.html` / `rss.xml` /
  `nav.html` / `footer.html` / `custom_head.html` / `giscus.html` / `giscus.js` —— 同源。
- **本站多出来的**（试运行站都没有）：`_default/archive.html`（试运行站没有 `/archive/`）、
  `_default/_markup/render-link.html`（去掉 `</a>` 后的换行）、
  以及 `single.html` / `archive.html` 里 2026-10-11 新加的系列与上下篇两段。
- **本站改过的**：`"blog"` → `"posts"`（本站的栏目叫 `posts`，不是 `blog`，4 处）；
  `custom_head.html` 第 06 段删掉（TOC 保持上游「默认隐形」）、末尾补回 GoatCounter；
  **试运行站没有第 11 / 12 / 13 段**，也没有 `breadcrumbs.html`：
  第 11 段留空（`/roll/` 分隔线改用裸 `<hr>`）；
  第 12 段是代码块配色 —— 试运行站仍是 monokai 内联色，即「代码块看不见」那个状态；
  第 13 段是面包屑样式。**这三样都别反向同步过去。**
- **内容**：`_index.md` / `about.md` / `privacy.md` / `now.md` 从试运行站搬过来，
  链接页则是本站自己的形态（`/roll/` 一页、**一条平铺 14 项**；试运行站没有这一页）；
  ⚠️ 2026-10-11 之前拆成过 `/roll/` + `/links/` 两页，现已合并成一页 —— 别拆回去。
- 试运行站的 `content/blog/` 对应本站的 `content/posts/`。

⚠️ **改完共享内容别忘了两边同步**；反过来，只属于本站的改动（比如 `archive.html`）
**不要**反向同步过去。

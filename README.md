# 我的博客（Hugo）

`hulatu.com` 的源码：一个基于 [Hugo](https://gohugo.io/) 的中文个人博客，
主题是上游 [hugo-bearneo](https://github.com/rokcso/hugo-bearneo)（**逐字节未改**），
外加四个独立子站（`run.` / `shot.` / `share.` / `profile.hulatu.com`）。

> **这份 README 只讲「怎么跑起来」。** 想改站上的具体东西（版式、缓存、脚本、部署、常见故障），看
> [MAINTENANCE.md](MAINTENANCE.md)；想动视觉，看 [DESIGN.md](DESIGN.md)（那份列了站点层全部 19 个文件的偏离）。
> 两份冲突时以 MAINTENANCE.md 为准。
>
> ⚠️ 2026-10-10 晚整站从**自建主题**迁移到了上游 hugo-bearneo。这份 README 是那天同步重写的。

## 功能特点

- **导航栏**：7 项英文标签，**完全由 `hugo.toml` 的 `[[menu.main]]` 驱动**，模板里不写死任何链接：
  `Home` / `About` / `Now` / `Links`(→`/roll/` 收藏与友链) / `Weekly`(→`/weekly/`) / `Posts`(→`/archive/` 归档) / `RSS`(→`/index.xml` 全站订阅源)
- **首页**：逐条照 [yinji.org](https://yinji.org/) 的 Bear Neo 版式 —— `Hi!`（h2）+ 一句题记 +
  一段简介 + 一句「…可以选择 **[支持]** 我」（链到 `/donate/`）+ 一行五个平台的入口链接
  （公众号 / 少数派 / 小红书 / 知乎 / 即刻），
  虚线 `<hr>` 之后是 `<h3>Recent Posts:</h3>` 和**最近 5 篇**（日期在左、标题在右，
  **与标题左对齐**，照 yinji），**不分页**、**列表后面没有任何尾巴**。文案全在 `content/_index.md`
- **支持页 `/donate/`**：微信 + 支付宝两个赞赏码并排居中（窄屏落成一列）。
  收款码是站内静态资源，不走图床。**换码后记得去 Cloudflare Purge `/images/donate/*`**（30 天缓存）
- **关于页 `/about/` 与 `/now/`**：**没有页面标题、没有头像**（标题只留在 `<title>` 和导航高亮里，
  照 yinji）。页头那张头像更早就撤了，所以**全站一张头像都没有**
- **文章页**：**面包屑**（`首页 / 文章 / 分类`；周刊是 `首页 / 周刊`。125 篇都有，
  另带完整的 `BreadcrumbList` JSON-LD）—— **分类的入口就在这一段的第三段**、
  右侧固定目录（照 Bear Neo —— 平时**完全隐形**、悬停才显形；**≤800px 整块隐藏**）、
  标签行（**只有标签、没有分类行**）、**文末「系列坐标带」+「上一篇 / 下一篇」**、
  评论区、CSS-only 的图片放大。
  **含代码的文章有跟随深浅色的语法配色**（2026-10-11 修 —— 改之前代码块里的
  普通标识符/字符串在浅色底上对比度只有 1:1，等于看不见）。
  **没有**相关文章、阅读进度条、回到顶部（长文页的返回顶部除外）、代码块红绿灯 —— 都删了
- **归档 `/archive/`**：搜索框 + 「共 125 篇。」+ **「系列」三条横向行**（系列名在左、篇目在右铺开，
  无分割线无折叠）+ 按年份分组的全部文章（含周刊）。⚠️ 没有页面级 `<h1>`，与上游一致
- **周更栏目**：周刊独立成栏（`/weekly/`），正文走 `/posts/年/月/日/slug/`，另有单独的 RSS
- **链接页 `/roll/`（导航里那项 `Links`）**：全站唯一的链接清单，照 [yinji.org/roll](https://yinji.org/roll)
  做成**一条平铺的 14 项列表**（前 3 条朋友、后 11 条聚合站/目录站，**没有小标题、也没有页面标题**），
  两组之间是一条**全宽虚线 `<hr>`**（与首页 `Hi!` / `Recent Posts:` 之间那条同源）。
  条目写成 `名称：一句话点评`，**点评目前留空待填**。
  旧的 `/links/` 友链页已删除，`/links/` 与更早的 `/friends/` 都 301 到 `/roll/`
- **深浅色**：**完全跟随系统**，没有切换按钮（上游如此）
- **搜索**：只有列表页顶部的**标题过滤**（上游 `postSearch`）。全站搜索面板已删除
- **评论**：giscus（GitHub Discussions），只挂长文页、默认收起。样式极简 —— 没有任何外框，
  只有一行加粗的「评论」+ 右边一个**实心三角 ▼**（展开翻成 ▲），点一下展开
- **404 页**：两段结构（水印 `404` + `<h1>这一页不在账上</h1>` + 三个动作 + 「逛逛别处」两列栏目）。
  「随便看一篇」是构建时抽签，每次发布换一篇
- **标题锚点**：**只在文章页** —— h2/h3 悬停显示一个可点的 `#`，用来复制小节直链。
  ⚠️ 非文章页（`/about/` `/now/` `/privacy/` `/` …）**模板层就不输出它**，所以那些页面没有 `#`
- **返回顶部**：只挂长文页。**纯 CSS 滚动驱动动画，零 JS**（⚠️ 同批做过的阅读进度条已按用户要求删除）
- **订阅**：RSS 2.0 全文输出，主源 `/index.xml` + 周刊专线 `/weekly/index.xml`，每源最多 20 条。
  **两个源都只收文章页**（`/about/` `/now/` `/roll/` `/privacy/` `/donate/` `/archive/` 一条都不进）。
  浏览器直接打开 feed 时用 `static/rss.xsl` 渲染成一页 HTML（标题 + 简介 + 标题/日期/摘要列表）
- **SEO**：canonical、Open Graph、JSON-LD、sitemap、robots、旧链接 301。
  `noindex, follow` 覆盖 **196 页**（184 个标签词条 + 8 个分类词条 + `/privacy/` + `/posts/` + `/donate/` + 404）。
  ⚠️ 每页 `og:image` 目前都是同一张 `share.webp`（按 slug 分图的 125 张已失效，见 DESIGN.md 第 8 节）
- **子站**：`run`（跑步数据）、`shot`（随手拍）、`share`（好物分享）、`profile`（个人主页），
  源码在 `sites/`，四个都已上线，配置见 [sites/README.md](sites/README.md)

## 目录结构

```
blog/
├── hugo.toml                   # 站点配置（导航、参数、permalinks、输出格式、代码高亮、Hugo 版本约束）
├── content/
│   ├── _index.md               # 首页文案（Hi! / 题记 / 简介 / 支持链接 / 五个平台入口链接）
│   ├── posts/                  # 101 篇文章 + _index.md（noindex，站内没有入口）
│   ├── weekly/                 # 24 期周刊 + _index.md（单独开了 RSS 输出）
│   ├── about.md now.md roll.md privacy.md archive.md             五个根级独立页
│   │                           # ⚠️ links.md 2026-10-11 已删：友链并进 roll.md（唯一的链接页）
│   ├── donate.md               # ↑ 之后的第 6 个独立页：支持页（两个赞赏码），2026-10-11 搬回
├── layouts/                    # ★ 站点层覆盖，只有 19 个文件（见 DESIGN.md 第 5 节）
│   ├── index.html              #   首页（上游只有 {{ .Content }}；简介不包 <content>）
│   ├── _default/baseof.html    #   LanguageCode → Language.Locale + 补回 robots 分支
│   ├── _default/single.html    #   去 `if eq .Type "blog"` 门槛 + hideDate/hideTitle + 系列带/上下篇 + 评论区
│   ├── _default/list.html      #   5 处文案英译中 + 删底部标签墙
│   ├── _default/rss.xml        #   加 pageLimit 上限
│   ├── _default/archive.html   #   ★ 新增：/archive/ 列表页 + 顶部「系列」横向入口
│   ├── _default/_markup/render-link.html  # ★ 新增：去掉 `</a>` 后面的换行（中文标点前多空格）
│   └── partials/               #   nav / footer / custom_head / giscus
│       └── breadcrumbs.html    #   ★ 新增：面包屑 + BreadcrumbList JSON-LD（只给文章页）
├── assets/js/giscus.js         # 评论区脚本（只在挂评论的页加载）
├── assets/js/code-copy.js      # 代码块复制按钮（只在含代码块的 5 页加载）
├── themes/hugo-bearneo/        # ★ 上游主题逐字节副本（27 个文件），**不要改这里**
├── scripts/                    # 发布前脚本、Garmin 同步、子站构建、仓库清理（13 个，见 MAINTENANCE.md）
├── data/
│   ├── runs.json               # 跑步数据（唯一一份，run 子站挂载读取）
│   ├── media.json              # 书影音数据（⚠️ 消费者已删除，见 DESIGN.md 第 8 节）
│   └── image_dims.json         # 正文远程图片宽高缓存（⚠️ 已失效）
├── static/                     # 原样发布：_headers / _redirects / 图标 / images/（头像、分享卡、donate/ 赞赏码、og/、uploads/）/ rss.xsl
├── sites/                      # 四个子站（各自独立的 Hugo 站点）
├── admin/                      # 本地图形界面后台（零依赖，双击 博客后台.command 启动）
├── archetypes/                 # hugo new 用的模板（posts / weekly）
├── publish.sh                  # 发布：刷新数据 → 提交 → 推 GitHub
├── deploy.sh                   # 只在本地干净构建到 public/，不部署
├── DESIGN.md                   # 设计规范（站点层 19 个文件的偏离 + 已删功能清单）
├── MAINTENANCE.md              # 维护手册（文件地图、坑、验收清单）
└── 博客后台.command             # 双击打开图形界面后台
```

## 本地运行

### 1. 装 Hugo（Extended，0.167.0+）

- macOS：`brew install hugo`
- Windows：`winget install Hugo.Hugo.Extended`
- Linux：参考[官方安装文档](https://gohugo.io/installation/)

```bash
hugo version   # 期望：hugo v0.167.0+extended ...
```

版本要在三处一致，否则会出现「本地正常、线上构建失败」：本机、`.github/workflows/build.yml` 的
`hugo-version`、Cloudflare Pages 五个项目的环境变量 `HUGO_VERSION`；`hugo.toml` 的
`[module.hugoVersion]` 是第四处。

⚠️ **`extended = true` 是历史遗留**：自建主题时代 `head-meta.html` 用 `imageConfig` 读分享图宽高，
非 extended 版解不了 WebP。迁移到 hugo-bearneo 后全仓库已经**没有任何 `imageConfig` 调用**，
标准版理论上也能构建 —— 但保持 extended 零成本，**先留着**，别为了顺手删掉去动 CI 和平台配置。

### 2. 预览

```bash
hugo server -D     # -D 连草稿一起显示，改文件自动刷新
```

只想构建一份干净的产物看看（不部署）：

```bash
./deploy.sh        # 干净构建到 public/，并检查产物里没有 livereload 调试脚本
```

⚠️ `hugo server` 开着会持续覆盖 `public/`。想在不打扰 server 的情况下验收，
构建到临时目录：`hugo --gc --minify --cleanDestinationDir --destination /tmp/hb-check`。

### 3. 新建一篇文章

```bash
hugo new content/posts/文章名.md      # 周刊：hugo new content/weekly/周刊-第N期.md
```

按 `archetypes/posts.md` 里的清单填 front matter，写完把 `draft` 改成 `false` 即可发布。
`date` 决定 URL（`/posts/年/月/日/slug/`），`slug` 决定 URL 的最后一段。

⚠️ **`series`（系列）和 `issue`（周刊期号）两个字段已作废** —— 没有模板读它们了，新文章不用填。

### 4. 图形界面后台（不想敲命令时用）

**双击仓库根目录的「博客后台.command」**，会自动起一个本地服务并打开浏览器（只监听 `127.0.0.1`，
不联网、不上传任何东西）。在里面可以看列表、筛草稿、新建文章 / 周刊 / 页面、表单改 front matter、
写正文、看真实预览、一键发布、改顶部导航。关掉那个终端窗口就停。

等价命令：`./admin/start.sh`。它只用 Python 3 标准库，不需要装任何东西。

> ⚠️ **不要直接打开 `admin/ui/index.html` 这个文件**。它的样式和脚本是分开的，只有由后台服务提供时
> 才会被内联进同一份 HTML；单独打开会是一片空白（页面里有兜底提示，照它做就行）。
> 默认端口 `8787`，被占用时后台会自动换端口并在终端里说明。

## 常用自定义

| 想改什么 | 去哪改 |
|---|---|
| 博客名 / 描述 / 作者 / 邮箱 | `hugo.toml` 顶部与 `[params]` |
| **导航菜单**（增删项 / 改标签 / 换落点） | `hugo.toml` 的 `[[menu.main]]`（`weight` 控制顺序），**不用碰模板** |
| 页脚 | `hugo.toml` 的 `copyright` / `copyrightNote` / `licenseName` / `licenseURL` / `[params.footer]` 四个开关；结构在 `layouts/partials/footer.html`（**四行顺序**：Made with → Copyright → 订阅行 → 英文授权行） |
| 首页文案 | `content/_index.md` |
| 首页列几篇 | `hugo.toml` 的 `homeRecentCount`（当前 5，设 0 就不显示列表） |
| 首页列表的对齐 | `layouts/partials/custom_head.html` 第 04 段（`padding-left: 0` 保证与标题左对齐） |
| 支持页 / 换赞赏码 | `content/donate.md` + `custom_head.html` 第 08 段。⚠️ 换码后去 Cloudflare Purge `/images/donate/*` |
| 链接页（朋友 / 聚合站 / 点评） | `content/roll.md` —— **全站唯一的链接页**，一条平铺 14 项（前 3 朋友、后 11 聚合站，无小标题）。条目写成 `名称：一句话点评`（点评待填） |
| 关于页介绍块 | `content/about.md`（**纯 Markdown，没有头像**；`custom_head.html` 第 03 段已留空） |
| **颜色 / 字体 / 宽度 / 圆角** | `themes/hugo-bearneo/layouts/partials/style.html` 的 `:root`（改上游，改完在 DESIGN.md 第 5 节登记） |
| 正文排版（标题间距 / 中文字体） | `layouts/partials/custom_head.html` 第 02 段 |
| 代码块配色 | `custom_head.html` 第 12 段（浅/深两套）。⚠️ 前提是 `hugo.toml` 的 `[markup.highlight] noClasses = false` |
| 面包屑 | `layouts/partials/breadcrumbs.html`（**新增文件**）+ `custom_head.html` 第 13 段。改**分类**那一段看 partial 里 `$catName` 那块（周刊刻意不加） |
| 独立页是否显示标题 | front matter 的 `hideTitle: true`（`/roll/` `/about/` `/now/` 开着） |
| 文末「系列」/「上一篇 / 下一篇」 | 模板 `layouts/_default/single.html` + `custom_head.html` 第 09 / 10 段 |
| 归档页「系列」横向入口 | 模板 `layouts/_default/archive.html` + `custom_head.html` 第 09 段 |
| 404 页 | `layouts/404.html` + `custom_head.html` 第 15 段 |
| 标题锚点 / 孤行保护 | `_markup/render-heading.html`（只文章页，第 19 段）+ `partials/orphan-safe.html`（全站，第 14 段） |
| 返回顶部 | `partials/back-top.html` + `custom_head.html` 第 16 段 |
| 代码复制按钮 | `assets/js/code-copy.js` + `partials/code-copy.html` + 第 18 段 |
| 分页 | **全站都不分页**（上游不用 `.Paginate`）。旧地址 `/page/*` 和 `/weekly/page/*` 由 `static/_redirects` 301 兜底 |
| 目录显示断点 | `themes/hugo-bearneo/.../style.html` 里搜 `800px` —— **只有一个断点**（≤800px 整块隐藏） |
| 图标 | `static/logo.svg`、`static/favicon.svg`、`static/apple-touch-icon.png`、`icon-192/512.png` |
| 评论 | `hugo.toml` 的 `[params.giscus]`；单篇用 `comments: false` 关掉 |
| 统计 | `hugo.toml` 的 `[params.analytics]`（当前只有 GoatCounter，挂在 `custom_head.html` 末尾） |
| 分享图 | `hugo.toml` 的 `params.images`（当前是 `images/share.webp`，**全站同一张**） |
| 加 301 / 改缓存头 | `static/_redirects`（首条命中即生效）/ `static/_headers` |
| 加根级独立页 | `content/xxx.md`（记得 `hideDate: true` + `toc: false`；纯工具页再加 `noindex: true`，参考 `content/donate.md`）+ 回 `_headers` 补一条缓存规则 |

## 接入 giscus 评论

giscus 基于 GitHub Discussions，不用自建后端：

1. 仓库设为 **public**
2. 仓库 **Settings → General → Features** 里开启 **Discussions**
3. 打开 [giscus.app](https://giscus.app)，填入仓库地址，按提示选分类
4. 它生成的那段 `<script>` 里，把 `data-repo`、`data-repo-id`、`data-category`、`data-category-id`
   抄进 `hugo.toml` 的 `[params.giscus]`
5. 重新构建：文章页正文下方会出现评论区（`repo` 留空则整块不显示；
   列表页 / 关于 / 现在 / 收藏（链接页）/ 隐私页也不会显示）

⚠️ `mapping = "pathname"` —— **只要 URL 不变，老评论就直接接上**。改 `[permalinks]` 会让评论全部断掉。

## 发布

线上是 **Cloudflare Pages 的 Git 集成**在构建：push 到 GitHub → 五个 Pages 项目（主站 + 四个子站）
各自构建发布。本机不装 wrangler，也不手动上传。

日常一条命令：

```bash
up            # 或 cd ~/Blog && ./publish.sh
```

`publish.sh` 在提交前会自动做四件事（都是失败不阻断发布）：抓正文远程图尺寸、刷新花园页内容快照、
给新写的中文标题补 `{#pinyin}` 锚点、刷新改动过文章的 `lastmod`。
⚠️ 其中**第一件和第四件现在已无可见产出**（见 DESIGN.md 第 8 节），但保留调用不影响发布。

CI（`.github/workflows/`）：

- `build.yml`：push / PR 时用同一个 Hugo 版本构建主站 + 四个子站，并检查中文标题锚点，
  把「本地没事、平台构建失败」挡在推送前。
- `sync-garmin.yml`：每天 22:00（Asia/Taipei）拉一次跑步数据，写进 `data/runs.json`。

## License

文章内容采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)（页脚那行由
`hugo.toml` 的 `copyrightNote` / `licenseName` / `licenseURL` 三个参数拼出），代码部分随意取用。

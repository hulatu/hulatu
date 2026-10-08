# 我的博客（Hugo）

`hulatu.com` 的源码：一个基于 [Hugo](https://gohugo.io/) 手写的极简个人博客，不用第三方主题，外加四个独立子站（`run.` / `shot.` / `share.` / `profile.hulatu.com`）。

> **这份 README 只讲「怎么跑起来」。** 想改站上的具体东西（版式、缓存、脚本、部署、常见故障），看 [MAINTENANCE.md](MAINTENANCE.md)——那份才是维护手册，两边冲突时以它为准。

## 功能特点

- **导航栏**：关于 / 归档 / 周刊 / 分类；右侧是搜索、深浅色切换、RSS 三个图标按钮
- **首页**：按时间倒序每页 10 篇（`hugo.toml` 的 `[pagination] pagerSize`），底部箭头翻页
- **文章页**：目录（宽屏右侧刻度栏，悬停展开；窄屏排在正文开头）、相关文章、评论、「更新于」（文末的「上一篇 / 下一篇」2026-10-05 已删除，只留相关文章；阅读进度条与返回顶部 2026-10-08 起只挂长文页）
- **周更栏目**：周刊独立成栏（`/weekly/`），正文走 `/posts/年/月/日/slug/`，另有单独的 RSS
- **搜索**：构建期生成 `search-index.json`，纯前端搜索（`/` 或 `⌘K` 打开）；面板底部可按分类 / 标签筛选，空态显示最近 5 次搜索
- **深浅色**：默认跟随系统，右上角按钮可手动切换（刷新后回到跟随系统，不记忆）
- **归档**：按年、月折叠分组，统计总篇数和今年写字数；顶部另有「系列」胶囊（`content` 里写 `series:` 即可加一组连载）和「按年」年份索引（页内跳转）
- **分类 / 标签**：自动生成总览和文章列表页（入口在页脚）
- **书影音**：`/media/` 读 `data/media.json`，数据由 `scripts/sync-douban.py` 从豆瓣公开收藏页同步（书籍 / 影视 / 音乐三组，封面下载到 `static/images/media/`）。**不要在 `content/media/_index.md` 里手写卡片**，下次同步会覆盖 —— 要加条目去豆瓣标记，然后跑脚本
- **结算页**：`/stats/` 把累计数字摊开 —— 篇数 / 字数 / 按月写作格（印泥红浓淡）/ 分类构成 / 跑步里程。纯构建期生成、零 JS（数据源：content 的日期与字数 + `site.Taxonomies.categories` + `data/runs.json`）
- **订阅**：RSS 2.0 全文输出，主源 `/index.xml` + 周刊专线 `/weekly/index.xml`，每源最多 20 条，每条带 `atom:updated`（更新于）
- **评论**：giscus（GitHub Discussions），按需加载
- **站内预取**：浏览器原生 Speculation Rules，点链接前先把下一页渲染好
- **SEO**：canonical、Open Graph、JSON-LD、sitemap、robots、旧链接 301（Twitter Card 已删除，X 优先读取 Open Graph）
- **子站**：`run`（跑步数据）、`shot`（随手拍）、`share`（好物分享）、`profile`（个人主页），源码在 `sites/`，四个都已上线，配置见 [sites/README.md](sites/README.md)

## 目录结构

```
blog/
├── hugo.toml                   # 主站配置（菜单、分页、订阅条数、评论、打赏…）
├── content/
│   ├── posts/                  # 普通文章
│   ├── weekly/                 # 周刊（front matter 里额外开了 RSS）
│   ├── about.md                # 「关于」页（版式走 layouts/_default/about.html）
│   ├── archive.md              # 「归档」页
│   ├── stats.md                # 「结算」页（版式走 layouts/_default/stats.html）
│   ├── privacy.md              # 「隐私政策」（noindex）
│   ├── friends/ media/         # 友链、书影音
│   ├── categories/ tags/       # 分类、标签总览页
│   └── posts/_index.md         # 「文章」栏目页（noindex，站内没有入口）
├── layouts/                    # 模板：_default / partials（`shortcodes/` 2026-10-08 已空、整个目录移除）
├── assets/
│   ├── css/                    # 样式按「首屏 / 异步」两组拆，内联部分再按页型分档（见 layouts/partials/css-modules.html）
│   │   ├── critical.css        #   ★内联：每个页面的首屏骨架；设计令牌都在这个文件顶部
│   │   ├── critical-post.css   #   ★内联：文章页额外要的（文章头 / 元信息行 / 目录 / 正文排版）
│   │   ├── critical-page.css   #   ★内联：列表型页面额外要的（列表骨架 / 标签云 / 分类 / 书影音）
│   │   ├── critical-info.css   #   ★内联：一页一型的信息页额外要的（归档 / 关于 / 友链 / 404 / 结算）
│   │   ├── core.css            #   异步包：全站共用（页头交互、搜索、灯箱、提示条…）
│   │   └── post.css            #   异步包：文末家具（评论 / 相关文章 / 打赏）—— 文章页 + 关于页（后者只为打赏）
│   └── js/                     # theme / ui / toc / lightbox / search / giscus
├── scripts/                    # 发布前脚本、Garmin / 豆瓣同步、子站构建
├── data/
│   ├── runs.json               # 跑步数据（唯一一份，run 子站挂载读取）
│   ├── media.json              # 书影音数据（scripts/sync-douban.py 从豆瓣同步）
│   └── image_dims.json         # 正文远程图片的宽高缓存
├── static/                     # 原样发布的文件：_headers / _redirects / 图标 / 头像与分享卡（images/）/ 打赏收款码（images/donate/） / 豆瓣封面（images/media/） / rss.xsl …
├── sites/                      # 四个子站（各自独立的 Hugo 站点）
├── admin/                      # 本地图形界面后台（零依赖，双击 博客后台.command 启动）
├── archetypes/                 # hugo new 用的模板（posts / weekly）
├── publish.sh                  # 发布：刷新数据 → 提交 → 推 GitHub
├── deploy.sh                   # 只在本地干净构建到 public/，不部署
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

**Extended 是硬要求**：`layouts/partials/head-meta.html` 要用 `imageConfig` 读 `static/images/share.webp` 的宽高，标准版 Hugo 解不了 WebP。

版本要在三处一致，否则会出现「本地正常、线上构建失败」：本机、`.github/workflows/build.yml` 的 `hugo-version`、Cloudflare Pages 五个项目的环境变量 `HUGO_VERSION`。校验逻辑在 `layouts/partials/check-hugo-version.html`：版本不够直接失败并打印当前版本，缺 extended 只警告（Cloudflare 的 `HUGO_VERSION` 只能填版本号）。

### 2. 预览

```bash
hugo server -D     # -D 连草稿一起显示，改文件自动刷新
```

只想构建一份干净的产物看看（不部署）：

```bash
./deploy.sh        # 干净构建到 public/，并检查产物里没有 livereload 调试脚本
```

### 3. 新建一篇文章

```bash
hugo new content/posts/文章名.md      # 周刊：hugo new content/weekly/周刊-第N期.md
```

按 `archetypes/posts.md` 里的清单填 front matter，写完把 `draft` 改成 `false` 即可发布。`date` 决定 URL（`/posts/年/月/日/slug/`），`slug` 决定 URL 的最后一段；`lastmod` 不用手改，`publish.sh` 会自动刷（文章页的「更新于」靠它）。

### 4. 图形界面后台（不想敲命令时用）

**双击仓库根目录的「博客后台.command」**，会自动起一个本地服务并打开浏览器（只监听 `127.0.0.1`，不联网、不上传任何东西）。在里面可以看列表、筛草稿、新建文章 / 周刊 / 页面、表单改 front matter、写正文、看真实预览、一键发布、改顶部导航。关掉那个终端窗口就停。

等价命令：`./admin/start.sh`。它只用 Python 3 标准库，不需要装任何东西。

> ⚠️ **不要直接打开 `admin/ui/index.html` 这个文件**。它的样式和脚本是分开的，只有由后台服务提供时才会被内联进同一份 HTML；单独打开会是一片空白（页面里有兜底提示，照它做就行）。默认端口 `8787`，被占用时后台会自动换端口并在终端里说明。

细节和设计约束见 [MAINTENANCE.md](MAINTENANCE.md) 的「图形界面后台」一节。

## 常用自定义

| 想改什么 | 去哪改 |
|---|---|
| 博客名 / 描述 / 作者 / 邮箱 | `hugo.toml` 顶部与 `[params]` |
| 导航菜单 | `hugo.toml` 的 `[[menu.main]]`（`weight` 控制顺序） |
| 页脚链接 | `layouts/partials/footer.html` |
| 每页几篇 | `hugo.toml` 的 `[pagination] pagerSize`（模板里的 `.Paginate` 故意不传第二个参数） |
| 颜色 / 字体 / 间距 | `assets/css/critical.css` 顶部的 CSS 变量（`--font-meta` 元信息等宽字体也在那）；**五个站要一起改**，见 [sites/README.md](sites/README.md) 的颜色约定 |
| 正文 / 页头宽度 | `assets/css/critical.css` 的 `--content-width`（当前 680px，五个站同宽） |
| 头像 | 图片放 `static/images/`，路径填 `hugo.toml` 的 `params.avatar`；文件不在就退回「胡」字印章。页面渲染时会自动套 Cloudflare Image Transformations 按显示尺寸出图（开关 `params.avatarCDN`） |
| 图标 | `static/logo.svg`、`static/favicon.svg`、`static/apple-touch-icon.png`、`icon-192/512.png` |
| 目录显示断点 | `assets/css/critical-post.css` 里搜 `1152px`（右侧刻度栏）和 `1151.98px`（正文开头那块）。这是**成对**的两个断点（另加 `single.html` 一处注释），改一处要四处同改，详见 MAINTENANCE.md |
| 周刊期号徽章 | 周刊 front matter 的 `issue: 23`（不填不显示徽章） |
| 打赏 | `hugo.toml` 的 `[params.donate]`（留空则整块不显示）。**只出现在关于页**，文章页没有（2026-10-02 起）。收款码是站内静态图 `static/images/donate/{wechat,alipay}.webp`，不是图床图；换图覆盖同名文件后要去 Cloudflare Purge 一次 `/images/donate/*`（那条路径有 30 天缓存） |
| 评论 | `hugo.toml` 的 `[params.giscus]`；单篇用 `comments: false` 关掉 |
| 统计 | `hugo.toml` 的 `[params.analytics]`（当前只有 GoatCounter） |
| 分享图 | `hugo.toml` 的 `[params.assets] shareImage`；想给某篇单独指定，在它的 front matter 写 `cover`（预留能力，目前没有文章在用） |

## 接入 giscus 评论

giscus 基于 GitHub Discussions，不用自建后端：

1. 仓库设为 **public**
2. 仓库 **Settings → General → Features** 里开启 **Discussions**
3. 打开 [giscus.app](https://giscus.app)，填入仓库地址，按提示选分类
4. 它生成的那段 `<script>` 里，把 `data-repo`、`data-repo-id`、`data-category`、`data-category-id` 抄进 `hugo.toml` 的 `[params.giscus]`
5. 重新构建：文章页正文下方会出现评论区（`repo` 留空则整块不显示，关于 / 归档这类页面也不会显示）

## 发布

线上是 **Cloudflare Pages 的 Git 集成**在构建：push 到 GitHub → 五个 Pages 项目（主站 + 四个子站）各自构建发布。本机不装 wrangler，也不手动上传。

日常一条命令：

```bash
up            # 或 cd ~/Blog && ./publish.sh
```

`publish.sh` 在提交前会自动做四件事（都是失败不阻断发布）：抓正文远程图尺寸、刷新花园页内容快照、给新写的中文标题补 `{#pinyin}` 锚点、刷新改动过文章的 `lastmod`；然后提交、推 GitHub、拉取远端、再推一次。

CI（`.github/workflows/`）：

- `build.yml`：push / PR 时用同一个 Hugo 版本构建主站 + 四个子站，并检查周刊的 `issue` 字段、中文标题锚点，把「本地没事、平台构建失败」挡在推送前。
- `sync-garmin.yml`：每天 22:00（Asia/Taipei）拉一次跑步数据，写进 `data/runs.json`。

## License

文章内容采用 CC BY-NC-SA 4.0（`hugo.toml` 的 `copyright`），代码部分随意取用。

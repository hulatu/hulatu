# 博客维护指南

给「胡拉图说」的日常维护和局部改动说明。改动模板或写完文章后，在终端输入 `up` 即可发布。

## 一、日常写作

### 新建文章

```bash
hugo new content/posts/我的新文章.md        # 普通文章
hugo new content/weekly/周刊-第N期.md       # 周刊
```

生成的文件顶部是 front matter（文章设置），常用字段：

| 字段 | 作用 |
|---|---|
| `title` | 标题 |
| `slug` | URL 后缀（**统一小写**：Hugo 默认会把 URL 小写化，写大写会跟实际地址对不上）；改后旧链接会失效（想保留旧链接需加 301，见"部署"） |
| `summary` | 摘要、分享卡片描述 |
| `description` | 搜索结果、社交卡片上那段描述，**建议 60–90 字**（中文搜索结果大约只显示 78 字）。留空会退回用 `summary`，而 `summary` 通常只有十几个字，分享出去就是一句没头没尾的短句——所以别留空 |
| `categories` / `tags` | 分类 / 标签，决定分类页、标签云、相关文章 |
| `comments` | 填 `false` 可单独关闭这篇文章的评论 |
| `draft` | `true` 表示草稿，不会发布 |

发布前把 `draft` 改成 `false`，然后执行 `./publish.sh`（或终端里的 `up`）。`publish.sh` 在提交前会自动做四件事：抓正文远程图片的宽高、刷新花园页的内容快照、给新写的中文标题补 `{#pinyin}` 锚点、把这次改动过的文章的 `lastmod` 刷成当前时间（见下面「标题锚点」和「文章页的『更新于』」）。

### 标题锚点（中文标题为什么要写 `{#xi-guan}`）

标题后面的 `{#...}` 就是这段小节的链接锚点。中文标题不写它，Hugo 就把中文原文当 id，分享出去的链接会变成 `https://hulatu.com/posts/...#%e4%b9%a0%e6%83%af` 这种看不懂的百分号编码；写了就变成 `#xi-guan`，一眼能看出是哪个小节，粘贴到聊天软件、邮件里也不会变形。

默认不用自己写：`publish.sh` 会跑 `scripts/add-heading-anchors.py`，用 macOS 自带的拼音转写给缺锚点的中文标题补上（`## 习惯` → `## 习惯 {#xi-guan}`，超长标题只取前 6 段拼音）。已经写了 `{#...}` 的标题一律不动，所以想改成英文词直接手写就行，比如 `## 习惯 {#habit}`。

两个注意点：改标题文字不会自动改已有锚点，链接会「停在原地」——想让老链接继续能用，就别改已经分享出去的 `{#...}`；锚点只在本地补齐，CI 里的 `--check` 只做检查不修改，缺了会报错并列出文件行号。

### 文章页的「更新于」靠什么出现

文章页头部那行是「发布于 X · 更新于 Y · 约 N 字 · 读 M 分钟」，其中「更新于」只在 `lastmod` 比 `date` **晚**的时候才出现（模板是 `layouts/_default/single.html` 里的 `gt .Lastmod.Unix .Date.Unix`，比的是完整时间戳，所以当天写完、当天又改一版也会显示，只是两个日期看着一样）。

坑在 Hugo 的默认行为：front matter 里没写 `lastmod` 时，`.Lastmod` 直接退回用 `date`——于是「改了文章、忘了改 lastmod」的结果就是这一行永远不出现。所以这件事不靠人手记：`publish.sh` 在 `git add` 之前会跑 `scripts/sync-lastmod.py`，把**这次真正改动过**的文章的 `lastmod` 刷成当前时间（+08:00）。

它判断「真正改动过」的方式是：当前文件和上一个提交里的版本都去掉 `lastmod:` 那一行再比较，相同就跳过。这样一来，反复跑 `publish.sh` 不会一直刷新（刷完 lastmod 后，第二次比较两边都被去掉，仍然相同），新写的文章也不会多出一行「更新于」（HEAD 里没有的新文件直接跳过）。**默认只看 `content/posts/` 和 `content/weekly/`**——只有文章页会显示「更新于」，改「关于」「隐私政策」这类页面时不该跟着动 lastmod。

想手动给某篇老文章盖上「更新于」，两种办法：

```bash
# 1. 内容确实要改：直接改正文，publish.sh 会自动刷
# 2. 只想盖章、内容不动：强制刷一个文件
python3 scripts/sync-lastmod.py --force content/posts/某篇.md
```

想先看会刷哪些、不写文件，加 `--dry-run`。

### 文章短代码

正文里可以直接用的排版组件，只有书影音这一类：

| 短代码 | 用途 | 用法 |
|---|---|---|
| `media` | 单条书影音（书 / 影视 / 音乐通用） | `{{< media cover="封面图" title="标题" creator="作者" >}}` |
| `media-grid` | 把若干 `media` 包成网格 | `{{< media-grid >}}…{{< /media-grid >}}` |

两个短代码都只是转调 `layouts/partials/media-card.html`（单条）和包一层 `.media-grid` 的 div（网格），排版细节在 `assets/css/style.css` 的「书影音」段。用法直接抄 `content/media/_index.md` 的现成例子。

> 曾经还有 `book` / `books` 两个短代码，和 `media` / `media-grid` 逐字相同（只是名字更贴「书」），2026-09 删掉了：留着就是两份要同步维护的同样内容，`content/media/_index.md` 也改成了 `media` / `media-grid`。

> 曾经还有 `tip` / `note` / `warning` / `fold` 四个提示框短代码，配套一份 `assets/css/shortcodes.css` 和 baseof 里「这一页用到才加载」的判断。2026-09 清掉了：内容里一次都没用过。要提示框直接用 Markdown 引用块；真要用短代码，`git log --diff-filter=D --name-only -- layouts/shortcodes` 能把文件捞回来。

### 备份

```bash
bash scripts/backup-blog.sh
```

默认备份到 `~/Backups/hulatu-blog/`，会生成内容快照和 Git bundle。要备份到外置盘：

```bash
BACKUP_DEST="/Volumes/SSD/hulatu-blog" bash scripts/backup-blog.sh
```

### 子站点

`run.hulatu.com`、`shot.hulatu.com`、`share.hulatu.com` 和 `profile.hulatu.com` 是独立 Hugo 站点，源码分别在 `sites/run/`、`sites/shot/`、`sites/share/` 和 `sites/profile/`，四个都已经上线（`shot`、`share` 内容还少，但项目和数据都在跑）。本地一起构建：

```bash
bash scripts/build-subdomains.sh
```

Cloudflare Pages 需要为各子域名分别创建项目，具体配置见 `sites/README.md`。

跑步子站（`sites/run`）**不存数据副本**，它的 `hugo.toml` 用 `[[module.mounts]]` 直接挂载仓库根目录的 `data/`；`scripts/sync-garmin.py` 只写 `data/runs.json` 和 `sites/profile/data/run_summary.json` 两个文件。

### 本地预览

```bash
hugo server -D
```

`-D` 会同时显示草稿。预览时不要运行 `./deploy.sh`（`hugo server` 会把调试脚本写进 public/，脚本已做检测并中止）。

## 二、各部分怎么改

| 想改什么 | 去哪改 |
|---|---|
| 博客名、描述、作者 | `hugo.toml` 顶部 |
| 导航菜单 | `hugo.toml` 的 `[[menu.main]]`（`weight` 控制顺序） |
| 页脚、头像、社交链接 | `layouts/partials/footer.html`、`hugo.toml` |
| 页脚链接（花园 / 友链 / 开往 / 隐私 / 邮箱 / CC 协议） | `layouts/partials/footer.html` 的 `.footer-links` 和 `.footer-license`。**开往（友链接力）放在页脚，不在导航栏**——导航栏只留搜索 / 深浅色 / RSS 三个图标按钮 |
| 标签页图标 / 页头 logo | `hugo.toml` 的 `[params.assets]`：`logo` 给页头那个大 logo（深色模式由 CSS 的 `filter` 反白），`favicon` 给标签页（`static/favicon.svg`，文件里内置了 `prefers-color-scheme` 深色反白）。**两个文件是故意分开的**：favicon 里的反白规则会和页头的 `filter` 叠加成反色，混用会出问题 |
| 添加到主屏幕（PWA） | `static/site.webmanifest` + `static/icon-192.png` / `icon-512.png`。图标由 `logo.svg` 渲染而来，要重做就用：`magick -background none SVG:static/logo.svg -resize 512x512 -colors 64 -strip -define png:compression-level=9 static/icon-512.png`（`-colors 64` 能把 76KB 压到 30KB，肉眼无差） |
| 分享卡片图 | `[params.assets] shareImage`。宽高由 `layouts/partials/head-meta.html` 用 `imageConfig` 现读，换图不用改模板；文章 front matter 里写了 `cover` 就用 cover，但远程图读不到尺寸，那两个 meta 就不输出 |
| 首页文案（"总得留下点什么吧"） | `layouts/index.html` 顶部的 `.site-hero` |
| 首页 / 周刊每页展示几篇 | `hugo.toml` 的 `[pagination] pagerSize`（当前 10）。模板里 `.Paginate` **故意不传第二个参数**，就是让它读这个配置——以前模板里写死 10，配置里那个 `pagerSize` 改了没用，等于两个数字打架 |
| 周刊期号徽章 | 读 front matter 的 `issue: 22`（模板里是 `.Params.issue`）。**新写一期周刊记得填这个字段**，不填就不显示徽章。以前是从标题「第 X 期」里正则解析中文数字（`layouts/partials/issue-num.html`，2026-09 已删）：那种写法只在标题里能看出来，改标题就悄悄失效，还多一层中文数字解析 |
| 相关文章（取几篇、按什么匹配） | `hugo.toml` 的 `[related]`；模板在 `layouts/_default/single.html` |
| 上一篇 / 下一篇导航 | `layouts/_default/single.html` 里的 `.post-nav` |
| 标签云（展示哪些标签） | `layouts/_default/taxonomy.html` 里 `site.Taxonomies.tags.ByCount` |
| 目录在哪显示 | `assets/css/style.css` 搜 `1280px`。≥1280px 悬浮在正文右侧（刻度栏）；<1280px 排在正文开头（`.post-toc-inline`，可点标题栏收起），手机上默认收起。**页面里没有浮动目录按钮**：2026-09 按需求删掉了左下角那个按钮和它的底部抽屉，窄屏一律看正文开头那块 |
| 正文 / 页头宽度 | 只有 `--content-width`（`assets/css/style.css` 顶部，当前 **680px**，照 sspai 文章页量的：它的 `.article__section__wrapper` 是 728px 含 24px 内边距）。`.container` 用它加两侧 `--gutter` 当 max-width（内边距留在外面），所以**页头（导航栏）、正文、列表页是同一个内容宽度**；`.post-content`、`.post-toc-inline`、`.friends-page`、`.about-page`、`.page-intro` 也都引用它。**四个子站同宽**：各自 `static/style.css` 的 `:root` 里也有一份 `--content-width: 680px`，靠 `main { width: min(var(--content-width), calc(100% - 32px)) }` 取（profile 是 `- 40px`）。改宽度要五处一起改，详见 `sites/README.md` |
| 文章排版（字号 / 行高 / 段间距） | 数值照 sspai 文章页（`.wangEditor-txt`）：正文 **17px / 1.8**、段间距 **32px**、H2 **32px**（上间距 56px = 段距 + 24px）、H3 **24px**（上 48px）、H4 与正文同号、文章标题 **38px**；手机（≤760px）各降一档：15px / 24px / 24px / 20px / 28px（= sspai 的 `<768px` 那一套）。变量是 `--text-reading`、`--reading-leading`、`--block-gap`、`--h2-size`、`--h3-size`、`--post-title-size`，`--h2-gap-top` / `--h3-gap-top` 由 `--block-gap` 自动跟着缩。**这套是单开的**：别顺手改全站的 `--text-lg` / `--text-md`，否则归档年份、友链 / 关于页的小标题会跟着跳 |
| 点目录 / 带 `#锚点` 进页面时标题停在哪儿 | 只由 `assets/css/style.css` 的 `--anchor-offset`（顶栏 `--header-h` + `--space-3` = 76px）决定，挂在 `main [id]` 的 `scroll-margin-top` 上。**别在 `html` 上再加 `scroll-padding-top`**——两个值会叠加，标题会被顶到离顶部将近 180px，看着就像没对准。带锚点进页面时 `assets/js/toc.js` 的 `initHashAnchor()` 会在图片 / 字体就位后重新对准一次；链接里是换成拼音之前的旧中文锚点（`#%e4%b9%a0%e6%83%af`）时，会自动退回按标题文字找 |
| 中文标题的锚点 | 中文标题要显式写 `{#pinyin}`（`## 习惯 {#xi-guan}`），不写的话分享链接是 `#%e4%b9%a0%e6%83%af`。日常不用手写，`publish.sh` 会跑 `scripts/add-heading-anchors.py` 自动补；想用英文词就自己写 `{#habit}`，脚本看到已有 `{#...}` 会跳过。CI 里另有一道 `--check` 兜底 |
| 手动提交发布 | 终端输入 `up` → `publish.sh`（抓取正文图片宽高 → 提交本地改动 → 推 GitHub → 拉取远端 → 再推送）→ `hugo --minify`（**只写本地 `public/`，给自己看**）。**真正的上线由 Cloudflare Pages 的 Git 集成在 push 后自动构建完成**；本机没有 wrangler，也不做手动上传 |
| 正文图片宽高 | 远程正文图（图床）构建期读不到尺寸，会让页面加载时跳动。`scripts/fetch-image-dims.py` 抓一次尺寸写进 `data/image_dims.json`（已提交），模板 `layouts/_default/_markup/render-image.html` 查表输出 `width`/`height`。新增图片后跑一次脚本即可，已缓存的会跳过 |
| 脚本怎么读 front matter | 统一走 `scripts/_frontmatter.py`（`split` / `fields` / `read` / `write` / `remove`）。它只做「按行找字段」，不做 YAML 解析——front matter 里有中文注释、对齐用的行尾空格，用 PyYAML 解析再 dump 回去会把注释和空行冲掉，diff 变成整块重写。以前 `fetch-profile-content.py` 和 `sync-lastmod.py` 各写一份正则，字段清单和换行处理都不一致：**`fetch-profile-content.py` 的字段清单漏了 `image`，导致 `_shot_item()` 永远返回 None、`selected_photos.json` 恒为空**（2026-09 修），加字段时记得两边都看。 |
| 图片灯箱 | 结构在 `layouts/_default/_markup/render-image.html`：图片被 `<a class="article-image-link" href="原图">` 包着，JS 拦下点击打开灯箱，JS 不可用时退化成「点开原图」。样式在 `assets/css/style.css` 的「文章插图」段，逻辑在 `assets/js/lightbox.js`（原图地址直接读链接的 `href`，不再用 `data-full`） |
| 键盘可达性 / 焦点陷阱 | 两个弹层（搜索框、图片灯箱）共用 `assets/js/focus-trap.js` 提供的 `window.hulatuFocusTrap(容器, 初始焦点)`，关闭时记得调用它返回的 `release()` 并把焦点还给触发按钮。**这个文件必须在 `layouts/partials/scripts.html` 的打包顺序里排第一**，否则后面几个脚本运行时拿不到它 |
| 评论 | 配置 `hugo.toml` 的 `[params.giscus]`；单篇关闭用 `comments: false`。DOM 在 `layouts/partials/giscus.html`，行为逻辑在 `assets/js/giscus.js`：滚到评论区前 400px **在后台把 giscus 预加载好，但整块收着不展开**，「显示评论」按钮一直留着；读者点了才展开——因为内容已经加载完，展开是瞬间的、不会先白一下。状态机只有一个 `state` 变量（`idle → loading → ready → slow → open`，`opening` 表示「读者已经在等」），并镜像到 `.giscus-body` 的 `data-state`，调试时在开发者工具里直接看得见。等 iframe 用的是 **MutationObserver，不是定时轮询**；两个超时各管一段：点开后 12 秒没出来才变「重新加载评论」，预加载 2 分钟没结果就静默作废。**这个脚本单独打包、只在带评论的文章页加载**（`giscus.html` 里的 `resources.Get`），不塞进全站 bundle。收起用的 `.giscus-body { max-height: 0; visibility: hidden }`，**别改成 `display: none`**，那样 iframe 没有布局尺寸，giscus 会把高度算成 0 |
| 文章目录 | 同一份目录在页面里有两份副本：宽屏刻度栏（`id="TableOfContents"`）和正文开头那块（`TableOfContentsInline`，<1280px 显示），后者的 id 由 `single.html` 里的 `replaceRE` 改掉，避免重复 id。四段逻辑都在 `assets/js/toc.js`：`init()` 管滚动高亮（对页面里所有 `.post-toc-nav` 一起生效），`initPin()` 管宽屏图钉的「钉住」，`initInlineToc()` 负责手机上把正文开头那块默认收起，`initHashAnchor()` 管带 `#锚点` 进页面后的重新对准。新增目录副本时记得同步改 id，样式挂 `.post-toc-nav` 就能直接复用编号和高亮 |
| 宽屏目录的刻度栏 / 钉住 | 参考 sspai 文章页的目录（`.comp__Directory`），尺寸照它量：**面板 244px 宽、纵向居中、面板左边缘离正文右边缘 128px**（`right: max(0px, calc(50vw - 712px))`，推导写在样式表注释里）、文字 15px、收起一行 12px（刻度 2×6px）、展开一行 33px（刻度 21px，`border-radius: 6px`）、二级标题的文字再缩进 16px（**刻度始终排在同一列**，只缩进文字）。收起态用 `color: transparent` 让标题占位：**别改成 `display: none` 或收掉宽度**，否则展开时会把正文挤动。图钉按钮 `#toc-pin` 由 `initPin()` 切成 `.is-pinned`，状态不跨页面记；它只在 ≥1280px 生效（窄屏整块 `.post-rail` 是 `display: none`）。**图钉的位置**：`.post-toc-wrap` 是 `display: flex; flex-direction: column`，图钉是它的第一行（`align-self: flex-start`），所以钉在**目录框左上角**、目录本体从它下面 4px（`gap: var(--space-1)`）开始——不要改回 `position: absolute` 浮在面板上方，那样它会跑出目录的边界 |
| 目录为什么居中得很稳 | `.post-rail` 是 `top: var(--header-h)` / `bottom: 0` 的固定容器（`display: flex; align-items: center; pointer-events: none`），里层 `.post-toc-wrap` 才裹着图钉和目录本体并把 `pointer-events` 打开。**容器高度是固定的**，所以悬停展开（一行 12px → 33px）时只有里面的行在长，整块目录不会上下滑——这正是不用 `top: 50% + translateY(-50%)` 的原因。改回居中时别丢掉这一层结构，也别把 `pointer-events` 一起放开（那样右侧一整条会挡住页面点击）。图钉用 `visibility: hidden` 藏着（**不是 `display: none`**），占位一直留着，所以鼠标扫进来把它点亮时目录不会上下跳 |
| 深浅色 | 默认跟随系统；右上角按钮手动切换（带旋转动效），**不记忆选择**（刷新后回到跟随系统）。逻辑在 `assets/js/theme.js`，配色变量在 `assets/css/style.css` 的 `[data-theme="dark"]` |
| 打赏 | `hugo.toml` 的 `[params.donate]`。收款码图片在 `layouts/partials/donate.html` 里走 `cf-image.html`（`width=400,format=auto`）——原图是没压缩的 JPEG，且文件后缀错写成 `.webp`（直接返回的 Content-Type 是 `image/jpeg`），过一层图片变换后按浏览器给 avif/webp，顺带把这个错误头一起修掉。换收款码时**别在模板里直接写原始 URL** |
| Hugo 版本 | **三处必须一致**：本机 `hugo version`、`.github/workflows/build.yml` 的 `hugo-version`、Cloudflare 五个项目的 `HUGO_VERSION`（主站 + 四个子站）。硬校验在 `layouts/partials/check-hugo-version.html`（`baseof.html` 顶部引入）：**版本不够直接失败**并报出当前版本；**缺 extended 只打 WARN**（Cloudflare 的 `HUGO_VERSION` 只能填版本号，硬拦会误伤线上；真用到 extended 功能时 Hugo 自己会报错）。`hugo.toml` 的 `[module.hugoVersion]` 只起文档作用——实测它在项目自身配置里只打一行 WARN，拦不住构建 |
| 构建校验（CI） | `.github/workflows/build.yml`：push / PR 时用 0.166.0 extended 构建主站 + 调用 `scripts/build-subdomains.sh` 构建四个子站，另外检查每篇周刊的 front matter 有没有 `issue` 字段（漏填只会不显示徽章、不报错，所以单独查一遍）。这是「本地没事、Cloudflare 构建失败」的第一道拦截 |
| 订阅格式 | `layouts/_default/rss.xml`。首页主源 `/index.xml` + 周刊源 `/weekly/index.xml`（在 `content/weekly/_index.md` 里用 `outputs` 单独开）；栏目默认不出 RSS，改 `hugo.toml` 的 `[outputs] section`。每个源最多 20 条全文，见 `[services.rss] limit` |
| 阅读时长 / 字数 | `layouts/_default/single.html` 的 `.post-meta-main`，按 350 字/分钟算阅读时长 |
| 文章页的「更新于」 | 同一个 `.post-meta-main`：`lastmod` 比 `date` 晚才显示（比完整时间戳，不是比日期）。`lastmod` 由 `publish.sh` 里的 `scripts/sync-lastmod.py` 自动刷，别手改——手动盖章用 `python3 scripts/sync-lastmod.py --force 某篇.md`，详见「文章页的『更新于』」 |
| 文章页头部版式 | **日期 / 字数 / 阅读时长在左，分类和标签贴右**（`.post-meta` 用 `justify-content: space-between`，见 `assets/css/style.css`）。这是刻意定的，不是对齐错了。窄屏放不下而换行时，标签会另起一行、从左边开始——那是 `space-between` 对「单独占一行的子项」的正常表现，不用改 |
| 代码块（红绿灯 + 复制） | 结构在 `layouts/_default/_markup/render-codeblock.html`，样式在 `assets/css/style.css` 的 `.code-block`，复制逻辑在 `assets/js/ui.js` |
| 面包屑 | `layouts/_default/single.html` 的 `.breadcrumb`（首页 › 分类 › 标题） |
| 阅读进度条 / 返回顶部 / Header 自动隐藏 | 逻辑都在 `assets/js/ui.js`，样式在 `assets/css/style.css`（`.reading-progress`、`.back-top`、`.site-header.is-hidden`） |
| 站内跳转预渲染 + 页面过渡 | 预渲染规则在 `layouts/_default/baseof.html` 的 `<script type="speculationrules">`（当前是 `prerender` + `eagerness: moderate`，嫌费流量就改成 `conservative`）；过渡样式在 `assets/css/style.css` 的「跨页面视图过渡」段。**预渲染会真的执行页面脚本**，所以统计（`layouts/partials/analytics.html`）和评论（`layouts/partials/giscus.html`）都判断了 `document.prerendering`，以后新加的第三方脚本也要照做 |
| 完字章 | `layouts/_default/single.html` 的 `.post-end`（印章红「完」字圆章） |
| 打印样式 | `assets/css/style.css` 末尾的 `@media print`（打印/存 PDF 时隐藏导航、评论等，只留正文） |

### 颜色 / 字体 / 间距

全部在 `assets/css/style.css` 顶部的 `:root`（浅色）和 `[data-theme="dark"]`（深色）变量里，比如：

```css
--accent: #c73e2f;      /* 印章红，全站主色 */
--paper: #f6f6f8;       /* 冷白浅色背景 */
--surface: #ffffff;     /* 卡片 / 分组列表 */
--ink: #1d1d1f;         /* 正文文字 */
--font-serif: ...;      /* 标题字体 */
```

用色的两条硬规则：

- **印泥淡痕底（`--accent-soft`）+ 小字，颜色要用 `--accent-ink`，不要用 `--accent`。** 浅色下 `--accent` 打在 `--accent-soft` 上只有 4.33:1，达不到 WCAG AA 的 4.5；`--accent-ink` 是 5.72:1（深色下 5.57 → 7.40）。分类页角标、周刊徽标、搜索高亮都按这条改过了。
- 其他组合的对比度都是达标的（正文、次要信息、代码高亮、按钮文字，浅色深色都算过），改配色时保持这个水位即可。

字号统一走一套尺度（16px 基准 × 1.2 比例）：

```css
--text-2xs: 0.72rem;      /* 角标 / 极小元信息 */
--text-xs: 0.86rem;       /* 元信息 / 说明文字 */
--text-sm: 1rem;          /* 基础 UI */
--text-md: 1.2rem;        /* 小标题 */
--text-lg: 1.44rem;       /* 页面标题 / h2 */
--text-xl: 1.73rem;       /* 大标题（< 760px 时收到 1.44rem） */
--text-2xl: 2.07rem;      /* 文章标题上限（< 760px 时收到 1.73rem） */
--text-reading: 1.0625rem; /* 正文 17px（< 760px 时收到 0.9375rem = 15px） */
```

上面这段是**摘抄**，真值以 `assets/css/style.css` 顶部为准（以前这里抄着 18px / `< 600px`，和文件里的 17px / `< 760px` 对不上，2026-09 对齐过一次）。

写新样式时**不要再随手写 `font-size: 1.05rem` 这种值**，从上表里挑一档；字距同理，用 `--tracking-title`（中文标题 0.02em）、`--tracking-label`（中文小标签 0.06em）、`--tracking-num`（数字 / 日期 0.04em）。真正的"大字距"只留给纯英文或数字，套在汉字上会显得字被掰开。

### 控件四态（按钮手感）

所有可点的控件都走 `:root` 里的四态变量，每态四件套「底 `-bg` · 字 `-text` · 边 `-border` · 影 `-shadow`」，共 12 组。要调全站按钮的手感，**只改这一段**，不要在各个组件的 `:hover` 里写死颜色。

三套按控件的形态分：

| 前缀 | 用在 | 成员 |
|---|---|---|
| `--ctrl-*` | 描边型按钮：有底、有边 | 翻页、文章胶囊、标签云胶囊、404 按钮、搜索关闭 |
| `--ctrl-solid-*` | 印章红实心主按钮 | 打赏按钮、404「回首页」 |
| `--ctrl-ghost-*` | 无底图标按钮：默认完全安静 | 页头搜索 / 深浅色 / RSS / 汉堡、代码块「复制」 |

另有 `--ctrl-float-*`（`-bg` / `-hover-bg` / `-border` / `-shadow`）只给毛玻璃浮动按钮用（返回顶部、手机目录）：它们的底是半透明 + `backdrop-filter`，和普通按钮的不是一个东西，所以底和影单开一组，但四态仍然复用上面的配色。

写新控件时的固定写法：

```css
.xxx-btn {
  background: var(--ctrl-bg);
  color: var(--ctrl-text);
  border: 1px solid var(--ctrl-border);
  box-shadow: var(--ctrl-shadow);
  transition: var(--ctrl-transition);   /* 不要自己写 transition 列表 */
}
.xxx-btn:hover  { /* 换成 --ctrl-hover-* 四件套 */ }
.xxx-btn:active { /* 换成 --ctrl-active-* 四件套 */ }
.xxx-btn:disabled { /* 换成 --ctrl-disabled-*，加 opacity: var(--ctrl-disabled-opacity) */ }
```

几条约定：

- **按下态不发光**：`--ctrl-active-shadow` 是 `none`，深色下也一样。按压靠 `--ctrl-active-bg`（印泥淡痕底）和已有的 `transform: scale(0.96)` 反馈，不要加阴影。
- **禁用态统一 `opacity: var(--ctrl-disabled-opacity)`（0.5）**，别再各写 0.35 / 0.55。取 0.5 是因为「显示评论」按钮加载中也要保持可读（旧值是 0.55），翻页箭头那边同时还有 `pointer-events: none` 兜底。`<a>` 模拟的禁用（翻页到头）用 `.is-disabled` 类，样式和 `:disabled` 一致。
- **深色模式只重写阴影**：其余变量都引用 `--surface` / `--line` / `--accent` 这些原始取色，会自动跟着变，不用在 `[data-theme="dark"]` 里重复一遍。
- 图片灯箱（`.lightbox-btn`）是唯一的例外：它浮在纯黑遮罩上，纸色系按钮放上去会突兀，仍然单独写白色半透明 —— 新增这类"深底上的控件"时照此单独处理，别硬套 token。
- `--ctrl-ghost-active-*` 也用在「开关类按钮的展开态」上（比如汉堡菜单 `.is-open`），这样"现在正开着"在按钮上看得见，而不只是一个图标变形。
- **文字链接不进这套 token**：页脚 / 友链 / 导航这些纯文字链接统一是「hover 变 `--accent`」，正文内链接另有「印泥淡痕底 + 红字」的一套（`.post-content a`），这是刻意的区分——文字链接靠字色，控件靠底、边、影。
- **带语义色的胶囊不套中性 token**：`.post-cat-chip`（印泥底红字）和 `.post-tag-chip`（灰底）的底色是分类 / 标签的语义，hover 时整体切成 `--accent` 实底，保持原样，不要去"统一"它们。

### 响应式断点速查

| 断点 | 行为 |
|---|---|
| ≥ 1280px | 目录固定在正文右侧，平时收成一列小刻度；悬停展开成标题，点左上角图钉「钉住」后一直展开 |
| < 1280px | 目录排在正文开头（`.post-toc-inline`），点标题栏可收起；手机上（≤760px）默认收起 |
| < 760px / < 600px | 导航、卡片、列表、正文字号的移动端微调 |

1280px 这个断点是照 sspai 取的（它自己也在这个宽度以内就不显示右侧目录）：正文 680px 居中，1280px 窗口两侧各留 300px，减去 244px 的目录还剩 56px 空隙；再窄目录就会贴到正文上。窗口宽到 1424px 以上时，目录左边缘离正文右边缘固定 128px（sspai 的取值），多出来的宽度都留给右边距。

### 跑步数据

跑步数据展示在独立的 `run.hulatu.com`。数据链路：Garmin 255 同步到 Garmin Connect → GitHub Actions 定时拉取或本机手动同步 → 合并写入 `data/runs.json`（唯一一份，子站靠挂载读取）和 `sites/profile/data/run_summary.json` → 提交推送 → Cloudflare Pages 构建对应子站。

GitHub Actions 目前每天 22:00（Asia/Taipei）跑一次 `.github/workflows/sync-garmin.yml`；也可以本机手动同步：

```bash
python3 scripts/sync-garmin.py
```

```bash
up   # 在任意目录输入 up 即可（函数定义在 ~/.config/zsh/.zshrc）
```

### `up` 到底做了什么（以及它为什么不负责部署）

**线上部署 100% 由 Cloudflare Pages 的 Git 集成完成**：`publish.sh` 把改动 push 到 GitHub → Pages 监听到 push → 平台自己跑 Hugo 构建 → 发布。

本机**没有安装 wrangler**，而且就算装上也不该用：push 触发的平台构建会回过头覆盖 wrangler 上传的内容，两边是竞态，谁先谁后不确定。所以 `up` 里 `hugo --minify` 之后的部分**都是本地行为，不影响线上**。

`up`（函数定义在 `~/.config/zsh/.zshrc`）实际只做两件事：

1. **`bash ./publish.sh`** —— 依次：
   - 抓取正文图片宽高：`scripts/fetch-image-dims.py` → 写 `data/image_dims.json`
   - 刷新花园页（profile.hulatu.com）的内容快照：`scripts/fetch-profile-content.py` → 写 `sites/profile/data/latest_posts.json` 和 `selected_photos.json`
   - 补中文标题锚点：`scripts/add-heading-anchors.py`
   - 刷新改动过文章的 `lastmod`：`scripts/sync-lastmod.py`（文章页的「更新于」靠它）
   - `git add .` + 提交（commit 信息：博客：新增/修改文章）
   - 推 GitHub → `git pull --rebase` 拉取远端 → 再完整推送

   图片尺寸数据要**赶在 `git add` 之前**跑，产物才能跟文章一起提交、被平台构建读到。
2. **`hugo --minify`** —— 本地构建一份预览到 `public/`。`public/` 在 `.gitignore` 里，不会上传，纯粹给你自己看效果。

> ⚠️ `up` **不会**调用 `./deploy.sh`。`deploy.sh` 是手动脚本，做「干净构建 + livereload 自检」，只写本地 `public/`，不上传也不部署。

**要上线，只要 push 成功就够了。**

首次配置：

推荐方式（令牌）：先在本机生成一次登录令牌（会同时保存在 `~/.garminconnect/garmin_tokens.json`，本地手动同步直接复用；把打印出的长字符串存为 GitHub Secret `GARMINTOKENS`，可手动触发 GitHub Actions 同步）：

```bash
pip install --upgrade garminconnect
GARMIN_EMAIL=你的邮箱 GARMIN_PASSWORD=你的密码 python3 scripts/garmin-token.py
```

把输出的一整串长字符串存为 GitHub Secret：`GARMINTOKENS`（Settings → Secrets and variables → Actions）。之后定时任务用令牌登录，不再每次输密码。令牌过期后再跑一次上面的命令更新即可。

备选方式（密码）：在 Secrets 里添加 `GARMIN_EMAIL` 和 `GARMIN_PASSWORD`。如果 Garmin 账号开了两步验证，还需要 `GARMIN_MFA_CODE`（验证码每次会变，不适合自动同步，建议关闭两步验证或改用令牌方式）。

跑完步想立刻更新：

```bash
up
```

说明：跑步数据现在由 GitHub Actions 定时同步；本地如需手动同步，可运行 `python3 scripts/sync-garmin.py`。令牌过期时先重跑 `python3 scripts/garmin-token.py`，然后更新 GitHub Secret。脚本默认只同步跑步（`running`），想加其他运动类型用环境变量 `GARMIN_TYPES=running,cycling`。garminconnect 是非官方接口，Garmin 改版后若失效，留意同步时的报错并按提示调整。

## 三、部署与托管

日常发布走 `up`（见上一节）。**线上部署由 Cloudflare Pages 的 Git 集成完成**：push 到 GitHub 后平台自己构建并发布。本机没有安装 wrangler，也不做手动上传（原因见上一节）。

### 线上没更新？先看这五条 check（2026-09 栽过两次）

push 之后 Cloudflare Pages 会给每个项目挂一条 check，「线上没生效」不用猜是哪一环：

- 网页：打开那次提交 → 右侧 **Checks** → 看 `Cloudflare Pages: hulatu` / `-run` / `-profile` / `-share` / `-shot` 五条；失败的点 **View logs** 直接跳 Cloudflare 构建日志。
- 命令行（不用登录，仓库是公开的）：

```bash
curl -s "https://api.github.com/repos/hulatu/hulatu/commits/main/check-runs" \
  | python3 -c "import sys,json;[print(c['name'],c['conclusion']) for c in json.load(sys.stdin)['check_runs']]"
```

已经踩过的两种：

| 现象 | 原因 | 修法 |
|---|---|---|
| 五个项目一起挂 | 项目里没设 `HUGO_VERSION`，Cloudflare 用镜像默认的 Hugo 0.147.7，被 `check-hugo-version.html` 硬拦 | Settings → Environment variables → **Production** 作用域补 `HUGO_VERSION=0.166.0`（五个项目都要），再回 Deployments 点 **Retry deployment** |
| 只有 run / profile 挂 | 模板用了 `hugo.Data`（0.156 才有），而子站项目还跑在 0.147.7 | 同上，把子站的 `HUGO_VERSION` 一起提到 0.166.0 |

> 环境变量改完**必须重新部署一次才生效**：Deployments → 最新那次 → Retry deployment（或再推一个提交）。构建期间站点不会掉线——失败时 Cloudflare 保留上一次成功的部署，只是内容停在那一次。

`deploy.sh` 是一个**手动**的干净构建脚本，做的事：

1. `hugo --gc --minify` 干净构建到临时目录，并检查产物里没有 livereload 调试脚本；
2. `rsync -a --delete` 同步到 `public/`。

它只更新本地 `public/`，**不上传、不部署**。想确认构建产物是否干净、或想强制全量重建时用它。

托管平台相关的两个文件都在 `static/`，部署时会原样发布：

- `_headers`：缓存与安全响应头。**HTML、RSS、搜索索引、sitemap 一律 `max-age=0, must-revalidate`**（每次访问都发条件请求，没变回 304，变了立刻是新内容），**不要给这些加 `stale-while-revalidate`**：它会让 CDN 在回源刷新期间继续发旧页面（最长 24 小时），2026-09-28 那次「发了新文章、首页还是旧的」就是这么来的。这几条 HTML 规则其实和 Cloudflare Pages 的默认值相同（实测不写规则的 `/privacy/` 也是 `max-age=0, must-revalidate`），显式写一遍是为了不依赖平台的默认行为。静态资源长缓存：CSS/JS 1 年 immutable、图片 30 天（`/img/`、`/media/`、`/images/` 三条都要有）、图标 7 天。规则按路径精确匹配，**新加文件类型或新目录时记得补一条**（`/images/` 就是漏了一整年）。防嵌套那两条是 `X-Frame-Options: SAMEORIGIN` + `Content-Security-Policy: frame-ancestors 'self'`——**CSP 只写这一个指令**，其余留空才不会限制脚本/样式，不会影响 giscus。注释要写在路径块外面，Cloudflare 只在整行以 `#` 开头时当注释。**这里的值只在 CDN 没有额外规则时才说了算**：Cloudflare 后台如果给 HTML 单独配了 Cache Rule 或 Browser Cache TTL，会覆盖它（判断方法：`curl -sSI https://hulatu.com/ | grep -i 'cache-control\|age\|cf-cache-status'`，`age` 很大而 `cf-cache-status: HIT` 就是被缓存住了；实测后台那条 Browser Cache TTL = 4 小时会把 `/images/avatar.webp` 这类静态资源的 max-age 改写成 14400）。
- `_redirects`：旧链接 301 跳转。当前 5 条：`/running/ → run.hulatu.com`，以及两篇「slug 末尾多个句点」的老文章各两种写法（带点 / 不带点，因为 Cloudflare 会先 308 补斜杠）。**以后改文章的 slug 或移动文章，想保留旧链接的话在这里补一条 301**，否则旧链接会 404。

## 四、性能与 SEO 维护清单

发布前可以快速自查：

```bash
./deploy.sh
```

然后检查 `public/` 里这几样：

- sitemap 条数：正常值 = 文章总数（归档页那句「共 N 篇」，含周刊）+ 6（首页 / 周刊 / 归档 / 书影音 / 友链 / 关于）。标签页、分类页、隐私页、`/posts/` 栏目页都应被排除。**别在这里写死条数**——每发一篇文章就 +1，写过「125 条」这种数字，必然过期。随时用这条核对：

  ```bash
  hugo --quiet --destination /tmp/site && grep -c "<loc>" /tmp/site/sitemap.xml
  ```

  多了 `tags` / `categories` 的 URL，说明 `layouts/sitemap.xml` 的过滤被改坏；少了文章，说明那篇 front matter 里被加了 `noindex: true`。
- `index.html`：不应包含 `livereload`。
- `index.xml`：首页主源，最多 20 条全文（干净构建约 270KB）。如果突然涨到 1MB 级别，说明 `[services.rss] limit` 被改回 `-1` 了——订阅端会跟着一起难受。
- 全站应该只有 3 个 XML：`index.xml`、`weekly/index.xml`、`sitemap.xml`。多出 `posts/index.xml` 说明 `[outputs] section` 又被改回 `["HTML", "RSS"]`。

图片约定：

- 正文图片用远程图床 URL（当前为 `https://img.hulatu.com/...`）最省流量；本地图放 `static/`。
- 正文图走 Cloudflare Image Transformations，三档尺寸在 `layouts/_default/_markup/render-image.html`：480w `quality=72`、960w `quality=75`、灯箱大图 1600w `quality=85`。嫌糊就往上调 3~5，Cloudflare 免费额度是每月 5000 次唯一变换、同参数重复请求只算一次，目前用量约 2000。
- 正文第一张图会自动带 `loading="eager" fetchpriority="high"`（`.Ordinal == 0`），其余图 `lazy`。别把第一张图放到很长的引言后面，否则等于白白抢了优先级。
- 正文图宽高缓存：新增带图的文章后跑一次 `python3 scripts/fetch-image-dims.py`（`up` 里已自动包含）。漏跑也不会出错，只是那几张图没有宽高属性、加载时会跳动。

可随时安全删除的构建产物（下次构建自动重建）：

```bash
# 主站 + 四个子站的产物、Hugo 的构建锁、macOS 顺手生成的 .DS_Store
rm -rf public resources sites/*/public sites/*/resources .hugo_build.lock sites/*/.hugo_build.lock
find . -name .DS_Store -not -path './.git/*' -delete
```

产物都在 `.gitignore` 里，删掉不影响仓库；但 `hugo` 一跑 `resources/` 和 `.hugo_build.lock` 就会回来，所以"清理"是清理当下，别指望一直干净。本地全文搜索（`rg`）的噪音主要就来自 `public/`。

## 五、常见问题

| 现象 | 原因 / 处理 |
|---|---|
| 新文章发布后首页看不到 | 先分清是**构建**问题还是**缓存**问题：用带随机参数的地址打开 `https://hulatu.com/?v=1`——如果新文章在里面，就是缓存（`draft` 之类的数据早就是对的，别白改 front matter）。缓存要看两处：浏览器自己的缓存，和 Cloudflare 那边的 `age`（`curl -sSI https://hulatu.com/ \| grep -i age`）。处理办法见下一条 |
| 站上确实没更新（带 `?v=` 也是旧的） | 才是真没构建：front matter 的 `draft` 还是 `true`，或 Cloudflare Pages 这次构建失败（去后台看 Deployments 的日志）。 |
| 首页 / RSS 是旧的，但那篇文章的页面能打开 | CDN 缓存。`static/_headers` 里 HTML 已经改成 `max-age=0, must-revalidate`，如果还是旧的，就是 Cloudflare 后台有额外配置覆盖了源站响应头。**要查三处**：`Caching → Cache Rules`（有没有一条把 HTML 标成 Eligible for cache / 设了长 Edge TTL）、旧版的 `Rules → Page Rules`（历史遗留的 Cache Everything）、以及 `Caching → Configuration` 里的 **Browser Cache TTL**（设成 4 小时就会让浏览器自己把旧首页留 4 小时）。把这几处改成 Respect Existing Headers 或删掉，然后 `Caching → Configuration → Purge Everything`。别指望「等一会儿就好」：这种缓存能挂满 24 小时 |
| 文章页没有「更新于」 | `lastmod` 没比 `date` 晚。`publish.sh` 会自动刷（`scripts/sync-lastmod.py`），漏刷或想手动盖章用 `python3 scripts/sync-lastmod.py --force content/posts/某篇.md`，再 `./publish.sh` |
| 文章页没有"相关文章" | 同标签/同分类的文章太少，低于 `[related]` 的 `threshold = 60` |
| 首页或周刊翻页数量不对 | 检查 `layouts/index.html` / `layouts/weekly/list.html` 里的 `.Paginate` 第二参数（当前为 10） |
| 改了 slug 后旧链接 404 | 在 `static/_redirects` 补 301 规则 |
| 手机上目录没出现 | 文章没有二级以上标题，不会生成目录；有目录时它在正文开头的「目录」折叠块里（默认收起） |
| 哪些页面不被收录 | 隐私政策、分类页、标签页、`/posts/` 栏目页都不进 sitemap、也带 `noindex`。前两类是模板里按类型判断的（`layouts/_default/baseof.html` 的 `$noindex`），后两类靠 front matter 写 `noindex: true`。**加 noindex 就不要再往 robots.txt 加 Disallow**——Disallow 会让爬虫看不到 noindex，反而更糟 |
| 分页页 `/page/N/` 不被收录 | `robots.txt` 里 `Disallow: /page/`，阻止抓取分页页 |
| 隐私政策没出现在首页/归档列表 | 首页只列 `posts`（周刊有自己的一栏，不在首页），归档列 `posts` + `weekly`；根目录的普通页面（关于 / 隐私政策 / 归档自己）一律不混进这两个列表。**首页和归档的收录范围本来就是不一样的**，别当成 bug 去改 |
| 某个页面的标题想隐藏 | front matter 里的 `hide_title: true` **只有 `layouts/_default/list.html`（栏目页）会读**，普通页面走各自的布局（`single.html` / `taxonomy.html` / `archive.html` / `about.html`），想隐藏标题得改对应模板。2026-09 之前有几个页面写了这个字段但其实没生效，已经把这些「写了不生效」的字段删掉了 |
| 归档页「今年写了多少字」和文章页的「约 N 字」 | 现在是同一套口径：都取 Hugo 的 `.WordCount`，都只算文章（`posts` + `weekly`）。以前归档是「去掉空白后数字符」并且把关于 / 隐私 / 归档页也算进去，两边数字对不上，2026-09 统一了 |

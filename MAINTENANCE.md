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
| `slug` | URL 后缀（**统一小写**）。写大写其实不会出错——Hugo 默认会把路径小写化（`hugo.toml` 没设 `disablePathToLower`），产物里一律是小写；但大小写混写会让 front matter 和实际 URL 看着对不上，容易让人误以为链接坏了，所以统一写小写。改 `slug` 的**值**才会让旧链接失效（想保留旧链接需加 301，见"部署"） |
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

**「只差空白字符」不算改动。** 编辑器或清理脚本收拾行尾空格时，git 会把整批文件标成「已修改」，但内容一个字没变——只按字符串比较的话，这些文章的 `lastmod` 会被集体刷成发布时刻：文章页的「更新于」跟着集体往前跳，git 里还多出上百行无意义的 diff。所以比较前会先抹平三类空白：行尾空白、换行符（CRLF / CR）、文件末尾多出来的空行。刻意**不**抹平行首缩进和行内空格——Markdown 里行首缩进会改变语义（4 空格 = 代码块、2 空格 = 嵌套列表），行内空格就是正文本身。已知取舍：Markdown 的「行尾两个空格 = 硬换行 `<br>`」也会被一起忽略，真遇到只加了硬换行的改动，用 `--force` 手动刷一次。

这个坑有实据：2026-09-29 清理 front matter 行尾空格的那次提交（`d154d53`）一共动了 113 个文件，其中 **106 个只差行尾空格**——修复前这 106 篇会被全部白刷。修复后拿 `git diff --ignore-all-space` 当事实标准回测：106 个纯空白全部跳过、7 个真改动全部照刷，零偏差。

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

两个短代码都只是转调 `layouts/partials/media-card.html`（单条）和包一层 `.media-grid` 的 div（网格），排版细节在 `assets/css/critical-page.css` 的「书影音」段。用法直接抄 `content/media/_index.md` 的现成例子。

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
| 标签页图标 / 页头 logo | `hugo.toml` 的 `[params.assets]`：`logo` 给页头那个大 logo（深色模式由 CSS 的 `filter` 反白，规则是 `critical.css` 的 `[data-theme="dark"] .site-logo` —— **2026-10-04 从 core.css 搬到首屏包**，因为 logo 是首帧元素，留在异步包里深色下会「先原色、后反白」闪一下），`favicon` 给标签页（`static/favicon.svg`，文件里内置了 `prefers-color-scheme` 深色反白）。**两个文件是故意分开的**：favicon 里的反白规则会和页头的 `filter` 叠加成反色，混用会出问题 |
| 添加到主屏幕（PWA） | `static/site.webmanifest` + `static/icon-192.png` / `icon-512.png`。图标由 `logo.svg` 渲染而来，要重做就用：`magick -background none SVG:static/logo.svg -resize 512x512 -colors 64 -strip -define png:compression-level=9 static/icon-512.png`（`-colors 64` 能把 76KB 压到 30KB，肉眼无差） |
| 分享卡片图 | `[params.assets] shareImage`。宽高由 `layouts/partials/head-meta.html` 用 `imageConfig` 现读，换图不用改模板；文章 front matter 里写了 `cover` 就用 cover，但远程图读不到尺寸，那两个 meta 就不输出 |
| 首页文案（"总得留下点什么吧"） | `layouts/index.html` 顶部的 `.site-hero` |
| 首页 / 周刊每页展示几篇 | `hugo.toml` 的 `[pagination] pagerSize`（当前 10）。模板里 `.Paginate` **故意不传第二个参数**，就是让它读这个配置——以前模板里写死 10，配置里那个 `pagerSize` 改了没用，等于两个数字打架 |
| 周刊期号徽章 | 读 front matter 的 `issue: 22`（模板里是 `.Params.issue`）。**新写一期周刊记得填这个字段**，不填就不显示徽章。以前是从标题「第 X 期」里正则解析中文数字（`layouts/partials/issue-num.html`，2026-09 已删）：那种写法只在标题里能看出来，改标题就悄悄失效，还多一层中文数字解析 |
| 相关文章（取几篇、按什么匹配） | `hugo.toml` 的 `[related]`；模板在 `layouts/_default/single.html` |
| 上一篇 / 下一篇导航 | `layouts/_default/single.html` 里的 `.post-nav` |
| 标签云（展示哪些标签） | `layouts/_default/taxonomy.html` 里 `site.Taxonomies.tags.ByCount` |
| 目录在哪显示 | `assets/css/critical-post.css` 搜 `1152px`。≥1152px 悬浮在正文右侧（刻度栏，面板宽度 `clamp(212px, 50vw - 372px, 244px)` 随窗口伸缩）；<1152px 排在正文开头（`.post-toc-inline`，可点标题栏收起），手机上默认收起。**页面里没有浮动目录按钮**：2026-09 按需求删掉了左下角那个按钮和它的底部抽屉，窄屏一律看正文开头那块。断点是**一对**：`min-width: 1152px` 和文件末尾那两条 `max-width: 1151.98px` 必须同时改（`layouts/_default/single.html` 里还有一处注释跟着它） |
| 正文 / 页头宽度 | 只有 `--content-width`（`assets/css/critical.css` 顶部，当前 **680px**，照 sspai 文章页量的：它的 `.article__section__wrapper` 是 728px 含 24px 内边距）。`.container` 用它加两侧 `--gutter` 当 max-width（内边距留在外面），所以**页头（导航栏）、正文、列表页是同一个内容宽度**；`.post-content`、`.post-toc-inline`、`.friends-page`、`.about-page`、`.page-intro` 也都引用它。**四个子站同宽**：各自 `static/style.css` 的 `:root` 里也有一份 `--content-width: 680px`，靠 `main { width: min(var(--content-width), calc(100% - 32px)) }` 取（profile 是 `- 40px`）。改宽度要五处一起改，详见 `sites/README.md` |
| 文章排版（字号 / 行高 / 段间距） | 数值照 sspai 文章页（`.wangEditor-txt`）：正文 **17px / 1.8**、段间距 **32px**、H2 **32px**（上间距 56px = 段距 + 24px）、H3 **24px**（上 48px）、H4 与正文同号、文章标题 **38px**；手机（≤760px）各降一档：15px / 24px / 24px / 20px / 28px（= sspai 的 `<768px` 那一套）。变量是 `--text-reading`、`--reading-leading`、`--block-gap`、`--h2-size`、`--h3-size`、`--post-title-size`，`--h2-gap-top` / `--h3-gap-top` 由 `--block-gap` 自动跟着缩。**这套是单开的**：别顺手改全站的 `--text-lg` / `--text-md`，否则归档年份、友链 / 关于页的小标题会跟着跳 |
| 正文列表（`ul` / `ol`） | **两种都是小点，全站只有脚注还带序号**（2026-10-02 改）。`ul` 走浏览器默认的 `disc` 圆点，只是用 `.post-content ul li::marker { color: var(--accent) }` 把点染成印章红。`ol` 原来是一套「红圈数字」徽章（`list-style: none` + `li::before` 画 `counter(ol-item)` 的圆环 + `li` 上 28px 让位缩进），按用户要求「只要 markdown 小点」整套删掉，现在和 `ul` 一样是 `list-style: disc` + 红色 marker。**删那套徽章必须三处一起删**（`ol` 的 `list-style`、`li` 的 `padding-left` / `position`、`::before` 整块），漏一处就会剩半个徽章、或多缩进 28px。想看效果：全站只有 4 篇写了 `1.` 列表（`平价跑步装备-实用篇`、`《小狗钱钱》对我的影响`、`手机双持方案…`、`周刊-第十八期`），其余全是 `-` 列表、本来就一直是小点 |
| 脚注 | Goldmark 的 `footnote` 扩展（默认开着，`hugo.toml` 里没写就是开）。标记：正文里 `<sup id="fnref:N"><a class="footnote-ref">N</a></sup>`，文末 `<div class="footnotes"><hr><ol><li id="fn:N">…<a class="footnote-backref">↩︎</a></li></ol></div>`。**整块落在 `.post-content` 里面**，所以会继承正文的 `hr` 分节装饰（40% 宽 + 正中圆点）——「没写样式」不等于「没样式」。样式在 `assets/css/critical-post.css` 的「脚注」段，逐项压回附属信息的层级：`hr` 藏掉、改用容器的通栏细线；`ol` 换回紧凑的十进制序号；`li > p` 去掉 32px 段间距；整块降到 `--text-xs` 并降调成 `--muted`。作者自己在正文里手写的 `<hr>`（不在 `.footnotes` 内）不受影响，分节装饰该留还留着 |
| 点目录 / 带 `#锚点` 进页面时标题停在哪儿 | **分两条路径，别混**。**① 点目录**（`assets/js/toc.js` 里 `init()` 的 `scrollToTarget()`，2026-10-02 加）：按方向算落点 —— **向下跳时不留顶栏那 76px，只留 5px 呼吸（`scrollToTarget()` 里的 `DOWN_GAP`，严格贴顶太挤）、标题几乎贴到页面最顶端**，因为顶栏是「向下滚就自动收起」的（`ui.js` 的 `updateHeader`），这时再留 76px 只会剩一片空白，看着像没对准；**向上跳时照旧留 `--anchor-offset`**，因为顶栏会随着向上滚动重新露出来，不留位就会被盖住。向下跳时还会顺手给顶栏加 `is-hidden`（人在页面顶部时 `ui.js` 要滚过 120px 才收起，等它不及）——**但判据是算出来的落点 `next` 是否真的更大，不是 `goingDown`**（2026-10-02 修）：`goingDown` 只看目标在不在下方，而向下跳的 `offset` 是 `DOWN_GAP`（5px），目标只比当前位置低 1~5px 时 `next` 反而比当前位置还小 —— 页面会往上滚一丁点，`ui.js` 的 `updateHeader` 立刻判成「向上滚」把 `is-hidden` 摘掉，顶栏先收起再弹回来、闪一下。现在只有 `next > window.scrollY` 才收。**点目录之后高亮会被「锁」住**（`lockHighlight()` / `unlockHighlight()`）：点击时先 `setActive(target)`，可紧接着第一帧 scroll 事件里 `sync()` 读到的还是旧的 `scrollY`，会算出「当前还在原来那一节」把高亮打回去，看上去就是高亮闪一下再走；现在锁到 `scrollend`（不支持的浏览器 700ms 兜底）才解封，解封时再按最终位置对一次。用户自己一动手（`wheel` / `touchstart` / `keydown`）立刻解封，免得高亮卡住。这条**故意不写进 CSS**：`scroll-margin-top` 是全站锚点共用的，脚注的 `#fn:` / `#fnref:` 回跳会跟着一起变。**② 其余锚点**（外部链接带 `#`、脚注回跳、`#main`）只由 `assets/css/critical.css` 的 `--anchor-offset`（顶栏 `--header-h` + `--space-3` = 76px）决定，挂在 **`main[id], main [id]`** 的 `scroll-margin-top` 上。**两个选择器缺一不可**（`main[id]` 是 2026-10-02 补的）：正文里 h2/h3 的 id 是 `main` 的后代，靠 `main [id]` 生效；但跳转链接的落点 `<main id="main">` **本身就是 `main`**，不是它的后代 —— 只写后代选择器它压根匹配不上，表现是点「跳到正文」后标题最上面约 24px 被 68px 的固定顶栏吃掉（`main.container` 的 `padding-top` 只有 40px，不够让位）。**别在 `html` 上再加 `scroll-padding-top`**——两个值会叠加，标题会被顶到离顶部将近 180px，看着就像没对准。带锚点进页面时 `assets/js/toc.js` 的 `initHashAnchor()` 会在图片 / 字体就位后重新对准一次；链接里是换成拼音之前的旧中文锚点（`#%e4%b9%a0%e6%83%af`）时，会自动退回按标题文字找 |
| 关于页名片卡（红色只用一处） | `assets/css/critical-info.css` 的 `.about-head-card` 段。2026-09-29 改版：原先一张卡上出现了**四处红** —— 左边缘 3px 竖向渐变红柱（`::before`）、头像外圈 `--accent-soft` 粉红光晕、角色行前的小红点、分隔线中间的红菱形。用户反馈「不太美观，尤其是那个红色」，问题不是红本身，而是**同一张卡上红了四次**，而且那圈 `#fbeae7` 是「淡到发白的粉」，看着像印错了。现在红只留角色行前那个 5px 小点：左柱整根删掉、头像改细描边、分隔线只留一条短线。顺带把 5 个「等分拉伸」的胶囊改成按内容宽度居中，列间距 24 → 28px、两列垂直居中。**再动这张卡时守住「一处红」**。**2026-10-04 起 `.about-body` 里各节标题前的小菱形也改成了中性线色**（`--line-strong`，与分节线 `.about-section + .about-section` 同色）—— 原先 6 个 section = 6 颗红菱形，一页 6 处红，把「印章红必须稀缺」摊成了底色。所以这一页的红现在只剩三处有语义的地方：角色行前那个 5px 小点、段落里的行内链接、可交互元素的 hover / active 态 |
| 关于页的《关于我》链接（行内链接） | `assets/css/critical-info.css` 的 `.about-section > p a` 段，模板在 `layouts/_default/about.html` 的「我是谁」段。**为什么要有它**：全站基础规则是 `a { color: inherit; text-decoration: none }`，所以段落里的裸 `<a>` 和正文**完全同色、没有下划线** —— 那条链接原先读起来就是句子的一部分，看不出能点。**注意别过度设计**：它一度被做成一条「链接行」（`.about-feature-link`：发丝线描边 + `--surface-2` 纸背底 + 常显箭头，形态与同页 `.about-link-list` 的行一致）—— 形态没错，但那是**列表行**的语言；插进散文里就成了「一句话读到一半，中间冒出一个带边框的方块」，太显性、像广告位。2026-10-02 第四轮按用户要求退回**行内链接**：`--accent` + 1px 下划线（`text-underline-offset: 2px`），和全站正文链接（`.post-content a`）同一套语言。**刻意没有复制 `.post-content a` 那套「下划线从左划出」的 background 渐变** —— 为一段散文里的单条链接再维护一份画线技术不值得，hover 只做颜色变化（→ `--accent-ink`）。**链接文字不带书名号**：页面上是「关于我」，不是「《关于我》」—— 红字 + 下划线已经说明它是可点的标题，再加书名号是第二重标记，反而把它推成一个「条目」。样式放在 `critical-info.css`（**内联**）是因为它在关于页首屏附近，不能等异步包 |
| 中文标题的锚点 | 中文标题要显式写 `{#pinyin}`（`## 习惯 {#xi-guan}`），不写的话分享链接是 `#%e4%b9%a0%e6%83%af`。日常不用手写，`publish.sh` 会跑 `scripts/add-heading-anchors.py` 自动补；想用英文词就自己写 `{#habit}`，脚本看到已有 `{#...}` 会跳过。CI 里另有一道 `--check` 兜底 |
| 手动提交发布 | 终端输入 `up` → `publish.sh`（抓取正文图片宽高 → 提交本地改动 → 推 GitHub → 拉取远端 → 再推送）→ `hugo --minify`（**只写本地 `public/`，给自己看**）。**真正的上线由 Cloudflare Pages 的 Git 集成在 push 后自动构建完成**；本机没有 wrangler，也不做手动上传 |
| 正文图片宽高 | 远程正文图（图床）构建期读不到尺寸，会让页面加载时跳动。`scripts/fetch-image-dims.py` 抓一次尺寸写进 `data/image_dims.json`（已提交），模板 `layouts/_default/_markup/render-image.html` 查表输出 `width`/`height`。新增图片后跑一次脚本即可，已缓存的会跳过 |
| 脚本怎么读 front matter | 统一走 `scripts/_frontmatter.py`（`split` / `fields` / `read` / `write` / `remove`）。它只做「按行找字段」，不做 YAML 解析——front matter 里有中文注释、对齐用的行尾空格，用 PyYAML 解析再 dump 回去会把注释和空行冲掉，diff 变成整块重写。以前 `fetch-profile-content.py` 和 `sync-lastmod.py` 各写一份正则，字段清单和换行处理都不一致：**`fetch-profile-content.py` 的字段清单漏了 `image`，导致 `_shot_item()` 永远返回 None、`selected_photos.json` 恒为空**（2026-09 修），加字段时记得两边都看。 |
| 图片灯箱 | 结构在 `layouts/_default/_markup/render-image.html`：图片被 `<a class="article-image-link" href="原图">` 包着，JS 拦下点击打开灯箱，JS 不可用时退化成「点开原图」。样式在 `assets/css/critical-post.css` 的「文章插图」段，逻辑在 `assets/js/lightbox.js`（原图地址直接读链接的 `href`，不再用 `data-full`）。**2026-09-29 去掉了两处「鼠标悬浮才出现」的效果**：① 右上角那个「看大图」小胶囊（`.article-image-zoom`，span 已从模板删掉、CSS 也删了）——它原先靠 `:hover` / `:focus-within` 显隐；② 图片正下方那条 1px 强调色下划线——它其实是正文链接 `.post-content a` 的「从左划出」底纹（`background-size: 0 → 100%`），图片链接 `display:block` 整块包住图片，线就横在图片底下，所以在 `.article-image a` 上加了 `background-image: none; padding-bottom: 0` 压掉。图片现在只靠 `cursor: zoom-in` 和全局 `:focus-visible` 焦点环暗示可点，点击/回车照样开灯箱 |
| 正文图片的淡入 / 加载失败兜底 | 加载逻辑在 `assets/js/ui.js` 的「图片渐进加载」段，三态样式在 `assets/css/critical-post.css` 的 `.js .article-image img`（默认 `opacity: 0`）、`.is-loaded`、`.is-failed`。**成败两个方向都要挂**（2026-10-02 修）：只挂 `load` 的话，图挂掉就等不到 `load`，这张图会连着 `alt` 文字一起停在 `opacity: 0` —— 读者只看到一个灰色空盒子，等于静默丢内容（JS 被禁用时反而正常，所以最容易漏掉）。还有一个更隐蔽的漏：**`img.complete` 为 `true` 只说明「浏览器已经有结论了」，失败同样算 complete**，所以老代码的 `complete && naturalWidth > 0` 会把失败的图塞进 `else` 分支去等一个永远不会来的 `load`。现在的判法是「已经 `complete` 的就当场按 `naturalWidth` 定生死，没 `complete` 的 `load` / `error` 都挂上」。失败态 `.is-failed` 只做两件事：还原不透明度让 `alt` 文字露出来，再补一圈虚线说明「这里本该有图、没加载出来」。**虚线用 `outline` 而不是 `border`**：不参与盒模型，失败的图不会比成功的图窄 2px |
| 键盘可达性 / 焦点陷阱 | 两个弹层（搜索框、图片灯箱）共用 `assets/js/focus-trap.js` 提供的 `window.hulatuFocusTrap(容器, 初始焦点)`，关闭时记得调用它返回的 `release()` 并把焦点还给触发按钮。**这个文件必须在 `layouts/partials/scripts.html` 的打包顺序里排第一**，否则后面几个脚本运行时拿不到它。**跳转链接**（`.skip-link`，`baseof.html` 里紧跟 `<body>` 之后的第一个元素）聚焦时落在 `top: calc(var(--header-h) + 0.75rem)`（2026-10-02 改）：原来是 `0.75rem`，正好落在 0–68px 那条固定顶栏里 —— `z-index: 1000` 压得过顶栏的 `100`、所以没被盖住，但会糊住导航；而且顶栏哪天因为 `transform` / `filter` / `opacity` 造出新的层叠上下文，这块就会被真盖掉，让到下方最稳。它指向的 `#main` 靠 `main[id]` 拿 `scroll-margin-top`，见上面「点目录 / 带 `#锚点` 进页面时标题停在哪儿」 |
| 评论 | 配置 `hugo.toml` 的 `[params.giscus]`；单篇关闭用 `comments: false`。DOM 在 `layouts/partials/giscus.html`，行为逻辑在 `assets/js/giscus.js`：滚到评论区前 400px **在后台把 giscus 预加载好，但整块收着不展开**；读者点了才展开——因为内容已经加载完，展开是瞬间的、不会先白一下。**折叠开关是一颗 `<details>/<summary>` 胶囊按钮**（`#giscus-toggle`，样式与关于页的 `.donate-btn` 同一套 `--ctrl-*` 描边四态 + `::after` 画的 V 形箭头，`is-open` 时箭头转 180°）：2026-10-04（Request K）改成现在这样、与打赏块统一；更早换过两版形态（先是全宽按钮行，再是 `h2` + 右侧圆形箭头）。**⚠️ 那个 `<details>` 恒带 `open` 属性，收起不靠它原生折叠** —— `assets/js/giscus.js` 里 `preventDefault` 掉 `summary` 的原生 toggle，改由状态机给 `.giscus-box` 切 `.is-open` 类、由 CSS 收起（原因见本行末尾「别改成 display:none」）。`aria-label` 由 JS 在「展开评论 / 收起评论」之间同步切换。整块包在 `layouts/_default/single.html` 的 `<section class="giscus-wrap">` 里（带发丝线描边的卡片；`@media print` 藏的就是它）。再点一次可收起，iframe 留在 DOM 里，再展开是瞬时的。状态机只有一个 `state` 变量（`idle → loading → ready → slow → open`，`opening` 表示「读者已经在等」），并镜像到 `.giscus-body` 的 `data-state`，调试时在开发者工具里直接看得见。等 iframe 用的是 **MutationObserver，不是定时轮询**；两个超时各管一段：点开后 12 秒没出来才提示重试，预加载 2 分钟没结果就静默作废。**这个脚本单独打包、只在带评论的文章页加载**（`giscus.html` 里的 `resources.Get`），不塞进全站 bundle。收起用的 `.giscus-body { max-height: 0; visibility: hidden }`，**别改成 `display: none`**，那样 iframe 没有布局尺寸，giscus 会把高度算成 0。加载 / 重试提示 `.giscus-loading` 必须留在 `.giscus-body` **外面**，否则 body 收着时它会被一起裁掉、看不见 |
| 文章目录 | 同一份目录在页面里有两份副本：宽屏刻度栏（`id="TableOfContents"`）和正文开头那块（`TableOfContentsInline`，<1152px 显示），后者的 id 由 `single.html` 里的 `replaceRE` 改掉，避免重复 id。四段逻辑都在 `assets/js/toc.js`：`init()` 管滚动高亮（对页面里所有 `.post-toc-nav` 一起生效），`initPin()` 管宽屏图钉的「钉住」，`initInlineToc()` 负责手机上把正文开头那块默认收起，`initHashAnchor()` 管带 `#锚点` 进页面后的重新对准；`init()` 内部另有一个 `scrollToTarget()`，负责**点目录时的落点**（按方向决定留不留顶栏那 76px，详见上面「点目录 / 带 `#锚点` 进页面时标题停在哪儿」）；同一层还有一对 `lockHighlight()` / `unlockHighlight()`，负责点完目录后把高亮锁住，别让它在平滑滚动刚起步那几帧被 `sync()` 拿旧位置打回原处（不然会看到高亮闪一下再走，详见同一行）。新增目录副本时记得同步改 id，样式挂 `.post-toc-nav` 就能直接复用编号和高亮。**高亮是「祖先链」不是单点**（2026-10-02 改，做法取自 bearneo 的 `toc.html`）——详见下面「目录高亮为什么要亮一整条链」 |
| 目录高亮为什么要亮一整条链 | `toc.js` 的 `setActive()` 不是只给命中的那个 `<a>` 加 `.is-active`，而是先用 `chainOf()` 沿 `li.parentElement.closest('li')` 往上爬，把**沿途每一级的 `<a>`** 都收进链里一起点亮。原因：只亮叶子的话，读到 `###` 小节时上面的 `##` 还是灰的，看不出「我在哪一章的哪一节」。**两份副本要一起处理**——同一份目录在刻度栏和正文开头各有一份，`hash` 相同的 link 都得亮，所以是「先找出所有同 hash 的 link，再把各自的链并成一条」。滚动时每帧都会走到 `setActive()`，所以只对**差集**增删 class（`activeChain` 记着上一条链），不做全量 `toggle`。**高亮这件事本身不用改 CSS**：① 刻度栏里那条 `.post-rail .post-toc-nav:has(a.is-active) a:not(.is-active) { opacity: 1 }` 把通用规则里的 `0.5` 重置回了 1，所以刻度栏靠**红色的刻度竖条**表达（链上每一级的 `--tick` 高度不同 → 收起来时是一串递减的红刻度）；② 正文开头那块仍走 `.post-toc-nav:has(a.is-active) a:not(.is-active) { opacity: 0.5 }`，链上三级各有一条红色左边框 + 红字，形成阶梯。**但改这个功能时暴露了一条必须先修的 CSS 坑**（2026-10-02 修）：刻度栏那条基础规则 `.post-rail .post-toc-nav a` 原先**并列写着一个 `.is-active`**（`.post-rail .post-toc-nav a, .post-rail .post-toc-nav a.is-active { … }`），`.is-active` 把特异性抬到 `(0,3,1)`，压过了按层级给的缩进 `.post-rail .post-toc-nav ul ul ul a`（`0,2,4`，先比类数所以输）—— 于是**任何一级被点亮时，它的 `padding-left` 都会被那条的 `padding: 0 0 0 18px` 打回一级缩进**：二级从 34px、三级从 50px 一起左移，看着就是「目录项往左跳、和上一级对齐」。目录缩进只该由层级决定、和高亮无关；刻度条又是绝对定位在 `left: 0`、不依赖 `padding`，所以那个 `.is-active` 纯属多余，已删（删掉后 active 项的 `color: transparent` / `border-left: 0` 照旧生效：本规则的 `(0,2,1)` 与 `.post-toc-nav a.is-active` 的 `(0,2,1)` 打平，靠「后出现」取胜）。**教训：给 `.post-toc-nav a` 加带状态的选择器时，别把「缩进」这类和状态无关的属性一起写进去。**（只亮叶子那会儿这个跳动就存在，只是不显眼；改成祖先链一起亮之后，被点亮的 `##` 和 `###` 一起掉到 18px、彼此对齐，才变得刺眼。） |
| 宽屏目录的刻度栏 / 钉住 | 样式在 `assets/css/critical-post.css` 的 `@media (min-width: 1152px)` 段。参考 sspai 文章页的目录（`.comp__Directory`），尺寸照它量：**面板 244px 宽、纵向居中、面板左边缘离正文右边缘 128px**（`right: max(0px, calc(50vw - 712px))`，推导写在样式表注释里）、文字 15px、收起一行 12px、展开一行 33px（`border-radius: 6px`）、二级标题的文字再缩进 16px（**刻度始终排在同一列**，只缩进文字）。**刻度尺寸走 `--tick`**：按层级递减 6 / 5 / 4 / 3px，展开时统一 `calc(var(--tick) * 3.5)`（一级 6×3.5 = 21px，与改造前的固定值一致）。递减这个做法移植自 bearneo 的目录刻度——那边是一级 16px、二级 12px、三级 8px 的横线，这边刻度是竖条，对应的「长度」就是高度，所以落到高度上。刻度绝对定位在 `left: 0`、不占文本宽度，所以**不需要** bearneo 那套「宽度减多少、`margin-right` 就补多少」的补偿；缩进由 `a` 的 `padding-left` 单独负责，**而且只由层级决定** —— 别把 `padding-left` 写进带 `.is-active` 的选择器里，那会用特异性压掉层级缩进，让被点亮的目录项往左跳（2026-10-02 修过一次，见上面「目录高亮为什么要亮一整条链」）。收起态用 `color: transparent` 让标题占位：**别改成 `display: none` 或收掉宽度**，否则展开时会把正文挤动。图钉按钮 `#toc-pin` 由 `initPin()` 切成 `.is-pinned`，状态不跨页面记；它只在 ≥1152px 生效（窄屏整块 `.post-rail` 是 `display: none`）。**展开的触发条件里那条「键盘焦点」写的是 `.post-rail:has(.post-toc-nav a:focus-visible)`，不是 `.post-rail:focus-within`**（2026-10-02 改）：图钉按钮也在 `.post-rail` 里，而浏览器点按钮会给它焦点，用 `:focus-within` 的话「点一下图钉」就把 rail 的焦点态点亮、焦点赖在图钉上不走，目录被永久钉在展开态 —— 再点一次想取消钉住也收不回来（鼠标移开都没用），用户看到的就是「点第二次取消不了全部显示」。现在只看 `.post-toc-nav` **内部**有没有 `:focus-visible`，图钉被排除在外。**别顺手把图钉自己的 `.post-rail:focus-within .post-toc-pin` 一起改掉** —— 那条管的是「键盘 Tab 到图钉时它要保持可见」，必须留着。**图钉的位置**：`.post-toc-wrap` 是 `display: flex; flex-direction: column`，图钉是它的第一行（`align-self: flex-start`），所以钉在**目录框左上角**、目录本体从它下面 4px（`gap: var(--space-1)`）开始——不要改回 `position: absolute` 浮在面板上方，那样它会跑出目录的边界 |
| 目录为什么居中得很稳 | `.post-rail` 是 `top: var(--header-h)` / `bottom: 0` 的固定容器（`display: flex; align-items: center; pointer-events: none`），里层 `.post-toc-wrap` 才裹着图钉和目录本体并把 `pointer-events` 打开。**容器高度是固定的**，所以悬停展开（一行 12px → 33px）时只有里面的行在长，整块目录不会上下滑——这正是不用 `top: 50% + translateY(-50%)` 的原因。改回居中时别丢掉这一层结构，也别把 `pointer-events` 一起放开（那样右侧一整条会挡住页面点击）。图钉用 `visibility: hidden` 藏着（**不是 `display: none`**），占位一直留着，所以鼠标扫进来把它点亮时目录不会上下跳 |
| 深浅色 | 默认跟随系统；右上角按钮手动切换（带旋转动效），**不记忆选择**（刷新后回到跟随系统）。逻辑在 `assets/js/theme.js`，配色变量在 `assets/css/critical.css` 的 `[data-theme="dark"]` |
| 打赏 | `hugo.toml` 的 `[params.donate]`（`title` / `hint` / `button` / `payee` / `wechat` / `alipay` / `url`）。**这块全站只在关于页出现**，而且是**关于页的一个 `.about-section`**（2026-10-02 第四轮）：模板 `layouts/partials/donate.html` 直接输出 `<section class="about-section donate">`，由 `about.html` 放进 `.about-body` 里，和「我是谁 / 网站导览 / 订阅 / 平台 / 联系」平级。**所以它自己不再有 `border-top` / `max-width: 30rem` / `padding-top` / `margin: auto`** —— 那四条是它挂在卡片外面时才需要的「只有它这样」的特例，收进页面结构后一起删了，分隔线交给现成的 `.about-section + .about-section`。文章页的调用在 `layouts/_default/single.html` 里移除并留了注释（每篇文末都挂收款码 = 「每篇都在要钱」）。<br>**触发器刻意不是印章红实心按钮**：它一度走 `--ctrl-solid-*`（红底 + 红晕投影），成了整页视觉最重的元素；现在走中性的 `--ctrl-*` 描边四态（与 `.tag-chip` 同一套）。**节标题前那颗小菱形也已改中性线色**（2026-10-04，见上面「关于页名片卡」一行），所以这一页不再靠它承载红。`summary` 上的原生三角被 reset 抹掉了，所以另补了一个 `::after` 画的 V 形折叠指示（`[open]` 时转 180°）。展开区**不套外框** —— 两个收款码本身就是白底 + 发丝线的卡片，再包一层就是「卡片里的卡片」。<br>**收款码是站内静态图**（`static/images/donate/{wechat,alipay}.webp`，2026-10-02 第四轮从图床搬过来）：它是「站点家具」而不是文章内容，和头像 / 分享卡一个性质，所以跟它们一起放 `/images/`（`static/_headers` 里已有 30 天缓存），顺带不再需要 `cf-image.html` 那层图片变换（那个 partial 现在只服务正文插图）。生成方式：把手机截的收款码裁成「二维码本体 + 白静区」的正方形，输出**无损 WebP**。当前两份分别是 435×435（微信，17.5KB）和 440×440（支付宝，21.4KB），二维码本体约 350px —— 页面显示 180 CSS px，1x/2x/3x 屏分别是 180/360/540 设备 px，这个尺寸正好覆盖 2x。**两个关键坑**：① 静区必须有（QR 规范要 4 个模块，代码里用 12% 边长），而且素材必须自己带白底 —— 页面 CSS 里写死 `background: #fff` 是物理要求，深色模式下 `var(--paper)` 是近黑，拿它当底整张码就废了；② 微信那张要先**二值化**（源是 JPEG 截图，「白」带噪声、黑边有振铃，无损体积 47.7KB；二值化后 17.5KB 且模块边缘更硬、更好扫），但**中心彩色贴纸要按彩色像素包围盒原位贴回**，否则会被吃掉；支付宝那张**不能**二值化 —— 它中心的 logo 是灰阶气泡，Otsu 会把整块判成白、logo 直接消失。<br>**换图之后要去 Cloudflare 后台 Purge 一次 `/images/donate/*`**（30 天缓存，不 purge 老访客看到的还是旧码）。<br>撤文章页时顺带修了一处**白开的预连接**：`baseof.html` 里原来有半句 `and site.Params.donate.enabled (in (slice "posts" "weekly") .Type)`，让**所有**文章页都预连接图床，可打赏码是 `<details>` 里的 `loading="lazy"` 图、不展开根本不请求（`perf-interaction-review.html` 的 P3 记过这一条）。那半句现在整条去掉，只按「正文里真的有图床图」判断 —— 123 篇文章里有 60 篇正文无图，从此不再白连。<br>**`.donate-*` 规则仍在 `post.css` 里**（15 条，minify 后约 1.7KB；关于页的异步包要它），要不要拆成单独模块的判断写在 `css-modules.html` 的注释里 —— 结论是先留着，理由见那里 |
| Hugo 版本 | **三处必须一致**：本机 `hugo version`、`.github/workflows/build.yml` 的 `hugo-version`、Cloudflare 五个项目的 `HUGO_VERSION`（主站 + 四个子站）。硬校验在 `layouts/partials/check-hugo-version.html`（`baseof.html` 顶部引入）：**版本不够直接失败**并报出当前版本；**缺 extended 只打 WARN**（Cloudflare 的 `HUGO_VERSION` 只能填版本号，硬拦会误伤线上；真用到 extended 功能时 Hugo 自己会报错）。`hugo.toml` 的 `[module.hugoVersion]` 只起文档作用——实测它在项目自身配置里只打一行 WARN，拦不住构建 |
| 构建校验（CI） | `.github/workflows/build.yml`：push / PR 时用 0.167.0 extended 构建主站 + 调用 `scripts/build-subdomains.sh` 构建四个子站，另外检查每篇周刊的 front matter 有没有 `issue` 字段（漏填只会不显示徽章、不报错，所以单独查一遍）。这是「本地没事、Cloudflare 构建失败」的第一道拦截 |
| 订阅格式 | `layouts/_default/rss.xml`。首页主源 `/index.xml` + 周刊源 `/weekly/index.xml`（在 `content/weekly/_index.md` 里用 `outputs` 单独开）；栏目默认不出 RSS，改 `hugo.toml` 的 `[outputs] section`。每个源最多 20 条全文，见 `[services.rss] limit` |
| 阅读时长 / 字数 | `layouts/_default/single.html` 的 `.post-meta-main`，按 350 字/分钟算阅读时长 |
| 文章页的「更新于」 | 同一个 `.post-meta-main`：`lastmod` 比 `date` 晚才显示（比完整时间戳，不是比日期）。`lastmod` 由 `publish.sh` 里的 `scripts/sync-lastmod.py` 自动刷，别手改——手动盖章用 `python3 scripts/sync-lastmod.py --force 某篇.md`，详见「文章页的『更新于』」 |
| 文章页头部版式 | **日期 / 字数 / 阅读时长在左，分类和标签贴右**（`.post-meta` 用 `justify-content: space-between`，见 `assets/css/critical-post.css`）。这是刻意定的，不是对齐错了。窄屏放不下而换行时，标签会另起一行、从左边开始——那是 `space-between` 对「单独占一行的子项」的正常表现，不用改 |
| 代码块（红绿灯 + 复制） | 结构在 `layouts/_default/_markup/render-codeblock.html`，样式全在 `assets/css/critical-post.css` 的 `.code-block` / `.chroma*`（外壳和红绿灯配色都在这一份里，随文章页首屏内联），复制逻辑在 `assets/js/ui.js` |
| 面包屑 | `layouts/_default/single.html` 的 `.breadcrumb`（首页 › 分类 › 标题） |
| 阅读进度条 / 返回顶部 / Header 自动隐藏 | 逻辑都在 `assets/js/ui.js`，样式在 `assets/css/critical.css`（`.reading-progress`、`.back-top`、`.site-header.is-hidden` —— 都在首屏关键 CSS 里，因为滚动一开始就要用到，不能等异步包） |
| 站内跳转预渲染 + 页面过渡 | 预渲染规则在 `layouts/_default/baseof.html` 的 `<script type="speculationrules">`（当前是 `prerender` + `eagerness: moderate`，嫌费流量就改成 `conservative`）；过渡样式在 `assets/css/core.css` 的「跨页面视图过渡」段（`.post-title` / `.page-title` / `.hero-line` 上的 `view-transition-name: page-title` 在 `critical.css`，因为标题在首屏）。**预渲染会真的执行页面脚本**，所以统计（`layouts/partials/analytics.html`）和评论（`layouts/partials/giscus.html`）都判断了 `document.prerendering`，以后新加的第三方脚本也要照做 |
| 完字章 | `layouts/_default/single.html` 的 `.post-end`（印章红「完」字圆章） |
| 打印样式 | `assets/css/critical.css` 和 `assets/css/critical-post.css` 里的 `@media print`（打印/存 PDF 时隐藏导航、评论等，只留正文）。拆分时这 7 条选择器被按归属分到了两个模块，`critical.css` 那份随首屏内联、每页都有，所以打印首页也不会带出导航 |

### CSS 怎么加载（6 个模块：4 内联 + 2 异步）

样式按「首屏 / 页型」拆成 6 个模块。**每个页面只内联自己首屏用得到的那几个**，其余走异步包，目标是把关键路径压到最小。

**四个内联模块**（都内联在 `<head>` 的 `<style>` 里，零往返、不闪）：

| 模块 | 内容 |
|---|---|
| `critical.css` | **全站公共首屏**：`:root` 令牌（`--accent` / `--line-strong` / `--tick` 都靠它）、reset、滚动条、`main[id], main [id]` 锚点偏移、`.container`、`.site-header` / `.nav-*` / `.nav-icon-btn` / `.site-logo`（含深色 `filter` 反白，2026-10-04 从 `core.css` 搬来）/ `.site-brand`、**全局 `svg { stroke-width: 2 }`**、`.site-hero` / `.hero-line` + `@keyframes hero-in`、`.post-row*`、列表工具条与翻页、页脚、主题切换图标、`.back-top`、`.reading-progress`、`.skip-link`、`@media print` 的导航那几条 |
| `critical-post.css` | **正文首屏**：面包屑、`.post-header` / `.post-title` / `.post-meta*`、`.post-content` 及标题/锚点/链接/列表/复选框、`.post-toc*` / `.post-rail`（含刻度栏）/ `.post-toc-inline*`、`.article-image*`、`.code-block*` / `.chroma*`、`.table-wrap`、`.issue-badge*`、`.post-end`、`.post-tag-chip` |
| `critical-page.css` | **列表 / 卡片型首屏**：`.tag-cloud` / `.tag-chip*`、`.minimal-*`、`.group-card`、`.weekly-*`、`.page-intro`、`.category-*`、`.media-*` |
| `critical-info.css` | **单页型首屏**：`.archive-*`、`.about-*`、`.friends-*`、`.notfound*` |

（哪个页型内联哪几个，见下面的组合表——**模块表不再承担「谁用」这一列**，因为收窄之后同一个模块会被好几个页型以不同组合挑走，写在模块表里只会越来越糊。）

**两个异步模块**（`resources.Concat` 合并后异步加载）：`core.css`（全站共用，已剔除 `critical` 里已有的部分）＋ `post.css`（只放**文末家具**：`.donate*`、`.giscus*`、`.related-posts`、`.post-nav*`）。~~`.post-pill*`~~ 已于 2026-10-02 删除 —— 全站零引用，是按钮残骸（详见下面「动效词表」一节的清理记录）。

实测的加载组合与体积（2026-09-29 收窄后，读的是构建产物里真正内联的那段 `<style>`）：

| 页面 | 内联模块 | 内联 原始 / gzip | 异步包 |
|---|---|---|---|
| 首页、`/page/N/`、`/posts/` 列表 | `critical` | 19.7KB / 4.7KB | `site-core` 5.7KB / 1.8KB |
| 标签页（列表 + 详情）、分类页（列表 + 详情）、周刊列表 | `critical` + `critical-page` | 25.1KB / 5.5KB | `site-core` 5.7KB / 1.8KB |
| 归档、404 | `critical` + `critical-info` | 30.8KB / 6.3KB | `site-core` 5.7KB / 1.8KB |
| 关于 | `critical` + `critical-info` | 30.8KB / 6.3KB | `site-core-post`（页尾有打赏块 —— 它是**全站唯一**非文章却要 post 的页面，2026-10-02 起。**这个共享是故意的**：文章页也用同一个包，而「文章 → 关于」是最常见的跳转路径之一，共用一个包就是一次缓存命中；反过来把 `.donate-*` 挪进内联的 `critical-info`，会让关于页换成文章页没有的包，还给归档 / 404 / 友链三页各加内联字节） |
| 友链 | `critical` + `critical-info` + `critical-page` | 36.1KB / 7.0KB | `site-core` 5.7KB / 1.8KB |
| 隐私政策 | `critical` + `critical-post` | 37.8KB / 7.8KB | `site-core` 5.7KB / 1.8KB |
| 文章页、周刊正文 | `critical` + `critical-post` | 37.8KB / 7.8KB | `site-core-post` 10.6KB / 2.6KB |
| 书影音 | `critical` + `critical-page` + `critical-post` | 43.1KB / 8.5KB | `site-core` 5.7KB / 1.8KB |

> **兜底仍然是「全给」**（4 个内联 + `core` + `post`），但 2026-09-29 收窄之后**已经没有任何页型落在它上面**（最大内联从 54.3KB 降到 43.3KB，就是书影音页）。它现在是一条纯粹的安全网：以后新增的根级单页、或 Hugo 将来新加的 `.Kind` 落到这里时，最坏结果只是多内联几 KB，不会掉样式。
>
> 收窄的收益（每页首屏字节，内联 + 异步一起算）：分类页 −5.3KB gzip、归档/404 −4.4KB、友链 −3.7KB、关于 −3.6KB、隐私 −2.9KB、书影音 −2.2KB。方法是「解析页面用到的 class/id，看这些 token 的规则落在哪个模块，做贪心集合覆盖取最小集」；把这套方法代回首页 / 文章页 / 标签页 / 周刊列表，算出来的结果与原来已经写好的分支完全一致——这本身就是对方法的一次交叉验证。
>
> 两个**算过总账、刻意没做**的微优化：书影音页只需要 `critical-post` 里的 `.heading-anchor` 一条，友链页只需要 `critical-page` 里的 `.page-intro` 一条。把这两条挪进公共 `critical` 能让这两页各降一个模块，但会让 300+ 个页面每页多背 150–300B——单页的收益不值得全站付账。
>
> 2026-09-28 之前还有第 5 个模块 `home.css`（首页 hero、列表工具条、分页）。它整个都属于「首屏可见」，留在异步包里会让首屏先画错再重绘一次（标题先是浏览器默认的黑色粗体 h1、页脚先竖排、翻页按钮先是裸的 ‹ ›），所以整体并回了 `critical.css` 并删除。

**加载组合由 `layouts/partials/css-modules.html` 决定**：它按页型返回两组模块名（`critical` = 要内联的、`async` = 走异步包的），`baseof.html` 各 `resources.Concat` → `minify` 一次；异步那组再 `fingerprint`，用 `media="print" onload="this.media='all'"` 异步换回 `all`，另配一个 `<noscript>` 兜底（用 `media="print"` 而不是 `rel="preload"`，是为了保住 `integrity` 校验）。**两组各用各的目标名**（`css/crit-{{…}}.css` 与 `css/site-{{…}}.css`），否则会撞上下面第 1 条坑。

**`static/css/` 曾经有个兼容文件，2026-09-29 已删除**：那时为了救被 Cloudflare 边缘缓存住的**重构前**首页 HTML，把重构前单包 `assets/css/style.css` 的构建产物（62,839 B，SRI `sha256-teyeICL…G25fo=`）以**原文件名**补回 `static/css/`——那份旧 HTML 里唯一的样式表就是它，文件随 `d154d53` 删除后变成 404，命中旧缓存的访客就会看到**完全没样式**的首页（当时实测裸路径 `/` 12 次请求里 9 次命中旧变体；带 query string 的请求全部回源，所以「加个 `?x=` 就正常」正是这个现象）。

**删除前做的验证（这才是能删的依据，别只看「没人改它」）**：把**线上全站 327 个 URL**（sitemap 的 127 条 + 分页 / 标签详情 / 分类详情 / 404 + 四个子站首页）全爬一遍，grep 旧哈希 `b5ec9e2022c799f7` —— **零命中**；同时确认全站唯一出现过的样式表引用只有 `/css/site-core.min.…css`、`/css/site-core-post.min.…css` 和子站的 `/style.css`，且这三个都返回 200。删完重建，`static/css/` 目录整个消失（它只服务过这一个文件），产物 `public/css/` 只剩那两个真文件。

> 想复现那个旧产物：`git worktree add /tmp/blog-old d0d56d7 && hugo` —— 同一个 Hugo 版本 + 同一份源，指纹是确定性的，产物就是同一个哈希。

> ⚠️ 顺带暴露的真问题（**仍未根治**）：Cloudflare 那边给 HTML 的下发头一度是 `public, max-age=14400, must-revalidate`，和 `static/_headers` 里写的 `max-age=0` **不一致**（被后台的 Browser Cache TTL / Cache Rule 改写了）。2026-09-29 19:33 复测时首页已经回到 `max-age=0`，但 `cf-cache-status` 仍是 `HIT`。**每次改 CSS 都会换文件名**，所以只要边缘还在发缓存副本，以后每次发布都可能让一部分访客看到旧 HTML + 404 的 CSS。真要根治得去 Cloudflare 后台把 HTML 的 edge/browser TTL 调成 0（或加一条 Cache Rule 排除 HTML），并在发布后 Purge 一次。

改这块时的坑，都踩过：

1. **`resources.Concat` 按「目标路径」缓存**。目标名如果写死成 `css/site.css`，所有页面都会拿到第一次生成的那个包（当时表现为 310 个页面报样式缺失，但构建不报错）。所以目标名里必须带上模块组合：`css/site-{{ delimit $mods.async "-" }}.css`。
2. **`critical*.css` 放的是规则本身，不是副本**。同一组选择器不要在别的模块里再写一遍——重复定义会白送字节，而且因为内联段在异步包之前，覆盖关系还容易看错。判定方法只有一条：这条规则**首屏画完之前**用得到吗？用得到 → 进对应的 `critical-*`；用不到 → 只进异步包。
3. **周刊文章的 `.Section` 是 `weekly`，但 URL 是 `/posts/...`**（见 `hugo.toml` 的 `[permalinks]`）。`css-modules.html` 里判页面类型必须**同时看 `.Kind` 和 `.Section`**，只判 `.Section` 会让 23 篇周刊文章落到全量包。
4. **原子单元不能拆到两个文件**（2026-09-28 第二次复查时栽的）。`@keyframes`、`@font-face`、自定义属性定义、`position:fixed` 元素的定位规则，都必须和「用到它的那条规则」待在同一个文件里。当时的具体事故：`.hero-line` 的 `animation: hero-in …` 内联了，`@keyframes hero-in` 却留在 `core.css` —— 首屏这句 `animation` 解析不到关键帧，按规范**整条声明被丢弃**，标题反而一次画对；等 `core.css` 到达、关键帧可用，动画才从头跑，标题从最终态**闪成透明再淡入**，比不做动画更糟。同一轮还漏了 `.back-top`：它是 `position:fixed`，首屏第一帧就在视口里，规则留在 `core.css` 的结果是先以浏览器默认 `<button>` 的样子出现在**文档流末尾、左下角、方角**，异步包到了才跳到右下角变圆并隐藏。
5. **「全局选择器」照样会命中首屏元素**（2026-09-28 第三次复查，靠逐像素比对抓到的）。前两条的经验容易让人只盯「这个元素在不在首屏」，于是把 `svg { stroke-width: 2 }` 当成通用规则留在 `core.css` —— 结果**全站每一页**都中招：页头的搜索/主题/RSS 三个图标和列表页的翻页箭头都靠它定粗细，首屏先按 SVG 属性默认的 `stroke-width: 1` 画出细线，异步包到了才变粗变深。判据仍然是「**这条规则**在首屏第一帧用不用得到」，跟它是不是全局选择器无关。
6. **「不带 class 的选择器」是覆盖率脚本的盲区**（2026-09-29 栽的）。上面那套「按 class/id 逐个核对」的判据，对 `a[target="_blank"]::after` 这种**裸元素 / 属性选择器**完全失效——它一个 class 都没有，脚本根本不会把它列出来。当时的表现是：友链页首屏先画出没有箭头的链接，异步包到了才补上 `↗`，整行文字宽度跟着跳一次（逐像素比对量到 10,000+ 像素差异）。所以 `scripts/css-critical-coverage.py` 现在会**单独列出异步包里所有不含 class/id 的选择器**，提醒人工判断——脚本只负责把盲区摆到眼前，判不判得看人。目前只剩 `::view-transition-*` 三条（只在页面跳转时生效，与首屏无关）。
7. **兜底现在是纯安全网，不再被任何页型命中**（2026-09-29 收窄后）。`css-modules.html` 的默认分支仍然是 4 个 `critical-*` 全内联 + `core` + `post`，但每种页型都已经有了实测确认过的最小集，最大内联从 54.3KB 降到 43.3KB。以后新增根级单页或 Hugo 新加的 `.Kind` 会落到兜底，最坏只是多下几 KB。

**怎么验证「关键 CSS 覆盖够了没有」**（2026-09-28 用这套查出并修掉了 `.back-top`、`@keyframes hero-in`、`svg { stroke-width: 2 }` 三处首屏重绘）：

**判据只有一条：这个页面用到的每个选择器，规则是不是都在这一页内联的那段 `<style>` 里。**
不是「在某个已加载模块里」——那正是第一版检查器漏掉 `.back-top` 的原因。

脚本是 `scripts/css-critical-coverage.py`：

```bash
python3 scripts/css-critical-coverage.py public/index.html
python3 scripts/css-critical-coverage.py public/posts/2025/12/10/daily-update-blog/index.html
python3 scripts/css-critical-coverage.py public/index.html --all   # 列出全部用到的 class/id
```

它有四个坑，缺了哪一处都会给出假的「全绿」（前两版都栽过）：

1. **要排除 `@media print` 块。** 打印重置列表里那一长串 `.site-footer, .back-top, .post-rail …`
   会让一个选择器「看起来有规则」，实际对屏幕首屏毫无作用。脚本先把整块 `@media print {…}`
   按大括号配平切掉再匹配。
2. **比对要认选择器边界。** 直接 `substring in css` 会让 `.post` 命中 `.post-content`、
   `.post-toc` 命中 `.post-toc-inline-nav`，一律用 `re.escape(sel) + r'(?![\w-])'`。
3. **别读源文件。** `critical` 已按页型拆成 4 个文件，源文件不等于「这一页实际内联的东西」；
   脚本一律读页面里的 `<style>`。
4. **`/css/…` 这类根相对路径要按站点根解析。** 拿页面父目录去拼会找不到异步包，
   把真缺口误判成「纯 JS 钩子」。

**还有一个它结构上就管不到的盲区：不带 class/id 的选择器。** 整套判据是「页面用到的
class/id 逐个核对」，所以 `a[target="_blank"]::after` 这种裸元素 / 属性选择器根本不会进入
比对范围。脚本现在会**单独把异步包里所有不含 class/id 的选择器列出来**（带 ⚠ 标记），
让人自己判断——2026-09-29 就是靠这个把外链 `↗` 标记的缺失补上的。**别把「0 真缺口」
当成「一定没问题」，它只覆盖按 class 挂样式的那部分。**

剩下的「真缺口」里还要再分两类：规则落在异步包里的才是问题（文章页剩下的
`.donate-*` / `.giscus-*` / `.related-posts` 就属于这一类，是刻意留在下面的文末家具）；
`#main`、`#site-nav`、`#search-btn` 这类是纯 JS 钩子 / 跳转锚点，本来就没有样式，不是缺口。

脚本只回答「规则在不在」，**画面还得逐像素比对**。办法是给每页造两份：`__full.html`（原样）
和 `__fp.html`（摘掉异步包那两条 `<link>`），各截一张 1400×900 再比 md5：

```bash
# 摘掉异步包 + noscript 兜底两条 link，得到「首屏态」
python3 - <<'PY'
import re, pathlib
s = pathlib.Path('/tmp/blogcheck/index.html').read_text(encoding='utf-8')
o = re.sub(r'<link rel=stylesheet href=[^>]*media=print[^>]*>', '', s)
o = re.sub(r'<noscript><link rel=stylesheet[^>]*></noscript>', '', o)
pathlib.Path('/tmp/blogcheck/_firstpaint.html').write_text(o, encoding='utf-8')
PY
```

比对时必须做两件事，否则会得到**假阳性**：

- **先做「同一页截两次」的对照。** 渲染是确定性的（同页两次 md5 完全相同），
  所以只要 fp 和 full 不一致，就是真的差异，不是噪声。这一步能省掉大量自我怀疑——
  本次就是靠它确认「8 个页型全不一致」不是抖动，而是真问题。
- **冻结动画和过渡。** `.hero-line` 的 `animation`、目录刻度的 `transition: background`
  都是「按时间推进」的：两份文件一个要去取异步包、一个不用，截图时机天然差几十毫秒，
  不冻结就会把「动画演到一半」误判成「样式缺失」（文章页那个 2×6px 的目录刻度差异就是这么来的）。
  注入 `.hero-line{animation:none!important}` 和
  `.post-rail .post-toc-nav a,.post-rail .post-toc-nav a::before{transition:none!important}`
  之后，**13 种页型**（首页 / 文章页 / 标签详情 / 标签列表 / 周刊列表 / 归档 / 关于 /
  隐私 / 404 / 分类列表 / 分类详情 / 友链 / 书影音）全部逐字节一致。

> **页型要铺满，别只测常用的那几个。** 2026-09-29 就是给「友链」补上第 13 个页型之后，
> 才撞出外链 `↗` 缺失那个问题的——它不在覆盖率脚本的覆盖范围里，只有铺满页型才看得见。

> Helium 无头截图有个坑：**图已经写出来了，但进程退出时挂住不返回**。别等它退出，
> 轮询输出文件出现（`[ -s "$OUT" ]`）后再等 1–2 秒就 `kill -9`，否则脚本会卡在第一张。
> 另外每次都要换一个全新的 `--user-data-dir`，复用会直接挂死。
> macOS 上**没有 `timeout` 命令**，别指望用它兜底。
>
> `--dump-dom` 也有同一个毛病（DOM 写出来了、进程不退），而且 `--headless=new` 下更容易卡住；
> 要看「JS 跑完后的状态」，直接截两张图比更稳。

> 拆分前的原件 `assets/css/style.css`（88KB）**已删除**（2026-09）。它在拆分后就不再被任何模板加载，留着只会让「改了不生效」这个坑一直摆在那。要找回旧版：`git show 7867f3d:assets/css/style.css`（`7867f3d` 是它最后一次被提交的版本）。拆分前后做过零损失校验：527 条规则进、527 条出，模块间选择器零重叠（所以不存在跨模块的层叠顺序依赖），`@media print` 的 7 条选择器也一条不少。

> ~~**`core.css` / `critical-post.css` 里的「空板块」不要删**~~ —— **2026-10-02 第三轮已清理完，这条反过来读了。**
> 原状：这两个文件里有 18 + 6 个 `---------- 板块名 ----------` 的标题，标题下面**没有规则**。
> 不是漏删 —— 规则早就搬到 `critical*.css` / `post.css` 了（首屏的进内联、正文的进 `post.css`），
> **但注释没跟着走**。而那些注释里的设计理由在新位置**都找不到**，只存在于原处，
> 例如「评论区为什么用 `max-height + visibility` 而不是 `display:none`」、
> 「正文图为什么等 JS 就绪才渐显」。就地删除等于把设计史一起删了。
>
> **本轮按「注释跟规则走」逐块处理完毕**，原则是：**先判断这条注释还有没有用，再决定挪还是删。**
> - 有独立理由的 → **挪到它现在所属的规则旁边**；
> - 描述的是**已废弃的旧版式** → **就地删除**（关于页那 7 条写的是 2026-09-29 就删掉的「左柱 / 粉红光晕 / 3rem 分隔线」，
>   留着只会误导下一个人去维护一个不存在的结构）；
> - 纯标题无规则、且理由已在别处 → 删标题。
>
> **清理前后的真实计数**（`core.css`，对 `git show HEAD:assets/css/core.css` 跑同一个脚本）：
>
> | | 注释块 | 纯标题块 | **孤儿标题**（标题下无规则） |
> |---|---|---|---|
> | 清理前 | 57 | 25 | **18** |
> | 清理后 | 22 | 4 | **0** |
>
> 注意「18」是**标题个数**，不是注释行数 —— `DESIGN.md` 早先写的「42 条」是按**行**数的，
> 多行注释的每一行都被记了一次，所以对不上。**统计孤儿要按块数，别按行数。**
>
> `core.css` 文件头现在写的是一句**判据**：这条规则在首屏第一帧用不用得到。
> 复算方法：取 `/\*\s*-{4,}\s*(.+?)\s*-{4,}\s*\*/` 之间的片段，**剥掉注释后**看是否含 `{`。

### 颜色 / 字体 / 间距

全部在 `assets/css/critical.css` 顶部的 `:root`（浅色）和 `[data-theme="dark"]`（深色）变量里，比如：

```css
--accent: #c73e2f;      /* 印章红，全站主色 */
--paper: #f6f6f8;       /* 冷白浅色背景 */
--surface: #ffffff;     /* 卡片 / 分组列表 */
--ink: #1d1d1f;         /* 正文文字 */
--font-serif: ...;      /* 标题字体（思源宋体） */
--font-meta: ...;       /* 日期 / 时间 / 期号等等宽元信息（见下） */
```

**字体三档，各管一摊，别混用：**

| 变量 | 用在哪 | 说明 |
|---|---|---|
| `--font-serif` | 标题、`.post-row-title`、`.minimal-title`、归档年份等 | 思源宋体。**中文标题一律走这个，不要动** |
| `--font-sans` | 正文默认（`body`）、UI 文字 | 系统无衬线，中文落 PingFang SC |
| `--font-meta` | **只给「以数字为主」的元信息**：日期、时间、期号、字数、计数 | 等宽，移植自 bearneo 的 `time { font-family: var(--font-secondary) }` |

`--font-meta` 的用法有两条硬规则：

1. **只用在纯数字 / 日期元素上**，或确认「汉字部分会落到末尾的中文栈」的元素上。它的栈是
   `ui-monospace, "SF Mono", Menlo, Consolas, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", monospace`
   —— 末尾显式接了 `--font-sans` 的那套中文，是为了让混在元信息里的汉字（「发布于」「字」「篇」「第…期」）照旧按 PingFang SC 渲染，而不是交给系统按 `monospace` 去猜中文（macOS 和 Windows 会各猜一套）。**删掉末尾那三个中文族，混排元素里的汉字字形就会变。**
2. **不要套在 `--font-serif` 的元素上**（`.archive-year-num`、`.post-title` 这类），否则里面的汉字会从宋体掉到黑体。所以 `.archive-year-num`（`2026`）和 `.issue-badge-label` 都**没有**用它。归档页的月份标签 `.archive-month`（`10 月`）是反过来的例子：2026-10-02 起它**刻意**不挂 `--font-serif`，从「16px 宋体小标题」退成「11.5px 等宽标签」，那一个「月」字落到黑体栈是预期内的 —— 它是标签，不是标题。

目前用上 `--font-meta` 的选择器，按模块分：`critical.css` 的 `.post-row-date`；`critical-post.css` 的 `.post-meta`、`.issue-badge-num`；`critical-page.css` 的 `.minimal-date`；`critical-info.css` 的 `.archive-item-date`、`.archive-total strong`、`.archive-count`、`.archive-month`。**新增日期类元素时记得挂上，否则列表里会出现「同宽的日期里夹一个比例宽度日期」的违和感。**

### 中文强调用着重号，不用斜体（2026-10-02 新增）

Markdown 的 `*强调*` → `<em>`。**别让它斜着**：中文没有真正的斜体字重，浏览器会拿正体做
「合成斜体」（把字形沿一个角度切变），字是歪的、笔画也跟着变形。bearneo 用
`i { font-style: normal }` 躲的就是这个坑（那是无差别掰正，连英文的 `<i>` 一起管）。

本站的做法是给强调一个正经的中文排法：**着重号**。GB/T 15834 里着重号用于「要求读者
特别注意的字、词、句」，**横排是「文下打点」、直排标在字的右侧** —— 所以
`text-emphasis-position` 取 `under right`，两个值刚好各自对应一种书写方向。
样式在 `assets/css/critical-post.css` 的「正文强调」段：

```css
.post-content em,
.page-intro em {
  font-style: normal;
  text-emphasis: filled dot var(--accent);
  text-emphasis-position: under right;
}
```

为什么是着重号而不是「改成加粗」：

- **和另外两套标记互不撞车** —— `**加粗**` 是 `<strong>`，走浏览器默认的真粗体
  （PingFang SC 有真 Bold，不是合成的）；正文链接是「印泥淡痕底 + 红字」。再加一种粗体就分不清了。
- **不依赖任何字重** —— 思源宋体有没有 600 都能正常显示，比「改加粗」稳。
- 点的颜色用 `--accent` 印章红，就是纸账上那支红铅笔。

几条要知道的：

- **不做 `@supports` 降级**：`text-emphasis` 的支持（Chrome 99 / Firefox 46 / Safari 6.1+）比本文件里
  已经在用的 `:has()`（Chrome 105）更老，所以不需要兜底。
- **已知取舍**：`*强调*` 里混了英文单词时，点也会打在字母下面（CSS 没法按语种拆开）。
- **`.page-intro` 是搭车的**：它是列表页的正文容器，样式本体在 `critical-page.css`，但这条 `em`
  规则跟着正文排版放在 `critical-post.css`。今天真正有 `.page-intro` 正文的只有 `/media/`，
  而那一页同时内联了 `critical-post`，所以能生效。**以后若给 `/posts/`、`/categories/`、`/tags/`
  的 `_index.md` 写正文并用到 `*强调*`，那条规则不会生效**（那几页只内联 `critical` + `critical-page`）——
  到那时把这条复制一份进 `critical-page.css`，或给那几页的模块组合加上 `critical-post`。
- 改这块时**别顺手给 `strong` 也加样式**：它现在没有专门规则（走浏览器默认粗体）是刻意的。

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

上面这段是**摘抄**，真值以 `assets/css/critical.css` 顶部为准（以前这里抄着 18px / `< 600px`，和文件里的 17px / `< 760px` 对不上，2026-09 对齐过一次）。

写新样式时**不要再随手写 `font-size: 1.05rem` 这种值**，从上表里挑一档；字距同理，用 `--tracking-title`（中文标题 0.02em）、`--tracking-label`（中文小标签 0.06em）、`--tracking-num`（数字 / 日期 0.04em）。真正的"大字距"只留给纯英文或数字，套在汉字上会显得字被掰开。

### 层级用线，不用影（2026-10-02 收敛）

一句话：**让纸和线赢，别让卡片和玻璃赢。** 站点身份是「纸账 + 印章」，而账本没有投影，只有横线和墨。之前实现漂向了「卡片 + 玻璃 + 大圆角」，2026-10-02 按 `DESIGN.md`（仓库根目录，参照 getdesign.md 的 Wired / Notion / Linear / Claude）做了一轮减法：

- **列表退回纸上**：`.post-list` 去掉白底 / 边框 / 投影，只留 `border-top`；行与行用 `--line` 发丝线分。`.post-row:hover` **只把标题染成 `--accent`**，不再整行位移 + 变色块。归档 / 分类的 `.group-card`、`.category-card` 同理去底。
- **圆角收敛**：`--radius` 16→12、`--radius-card` 22→12、`--radius-row` 14→10。大圆角是 App 的语言，博客的容器语言应更接近印刷品。
- **阴影只留给浮层**：`--shadow-md` 现在**只剩两处** —— `.search-box`（搜索面板）与 `.nav-links`（手机菜单）；`--shadow-sm` 只作为 `--ctrl-float-shadow` 的取值，间接用在返回顶部按钮。**灯箱没有投影**（它靠遮罩压出层次，见下「浮层三件套」）。卡片一律改用「发丝线 + 纸背色（`--surface-2`）」表达层级。
- **全站去毛玻璃**：`.site-header` 与 `.back-top` 的 `backdrop-filter` 都删了，改纸底 / 实底。层级交给 `.nav-container::after` 那条「滚动时才出现」的 1px 底线。
- **`--surface`（白）不再是卡片底**：只给真正「抬起」的浮层。日常表面用 `--paper`，次一级用 `--surface-2`。
- **签名时刻保留**：印章红仍用在链接 / 悬停 / 激活 / 焦点环 / 文章末尾那枚旋转的圆章 / `hr` 中点 / 书影音卡片的 ±1.2° 旋转（全站唯一的装饰性「贴纸」）。阅读进度条从 3px 收到 2px。

**线的语法（2026-10-02 定）**：全站只有两种线，各管一件事。

| 线 | 含义 | 用在哪 |
|---|---|---|
| 1px **实线**（`--line` / `--line-strong`） | **结构性分节** | 列表分行、区域边界、代码块栏、脚注区、关于页分节（打赏块就是其中一节）、手机菜单项 |
| 1px **虚线** | **临时 / 异常状态** | 现在只剩一处：图片加载失败 `.article-image:has(img.is-failed)` |

定这条之前，同样是「分节」，关于页用虚线、归档页用实线、内联目录用虚线、脚注区用实线 —— 读者看不出虚实之别意味着什么，线就退化成装饰。**新加分隔线时默认用实线**；只有表达「这里不正常 / 这是临时态」才用虚线，这样虚线一出现就自带含义。

**印章红的收敛（2026-10-02 第一轮）**：正文一屏内的红从 6 处收到 3 处。退回中性灰阶的是 `*强调*` 的着重号（→ `--ink-soft`）、引用块左框与引号（→ `--line-strong`）、`ul`/`ol` 与脚注的 `::marker`（→ `--muted`）。**只保留三种语义**：h2 前的竖条（章节路标）、正文链接（可点目标）、文末印章（落款）。`critical-post.css` 的 `var(--accent)` 从 27 降到 20。**2026-10-04 续做**：关于页 `h2::before` 的红菱形 → `--line-strong`（一页 6 处红 → 0）。**仍待复核**：`post-cat-chip` 的红 ●、`post-tag-chip` 的红 #、阅读进度条（都不在「正文一屏」范围内）。

**列表行的内边距（2026-10-02 第一轮归一，第二轮补齐）**：`.post-row` / `.minimal-row` / `.weekly-list .minimal-row` / `.minimal-list.group-card .minimal-row` 原本各有一套（`12px 0` / `10px 8px` / `10px 16px` / `12px 0`），左留白跨度 0→16px，跨页面看就是「左轨对不齐」。第一轮统一到 `12px 0`（向 `.post-row` 看齐），手机端也不再单独覆盖横向内边距。

第二轮复算时发现**归一漏了一页**：归档页的 `.archive-item` 还是 `11px 0` —— 而 `11` 根本不在 `--space-*` 刻度上（4/8/12/16…）。它的 `line-height` 也是 `1.55`，另外两处却是 `1.5`：字号同为 `--text-sm`，行高却分两档，等于三处行高各有各的算法。现在三处**完全一致**：

| 行 | padding | line-height | 单行高度 |
|---|---|---|---|
| `.post-row` | `var(--space-3) 0` | 1.5 | 16×1.5 + 24 = **48px** |
| `.minimal-row` | `var(--space-3) 0` | 1.5 | **48px** |
| `.archive-item` | `var(--space-3) 0` | 1.5 | **48px** |

三处都写**刻度名**而不是 `12px`：以后再想整体调列表疏密，改一处 token 就够；谁写了个不在刻度上的值（比如曾经的 `11px`）也会立刻显出来。

同一轮还顺手清了 `@media (max-width:600px)` 里 `.post-row` 那三条：`padding` / `margin` 与基础档同值（纯重复），`gap` 则**对它自己完全无效** —— `.post-row` 是单列网格、只有一个子元素，那条 `gap` 真正命中的是共用 class 的 `.post-row-home`，而后者已在 `≤760px` 里单独处理。

**`.category-card` 的交互态（2026-10-02 第一轮补，第二轮修）**：它在模板里是 `<a class="category-card" href=…>`，但原先一条交互规则都没有 —— 鼠标移上去光标都不变，键盘 Tab 过去只有浏览器默认焦点环。第一轮补齐 `:hover` / `:active`（复用 `--ctrl-*`），并给标题补了颜色过渡。**不挂投影、也不做位移**：投影留给真正的浮层，位移只给卡片与主按钮。

第二轮修了两处「上一轮自己带进来的」问题：

- **删掉 `.category-card:focus-visible`** —— 它和 `critical.css` 里全局那条 `:focus-visible` 逐字节重复（同样的 `outline: 2px solid var(--accent)` + `outline-offset: 2px`）。而且它连圆角都改不了：卡自身 `border-radius: var(--radius)`（12px）在层叠上赢过全局那条的 `--radius-sm`（10px），所以有没有它都是 12px 圆角。留着只会让下一个人以为「分类卡的焦点环是单独定制的」，从而在别处也照抄重复声明。
- **按下时把计数胶囊「捞」回来** —— `--ctrl-active-bg` 就是 `--accent-soft`，而 `.category-card-count` 的底也是 `--accent-soft`：卡一按下两个色块重合，胶囊的形就没了。**没有去改 `--ctrl-active-bg`**，因为它一改 5 个控件的按下底色全变，而且会把卡片 hover 时那行印章红标题的对比度从 4.33:1 压到 3.4:1（深色 5.57 → 4.10）—— 得不偿失。改用 `.category-card:active .category-card-count { outline: 1px solid var(--accent); outline-offset: -1px }`：**一道线**，正合「层级用线，不用影」；用 `outline` 而不是 `border`，是因为它不参与布局，按下时胶囊宽度一像素都不会跳。浅色 4.33:1 / 深色 5.57:1，两套主题都读得出来。

改这些之前先读 `DESIGN.md`。新加容器时先问一句：**这条线够不够？** 够就别加底色，更别加投影。

### 浮层三件套（2026-10-02 第三轮 · 深色下怎么浮起来）

搜索面板 / 灯箱 / 手机菜单 / 返回顶部共用一套浮层逻辑。浅色下它们一直没问题，**深色下全部失去层次** —— 这是本轮修的 P0-1。

**根因（一个物理限制，不是一个 bug）**：深色页面底 `--paper: #0b0b10` 的 **L\* 只有 3.14**，遮罩再黑也只能压掉 3 点。所以深色下「压暗页面」这条路**走不通**：搜索遮罩 `rgba(20,22,26,.42)` 是个深灰，叠在近黑页面上**反而把页面提亮**到 L\* 4.61（ΔL\* **+1.47**，浅色对照是 **−34.12**）；而 `.search-box` 的底是 `var(--paper)`，与页面**完全同色**（ΔL\* = 0）；`--shadow-md` 又是黑影叠近黑底。于是面板只剩一道 1px 发丝线在分隔 —— **不是「看不见面板」，是「浮不起来」**。

**解法：把方向反过来 —— 遮罩用纯黑压实，面板抬亮。** 三个 token 落在 `critical.css` 的 `:root`：

| token | 浅色（原值，渲染不变） | 深色 | 谁在用 |
|---|---|---|---|
| `--scrim` | `rgba(20,22,26,.42)` | `rgba(0,0,0,.62)` | `.search-backdrop`、手机菜单 `.nav-links` 的背幕 |
| `--scrim-deep` | `rgba(10,12,16,.88)` | `rgba(0,0,0,.92)` | `.lightbox-backdrop` |
| `--overlay-surface` | `var(--paper)` | `var(--surface)` | `.search-box`、手机菜单 `.nav-links` |

实测深色：搜索「面板 − 遮罩」= **+9.20**（浅色 +34.11，方向一致，量级差是物理限制）；灯箱「页面 − 遮罩」= +2.89。

> ⚠️ **`--overlay-surface` 在两个主题下指向不同 token，这是刻意的，别「统一」它。**
> 浅色 `--surface`(#fff, L\*=100) 比 `--paper`(#f6f6f8, L\*=96.94) **还亮** —— 面板若用 `--surface` 就成了「比页面更亮的白纸」，那不是浮层。浅色下浮层的对比**由遮罩提供**，面板与页面同色才是对的。
>
> **`.back-top` 不走 `--overlay-surface`**，它用 `--surface`：它背后没有遮罩，必须自己跟页面对比 —— 浅色下 `--surface` 的纯白正是它可见的原因。

**量法**：浮层层次用 **ΔL\***（CIE 明度），不用 WCAG 对比度。WCAG 在近黑区被压缩得几乎不可分（`#0b0b10` 与 `#14161a` 的 WCAG 比值接近 1，但肉眼有区别）。`L* = 116·Y^(1/3) − 16`，`Y` 由 sRGB 先转线性再求加权和。

### 控件四态（按钮手感）

所有可点的控件都走 `:root` 里的四态变量，每态「底 `-bg` · 字 `-text` · 边 `-border`」（默认态另带一个 `-shadow`，通常为 `none`）。要调全站按钮的手感，**只改这一段**，不要在各个组件的 `:hover` 里写死颜色。

> **2026-10-02（第二轮）：hover 不再带影。** 原先每组四态都配了个 `-shadow`，其中 `--ctrl-hover-shadow` 被 `.tag-chip` / `.pager-btn` / `.search-close` / `.notfound-btn` 四处引用，而它在两套主题下都近乎不可见（浅色 `0 2px 8px rgba(0,0,0,.05)`、深色 `0 2px 10px rgba(0,0,0,.5)` 是黑影叠近黑底），却让「投影只给浮层」这条原则在代码里处处破例 —— 同一页的 `.category-card` 还有条注释在遵守它，同一份原则两种待遇。现在这个 token 已**整体删除**（浅色块 + 深色块 + 4 处引用），hover 只靠「底 · 字 · 边」三样，全站一致。
>
> 影只留给三类，都是有理由的：`--shadow-md`（真正会浮起来的面板：搜索面板 / 手机菜单）、`--ctrl-float-shadow`（浮动按钮的边与影，返回顶部 —— 它的取值就是 `--shadow-sm`）、`--ctrl-solid-shadow`（印章红实心主按钮的强调光晕 —— 那是「这就是那个动作」的信号，不是通用 hover 反馈）。**灯箱不在其列**：它没有投影，靠遮罩压出层次。

三套按控件的形态分：

| 前缀 | 用在 | 成员 |
|---|---|---|
| `--ctrl-*` | 描边型按钮：有底、有边 | 翻页、文章胶囊、标签云胶囊、404 按钮、搜索关闭 |
| `--ctrl-solid-*` | 印章红实心主按钮 | 404「回首页」（**打赏按钮 2026-10-02 第四轮已从这套换成 `--ctrl-*`**：它是可选动作不是主 CTA） |
| `--ctrl-ghost-*` | 无底图标按钮：默认完全安静 | 页头搜索 / 深浅色 / RSS / 汉堡、代码块「复制」 |

另有 `--ctrl-float-*`，只给浮动按钮用（返回顶部、手机目录）。**2026-10-02（第三轮）收窄成两个成员：`-border` / `-shadow`。**

原来还有 `-bg` / `-hover-bg`（半透明，配 `backdrop-filter`），但毛玻璃已经全站移除、`.back-top` 改用实心 `var(--surface)`，于是：
- `--ctrl-float-bg`（`color-mix(--paper 88%, transparent)`）变成**定义 1 次、引用 0 次**的死 token；
- `--ctrl-float-hover-bg`（`color-mix(--surface 94%, transparent)`）还挂在 `.back-top:hover` 上 —— 效果是「改成实底之后，**鼠标一悬停按钮反而变透明 6%**」，和那次决定正好相反。

两个都已删除。**浮动按钮的底和字直接走 `--ctrl-*`**：它就是个描边按钮，只是浮着 —— `--ctrl-bg` 与 `--ctrl-hover-bg` 本来就同值（都是 `--surface`），悬停不换底、只换字色和边色。

写新控件时的固定写法：

```css
.xxx-btn {
  background: var(--ctrl-bg);
  color: var(--ctrl-text);
  border: 1px solid var(--ctrl-border);
  box-shadow: var(--ctrl-shadow);
  transition: var(--ctrl-transition);   /* 不要自己写 transition 列表 */
}
.xxx-btn:hover  { /* 换成 --ctrl-hover-* 三件套（底 / 字 / 边，不带影） */ }
.xxx-btn:active { /* 换成 --ctrl-active-* 四件套 */ }
.xxx-btn:disabled { /* 换成 --ctrl-disabled-*，加 opacity: var(--ctrl-disabled-opacity) */ }
```

几条约定：

- **按下态不发光**：`--ctrl-active-shadow` 是 `none`，深色下也一样。按压靠 `--ctrl-active-bg`（印泥淡痕底）和 `transform: scale(0.96)` 反馈，不要加阴影。
- **按压语言全站只有一种：`scale(0.96)`**（2026-10-02 第二轮统一）。共享规则在 `critical.css`：`.tag-chip:active, .pager-btn:active, .nav-icon-btn:active { transform: scale(0.96) }`。翻页按钮原本另有一条 `.pager-btn:active:not(:disabled) { transform: translateY(1px) }`，特异性 `(0,3,0)` 高于共享那条的 `(0,2,0)`，所以**它一直赢** —— 结果是「胶囊和页头图标按下是缩，翻页是往下沉」两种语言，而共享列表里的 `scale(0.96)` 对 `.pager-btn` 是永不生效的死声明。第二轮已删掉 `translateY(1px)`，三个控件回落到同一条。
- **区分「hover 位移」与「按下反馈」**：位移只给卡片与主按钮（`.post-nav-card` 的 `translateY(-2px)`、`.notfound-btn:hover` 的 `translateY(-1px)`），控件不做位移；按下反馈一律是 `scale`。两者不是一回事，别混着写。
- **禁用态统一 `opacity: var(--ctrl-disabled-opacity)`（0.5）**，别再各写 0.35 / 0.55。取 0.5 是「浅到能看出禁用、又不至于读不出字」的折中（旧值 0.55）。原先举的例子是评论区那个「显示评论」按钮，**2026-10-04 该按钮已改成 `<details>` 胶囊、例子作废，但取值不变**；翻页箭头那边同时还有 `pointer-events: none` 兜底。`<a>` 模拟的禁用（翻页到头）用 `.is-disabled` 类，样式和 `:disabled` 一致。
- **深色模式只重写阴影**：其余变量都引用 `--surface` / `--line` / `--accent` 这些原始取色，会自动跟着变，不用在 `[data-theme="dark"]` 里重复一遍。现在深色块里只剩 `--shadow-sm` / `--shadow-md` / `--ctrl-solid-shadow` / `--ctrl-solid-hover-shadow` 四条（`--ctrl-hover-shadow` 已随第二轮一并删掉）。
- 图片灯箱（`.lightbox-btn`）是唯一的例外：它浮在纯黑遮罩上，纸色系按钮放上去会突兀，仍然单独写白色半透明 —— 新增这类"深底上的控件"时照此单独处理，别硬套 token。
- `--ctrl-ghost-active-*` 也用在「开关类按钮的展开态」上（比如汉堡菜单 `.is-open`），这样"现在正开着"在按钮上看得见，而不只是一个图标变形。
- **文字链接不进这套 token**：页脚 / 友链 / 导航这些纯文字链接统一是「hover 变 `--accent`」，正文内链接另有「印泥淡痕底 + 红字」的一套（`.post-content a`），这是刻意的区分——文字链接靠字色，控件靠底、边、影。
- **带语义色的胶囊不套中性 token**：`.post-cat-chip`（印泥底红字）和 `.post-tag-chip`（灰底）的底色是分类 / 标签的语义，hover 时整体切成 `--accent` 实底，保持原样，不要去"统一"它们。

### 列表行与文章标题（2026-10-02 第三轮）

**标题一律不截断。** 全站有三处渲染「文章标题」，改之前是**三种不同的行为**：

| 位置 | 用的 partial | 改之前 | 现在 |
|---|---|---|---|
| 首页 / 文章列表 | `post-row.html` / `post-row-compact.html` | `-webkit-line-clamp: 2`（两行后带省略号） | 自由换行 |
| 分类 / 标签 / 周刊 | `post-row-minimal.html` | `white-space: nowrap` + `text-overflow: ellipsis`（压成一行） | 自由换行 |
| 文末上一 / 下一篇 | `single.html` 里的 `.post-nav-card` | `nowrap` + `ellipsis`（一行） | 自由换行 |

理由：**被截掉的那半句，正是读者判断「要不要点进去」的全部依据**，列表省下的那点行高不值这个价。
三处都只删掉了截断声明、加了 `min-width: 0`（让标题在 flex / grid 里能正常收窄换行），**没有动字号和行高**。

实测口径（复算用）：全站 122 篇里最长的标题约 **23.5 个全角字宽**，在 680px 正文列里只占 0.55 行
—— 也就是说首页那个 2 行 clamp **从来没触发过**，它只是在「等着」截断下一篇长标题；
而文末上下篇的卡片内宽只有约 292px（≈18 个全角字），**约 7% 的文章确实被砍过**。

> 想收紧列表高度，请调 `.post-row` / `.minimal-row` / `.archive-item` 的纵向内边距（三处都是 `var(--space-3)`），**不要回头去调标题**。

**文章页的 `h1`（`.post-title`）不做 `text-wrap: balance`**（2026-10-02 晚，作者单独提的问题）。
他看到的是「长标题换行后第一行没排到最右，右边空一大块」。根因是 `critical.css` 里这一组：

```css
.hero-line, .page-title, .post-title, .about-name { text-wrap: balance; }
```

`balance` 按「各行字符数尽量相等」去排，标题一多行，第一行就必然停在半途 —— 它治的是**英文**标题的孤词，
代价却是**每一条**多行标题都短一截。已把 `.post-title` 从这组摘出，单独写 `text-wrap: wrap`，
**并且留在内联的关键 CSS 里**（不能挪去异步包：标题在首屏，异步包到达后重排会让换行位置当场跳一下）。
另外三个选择器（`hero-line` / `page-title` / `about-name`）内容都很短，实际不换行，`balance` 保留。

**同一轮给 `.post-title` 补了 `font-weight: 500`**（对齐 `DESIGN.md` 的层级表）。此前全站**一条 `font-weight` 都没有**，也没有 `h1 { font-weight }` 规则，所以它落在浏览器对 `h1` 的默认值 **700**。
⚠️ 记住一个**渲染事实**：`--font-serif` 在 macOS 落到 **Songti SC，只有 400 / 700 两档**，所以 `500` 会**解析成 400 Regular** —— 标题实际比改之前**细了一档**（预期行为，不是 bug）。**别为了让 500「真的生效」去加载外部字体**，那和「不下载外部字体」的原则冲突；哪天换到思源宋体（有 Medium），同一个 `500` 会自动落到 Medium。
> 顺带发现：`DESIGN.md` 层级表里 **H2 / H3 写的也是 500，但实现同样是 700**（`.post-content h2/h3/h4` 都没有 `font-weight`）。**这次没有一并改** —— 它会改变正文内部的层级观感，比单改一个文章标题影响面大。已记进 `DESIGN.md` 的 Known Gaps 待决策。

**为什么不改成 `text-wrap: pretty`**（它规范上就是「让末行至少留 2 个词」，看着正好治孤字）：
Text Module Level 4 这批特性（`pretty` / `balance` / `hyphens` / `line-break`）的设计目标几乎都是英文场景，
在中文里 `pretty` 会让行**提前换行** —— 正是作者抱怨的同一个症状。中文站点不要默认引入这批特性。

**已知代价**：124 条标题里桌面端只有 9 条会换行，其中 3 条末行 ≤2 字（清单见 DESIGN.md 的 Known Gaps）。
这是中文自然换行的偶发代价，不是缺陷。

**中文断行的离线量法**（本机没有无头浏览器，只能这样量；细节见 `hugo-blog-design-review` skill）：
用 `fontTools` 读 `/System/Library/Fonts/Supplemental/Songti.ttc` 取每个字的 `hmtx` 字宽，
按 `字号 38px + 字距 0.02em`、容器 `680px`（`--content-width`）跑贪心断行，
断点规则用「汉字之间可断、`，。）」` 等收尾标点前不可断、`（「` 等起首标点后不可断」。
换字体栈或改 `--post-title-size` / `--content-width` 后要重跑。

**间距刻度外的残留值**（第三轮清点，**已收口**）：
①`.post-content a` 的 `padding-bottom: 1px` **保留** —— 它是**线宽**不是间距：下划线本身是 1px 的 `linear-gradient`，这个 padding 是让线不贴字形的间隙，收进 4px 步进会把线推远成「另一条装饰线」。
②右侧目录 `padding: 0 0 0 18px` → 抽成 `--toc-indent: calc(6px + var(--space-3))`；那个 **6px 是刻意的字面量**，**不能**换成 `var(--tick)` —— `--tick` 是逐级 6/5/4/3，用它会让层级越深缩进越**小**。
③`.code-block-dots` 的 `gap: 6px` → `var(--space-1)`（4px，随手写的，无特殊理由）。
> 顺带纠一处文档笔误：`1px` 在 **`.post-content a`** 上，不在 `.post-content p` 上（旧文档一直写错）。

### 动效词表（2026-10-02 建立）

**三档时长，一条缓动**，定义在 `critical.css` 的 `:root`：

| Token | 值 | 管什么 |
|---|---|---|
| `--dur-fast` | 0.15s | 悬停 / 聚焦 / 颜色变化（`--ctrl-transition` 也走这档） |
| `--dur-base` | 0.22s | 展开 / 淡入 / 位移 |
| `--dur-slow` | 0.4s | 图片入场 / 页面转场 |
| `--ease` | `cubic-bezier(0.32, 0.72, 0, 1)` | 全站唯一曲线 |

写新样式时的规矩：**`transition` / `animation` 的时长和缓动都从这里挑，不要写 `0.18s ease` 这种硬编码。**

**为什么要有词表**：建表前全站有 **10 个**不同的过渡时长（0.15s ×36、0.2s ×13、0.25s ×10、0.18s ×9、0.22s ×6、0.3/0.4/0.5/0.6/0.04s 各 1），只有 `--ctrl-transition` 是 token；缓动清一色裸 `ease`。这些值彼此只差 1–3 帧，读者感觉不到快慢，只觉得「这里好像跟别处不太一样」。

**落地数字（2026-10-02 第二轮复算，这个口径可复现）**：按 `transition` / `animation` 声明里的时长数 ——

| | 处数 | 明细 |
|---|---|---|
| 改动前 | **84** | 0.15s ×41 · 0.18s ×9 · 0.2s ×13 · 0.22s ×7 · 0.25s ×10 · 0.3s ×1 · 0.4s ×1 · 0.5s ×1 · 0.6s ×1 |
| 改动后 | **80** | `var(--dur-fast)` ×41 · `var(--dur-base)` ×36 · `var(--dur-slow)` ×3 |
| 刻意保留 | **2** | `hero-in` 的 `0.04s`、`page-title` 的 `0.32s` |

差额 `84 − 80 = 4` 就是同期一起删掉的 4 条**永不触发的死 transition**（`main.container` 的 opacity、`.post-list` 的 opacity、`.minimal-row` 的 background/transform 等），不是替换漏了。现在的状态是：**零裸 `ease`、零词表外时长**。

> 复算方式：`git show HEAD:assets/css/*.css` 拿到旧版，**先剥掉注释**再数 —— `critical.css` 的词表注释里本身就写着「0.15s ×36……」这些字面量，直接 grep 会连注释一起数进去，得出离谱的总数。更省事的办法是数**构建产物**（`public/*.html` 内联的 `<style>` 里没有注释）。另外 minify 会**去掉前导零**（`0.32s` → `.32s`），搜产物时正则要写成 `\d*\.?\d+s`。

**两个刻意的例外**（不要"顺手统一"掉）：
- `@keyframes hero-in` 用自己的 `cubic-bezier(0.2, 0.7, 0.2, 1)`，时长走 `--dur-slow`。卷首入场是一次性动画，要「推上来」不是「滑上来」。
- `::view-transition-group(page-title)` 的 `0.32s`，比 `--dur-base` 慢 0.1s，让标题**领着**页面走。

**`prefers-reduced-motion` 是「换一种做法」，不是「把时长归零」**：现在除了 `transition-duration: 0.01ms`，还加了 `animation: none !important`。只压时长的话，`hero-in` / `overlay-in` / `search-in` 三个 `@keyframes` 仍然会「跑」，只是瞬间跑完，元素照样「跳」到终态 —— 而这一跳正是敏感用户要避开的。关掉动画后三个元素自动落到基础样式（它们的终态本来就等于基础样式），所以不需要再补 `opacity: 1` / `transform: none`。

**位移（`translateY`）只给卡片和主按钮**：悬停位移全站只剩 `.post-nav-card`（-2px）与 `.notfound-btn`（-1px）两处。图标按钮 / 胶囊 / 文字链接 / 打赏按钮一律靠颜色与底色回应。原先是 7 处。

**顺带清掉的三样**（同一轮）：
- `.post-pill` 全套 5 条规则 + `.post-pill svg`，以及 `critical.css` 里三份**共享选择器列表**中的名字（`position: relative` / `::after` 命中区 / `:active` 缩放 —— 只摘名字，规则留给其他控件用）。
- `main.container` 与 `.post-list` 上两条**永不触发**的 `transition: opacity`（全站对 opacity 的写入只落在 `.article-image` 的 `.is-loaded` / `.is-failed` 上）。
- **空行占位**：`core.css` 1011 → 484 行、`critical-post.css` 1138 → 961 行。这些是历次「把规则搬走」留下的坑位，让「文件多大」完全失真（`core.css` 实际只有约 380 行 CSS）。

### 响应式断点速查

| 断点 | 行为 |
|---|---|
| ≥ 1152px | 目录固定在正文右侧，平时收成一列小刻度；悬停展开成标题，点左上角图钉「钉住」后一直展开。面板宽度 `clamp(212px, 50vw - 372px, 244px)`，窗口越窄面板越窄 |
| < 1152px | 目录排在正文开头（`.post-toc-inline`），点标题栏可收起；手机上（≤760px）默认收起 |
| < 760px / < 600px | 导航、卡片、列表、正文字号的移动端微调 |

侧边目录的断点是**从 1280px 降到 1152px 的**（2026-09-29）。原来的 1280px 照 sspai 取：正文 680px 居中，1280px 窗口两侧各留 300px，减掉 244px 的目录只剩 56px 空隙，再窄目录就贴到正文上 —— 于是 1280px 以下一律走正文开头那块，而 13 寸笔记本缩放后的窗口宽度（≈1280）正好卡在门外。现在让面板宽度自己跟着窗口缩：

```
面板宽 = clamp(212px, 50vw - 372px, 244px)
```

`50vw - 372px` 就是「正文右侧还剩多少」减去 32px 最小空隙（正文右边缘 = `50vw + 340`）。窗口 ≥ 1232px 时它算出来 ≥ 244px，被 clamp 的上限吃掉 —— **1232px 以上和改之前逐像素一样**（1440 / 1512 / 1920 完全没动）。1152px 时面板 212px、空隙 24px，是这套比例下还能看的最后一档：212px 减掉 18px 的刻度槽还剩 194px，约 13 个汉字。窗口宽到 1424px 以上时，目录左边缘离正文右边缘固定 128px（sspai 的取值），多出来的宽度都留给右边距。

改这个断点时**三处必须一起改**：`critical-post.css` 里那条 `min-width: 1152px`、同文件末尾两条 `max-width: 1151.98px`（一条藏刻度栏、一条显示 `.post-toc-inline`）、以及 `layouts/_default/single.html` 里的说明注释。只改一边会出现两种目录同时显示、或者同时消失。

**目录缩进收成了 token**（2026-10-02 第三轮）：`.post-rail .post-toc-nav a` 原来写死 `padding: 0 0 0 18px`（`18` 不在 `--space-*` 刻度上）。现在拆成 `--toc-indent: calc(6px + var(--space-3))`，二级 / 三级缩进分别用 `calc(var(--toc-indent) + var(--space-4))` / `calc(var(--toc-indent) + var(--space-8))`。**渲染值与改之前逐像素一致**（仍是 18px 起），改写法只是让「18 从哪来」看得见：`6px` 是刻度槽的宽、`var(--space-3)` 是文字与刻度槽的间隙。
> ⚠️ 那个 `6px` **刻意不用 `var(--tick)`** —— `--tick` 是**逐级** 6/5/4/3 的刻度点尺寸，拿它当缩进基准会让层级越深缩进越**小**，正好反了。

### 站内搜索（2026-10-02 重写：从「子串命中」到「加权打分」）

搜索分两半：**索引**（构建时生成）和 **匹配排序**（浏览器里跑）。

- 索引：`layouts/index.searchindex.json` → 输出 `/search-index.json`，字段 `title / summary / description / body / tags / categories / url / date`。
- 匹配：`assets/js/search.js`。索引在 `open()` 时才 `fetch`，**不是首屏资源**。

**为什么重写。** 旧实现是「把 title+summary+description 拼起来做一次 `indexOf`，命中即算 1 分，然后按索引顺序 `slice(0, 20)`」。两个硬伤叠在一起：

1. **没有相关度**。谁命中都是 1 分，结果按时间倒序排 —— 「最新」被当成了「最相关」。
2. **`slice(0, 20)` 是硬截断**。中文单字「我」在 122 篇里命中 75 篇，标题就叫《关于我》的那篇恰好是最老的一篇，永远排在第 122 位，直接被砍掉。

于是就有了那个很反直觉的现象：搜「我」找不到《关于我》。**顺带一提，搜「关于」其实也找不到**（8 篇命中，但只有第 2、18 位落在前 20 里），只是命中数少的时候不容易察觉。

**现在怎么排。** 每个字段一个权重，命中次数走对数衰减（出现 1 次得满权重，第 2 次只多 0.45 倍，避免长正文靠刷词堆分），再按总分排序：

| 字段 | 权重 | 说明 |
|---|---|---|
| `title` | 100 | 标题命中，最高 |
| `tags` | 60 | |
| `categories` | 40 | |
| `summary` | 30 | |
| `description` | 20 | |
| `body` | 8 | 只负责「召回」，不负责「排序」 |

再叠两个加成：**标题与查询完全一致 +300**（搜「关于我」时《关于我》必须第一）；**标题覆盖率加成**（查询词占标题的比例，最高 +50）—— 搜「我」时《关于我》(1/3) 要压过《我是个爱折腾的人》(1/8)。时间只在**同分**时当兜底。结果上限从 20 提到 30。

几条前端约定：

- **多词是 AND**：按空白 / `,，、;；|` 切词，每个词都得在某个字段里出现，否则整条淘汰。
- **中文单字兜底**：短语查不到、且查询是 2–4 个**纯汉字**时，退化成「这几个字都得有」。拉丁字母绝不能拆 —— 否则「zzzzz」会被拆成 5 个 z，去正文里翻出一堆含 z 的文章。
- **高亮所有命中**（旧版只标第一处），并且合并重叠区间，否则「关于我」里的「关于」和「我」会套出嵌套的 `<mark>`。
- **正文命中时换摘要**：如果命中只发生在正文，摘要行改为显示命中位置附近的上下文片段，并标注「正文匹配」—— 否则用户看到一条结果，摘要里一个关键词都没有，会莫名其妙。

**要调什么，去哪调：**

| 想改 | 改哪 |
|---|---|
| 权重 / 结果上限（`MAX_RESULTS` = 30）/ 兜底规则 | `assets/js/search.js` 顶部的 `W` 和 `MAX_RESULTS` |
| 正文进索引的长度（`$bodyCap`，当前 500 字） | `layouts/index.searchindex.json` |
| 索引收哪些字段 | 同上，那个 `dict` |

`$bodyCap` 是「体积 ↔ 召回」的旋钮，本机 122 篇实测（已剔除代码块）：

| `$bodyCap` | 未压缩 | gzip | 完整覆盖 |
|---|---|---|---|
| **500 字（当前）** | **224 KB** | **94 KB** | **3/122** |
| 600 字 | 258 KB | 108 KB | 15/122 |
| 800 字 | 323 KB | 137 KB | 16/122 |
| 1200 字 | 442 KB | 187 KB | 31/122 |
| 不限 | 921 KB | 389 KB | 122/122 |

停在 500 是刻意的取舍：正文只负责「召回」，排序权重压得很低（`W.body` = 8），所以**宁可少进一点，也别让索引变胖**。500 字 ≈ 220 个汉字，够覆盖「引言 + 第一个小节」；本机正文中位数 2056 字，也就是中位覆盖约四分之一。索引是打开搜索面板才拉的非关键路径，Cloudflare 还会 brotli 压缩。

**踩过的坑（改这块之前先看）：**

- **Hugo 的 `trim` 参数是 `(字符串, cutset)`，不是 `(cutset, 字符串)`**。所以 `{{ $s | trim " " }}` 会变成 `trim(" ", $s)` —— 拿一个空格去「按正文内容裁剪」，结果直接返回空串，而且**不报错**。裁首尾空白请用 `{{ $s | strings.TrimSpace }}`。
- **`len` 数的是字节，`truncate` 数的是字符**。中文 1 字 = 3 字节，`$bodyCap` 的单位是「字」，别拿 `len` 的结果去对。
- 正文取自 `.Content`，摘掉 `<pre>` 和 `.code-block-bar` 之后再 `plainify`。代码块是高熵内容（拖 gzip、又是检索噪音），`.code-block-bar` 里还有「语言名 + 复制」，不摘掉的话搜「复制」会命中一堆文章。
- 改完用 `hugo --gc --minify --cleanDestinationDir` 构建。不带 `--cleanDestinationDir` 的话，旧的 `bundle.min.*.js` 会残留在 `public/js/` 里，看起来像「改了没生效」。

### 归档页（2026-10-02 改造：去掉三处重复）

归档页原来是「时间轴 + 年 + 月 + 条目」四层，每层都想有存在感，结果**同一件事被说了三遍**：

- **篇数说两遍**：年报一次「110 篇」，下面每个月的标题又各报一次。
- **月份说两遍**：分组标题已经写了「12月」，每条文章前面又写 `12-05`。
- **折叠控件说两遍**：年一个箭头、月一个箭头，一屏里竖着排两列三角。

再加上左侧一条 2px 时间轴竖线（挂着年的 12px 空心圆环 + 月的 6px 实心点）和月份之间的 1px 虚线 —— **竖线 + 虚线 + 两种圆点，四套「线/点」语言同时出现**，这就是「乱」的直接来源。每行元素数：年行 4 个、月行 4 个、条目行 2 个。

**改法**（对齐 `DESIGN.md`「让纸和线赢」+ bearneo 的平铺列表）：

| 改动 | 说明 |
|---|---|
| 篇数只留年一级 | 删掉月级计数；`.archive-count` 加 `margin-left: auto` 推到最右，不再紧贴年号 |
| 月份退成标签行 | `.archive-month` 从「16px 宋体 + 计数 + 箭头 + 圆点」退成「11.5px 等宽小字 + 字距」，**不再折叠** |
| 条目日期只渲染「日」 | `.Date.Format "02"`，月份交给上面的标签（**2026-10-02 晚：日期从行首搬到了行尾**，见下） |
| 去掉时间轴与虚线 | 年份下加 `border-bottom: 1px solid var(--line)` 承担全部层级 |
| 行高松绑 | `.archive-item` 上下 padding `var(--space-3) 0`（8px → 11px → 2026-10-02 第二轮归到刻度名 12px）；`line-height` 也从 1.55 归到 1.5；hover 只染红标题，不再铺底色 |
| 只有 1 个月的年份不出月份标签 | 2025 只有 12 月，出标签就是「2025 · 12 篇」紧接「12月 · 12 篇」 |

每行元素数从 **4 + 4 + 2 降到 2 + 1 + 2**。

**结构**：`<section class="archive-list">` → 每年一个 `<details class="archive-year-block" open>` → `<summary class="archive-year">` 里放 `<h2 class="archive-year-num">`（年）+ `<span class="archive-count">`；下面是 `<h3 class="archive-month">` 标签 + `<div class="archive-month-list">` 条目。加 h2 / h3 是为了让读屏能在这 122 条里按年、按月跳转（原来整页只有 h1）。

**月份折叠是刻意去掉的**（2026-10-02 用户拍板），所以一屏里只有「年」这一列箭头。

**注意**：`.archive-timeline` 与 `.archive-month-label` 两个类名已彻底移除（前者改名 `.archive-list`），旧的 `.archive-year-block summary` 选择器也一并去掉 —— 样式直接挂在 `.archive-year`（它就是那个 `summary`）上。改这块时别再引旧类名。

**条目行：标题左 / 日期右（2026-10-02 晚，用户提出）**

原话是「文章标题在左，日期放在最右边」。改之前日期在**行首**，靠 `.archive-item-date` 写死的 `flex: 0 0 2.2ch` 立成一条左轨，标题跟在后面。现在整行换成**首页 `.post-row-home` 那套语言**：

```css
.archive-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;   /* 标题占弹性列，日期占 auto 列贴最右 */
  align-items: baseline;                        /* 注意：不是 .post-row-home 的 center */
  gap: var(--space-4);
  padding: var(--space-3) 0;
}
```

三个要点：

1. **`align-items` 用 `baseline`，不是 `center`。** 首页那些行标题基本不换行，居中没差别；归档页标题会换行，用 `center` 的话日期会掉到两行之间的半空，`baseline` 才能咬住**第一行**。
2. **`flex: 0 0 2.2ch` 已删。** 日期一走，那条左轨就由标题自己立住；何况 `flex` 简写在 grid 子项上本来就被忽略，留着是死声明。换成 `white-space: nowrap`（跟 `.post-row-date` 一致）。
3. **模板的 DOM 顺序也跟着换了**（`archive.html` 里 `<span class="archive-item-title">` 现在排在 `<time>` 前面），**没有用 CSS `order` 去掰** —— 视觉顺序和读屏顺序必须一致，否则屏幕阅读器会念出「20 标题」。

`.archive-item-title` 补了 `min-width: 0`，和 `.post-row-title` / `.minimal-title` 一致：长标题要能在弹性列里正常收窄换行，而不是把日期挤出容器。

> 顺带记一笔：日期搬到右边之后，**左侧那条「年 / 月 / 日」三级对齐的左轨就不存在了** —— `.archive-month` 标签还留在左边，但它不再和任何东西对齐，退化成纯粹的分组标题。这是本次改动的必然结果，不是漏改。右侧则新成了一条轨：年行的「N 篇」和每行的「日」都贴最右。

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
| 五个项目一起挂 | 项目里没设 `HUGO_VERSION`，Cloudflare 用镜像默认的 Hugo 0.147.7，被 `check-hugo-version.html` 硬拦 | Settings → Environment variables → **Production** 作用域补 `HUGO_VERSION=0.167.0`（五个项目都要），再回 Deployments 点 **Retry deployment** |
| 只有 run / profile 挂 | 模板用了 `hugo.Data`（0.156 才有），而子站项目还跑在 0.147.7 | 同上，把子站的 `HUGO_VERSION` 一起提到 0.167.0 |

> 环境变量改完**必须重新部署一次才生效**：Deployments → 最新那次 → Retry deployment（或再推一个提交）。构建期间站点不会掉线——失败时 Cloudflare 保留上一次成功的部署，只是内容停在那一次。

`deploy.sh` 是一个**手动**的干净构建脚本，做的事：

1. `hugo --gc --minify` 干净构建到临时目录，并检查产物里没有 livereload 调试脚本；
2. `rsync -a --delete` 同步到 `public/`。

它只更新本地 `public/`，**不上传、不部署**。想确认构建产物是否干净、或想强制全量重建时用它。

托管平台相关的两个文件都在 `static/`，部署时会原样发布：

- `_headers`：缓存与安全响应头。**HTML、RSS、搜索索引、sitemap 一律 `max-age=0, must-revalidate`**（每次访问都发条件请求，没变回 304，变了立刻是新内容），**不要给这些加 `stale-while-revalidate`**：它会让 CDN 在回源刷新期间继续发旧页面（最长 24 小时），2026-09-28 那次「发了新文章、首页还是旧的」就是这么来的。这几条 HTML 规则其实和 Cloudflare Pages 的默认值相同（实测不写规则的 `/privacy/` 也是 `max-age=0, must-revalidate`），显式写一遍是为了不依赖平台的默认行为。静态资源长缓存：CSS/JS 1 年 immutable、图片 30 天（`/img/`、`/images/` 两条）、图标 7 天。规则按路径精确匹配，**新加文件类型或新目录时记得补一条**（`/images/` 就是漏了一整年）。**别给内容路径写资源规则**：曾经有一条 `/media/*`，本意是图片目录，结果把书影音内容页 `/media/` 一起套上了 30 天缓存（2026-09-28 线上实测确认，已删）——加规则前先确认这条路径没有被内容页占用。防嵌套那两条是 `X-Frame-Options: SAMEORIGIN` + `Content-Security-Policy: frame-ancestors 'self'`——**CSP 只写这一个指令**，其余留空才不会限制脚本/样式，不会影响 giscus。**HSTS**（`Strict-Transport-Security: max-age=31536000; includeSubDomains`）是 2026-09-28 加的：浏览器在一年内只肯用 HTTPS 访问本域和全部子域，从根上堵掉 SSL stripping 和「用户手打 http://」的中间人窗口。加之前实测过 `hulatu.com` / `www` / `profile` / `run` / `shot` / `share` / `img` 七个域名的 `http://` 全部 301 跳 https、图床 https 也能正常取图，所以 `includeSubDomains` 是安全的。**注意它是单向门**：浏览器一旦记住，max-age 到期前回不去 HTTP——想退出就把这条改成 `max-age=0`（已经记住的人要等它过期）。没加 `preload`：那需要另外去 hstspreload.org 提交、而且从预加载列表移除要等好几个月，收益只覆盖「第一次访问」那一瞬间，属于可选的后话。**三处都写了 HSTS**：主站 `static/_headers`、`sites/run/static/_headers`、`sites/shot/static/_headers`（后两处是为了读者第一次落地就在子站时也能立刻拿到）；顺带记一笔，`sites/profile` 和 `sites/share` **根本没有 `_headers` 文件**，连 `X-Content-Type-Options` 这类基础头都没有。注释要写在路径块外面，Cloudflare 只在整行以 `#` 开头时当注释。**这里的值只在 CDN 没有额外规则时才说了算**：Cloudflare 后台如果给 HTML 单独配了 Cache Rule 或 Browser Cache TTL，会覆盖它（判断方法：`curl -sSI https://hulatu.com/ | grep -i 'cache-control\|age\|cf-cache-status'`，`age` 很大而 `cf-cache-status: HIT` 就是被缓存住了；实测后台那条 Browser Cache TTL = 4 小时会把 `/images/avatar.webp` 这类静态资源的 max-age 改写成 14400）。**2026-09-28 逐路径核对线上响应头，发现首页这条规则没生效**：`/` 返回的是 `public, max-age=14400, must-revalidate` 且 `cf-cache-status: HIT`（`age` 一万多秒），而 `/page/2/`、`/archive/`、`/weekly/`、`/categories/`、`/tags/`、`/about/`、`/friends/`、文章页、`/index.xml`、`/sitemap.xml`、`/search-index.json` 全部是正确的 `max-age=0, must-revalidate`。同一份 `_headers`、同样的值，只有 `/` 被改写，说明是那条 `/` 规则没匹配上、首页退回了后台的 4 小时 Browser Cache TTL——**「发了新文章、首页还是旧的」的根因在这里，不在 `stale-while-revalidate`**（那个 2026-09-28 已经去掉了，但首页问题仍在）。排查顺序：① `Caching → Configuration → Browser Cache TTL` 改成 **Respect Existing Headers**；② 查 `Caching → Cache Rules` 和 `Rules → Page Rules` 有没有针对根路径的规则；③ 想确认是不是规则没命中，在 `_headers` 的 `/` 块里临时加一行 `X-Test-Root: 1`，发布后 `curl -sSI https://hulatu.com/ | grep -i x-test-root`——没出现就是没匹配。**不要**图省事加一条 `/*` 兜底：Cloudflare 多条规则命中时同名字段会**逗号拼接**，`/*` 会和 `/css/*` 撞成 `max-age=0, ..., max-age=31536000, immutable`。
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
- 头像（`static/images/avatar.webp`）不在正文里，走的是另一条路：`layouts/_default/about.html` 给它套一层 `/cdn-cgi/image/width=…`，按实际显示尺寸出图（1x 148px、2x 296px；`≤600px` 时显示 124px）。**为什么值得单独套**：源图是 480×360 / 17.8KB，而页面只显示 148px，等于把 4 倍于所需的像素发给所有人——实测 AVIF 从 14KB 降到 3.6KB(1x) / 8.4KB(2x)。顺带修掉一个反直觉的坑：源图扩展名是 `.webp`，Cloudflare Polish 在「客户端不接受 webp」时会把它**重编码成 21KB 的 JPEG，比原文件 17.8KB 还大**；走 Transformations 后同样的兜底只有 11KB。只传 `width` 不传 `height`（保持 4:3，裁圆仍交给 CSS 的 `object-fit: cover`），视觉与改之前逐像素一致——实测 `fit=cover` 让服务端裁成正方形反而更大，而且裁剪重心可能与 CSS 不一致。开关是 `hugo.toml` 的 `params.avatarCDN`，设成 `false` 就退回发原图（头像在关键路径上是 `eager` + `fetchpriority=high`，留这个开关是为了 Image Transformations 万一不可用时能一键回退）。**改了 `assets/css/critical-info.css` 里 `.about-avatar` 的尺寸，记得回来同步 about.html 里的 `width=` 和 `sizes`。**
- `profile.hulatu.com` 页头用的是同一张头像（显示 120px；`≤520px` 时 84px），在 `sites/profile/layouts/index.html` 里做了同样的转换，但**只重写 `https://hulatu.com/images/` 开头的 URL**——以后换成外链（Gravatar 之类）会原样使用，不会把别人的图塞进我们的转换端点。
- 转换后的 URL 缓存是 30 天，**不是** `_headers` 里 `/images/*` 那条规则匹配到了 `/cdn-cgi/...`（路径对不上），而是 Cloudflare 的 Image Transformations 会继承源对象的 `Cache-Control`。所以想换头像仍然按老规矩来：改完在后台 Purge，或者换个文件名，否则 30 天内大家看到的还是旧图。

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

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

发布前把 `draft` 改成 `false`，然后执行 `./publish.sh`（或终端里的 `up`）。

### 文章短代码

正文里可以直接用的排版组件，只有书影音这一类：

| 短代码 | 用途 | 用法 |
|---|---|---|
| `book` | 单本书的封面卡片 | `{{< book cover="封面图" title="书名" creator="作者" >}}` |
| `books` | 把若干 `book` 包成网格 | `{{< books >}}…{{< /books >}}` |
| `media` | 单条书影音（书 / 影视 / 音乐通用） | `{{< media cover="封面图" title="标题" creator="作者" >}}` |
| `media-grid` | 把若干 `media` 包成网格 | `{{< media-grid >}}…{{< /media-grid >}}` |

`book` 和 `media` 都只是转调 `layouts/partials/media-card.html`，区别只在外面包的是 `books` 还是 `media-grid`。用法直接抄 `content/media/_index.md` 的现成例子；样式在 `assets/css/style.css` 的「书影音」段。

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

`run.hulatu.com`、`shot.hulatu.com`、`share.hulatu.com` 和 `profile.hulatu.com` 是独立 Hugo 站点，源码分别在 `sites/run/`、`sites/shot/`、`sites/share/` 和 `sites/profile/`。目前 `shot` 和 `share` 还没有实际内容，暂时不上线。本地一起构建：

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
| 首页每页展示几篇 | `layouts/index.html` 里的 `.Paginate $posts 10`；周刊在 `layouts/weekly/list.html` 里的 `.Paginate $all 10` |
| 周刊期号徽章 | 读 front matter 的 `issue: 22`（模板里是 `.Params.issue`）。**新写一期周刊记得填这个字段**，不填就不显示徽章。以前是从标题「第 X 期」里正则解析中文数字（`layouts/partials/issue-num.html`，2026-09 已删）：那种写法只在标题里能看出来，改标题就悄悄失效，还多一层中文数字解析 |
| 相关文章（取几篇、按什么匹配） | `hugo.toml` 的 `[related]`；模板在 `layouts/_default/single.html` |
| 上一篇 / 下一篇导航 | `layouts/_default/single.html` 里的 `.post-nav` |
| 标签云（展示哪些标签） | `layouts/_default/taxonomy.html` 里 `site.Taxonomies.tags.ByCount` |
| 目录侧栏显示/隐藏断点 | `assets/css/style.css` 搜 `1340px`（固定侧栏）和 `1339.98px`（改用抽屉） |
| 手动提交发布 | 终端输入 `up` → `publish.sh`（抓取正文图片宽高 → 提交本地改动 → 推 GitHub → 拉取远端 → 再推送）→ `hugo --minify`（**只写本地 `public/`，给自己看**）。**真正的上线由 Cloudflare Pages 的 Git 集成在 push 后自动构建完成**；本机没有 wrangler，也不做手动上传 |
| 正文图片宽高 | 远程正文图（图床）构建期读不到尺寸，会让页面加载时跳动。`scripts/fetch-image-dims.py` 抓一次尺寸写进 `data/image_dims.json`（已提交），模板 `layouts/_default/_markup/render-image.html` 查表输出 `width`/`height`。新增图片后跑一次脚本即可，已缓存的会跳过 |
| 图片灯箱 | 结构在 `layouts/_default/_markup/render-image.html`：图片被 `<a class="article-image-link" href="原图">` 包着，JS 拦下点击打开灯箱，JS 不可用时退化成「点开原图」。样式在 `assets/css/style.css` 的「文章插图」段，逻辑在 `assets/js/lightbox.js`（原图地址直接读链接的 `href`，不再用 `data-full`） |
| 键盘可达性 / 焦点陷阱 | 三个弹层（搜索框、目录抽屉、图片灯箱）共用 `assets/js/focus-trap.js` 提供的 `window.hulatuFocusTrap(容器, 初始焦点)`，关闭时记得调用它返回的 `release()` 并把焦点还给触发按钮。**这个文件必须在 `layouts/partials/scripts.html` 的打包顺序里排第一**，否则后面几个脚本运行时拿不到它 |
| 评论 | 配置 `hugo.toml` 的 `[params.giscus]`；单篇关闭用 `comments: false`。DOM 在 `layouts/partials/giscus.html`，行为逻辑在 `assets/js/giscus.js`：滚到评论区前 400px **在后台把 giscus 预加载好，但整块收着不展开**，「显示评论」按钮一直留着；读者点了才展开——因为内容已经加载完，展开是瞬间的、不会先白一下。状态机只有一个 `state` 变量（`idle → loading → ready → slow → open`，`opening` 表示「读者已经在等」），并镜像到 `.giscus-body` 的 `data-state`，调试时在开发者工具里直接看得见。等 iframe 用的是 **MutationObserver，不是定时轮询**；两个超时各管一段：点开后 12 秒没出来才变「重新加载评论」，预加载 2 分钟没结果就静默作废。**这个脚本单独打包、只在带评论的文章页加载**（`giscus.html` 里的 `resources.Get`），不塞进全站 bundle。收起用的 `.giscus-body { max-height: 0; visibility: hidden }`，**别改成 `display: none`**，那样 iframe 没有布局尺寸，giscus 会把高度算成 0 |
| 文章目录 | 两半逻辑都在 `assets/js/toc.js`：`init()` 管滚动高亮，`initDrawer()` 管移动端抽屉的开关 / 焦点陷阱 / ESC。抽屉的开合**以前写在 `single.html` 的内联脚本里**，2026-09 合并进 toc.js，模板里只剩 DOM |
| 深浅色 | 默认跟随系统；右上角按钮手动切换（带旋转动效），**不记忆选择**（刷新后回到跟随系统）。逻辑在 `assets/js/theme.js`，配色变量在 `assets/css/style.css` 的 `[data-theme="dark"]` |
| 打赏 | `hugo.toml` 的 `[params.donate]`。收款码图片在 `layouts/partials/donate.html` 里走 `cf-image.html`（`width=400,format=auto`）——原图是没压缩的 JPEG，且文件后缀错写成 `.webp`（直接返回的 Content-Type 是 `image/jpeg`），过一层图片变换后按浏览器给 avif/webp，顺带把这个错误头一起修掉。换收款码时**别在模板里直接写原始 URL** |
| Hugo 版本 | **三处必须一致**：本机 `hugo version`、`.github/workflows/build.yml` 的 `hugo-version`、Cloudflare 五个项目的 `HUGO_VERSION`（主站 + 四个子站）。硬校验在 `layouts/partials/check-hugo-version.html`（`baseof.html` 顶部引入）：**版本不够直接失败**并报出当前版本；**缺 extended 只打 WARN**（Cloudflare 的 `HUGO_VERSION` 只能填版本号，硬拦会误伤线上；真用到 extended 功能时 Hugo 自己会报错）。`hugo.toml` 的 `[module.hugoVersion]` 只起文档作用——实测它在项目自身配置里只打一行 WARN，拦不住构建 |
| 构建校验（CI） | `.github/workflows/build.yml`：push / PR 时用 0.166.0 extended 构建主站 + 调用 `scripts/build-subdomains.sh` 构建四个子站，另外检查每篇周刊的 front matter 有没有 `issue` 字段（漏填只会不显示徽章、不报错，所以单独查一遍）。这是「本地没事、Cloudflare 构建失败」的第一道拦截 |
| 订阅格式 | `layouts/_default/rss.xml`。首页主源 `/index.xml` + 周刊源 `/weekly/index.xml`（在 `content/weekly/_index.md` 里用 `outputs` 单独开）；栏目默认不出 RSS，改 `hugo.toml` 的 `[outputs] section`。每个源最多 20 条全文，见 `[services.rss] limit` |
| 阅读时长 / 字数 | `layouts/_default/single.html` 的 `.post-meta-main`，按 350 字/分钟算阅读时长 |
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
--text-reading: 1.125rem; /* 正文 18px（< 600px 时收到 1rem） */
```

写新样式时**不要再随手写 `font-size: 1.05rem` 这种值**，从上表里挑一档；字距同理，用 `--tracking-title`（中文标题 0.02em）、`--tracking-label`（中文小标签 0.06em）、`--tracking-num`（数字 / 日期 0.04em）。真正的"大字距"只留给纯英文或数字，套在汉字上会显得字被掰开。

### 控件四态（按钮手感）

所有可点的控件都走 `:root` 里的四态变量，每态四件套「底 `-bg` · 字 `-text` · 边 `-border` · 影 `-shadow`」，共 12 组。要调全站按钮的手感，**只改这一段**，不要在各个组件的 `:hover` 里写死颜色。

三套按控件的形态分：

| 前缀 | 用在 | 成员 |
|---|---|---|
| `--ctrl-*` | 描边型按钮：有底、有边 | 翻页、文章胶囊、标签云胶囊、404 按钮、目录抽屉关闭、搜索关闭 |
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
| ≥ 1340px | 目录固定悬浮在正文右侧 |
| < 1340px | 目录收成左下角按钮 + 底部抽屉（不再把目录块顶在正文前面） |
| < 760px / < 600px | 导航、卡片、列表、正文字号的移动端微调 |

1340px 这个断点是算出来的：正文 800px 居中时两侧各留 270px，减去 200px 的侧栏还剩 70px 空隙；再窄就会贴到正文上。

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

`deploy.sh` 是一个**手动**的干净构建脚本，做的事：

1. `hugo --gc --minify` 干净构建到临时目录，并检查产物里没有 livereload 调试脚本；
2. `rsync -a --delete` 同步到 `public/`。

它只更新本地 `public/`，**不上传、不部署**。想确认构建产物是否干净、或想强制全量重建时用它。

托管平台相关的两个文件都在 `static/`，部署时会原样发布：

- `_headers`：缓存与安全响应头（CSS/JS 长缓存、图片 30 天、RSS 1 小时、`search-index.json` 1 小时、`sitemap.xml` 1 小时、图标 7 天、`rss.xsl` 的 Content-Type 等）。规则按路径精确匹配，新加文件类型时记得补一条。防嵌套那两条是 `X-Frame-Options: SAMEORIGIN` + `Content-Security-Policy: frame-ancestors 'self'`——**CSP 只写这一个指令**，其余留空才不会限制脚本/样式，不会影响 giscus。注释要写在路径块外面，Cloudflare 只在整行以 `#` 开头时当注释。
- `_redirects`：旧链接 301 跳转（当前只保留 `/running/ → run.hulatu.com` 这一条）。历史文章路径的 301 已清理，**以后改文章的 slug 或移动文章，想保留旧链接的话在这里补一条 301**，否则旧链接会 404。

## 四、性能与 SEO 维护清单

发布前可以快速自查：

```bash
./deploy.sh
```

然后检查 `public/` 里这几样：

- `sitemap.xml`：应有全部文章、归档、周刊、友链等页面（标签页/分类页/隐私页/`/posts/` 栏目页都已排除，干净构建后 **125 条**）。
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
| 新文章发布后首页看不到 | front matter 的 `draft` 还是 `true` |
| 文章页没有"相关文章" | 同标签/同分类的文章太少，低于 `[related]` 的 `threshold = 60` |
| 首页或周刊翻页数量不对 | 检查 `layouts/index.html` / `layouts/weekly/list.html` 里的 `.Paginate` 第二参数（当前为 10） |
| 改了 slug 后旧链接 404 | 在 `static/_redirects` 补 301 规则 |
| 手机上目录按钮没出现 | 文章没有二级以上标题，不会生成目录 |
| 哪些页面不被收录 | 隐私政策、分类页、标签页、`/posts/` 栏目页都不进 sitemap、也带 `noindex`。前两类是模板里按类型判断的（`layouts/_default/baseof.html` 的 `$noindex`），后两类靠 front matter 写 `noindex: true`。**加 noindex 就不要再往 robots.txt 加 Disallow**——Disallow 会让爬虫看不到 noindex，反而更糟 |
| 分页页 `/page/N/` 不被收录 | `robots.txt` 里 `Disallow: /page/`，阻止抓取分页页 |
| 隐私政策没出现在首页/归档列表 | 首页和归档只列 `posts`、`weekly` 类型的文章，根目录的普通页面不会混入 |

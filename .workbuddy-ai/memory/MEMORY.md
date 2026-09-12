# 项目长期记忆 · 胡拉图说（Hugo 博客）

## 技术栈与约定
- Hugo 手搓主题（**无第三方主题**），`hugo.toml` 单文件配置；构建 `hugo --gc --minify`（见 `deploy.sh`）
- **改了模板/样式/脚本后必须跑 `hugo server -D` 验证**再发布（本机 Bash 偶发不可用，注意确认）
- **真实发布链路**：`up`（定义在 `~/.config/zsh/.zshrc`）只做两件事 ——
  ① `bash ./publish.sh`：刷热门榜 → 生成 OG 图 → `git add` + commit → push GitHub → 同步 Garmin → `git pull --rebase` → 再 push；
  ② `hugo --minify`：本地构建预览到 `public/`（`public/` 在 .gitignore 里，**不会上传**）
- ⚠️ **真正的部署 100% 由 Cloudflare Pages 的 Git 集成完成**（push 触发平台构建，约 1-2 分钟）。
  **本机并没有安装 wrangler**，`up` 里的 `wrangler pages deploy` 分支一直被跳过；
  而且即便装上也不该用 —— 它和平台自动构建是**竞态**，传上去的内容随时会被覆盖。
  ⇒ 由此得出本项目最重要的架构约束：**任何只写进本地 `public/` 的产物都永远上不了线**。
  想在线上出现，只有两条路：**(a) 提交进 git，由平台构建产出；(b) 放进 `static/`，Hugo 构建时原样复制**。
  （`data/hot.json` 走的是 (a)，所以热门榜和评论数/阅读数在线；`public/og/` 走的是"都没有"，所以一直 404）
- **Cloudflare Pages 构建镜像里没有 ImageMagick**（官方文档的工具表只有 Hugo/npm/pnpm 等），
  所以 OG 图**不可能**在平台构建时生成；本机脚本又硬编码了 macOS 字体。
  ⇒ 见「OG 分享图」条目
- **`deploy.sh` 不在 `up` 链路里**：手动脚本，干净构建 + livereload 自检，只写本地 `public/`，不上传不部署。
  它和 `publish.sh` 现在都会调用 `scripts/og-images.py`，且都必须排在 `hugo` **之前**

## 设计系统（`assets/css/style.css` 顶部 `:root` / `[data-theme="dark"]`）
- 主色 `--accent: #c73e2f`（印章红）；浅色纸底 `--paper: #f6f6f8`；卡片 `--surface`
- 圆角 `--radius-card / --radius-row / --radius-pill`；间距 `--space-1..14`（4px 步进）；缓动 `--ease`
- 正文容器 `--max-width: 800px`（`main.container`），侧栏/目录在 ≥1200px 固定
- 字体：标题 `--font-serif`（思源宋体），正文 `--font-sans`，代码 `--font-mono`
- 断点：1200px（固定侧栏）、899.98px（隐藏侧栏）、760px、600px、400px
- **新增样式统一插到 `/* ---------- 响应式 ---------- */` 段之前**，媒体查询写在新增块末尾

## 模板约定
- `layouts/_default/baseof.html` 里 `main.container` 内是 `{{ block "main" }}`
- 自定义板块 = `content/<section>/_index.md` + `layouts/<section>/list.html`（如 friends、tools、series）
- 文章页统一走 `layouts/_default/single.html`，用 `.Type` 做分支（`posts` / `weekly`），**不要为周刊另写 single.html**（会丢相关文章、打赏、评论等）
- **pjax**：`assets/js/pjax.js` 只替换 `main.container` 的 innerHTML 并重跑其中 `<script>`；全局脚本必须监听 `pjax:complete` 才能在新页面生效
- 主 bundle 在 `layouts/partials/scripts.html` 的 slice 里注册（常驻全站）；文章页专属脚本走 `page-extra`（由 `page-loader.js` 按需注入）
- 列表缩略图约定：`static/img/thumbs/<封面文件名去扩展名>.webp`，映射逻辑见 `layouts/partials/thumb-src.html`
- 数据文件放 `data/`，模板读作 **`hugo.Data.xxx`**（本项目既有写法，见 `stats.html` 的 `hugo.Data.runs`；`site.Data` 也可）；构建前生成的用 `scripts/` 下的 python
- ⚠️ **Hugo 的 `strings.Trim` 是 `STRING CUTSET`（字符串在前、cutset 在后），与 `TrimPrefix` / `TrimSuffix` 的顺序相反**。
  因此**绝不能写管道形式** `X | strings.Trim "/"` —— 管道把 X 塞到最后一个参数位，变成 `strings.Trim("/", X)`，
  被修剪的字符串成了 `"/"`、cutset 成了整条路径，结果**恒为空串**。正确写法：`strings.Trim (lower X) "/"`。
  这个坑不报错、不中断构建，只是查表全部落空（页面上数字静默变 0），极难发现——凡是用字符串 key 查 map 的地方都要留意
- **`public/` 在 .gitignore 里**：`public/post-index.json` 只在本地构建后存在，脚本拿它做路径→标题映射时要留兜底

## 内容结构
- `content/posts/` 普通文章；`content/weekly/` 周刊（20 期，标题含「第 X 期」）
- 文章 front matter：`title/date/slug/summary/cover/coverAlt/categories/tags/featured/comments/series/draft`
- **所有文章都填了 ASCII 英文 `slug`**，所以 URL 是 `/posts/YYYY/MM/DD/<slug>/`，无中文/百分号编码问题
- 周刊多数有 `series: "周刊"` 但**部分为空**，涉及周刊时按 `Type == "weekly"` 判断，别依赖 `series`
- 搜索索引只含 `posts` + `weekly`（`layouts/index.searchindex.json`）；归档页同理

## 第三方
- 评论 giscus（`hugo.toml [params.giscus]`，repo `hulatu/hulatu`，category `Announcements` / `DIC_kwDOTApIws4DCXd5`，mapping `pathname`）；统计 Umami（`umamiId = b191cc39-861f-43c0-b750-b1e090fa9472`）
- **Umami 用的是免费版（Hobby）**：只有 100K 事件/月、1 个站点、6 个月数据留存，
  **API access 是 Pro（$20/月）才有的功能**。所以任何「构建时/前端读 Umami 数据」的方案（如热门文章榜）在免费版都不可行，
  别再做类似设计
- **归档页热门榜 = giscus 评论数 + Cloudflare Web Analytics 浏览量**（两个免费源）：
  数据 `data/hot.json` 由 `scripts/fetch_hot.py` 构建前生成（`GITHUB_TOKEN` / `CF_API_TOKEN` + `CF_ACCOUNT_ID`；
  查的是 `rumPageloadEventsAdaptiveGroups`，维度 `requestPath`/`requestHost`）；展示 `layouts/partials/hot-list.html`，
  标签页交互 `assets/js/hot.js`；无数据整块隐藏。`--demo` 可生成示例数据看版式，`--introspect` 查维度名
- **热门榜 token 存放位置**：`~/.config/zsh/secrets.zsh`（`~/.config/zsh/.zshrc` 末尾 source 它，
  带 `[ -f … ] &&` 守卫）。GitHub PAT 勾 `public_repo`（或 fine-grained 给 Discussions: Read）；
  Cloudflare token 权限 `Account → Account Analytics → Read`；Account ID 用 `wrangler whoami` 最快
- 图片走图床 `https://img.hulatu.com/`
- 改 slug / 移动文章后**必须在 `static/_redirects` 补 301**

## 环境注意事项
- **present_files 的预览编辑器会改写源文件**：会往 HTML/模板里注入 `data-page-node-id="..."` 属性。
  用完后建议 grep 一次 `data-page-node-id`，确认源文件没被污染
- **同一文件不要在同一批里并发 Edit**：并行 Edit 会互相覆盖（实测 README/MAINTENANCE/脚本都丢过改动）。
  同文件的多处修改要分开发起；不同文件可以并行
- 本机 Bash 偶发整体不可用（`/dev/null` 缺失 + sandbox shim 丢失），此时 Read/Write/Grep 仍可用，但无法 rm/构建

## 已知问题盘点（2026-09-12）

**已修**
- **OG 分享图（2026-09-12 19:40 重构，方向推倒重来）**：改为输出到 **`static/og/` 并提交进 git**，
  由 Hugo 在本地和平台构建时统一复制到 `public/og/`。
  - `scripts/og-images.py`：输出目录固定 `ROOT/static/og`，**不再接受参数**（传参会警告并忽略）；
    新增「字体文件不存在就跳过」守卫；logo 临时文件改用 `tempfile.mkdtemp()`，
    不再往输出目录里写 `.logo-64.png`
  - `publish.sh`：新增 2b 步，在 `git add .` **之前**生成，图才能跟文章一起提交
  - `deploy.sh`：把生成挪到 `hugo` **之前**（否则 `rsync --delete` 会删掉没进 `$STAGE` 的 og/）
  - `up`：删掉原来的 2.5 步（写进 `public/` 等于白做）；第 3 步的 wrangler 上传也删了
  - `head-meta.html`：`og:image` 先用 `fileExists "static/og/<日期>-<slug>.png"` 判断，
    不在就退回 `/img/og-card.png`，保证不再出现死链
  - ⚠️ **待用户执行**：跑一次 `python3 scripts/og-images.py` 生成并提交（约 110 张 PNG、几 MB）；
    没装 ImageMagick 的话先 `brew install imagemagick`
- **评论数 / 阅读数**：`data/hot.json` 新增 `byPath`（全量计数，键为规范化路径）
  → `layouts/index.postindex.json` 注入 `post-index.json` 的 `comments`/`views`
  → 新 partial `layouts/partials/post-stats.html` 在文章页 / 列表行 / 首页行三处渲染
  - 🔧 **2026-09-12 19:30 修掉一个静默 bug**：两处都写成了管道形式
    `$page.RelPermalink | lower | strings.Trim "/"`，因 `strings.Trim` 是 `STRING CUTSET` 而恒得空串，
    导致所有页面的评论数/阅读数**全部显示为 0 且不报错**。已改成 `strings.Trim (lower …) "/"`。
    排查手法值得复用：**看构建产物**（`public/index.xml` 的 `lastBuildDate` 确认构建时间、
    `public/post-index.json` 里能否匹配到非零值、`public/archive/index.html` 里热门榜是否正常），
    再和 `data/hot.json` 的 `generated` 对比，就能区分「数据没抓到」和「模板没读对」
- **搜索**：命中词全部高亮（原来只高亮第一处）；↑↓ 改用 `.is-active` 类移动选中项
  （不用 DOM focus，避免输入框失焦后打不了字）；Enter 打开选中项；鼠标划过同步选中
- **文章底部「编辑此页」**：`hugo.toml` 的 `[params.edit]`（`repo` + `branch`），留空则整条不显示
- `MAINTENANCE.md` 里 `up` 的描述已按真实链路改写，并注明 `deploy.sh` 不在 `up` 里

**待办**
- **Cloudflare 热读源没通**：`data/hot.json`（2026-09-12 19:23 那次）里 `sources.cloudflare = false`，
  `viewed` 沿用上一次的旧值。而 `~/.config/zsh/secrets.zsh` **仍是全注释、一个字没填**，
  giscus 却成功了 → 说明 `GITHUB_TOKEN` 是用户在某次终端里**临时 export** 的，没落到文件。
  必须让用户把三个值填进 `secrets.zsh`，否则 `up`（无人值守）拿不到数据
- **OG 图仍未生成**：`public/og/` 目录根本不存在 → `og-images.py` 没跑到 `os.makedirs`。
  要么这次没走 `up`（最后一次构建更像手动 `hugo --minify`），要么没装 ImageMagick。
  让用户 `magick -version` 确认；没有就 `brew install imagemagick`
- **`up` 是就地构建，`public/` 里的指纹 JS/CSS 会一直堆积**（已有 10 个 `bundle.min.<hash>.js`），
  旧的不会被清掉 —— 属于「非干净构建」的副作用
- umami + plausible 双份统计脚本；`fetch_hot.py` 跑在 hugo 之前（读的是上一版 `post-index.json`，
  新建文章可能匹配不上标题）；`_headers` 未对指纹资源用 immutable；PWA（sw.js / manifest）无文档

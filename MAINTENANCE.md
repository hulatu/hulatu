# 维护手册 —— hulatu.com

> 2026-10-10 晚整份重写：本站从自建主题迁移到上游 hugo-bearneo。
> 旧版手册描述的整套东西（6 个 CSS 模块、6 个 JS、按页型分档内联、
> 纸账 + 印章设计系统、`_redirects` 之外的 50 个模板）**已经不存在了**。
> 设计相关在 [DESIGN.md](DESIGN.md)，两边同一次改动里同步。
> 2026-10-12 四个子站（run / profile / shot / share）全部下线、`sites/` 已从仓库删除，
> 本版已清掉所有子站内容，只在第 1 节末留一条取回办法。

---

## 0. 现状速览（2026-10-12 实测）

| 项 | 值 |
| --- | --- |
| Hugo | `0.167.0+extended`（本机 / GitHub Actions / Cloudflare 三边一致） |
| 主题 | `themes/hugo-bearneo/`，27 个文件，**上游逐字节未改**（`diff -r` 验过） |
| 代码高亮 | `[markup.highlight] noClasses = false`（**必须是 false**）+ 站点层第 12 段配色 |
| 站点层 | **21 个文件** = `layouts/` × 19 + `assets/js/` × 2，全站所有自定义都在这里 |
| 页面 | 336 页 → **332 个 HTML** |
| 内容 | 101 篇文章 + 25 期周刊 = 126 个内容页 + 7 个根级独立页（`about`/`now`/`roll`/`privacy`/`archive`/`donate`/`run`） |
| 订阅源 | `/index.xml`（文章 20 条）+ `/weekly/index.xml`（周刊 20 条），**都只收文章页**；浏览器直开走 `static/rss.xsl` |
| 词条页 | 标签 187 + 分类 8（索引页 `/tags/` `/categories/` 已关） |
| CSS | **全部内联**，无 `/css/` 目录 |
| JS | 两个：giscus（指纹化长缓存）+ 代码块复制按钮 |
| 构建 | 干净构建 **0 警告** |
| URL | 与迁移前逐条一致（126 个 `/posts/…` 全保留），仅 8 个刻意删除的地址有 301 |

内联 CSS 分档（Python `gzip.compress(d,9)` 口径；「补丁」= 该档全页 `<style>` 合计减去主题固定的 6424 B）：

| 档 | 页数 | raw / gzip | 补丁 |
| --- | --- | --- | --- |
| 普通页（首页 / `/about/` `/now/` `/roll/` `/privacy/` `/weekly/` / 195 词条页 / posts 列表页） | 202 | 8675 / 2610 | 2251 B（+00 +14 +17 +20 +21 +22 +23 段） |
| 长文页（101 文章 + 25 周刊，无代码块） | 121 | 12610 / 3400 | 6186 B（再 +09 +10 +13 +16 +19 段） |
| 长文页 + 代码块 | 5 | 14861 / 3893 | 8437 B（再 +12 +18 段） |
| `/archive/` | 1 | 10404 / 2962 | 3980 B |
| `/donate/` | 1 | 9101 / 2705 | 2677 B（+08 段） |
| `/run/` | 1 | 10509 / 3006 | 4085 B（+25 段） |
| `/404.html` | 1 | 10089 / 2888 | 3665 B（+15 段） |

合计 332 页，与 `os.walk` 数出的 HTML 数一致。`/about/` `/now/` `/roll/` `/privacy/` `/weekly/` 与普通页完全一致（03 段头像撤掉后不再输出任何 CSS）。

- 第 20–23 段是 2026-10-12 新增的 4 条全站规则（**+428 B raw / +115 B gzip**）：目录断点抬到 1200px、`img{height:auto}`、等宽字体令牌、TOC 链接 transition 收窄。
- 第 24 段（`/archive/` 的 `content-visibility`）评估后**撤回**，只留注释，运行时 +0 B。
- 第 25 段按 `.RelPermalink` 守卫，**其他页 0 字节**（实测：去掉它重构建，首页 `/now/` `/about/` 的 `<style>` 逐字节不变）。
- 03 / 06 / 11 三段**刻意留空**（只留注释保段号）；详见 DESIGN.md 第 5 节。

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

archetypes/
  posts.md weekly.md      新建文章的模板（含发布前检查清单）

layouts/                  ★ 站点层覆盖，19 个文件
  index.html                        首页（上游只有 {{ .Content }}；简介**不包 <content>**）
  _default/baseof.html              LanguageCode → Language.Locale + 补回 robots 分支
  _default/single.html              去掉 `if eq .Type "blog"` 门槛 + hideDate/hideTitle
                                    + 文末「系列坐标带」与「上一篇/下一篇」+ 评论区
  _default/list.html                5 处文案英译中 + 删底部标签墙
  _default/rss.xml                  ★ 补回 <?xml-stylesheet?> 指向 /rss.xsl + 首页 feed
                                    只收文章页 + atom:updated / category / 摘要 description /
                                    全文 content:encoded + pageLimit 20
  _default/archive.html             ★ /archive/ 列表页 + 顶部「系列」横向入口
                                    + 底部全部标签平铺（照 yinji）
  _default/run.html                 ★ /run/ 跑步数据页（2026-10-12 从子站搬入）
  _default/_markup/render-link.html ★ 只为去掉 `</a>` 后面那个换行
  _default/_markup/render-image.html ★ 给正文 <img> 补真实 width/height
                                    （读 data/image-dims.json）
  partials/nav.html                 完全由 [[menu.main]] 驱动（7 项）
  partials/footer.html              版权独立成行 + 订阅行挪到第 3 行
                                    + copyrightNote/licenseName/licenseURL
  partials/custom_head.html         25 段补丁样式 + GoatCounter
                                    （03/06/11 刻意留空，24 撤回）
  partials/orphan-safe.html         孤行保护（标题末 2 字包 nowrap）
  partials/back-top.html            返回顶部（只长文页，纯 CSS、零 JS）
  partials/code-copy.html           代码块复制按钮的脚本引入（只含代码的页）
  partials/breadcrumbs.html         ★ 面包屑（+ BreadcrumbList JSON-LD），只给文章页
  partials/giscus.html              评论区（2026-10-11 起无外框，只剩「评论」+ 一个实心三角）
  404.html                          ★ 404 页（上游只有两行字）

assets/js/giscus.js       评论区脚本（只在挂评论的页加载）
assets/js/code-copy.js    代码块复制按钮（只在含代码块的 5 页加载）

themes/hugo-bearneo/      ★ 上游逐字节副本，27 个文件，**不要改**

static/
  _headers _redirects     Cloudflare 的响应头 / 301 规则
  favicon.svg logo.svg apple-touch-icon.png icon-192.png icon-512.png
  site.webmanifest rss.xsl
                          ↑ rss.xsl 不是孤儿：layouts/_default/rss.xml 顶部那行
                            <?xml-stylesheet?> 指的就是它
  images/                 **只剩两个在用**：share.webp（全站唯一 og:image，params.images 引用）
                          + donate/（2 张收款码，/donate/ 在用）

data/                     runs.json（/run/ 页在读）+ image-dims.json（喂 render-image.html）
                          ⚠️ 两个都别当孤儿删
scripts/                  8 个脚本，见第 4 节
admin/                    本地 front matter 编辑器（Python + 单页 UI）
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

`publish.sh` 在 `git add` 前依次跑（失败都不阻断发布）：`add-heading-anchors.py` → `sync-lastmod.py`。
⚠️ `sync-lastmod.py` 已无可见产出（`lastmod` 只喂 RSS / sitemap），保留调用而已。
⚠️ 2026-10-11 删掉了原来排最前的 `fetch-image-dims.py`（脚本也删了）—— 它抓的 `data/image_dims.json` 上游模板根本不读，**别照旧文档加回来**。
⚠️ 2026-10-12 删掉了 `fetch-profile-content.py`（随 profile 子站一起删）—— 它刷的「花园页」快照已不存在。

### CI

- `.github/workflows/build.yml`：push / PR 时用同一个 Hugo 版本**只构建主站**，并检查中文标题锚点是否补齐。周刊期号检查那一步 2026-10-10 已删（`issue` 字段不再渲染）。
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

- `categories: ["周刊"]` 默认已填；`issue` 字段已无消费者，新周刊不用填。
- 周刊 URL 也落在 `/posts/YYYY/MM/DD/slug/`（`[permalinks]` 里 `weekly` 与 `posts` 同规则）—— **刻意，不是 bug**。

### 三个必须记住的规矩

1. **加根级独立页时写 `hideDate: true` + `toc: false`**（短页面挂目录是纯噪音）；纯工具页再加 `noindex: true`；新页别忘了回 `static/_headers` 补一条缓存规则。
2. **中文标题显式写锚点** `## 习惯 {#xi-guan}`，否则分享链接是 `#%e4%b9%a0%e6%83%af`。漏了跑 `python3 scripts/add-heading-anchors.py`（需要 macOS 拼音库）。
3. **`noindex: true` 是生效的**（站点层 `baseof.html` 有 robots 分支，上游没有），覆盖 199 页 = 187 标签词条 + 8 分类词条 + `/privacy/` + `/posts/` + `/donate/` + 404。
   ⚠️ **但这几页仍在 sitemap 里**（当时只恢复了 meta，没恢复旧站的 `layouts/sitemap.xml`）—— 已知缺口，别以为 sitemap 也排除了。

---

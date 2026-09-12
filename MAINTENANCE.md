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
| `slug` | URL 后缀，改后旧链接会失效（需加 301，见"部署"） |
| `summary` | 搜索摘要、分享卡片描述 |
| `cover` | 封面图（远程 URL 或本地路径） |
| `categories` / `tags` | 分类 / 标签，决定分类页、标签云、相关文章 |
| `featured` | `true` 会进入首页"精选" |
| `series` | 系列名，文章底部出现系列导航，并自动归入 `/series/` 聚合页 |
| `comments` | 填 `false` 可单独关闭这篇文章的评论 |
| `draft` | `true` 表示草稿，不会发布 |

发布前把 `draft` 改成 `false`，然后 `./deploy.sh`。

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
| 页脚图标链接（系列 / 朋友 / 书影音 / GitHub / 邮箱 / 隐私） | `layouts/partials/footer.html` 的 `.footer-icon-links`，每项是一个内联 SVG，统一规格 `viewBox="0 0 24 24"` / `width=17 height=17` / `stroke-width=2` / `stroke="currentColor"`。图标依次是：**层叠**（系列）、**双人**（朋友）、**胶片**（书影音）、GitHub 标、**信封**（邮箱）、**盾牌对勾**（隐私）。系列刻意不在导航栏，只在这里 |
| 首页文案（"总得留下点什么吧"） | `layouts/index.html` 顶部 hero |
| 首页精选/时间/随机逻辑 | `layouts/index.html` 里的内联脚本 |
| 首页每次展示几篇 | 脚本里的 `PER_PAGE = 5` |
| 周刊每页几期 | `hugo.toml` 的 `[pagination] pagerSize` |
| 系列聚合页 / 系列简介 | `content/series/`：`_index.md` 是总览页，每个系列一个同名 md 写简介；模板在 `layouts/series/` |
| 周刊专栏头图 | `content/weekly/_index.md` 的 `headerImage` |
| 周刊期号徽章 | 从标题「第 X 期」自动解析，逻辑在 `layouts/partials/issue-num.html` |
| 热门榜（热议 / 热读） | 数据 `data/hot.json`（由 `scripts/fetch_hot.py` 生成）；展示模板 `layouts/partials/hot-list.html`，归档页调用；切换交互 `assets/js/hot.js` |
| 评论数 / 阅读数 | 数据同上（`data/hot.json` 的 `byPath`）；渲染模板 `layouts/partials/post-stats.html`，被文章页 / 列表行 / 首页行三处调用；两个数都是 0 时整块不输出 |
| 文章底部「编辑此页」 | `hugo.toml` 的 `[params.edit]`（`repo` + `branch`，`repo` 留空则整个链接不显示）；链接由 `.File.Path` 拼出，模板在 `layouts/_default/single.html` 的 `.post-actions` |
| 相关文章（取几篇、按什么匹配） | `hugo.toml` 的 `[related]`；模板在 `layouts/_default/single.html` |
| 标签云（展示几个标签） | `layouts/_default/single.html` 里的 `first 15` |
| 目录侧栏显示/隐藏断点 | `assets/css/style.css` 搜 `1200px`（固定侧栏）和 `899.98px`（移动端隐藏） |
| 数据页（文章数据 + 跑步数据） | 页面文案在 `content/stats.md`；统计模板在 `layouts/_default/stats.html`；跑步数据文件 `data/runs.json`（手动运行 `./publish.sh` 同步） |
| 手动提交发布 | 终端输入 `up` → `publish.sh`（刷热门榜 → 生成 OG 分享图 → 提交本地改动 → 推 GitHub → 同步跑步数据 → 拉取远端 → 再推送）→ `hugo --minify`（**只写本地 `public/`，给自己看**）。**真正的上线由 Cloudflare Pages 的 Git 集成在 push 后自动构建完成**；本机没有 wrangler，也不做手动上传 |
| OG 分享图 | 生成器 `scripts/og-images.py`，输出到 **`static/og/` 并提交进 git**（Hugo 构建时把 `static/` 复制到 `public/og/`，所以本地和平台构建都有图）。生成时机在 `publish.sh` 里，必须赶在 `git add` 和 `hugo` 之前。`og:image` 元信息在 `layouts/partials/head-meta.html` |
| 搜索 | 逻辑 `assets/js/search.js`，索引模板 `layouts/index.searchindex.json` |
| 评论 | 配置 `hugo.toml` 的 `[params.giscus]`；单篇关闭用 `comments: false` |
| 深浅色 | `assets/js/theme.js` + `assets/css/style.css` 的 `[data-theme="dark"]` |
| 打赏 / 关注公众号 | `hugo.toml` 的 `[params.donate]`、`[params.wechat]` |
| 订阅格式 | `layouts/_default/rss.xml`、`atomfeed.xml`、`jsonfeed.json` |

### 颜色 / 字体 / 间距

全部在 `assets/css/style.css` 顶部的 `:root`（浅色）和 `[data-theme="dark"]`（深色）变量里，比如：

```css
--accent: #c73e2f;      /* 印章红，全站主色 */
--paper: #f6f6f8;       /* 冷白浅色背景 */
--surface: #ffffff;     /* 卡片 / 分组列表 */
--ink: #1d1d1f;         /* 正文文字 */
--font-serif: ...;      /* 标题字体 */
```

### 响应式断点速查

| 断点 | 行为 |
|---|---|
| ≥ 1200px | 目录 + 标签云固定右侧栏 |
| 900–1199px | 目录 + 标签云内联显示在正文上方 |
| < 900px | 侧栏隐藏，目录改成左下角按钮 + 底部抽屉；标签云隐藏 |
| < 760px / < 600px / < 400px | 导航、卡片、列表的移动端微调 |

### 跑步数据

跑步数据展示在「数据」页（`/stats/`）。数据链路：Garmin 255 同步到 Garmin Connect → 在本地手动拉取（`./publish.sh` 或 `python3 scripts/sync-garmin.py`）→ 合并写入 `data/runs.json` → 提交推送 → 托管平台构建时生成跑步总览、月度柱状图和最近记录。

已取消每日定时任务（GitHub Actions 定时拉取 + 本机 LaunchAgent 自动提交）。现在全部手动：

```bash
up   # 在任意目录输入 up 即可（函数定义在 ~/.config/zsh/.zshrc）
```

### `up` 到底做了什么（以及它为什么不负责部署）

**线上部署 100% 由 Cloudflare Pages 的 Git 集成完成**：`publish.sh` 把改动 push 到 GitHub → Pages 监听到 push → 平台自己跑 Hugo 构建 → 发布。

本机**没有安装 wrangler**，而且就算装上也不该用：push 触发的平台构建会回过头覆盖 wrangler 上传的内容，两边是竞态，谁先谁后不确定。所以 `up` 里 `hugo --minify` 之后的部分**都是本地行为，不影响线上**。

`up`（函数定义在 `~/.config/zsh/.zshrc`）实际只做两件事：

1. **`bash ./publish.sh`** —— 依次：
   - 刷新热门榜：`scripts/fetch_hot.py` → 写 `data/hot.json`
   - 生成 OG 分享图：`scripts/og-images.py` → 写 `static/og/`
   - `git add .` + 提交（commit 信息：博客：新增/修改文章）
   - 推 GitHub → 同步 Garmin 跑步数据（失败不阻断）→ `git pull --rebase` 拉取远端 → 再完整推送

   热门榜和 OG 图都**赶在 `git add` 之前**生成，这样才能跟文章一起提交、被平台构建读到。
2. **`hugo --minify`** —— 本地构建一份预览到 `public/`。`public/` 在 `.gitignore` 里，不会上传，纯粹给你自己看效果。

> ⚠️ `up` **不会**调用 `./deploy.sh`。`deploy.sh` 是手动脚本，做「干净构建 + livereload 自检」，只写本地 `public/`，不上传也不部署。它同样把 OG 图生成放在 `hugo` 之前。

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

说明：`up` / `publish.sh` 优先用本机令牌（`~/.garminconnect/garmin_tokens.json`）同步跑步数据，令牌过期时先重跑 `python3 scripts/garmin-token.py`。脚本默认只同步跑步（`running`），想加其他运动类型用环境变量 `GARMIN_TYPES=running,cycling`。garminconnect 是非官方接口，Garmin 改版后若失效，留意同步时的报错并按提示调整。

### 系列 / 专栏

- 给文章 front matter 填 `series: "系列名"`，它就会出现在 `/series/` 里；
- 想让系列有简介和独立页面，在 `content/series/` 下新建一个 md，front matter 写：

```yaml
---
title: "综述写作"
seriesName: "综述写作"     # 必须和文章的 series 值一致
description: "一句话简介，显示在总览卡片上"
weight: 1                  # 总览页排序
---
正文写系列简介。
```

- 周刊会自动归入「周刊」系列：`content/series/周刊.md` 里用 `seriesType: "weekly"` 标记，按 `Type` 汇总，不依赖 `series` 字段（所以早期没填 `series` 的几期也不会漏）；
- 系列详情页的「已读 x/N」进度存在浏览器 `localStorage`（键名 `series-read`），换设备不跟随，也不需要后端。

### 热门榜（热议 / 热读）

归档页（`/archive/`）顶部会显示一个「热门」卡片，两个榜单：

- **热议** —— 按 giscus 的评论数排序，数据来自 GitHub Discussions（免费）；
- **热读** —— 按浏览量排序，数据来自 Cloudflare Web Analytics（免费，站点本来就跑在 Cloudflare 上）。

数据由 `scripts/fetch_hot.py` 生成到 `data/hot.json`。链路是**构建前抓取**（不是浏览器里实时请求），
所以两个 token 都只留在你本机，不会进前端。`./publish.sh` 第 2 步已经内置了这一步。

**首次配置**：把几个值填进 `~/.config/zsh/secrets.zsh`（已经建好了，里面是注释掉的占位符；
填完去掉行首的 `#`，再 `chmod 600 ~/.config/zsh/secrets.zsh`）。`~/.config/zsh/.zshrc` 末尾
已经有一行 source 它，所以 `up` 跑 `publish.sh` 时能读到。

1. **`GITHUB_TOKEN`（热议）**
   - 打开 <https://github.com/settings/tokens> → **Tokens (classic)** → **Generate new token (classic)**
   - 勾 **`public_repo`**（只读公开仓库的 Discussions，这个就够），生成后复制 `ghp_...`（**只显示一次**）
   - 想要更小的权限就选 **Fine-grained tokens**：Repository access 只勾 `hulatu/hulatu`，
     Repository permissions 给 **Discussions: Read**（GitHub 的 GraphQL 自 2023 年起支持 fine-grained PAT）

2. **`CF_API_TOKEN` + `CF_ACCOUNT_ID`（热读）**
   - 打开 <https://dash.cloudflare.com/?to=/:account/api-tokens> → **Create Token**
   - 选 **Custom token** → **Get started**（不要套现成模板）
   - Permissions：第一栏 **Account**、第二栏 **Account Analytics**、第三栏 **Read**
   - Account Resources：**Include → 你的账号**；Zone Resources 留 All zones 即可（RUM 是账号级数据，用不到 Zone）
   - 生成后复制（**只显示一次**）
   - **Account ID** 有三种拿法（⚠️ 本机**并没有装 wrangler**，`wrangler whoami` 会 command not found）：
     ① 控制台 → 任选一个域名 → **Overview**，右侧 API 区块里的 Account ID；
     ② 控制台 **Account Home** 右侧栏；
     ③ 地址栏 URL 里那段 32 位 hex

3. **`CF_SITE_TAG`** 一般不用填，脚本会自己从 Web Analytics 站点列表里找。
   如果那一步报权限错误，可以手动指定：控制台 → 你的账号 → **Web Analytics** → 点进 hulatu.com，
   页面里 beacon 片段 `data-cf-beacon='{"token":"..."}'` 中的 `token` 就是 site tag。

4. 手动跑一次确认：

   ```bash
   python3 scripts/fetch_hot.py
   ```

   > 脚本优先用 `public/post-index.json` 把访问路径映射成文章标题；
   > 这个文件不存在时会退而从 `content/` 的 `slug` + `date` 推算。
   > 所以**先跑一次 `./deploy.sh` 或 `hugo` 再抓，标题最准**。

**常用环境变量**：

| 变量 | 默认 | 作用 |
|---|---|---|
| `GITHUB_TOKEN` | 无 | 不填则跳过「热议」榜 |
| `CF_API_TOKEN` / `CF_ACCOUNT_ID` | 无 | 不填则跳过「热读」榜 |
| `CF_SITE_TAG` | 自动查找 | 一个账户下有多个 Web Analytics 站点时手动指定 |
| `HOT_DAYS` | `30` | 「热读」统计窗口天数 |
| `HOT_LIMIT` | `5` | 每个榜单保留几条 |

**先看版式（还没配 token 时）**：

```bash
python3 scripts/fetch_hot.py --demo    # 用真实文章标题 + 假数字生成示例数据
```

跑完 `hugo server -D` 打开 `/archive/` 就能看到「热门」卡片，右上角会标着「示例数据」。
确认版式没问题后 `rm data/hot.json` 删掉，等配好 token 再跑真数据。

**排查**：如果「热读」报维度字段不存在（Cloudflare 改过 schema），跑
`python3 scripts/fetch_hot.py --introspect`，它会打印 RUM 数据集当前可用的字段和维度名。

**行为约定**：两个数据源互相独立——任一边失败只保留它上一次的数据，另一边照常更新；
两边都失败时不覆盖 `data/hot.json`。`data/hot.json` 不存在、或两个榜单都为空时，
归档页上的整块会自动隐藏，不会报错。想把它同时放到首页，在 `layouts/index.html` 里
加一行 `{{ partial "hot-list.html" . }}` 即可。

### 评论数 / 阅读数（`byPath`）

脚本除了写两个榜单，还会把**全量**计数写进 `data/hot.json` 的 `byPath`：

```json
"byPath": {
  "posts/2025/12/10/daily-update-blog": { "comments": 12, "reactions": 3, "views": 340 }
}
```

- 键是「去域名、去首尾斜杠、转小写」的路径，和 `layouts/index.postindex.json` 里
  `strings.Trim (lower $page.RelPermalink) "/"` 算出来的完全一致；
  ⚠️ **Hugo 的 `strings.Trim` 是 `STRING CUTSET`（字符串在前、cutset 在后）**，和
  `TrimPrefix` / `TrimSuffix` 的顺序相反。千万别写成管道 `X | strings.Trim "/"`——
  那会变成 `strings.Trim("/", X)`，被削的是 `"/"` 自己，key 恒为空串，
  结果是**页面上的评论数/阅读数全部静默显示为 0**（不报错，极难发现）。
- 构建时它被注入 `public/post-index.json` 的 `comments` / `views` 字段；
- 显示统一走 `layouts/partials/post-stats.html`，三处调用：文章页 `.post-meta`、
  列表行 `.post-row-meta`（`layouts/partials/post-row.html`）、首页行
  （`layouts/index.html`，服务端渲染和 JS 生成的两条路径都覆盖了）；
- 两个数都是 0、或没有 `byPath` 时，这个 span 整块不输出。

**覆盖规则**：某个源抓取成功时，它的字段**整体覆盖**（先清空再写入），所以删掉的讨论、
下线的路径不会残留；某个源失败时，只有它的字段沿用上一次的值。

> 「阅读数」是 Cloudflare Web Analytics 的**近 `HOT_DAYS` 天（默认 30 天）**浏览量，
> 不是历史总访问量；鼠标悬停在数字上的提示里也写明了数据来源。

## 三、部署与托管

日常发布走 `up`（见上一节）。**线上部署由 Cloudflare Pages 的 Git 集成完成**：push 到 GitHub 后平台自己构建并发布。本机没有安装 wrangler，也不做手动上传（原因见上一节）。

`deploy.sh` 是一个**手动**的干净构建脚本，做的事：

1. `python3 scripts/og-images.py` 生成 OG 分享图到 `static/og/`（必须排在 `hugo` **之前**，这样才会被复制进产物）；
2. `hugo --gc --minify` 干净构建到临时目录，并检查产物里没有 livereload 调试脚本；
3. `rsync -a --delete` 同步到 `public/`。

它只更新本地 `public/`，**不上传、不部署**。想确认构建产物是否干净、或想强制全量重建时用它。

托管平台相关的三个文件都在 `static/`，部署时会原样发布：

- `CNAME`：域名绑定。
- `_headers`：缓存策略（CSS/JS 7 天、图片 30 天、搜索索引不缓存等）。
- `_redirects`：旧链接 301 跳转。**以后改文章的 slug 或移动文章，一定要在这里补一条 301**，否则旧链接会 404，搜索引擎收录的地址也会失效。

## 四、性能与 SEO 维护清单

发布前可以快速自查：

```bash
./deploy.sh
```

然后检查 `public/` 里这几样：

- `sitemap.xml`：应有全部文章、分类、标签页（干净构建后约 260+ 条）。
- `index.html`：不应包含 `livereload`。
- `search-index.json`：文章更新后重新构建会重新生成，浏览器端缓存策略已设为不缓存。

图片约定：

- 封面图用远程图床 URL（当前为 `https://img.hulatu.com/...`）最省流量；本地图放 `static/`。
- 首页/列表缩略图由构建脚本按封面文件名自动映射到 `static/img/thumbs/<文件名去扩展名>.webp`，文件名里的空格会替换成 `_`。要更新某篇文章的缩略图，替换对应的 `static/img/thumbs/xxx.webp` 即可。
- 清理孤儿缩略图：对比 `public/post-index.json` 里的 `thumb` 列表与 `static/img/thumbs/` 下的文件，删掉没被引用的。

可随时安全删除的构建产物（下次构建自动重建）：

```bash
rm -rf public resources .hugo_build.lock
```

## 五、常见问题

| 现象 | 原因 / 处理 |
|---|---|
| 新文章发布后首页看不到 | front matter 的 `draft` 还是 `true` |
| 搜索找不到新文章 | 重新构建（搜索索引是构建时生成的） |
| 文章页没有"相关文章" | 同标签/同分类的文章太少，低于 `[related]` 的 `threshold = 60` |
| 周刊翻页数量不对 | 检查 `hugo.toml` 的 `pagerSize` |
| 改了 slug 后旧链接 404 | 在 `static/_redirects` 补 301 规则 |
| 手机上目录按钮没出现 | 文章没有二级以上标题，不会生成目录 |

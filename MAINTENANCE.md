# 博客维护指南

给「胡拉图说」的日常维护和局部改动说明。改动模板后跑一次 `./deploy.sh` 即可发布。

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
| `series` | 系列名，文章底部会出现系列导航 |
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
| 首页文案（"总得留下点什么吧"） | `layouts/index.html` 顶部 hero |
| 首页精选/时间/随机逻辑 | `layouts/index.html` 里的内联脚本 |
| 首页每次展示几篇 | 脚本里的 `PER_PAGE = 5` |
| 周刊每页几期 | `hugo.toml` 的 `[pagination] pagerSize` |
| 相关文章（取几篇、按什么匹配） | `hugo.toml` 的 `[related]`；模板在 `layouts/_default/single.html` |
| 标签云（展示几个标签） | `layouts/_default/single.html` 里的 `first 15` |
| 目录侧栏显示/隐藏断点 | `assets/css/style.css` 搜 `1200px`（固定侧栏）和 `899.98px`（移动端隐藏） |
| 数据页（文章数据 + 跑步数据） | 页面文案在 `content/stats.md`；统计模板在 `layouts/_default/stats.html`；跑步数据文件 `data/runs.json`（手动运行 `./publish.sh` 同步） |
| 手动提交发布 | 终端输入 `up`：git status → 提交本地改动 → 先推送 GitHub → 同步跑步数据（失败不阻断）→ git pull 拉取远端 → 再完整推送 → hugo 构建 → 部署 Cloudflare |
| 搜索 | 逻辑 `assets/js/search.js`，索引模板 `layouts/index.searchindex.json` |
| 评论 | 配置 `hugo.toml` 的 `[params.giscus]`；单篇关闭用 `comments: false` |
| 深浅色 | `assets/js/theme.js` + `assets/css/style.css` 的 `[data-theme="dark"]` |
| 打赏 / 关注公众号 | `hugo.toml` 的 `[params.donate]`、`[params.wechat]` |
| 订阅格式 | `layouts/_default/rss.xml`、`atomfeed.xml`、`jsonfeed.json` |

### 颜色 / 字体 / 间距

全部在 `assets/css/style.css` 顶部的 `:root`（浅色）和 `[data-theme="dark"]`（深色）变量里，比如：

```css
--accent: #c73e2f;      /* 印章红，全站主色 */
--paper: #f7f6f1;       /* 浅色背景 */
--ink: #27292d;         /* 正文文字 */
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

`up` 一次完成：`git status` 查看改动 → 提交本地改动（commit 信息：博客：新增/修改文章）→ 先推送 GitHub → 同步跑步数据（失败不阻断）→ `git pull --rebase` 拉取远端 → 再完整推送 → hugo 构建 → 推送到 Cloudflare。核心步骤在 `publish.sh`。即使网络或 Garmin 出问题，新文章也已先落入本地 commit，不会一直停留在未提交状态。

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

## 三、部署与托管

`deploy.sh` 做的事：

1. `hugo --gc --minify` 干净构建到临时目录，并检查产物里没有 livereload 调试脚本；
2. `rsync` 同步到 `public/`。

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

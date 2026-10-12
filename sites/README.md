# 子站点

这里放 `hulatu.com` 延伸出来的独立 Hugo 站点：

- `sites/run`：`run.hulatu.com`，展示 Garmin 跑步数据。
- `sites/shot`：`shot.hulatu.com`，朋友圈式图片分享。
- `sites/share`：`share.hulatu.com`，好物与经验分享。
- `sites/profile`：`profile.hulatu.com`，个人主页与各平台入口。

> `sites/run` **不存跑步数据副本**：它的 `hugo.toml` 用 `[[module.mounts]]` 挂载仓库根目录的 `data/`，
> 数据只有 `data/runs.json` 一份（以前子站里那份副本曾经比主站少两次跑步记录）。
> 因此上面四个 Pages 项目的 **Root directory 必须保持 `/`**——子站要能看见上一层的 `data/`。
> 想只构建某个子站时也别忘了这点：`hugo --source sites/run` 是从仓库根目录跑的。

## 五个站共用一套设计令牌（2026-10-12 起）

**2026-10-12 四个子站整体改成 BearNeo 视觉语言，与主站对齐。** 现在主站与四个子站共用同一套
令牌，值直接抄上游主题 `themes/hugo-bearneo/layouts/partials/style.html`：

| 语义 | 浅色 | 深色 | CSS 变量（子站里） |
|---|---|---|---|
| 页面底色 | `#fdfdfd` | `#121212` | `--bg-color-primary` |
| 次级底色（表头 / 代码块） | `#f2f4f7` | `#1c1f24` | `--bg-color-secondary` |
| 正文色 | `#1a1a1a` | `#e5e5e5` | `--text-color-primary` |
| 次要文字 | `#444` | `#b3b3b7` | `--text-color-secondary` |
| 三级文字（日期 / 计数） | `#8c8c8c` | `#a0a0a0` | `--text-color-tertiary` |
| 链接色 | `#0066cc` | `#6da6ff` | `--link-color` |
| 已访问链接 | `#551a8b` | `#b388ff` | `--link-visited-color` |
| 分割线 / 图片边框 | `#d0d7de` | `#30363d` | `--border-color` |

字体栈 **`Verdana, sans-serif`**（子站在前面插了 `"PingFang SC"` 等中文字体兜底），
`line-height: 1.5`，宽度靠 `body { margin: auto; padding: 20px; max-width: var(--width-max) }`
取，`--width-max: 720px` —— **四个子站与上游主题逐值一致**。

⚠️ **四个子站是独立 Hugo 站点，没有共享 CSS 的机制**，所以上面这套值在四份
`static/style.css` 里**各写一份**——**改颜色 / 宽度要四处一起改**。
（子站的 CSS 是**外链** `static/style.css`，不是像主站那样内联在 `<style>` 里。）

### 刻意去掉的东西（别再加回来）

| 已删除 | 为什么 |
|---|---|
| 印章红 `#c73e2f` / 深色 `#ef7b64` | 上游 BearNeo 没有主色，链接就是蓝的 |
| 冷白纸底 `#f6f6f8` / 正文 `#1d1d1f` | 换成 BearNeo 的 `#fdfdfd` / `#1a1a1a` |
| 圆角卡片（`border-radius: 16/18px`） | 全部改成发丝线列表 / 无边框网格 |
| `box-shadow` 大阴影 | BearNeo 无阴影；图片只有 1px 边框 + 4px 圆角 |
| 衬线标题（Georgia 等） | 统一 Verdana 无衬线 |
| 纸面噪点、竖向参考线、胶囊筛选按钮 | 同上，纯装饰性 |
| `--paper` / `--bg` / `--content-width` 旧变量名 | 换成上表的 `--*-color-*` 系列 |

**唯一的语义色例外**：`sites/share` 的 `.verdict`（推荐 / 避雷 / 中立）保留
`--good: #1a7f37` / `--bad: #cf222e` / `--neutral: #9a6700`（深色 `#3fb950` / `#f85149` / `#d29922`）
——它是**内容语义**不是主题色，且已去掉胶囊底色、只剩文字着色。

### 页头：四个子站与主站完全一致

四个子站的页头是**同一套结构**（各自 `layouts/_default/baseof.html` 里各写一份）：

```
<header>
  <a href="/" class="title"><h1>{{ site.Title }}</h1></a>   ← 站名 h1
  <nav> 8 项导航，全部绝对地址指向主站 </nav>
</header>
```

8 项导航（`Home / Hub / About / Now / Links / Weekly / Posts / RSS`）写在各自 `hugo.toml` 的
`[[menu.main]]` 里，`url` 一律用**绝对地址**（`https://hulatu.com/…`），因为子站是独立域名、
相对地址会 404。子站的 `baseof.html` 对每个菜单项硬编码
`target="_blank" rel="noopener noreferrer"`（主站是靠 `nav.html` 按 `externalLinksNewTab` 自动加）。

> ⚠️ 改主站导航时**四个子站的 `hugo.toml` 要一起改**，否则跨站导航会缺项。
> 主站导航的权威定义在根目录 `hugo.toml` 的 `[[menu.main]]`（见 [../DESIGN.md](../DESIGN.md)）。

**页脚**同样是主站那一套：`hulatu.com · Subscribe via RSS or just say hello.` +
`Copyright © 2025-2026, hulatu.`

### 仍然故意不同的两处

- **深浅色切换**：五个站都**只跟随系统** `prefers-color-scheme`。
  ⚠️ 主站原本有个右上角手动切换按钮（`data-theme` + `assets/js/theme.js`），
  **2026-10-10 已随迁移删除** —— 现在这一条是统一的，没有差异。
- **响应式断点**：主站 **800px 一档**（上游主题如此，只用来藏目录），
  子站是 **run 700px**、**profile 520px**、**shot / share 没有断点**（改用
  `repeat(auto-fit, minmax(…, 1fr))` 让列数自己跟着宽度走）。
  断点是跟着各站版式定的，不是共用的设计令牌。
  四个子站都额外带一个 `@media (prefers-reduced-motion: reduce)` 关掉过渡动画。

## 本地构建

```bash
bash scripts/build-subdomains.sh
```

构建产物：

```text
sites/run/public
sites/shot/public
sites/share/public
sites/profile/public
```

## Cloudflare Pages 配置

在 Cloudflare Pages 中为各子域名分别新建项目，并绑定同一个 GitHub 仓库。

### 每个项目都要设的环境变量

| 变量 | 值 | 为什么 |
|---|---|---|
| `HUGO_VERSION` | `0.167.0` | 不设就跟随平台默认版本，可能与本机、CI 不一致。**四个子站项目都要设**，主站的 Pages 项目也一样（见根目录 `README.md` 的「安装 Hugo」一节） |

版本不合适时**子站**构建会失败并打印当前版本；子站和主站都由 `.github/workflows/build.yml`
在 push 时用同一版本预先验证。（⚠️ 主站原来那份站点层的
`layouts/partials/check-hugo-version.html` 已随 2026-10-10 的主题迁移删除，
主站的版本约束现在只靠 `hugo.toml` 的 `[module.hugoVersion]` 和那个 workflow。）

### 需要的 Account API Token 权限

这个仓库的部署建议使用 **Manage Account → Account API Tokens** 里创建的 `cfat_` token（不是 My Profile 里的 `cfut_`），至少授予：

- Account → Cloudflare Pages → Edit
- Zone → Zone → Read
- Zone → DNS → Edit

资源范围包含 `hulatu.com` 这个 zone；Pages 资源范围包含 `hulatu` 这个 account。

用这个 token 可以创建 Pages 项目、把自定义域名绑定到项目、写入 `run` / `shot` / `share` / `profile` 的 CNAME。没有 Pages Edit 权限时，Cloudflare API 会返回 `10000 Authentication error`；没有 Zone Read 时 `/zones` 会是空列表。

### run.hulatu.com

| 设置项 | 值 |
|---|---|
| Build command | `hugo --source sites/run --cacheDir "$(pwd)/.hugo_cache/run" --gc --minify --destination "$(pwd)/sites/run/public"` |
| Build output directory | `sites/run/public` |
| Root directory | `/` |
| Custom domain | `run.hulatu.com` |

### shot.hulatu.com

| 设置项 | 值 |
|---|---|
| Build command | `hugo --source sites/shot --cacheDir "$(pwd)/.hugo_cache/shot" --gc --minify --destination "$(pwd)/sites/shot/public"` |
| Build output directory | `sites/shot/public` |
| Root directory | `/` |
| Custom domain | `shot.hulatu.com` |

### share.hulatu.com

| 设置项 | 值 |
|---|---|
| Build command | `hugo --source sites/share --cacheDir "$(pwd)/.hugo_cache/share" --gc --minify --destination "$(pwd)/sites/share/public"` |
| Build output directory | `sites/share/public` |
| Root directory | `/` |
| Custom domain | `share.hulatu.com` |

### profile.hulatu.com

| 设置项 | 值 |
|---|---|
| Build command | `python3 scripts/fetch-profile-content.py && hugo --source sites/profile --cacheDir "$(pwd)/.hugo_cache/profile" --gc --minify --destination "$(pwd)/sites/profile/public"` |
| Build output directory | `sites/profile/public` |
| Root directory | `/` |
| Custom domain | `profile.hulatu.com` |

DNS 中 `run`、`shot`、`share` 和 `profile` 的 CNAME 记录，按 Cloudflare Pages 给的目标地址填写。

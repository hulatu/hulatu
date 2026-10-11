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

## 内容宽度约定：四个子站都是 680px（主站已不再相同）

四个子站的内容列是 **680px**，在各自 `static/style.css` 的 `:root` 里各写一份
`--content-width: 680px`，页面宽度靠
`main { width: min(var(--content-width), calc(100% - 32px)) }` 取；`sites/profile` 是
`calc(100% - 40px)`，另外 `shot-single` / `share-single` 这类单篇页也引用同一个变量。

这样做是为了**四个子站之间跨站跳转时页面不会忽宽忽窄**（改之前 run 960px、shot 1000px、share 1040px、profile 600px）。
要再调宽度时，四处一起改；子站里那些 `repeat(4, 1fr)` / `repeat(3, 1fr)` 已经换成
`repeat(auto-fit, minmax(…, 1fr))`，列数自己跟着宽度走，不用再单独调。

> ⚠️ **2026-10-10 晚起主站不再参与这个约定**：主站迁移到上游 hugo-bearneo 后，
> 宽度由主题的 `--width-max: 720px` 决定（`themes/hugo-bearneo/layouts/partials/style.html`），
> 不再是 680px。所以现在从主站跳子站会差 40px。
> **没有跟着改子站**是刻意的 —— 改四个子站的 CSS 是独立的一次改动，不该混在主题迁移里做。
> 真要对齐，把四个 `static/style.css` 的 `--content-width` 一起改成 `720px` 即可。

## 颜色约定：四个子站共用一套语义色（主站已换掉）

四个子站的 `:root` 是各写一份的（子站是独立 Hugo 站点，没有共享 CSS 的机制），所以**改颜色要四处一起改**。
变量名两套：profile 用 `--paper`，run / share / shot 用 `--bg`，指的是同一个「冷白纸底」。

当前这套值（**以四个子站为准**，主站已不再使用）：

| 语义 | 浅色 | 深色 | 谁在用 |
|---|---|---|---|
| 主色（印章红） | `#c73e2f` | `#ef7b64` | 四个子站 |
| 页面底色 | `#f6f6f8` | `#0b0b10` | 四个子站 |
| 正文色 | `#1d1d1f` | `#f5f5f7` | 四个子站 |
| 次要文字 | `#56565c` | `#a1a1a8` | 四个子站 |
| 分割线 | `#e4e4e9` | `#2c2c31` | 四个子站 |

2026-09 清理过一次漂移：profile 的 `--muted` 是 `#6b6b72`、run / share / shot 是 `#66666c`、
深色 `--line` profile 是 `#26262c`，都统一成了上表的值。再改配色时对着这张表抄，别各自微调。

> ⚠️ **2026-10-10 晚起主站已换成上游 hugo-bearneo 的配色**（底色 `#fdfdfd`、
> 正文 `#1a1a1a`、链接 `#0066cc`、分割线 `#d0d7de`，**没有印章红**），
> 见 [../DESIGN.md](../DESIGN.md)。所以「五个站共用一套语义色」这句话**已经不成立了**：
> 现在是「四个子站共用一套 + 主站另用上游那套」。同样**刻意没跟改**。

两处**故意不同**，不用去「修」：

- **深浅色切换**：四个子站只跟随系统 `prefers-color-scheme`。
  ⚠️ 主站原本有个右上角手动切换按钮（`data-theme` + `assets/js/theme.js`），
  **2026-10-10 已随迁移删除** —— 现在**五个站都只跟随系统**，这一条反而统一了。
- **响应式断点**：主站 **800px 一档**（上游主题如此，只用来藏目录），
  profile 600 / 520px，run 700px，share 800 / 560px，shot 没有断点。
  断点是跟着各站版式定的，不是共用的设计令牌。

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

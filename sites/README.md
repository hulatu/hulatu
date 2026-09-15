# 子站点

这里放 `hulatu.com` 延伸出来的独立 Hugo 站点：

- `sites/run`：`run.hulatu.com`，展示 Garmin 跑步数据。
- `sites/shot`：`shot.hulatu.com`，朋友圈式图片分享。
- `sites/share`：`share.hulatu.com`，好物与经验分享。

## 本地构建

```bash
bash scripts/build-subdomains.sh
```

构建产物：

```text
sites/run/public
sites/shot/public
sites/share/public
```

## Cloudflare Pages 配置

在 Cloudflare Pages 中为各子域名分别新建项目，并绑定同一个 GitHub 仓库。

### 需要的 Account API Token 权限

这个仓库的部署建议使用 **Manage Account → Account API Tokens** 里创建的 `cfat_` token（不是 My Profile 里的 `cfut_`），至少授予：

- Account → Cloudflare Pages → Edit
- Zone → Zone → Read
- Zone → DNS → Edit

资源范围包含 `hulatu.com` 这个 zone；Pages 资源范围包含 `hulatu` 这个 account。

用这个 token 可以创建 Pages 项目、把自定义域名绑定到项目、写入 `run` / `shot` / `share` 的 CNAME。没有 Pages Edit 权限时，Cloudflare API 会返回 `10000 Authentication error`；没有 Zone Read 时 `/zones` 会是空列表。

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

DNS 中 `run`、`shot` 和 `share` 的 CNAME 记录，按 Cloudflare Pages 给的目标地址填写。

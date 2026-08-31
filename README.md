# 我的博客（Hugo）

一个基于 [Hugo](https://gohugo.io/) 手搓的极简个人博客模板，不依赖任何第三方主题，方便你按自己的想法随意修改。

## ✨ 功能特点

- **导航栏**：关于 / 归档 / 分类 / 工具箱 / 周刊 / 数据 / 留言 + 搜索、深浅色切换、RSS
- **首页**：精选 / 时间两种排列 + 随机 5 篇；时间模式下底部左右箭头翻页
- **文章页**：阅读进度、目录 + 标签云侧栏（手机端目录变底部抽屉）、相关文章、上一篇/下一篇、随机一篇、复制链接、CC 协议
- **真搜索功能**：基于 [Fuse.js](https://www.fusejs.io/) 的客户端模糊搜索，构建时自动生成 `search-index.json`，按 `/` 或 ⌘/Ctrl+K 唤起
- **评论系统**：接入 [giscus](https://giscus.app)（基于 GitHub Discussions），跟随深浅色主题
- **无刷新导航**：站内跳转只替换正文，不整页刷新（pjax）
- **深色 / 浅色模式**：右上角一键切换，记住选择，刷新不闪烁
- **归档页**：按年份、月份折叠分组展示所有文章
- **分类 / 标签**：自动生成总览和文章列表，文章页标签云直达
- **年度数据页**：统计篇数、字数、月度写作柱状图、话题分布
- **周刊**：独立栏目 + 每页 5 期的箭头翻页 + 专属 RSS
- **订阅**：RSS 2.0 / Atom / JSON Feed 三种格式
- **SEO**：canonical、Open Graph、Twitter Card、JSON-LD、sitemap、robots、旧链接 301 跳转

## 📁 目录结构

```
blog/
├── hugo.toml                  # 站点配置文件
├── content/
│   ├── about.md                # 「关于」页面
│   ├── archive.md              # 「归档」页面
│   ├── privacy.md              # 「隐私政策」页面
│   ├── guestbook/              # 「留言」页面
│   ├── categories/             # 「分类」页面（_index.md）
│   ├── tags/                   # 「标签」页面（_index.md）
│   ├── media/                  # 「书影音」页面
│   ├── stats.md                # 「年度数据」页面
│   ├── posts/                  # 普通文章
│   └── weekly/                 # 周刊文章
├── layouts/                    # 页面模板
│   ├── _default/
│   ├── partials/                # 导航栏、页脚、搜索弹窗
│   ├── shortcodes/              # media / media-grid 等短代码
│   └── index.searchindex.json   # 搜索索引生成模板
├── assets/
│   ├── css/style.css            # 全站样式
│   └── js/                      # 主题、搜索、pjax 等脚本
├── static/
│   ├── img/                     # 缩略图、OG 卡片
│   ├── media/                   # 书影音配图
│   └── js/fuse.min.js           # 搜索用的 Fuse.js
├── archetypes/posts.md         # 新建文章的默认模板
└── hugo.toml                   # 站点配置
```

> 详细维护说明见 [MAINTENANCE.md](MAINTENANCE.md)。

## 🚀 本地运行

### 1. 安装 Hugo（Extended 版本）

- macOS：`brew install hugo`
- Windows：`winget install Hugo.Hugo.Extended` 或 `choco install hugo-extended`
- Linux：参考 [官方安装文档](https://gohugo.io/installation/)

安装完成后确认版本：

```bash
hugo version
```

> 注意一定要装 **Extended 版本**（自带图片处理、Sass 编译等能力）。

### 2. 启动本地预览

在项目根目录下运行：

```bash
hugo server -D
```

浏览器打开 `http://localhost:1313` 即可实时预览，修改文件会自动刷新（`-D` 表示同时显示草稿文章）。

### 3. 新建一篇文章

```bash
hugo new content/posts/my-first-post.md
```

编辑生成的 Markdown 文件，把开头的 `draft: true` 删掉或改成 `false` 即可正式发布。

## ⚙️ 常用自定义

| 想改什么 | 去哪改 |
|---|---|
| 博客名称 / 描述 / 作者 | `hugo.toml` 顶部的 `title`、`params` |
| 导航栏链接 | `hugo.toml` 的 `[[menu.main]]` |
| 页脚信息 | `layouts/partials/footer.html` |
| 颜色 / 字体 / 间距 | `assets/css/style.css` 顶部的 CSS 变量 |
| 周刊每页文章数量 | `hugo.toml` 里 `[pagination]` 的 `pagerSize` |
| 网站图标（favicon） | 换成 `static/` 下的图片，改 `hugo.toml` 的 `[params.assets]` |
| 个人头像 | 把图片放进 `static/images/`，然后在 `hugo.toml` 的 `params.avatar` 填 `/images/文件名.jpg`；不填则自动显示首字母头像 |
| 文章封面图 | 在文章 front matter 加 `cover` 字段（远程 URL 或本地路径均可） |
| 相关文章数量与匹配 | `hugo.toml` 里 `[related]` 段 |
| 目录/标签云侧栏断点 | `assets/css/style.css` 里搜 `1200px` / `899.98px` 媒体查询 |

## 💬 接入 giscus 评论系统

giscus 是基于 GitHub Discussions 的免费评论系统，不需要自己搭后端。接入步骤：

1. 确保你的仓库是 **公开（public）** 仓库
2. 打开仓库 **Settings → General → Features**，勾选开启 **Discussions**
3. 打开 [https://giscus.app](https://giscus.app)，按页面提示填入你的仓库地址，它会自动检测配置是否正确
4. 页面下方会生成一段 `<script>` 代码，把其中这几个值抄到 `hugo.toml` 的 `[params.giscus]` 里：

```toml
[params.giscus]
  repo = "你的用户名/仓库名"
  repoId = "giscus.app 给你的 data-repo-id"
  category = "giscus.app 里选的分类，比如 Announcements"
  categoryId = "giscus.app 给你的 data-category-id"
  mapping = "pathname"
  reactions = true
  inputPosition = "bottom"
  lang = "zh-CN"
```

5. 保存后重新构建，评论区就会出现在每篇文章正文下方（`repo` 留空则不显示评论区，「关于」「归档」等非文章页面也不会显示）。

## 🌐 部署

本仓库不包含 CI 工作流，部署由你在托管平台（如 GitHub Pages / Cloudflare Pages / Vercel）侧配置：把仓库关联到平台后，每次 `git push` 会自动触发构建发布。

### 之后如何更新博客

```bash
hugo new content/posts/文章名.md
# 编辑文章内容...
git add .
git commit -m "新增文章：文章标题"
git push
```

push 之后托管平台会自动重新构建并发布，通常几分钟内就能在线上看到更新。

> 提示：本地 `hugo server` 预览时会把 livereload 调试脚本写进 `public/`（仅本地影响，
> 托管平台是 push 后独立构建的，不会带上）。如果你需要手动上传 `public/` 部署，
> 先停掉 `hugo server`，再运行 `./deploy.sh`（会做一次干净的生产构建并自检）。

### 关于 baseURL

`hugo.toml` 里的 `baseURL` 建议直接改成你最终的访问地址（比如 `https://yourname.github.io/` 或你自己绑定的域名），这样生成的链接（RSS、canonical 等）才是正确的。

### 绑定你自己的域名（可选）

在托管平台的域名设置里填上你的域名，然后去域名服务商后台把 DNS 指向托管平台提供的地址，等待生效即可；HTTPS 证书一般由托管平台自动签发。

## 📄 License

内容部分默认采用 CC BY-NC-SA 4.0，可以在 `hugo.toml` 的 `copyright` 字段自行修改；代码部分你可以自由使用和修改。

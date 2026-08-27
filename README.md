# 我的博客（Hugo）

一个基于 [Hugo](https://gohugo.io/) 手搓的极简个人博客模板，不依赖任何第三方主题，方便你按自己的想法随意修改。

## ✨ 功能特点

- **导航栏**：博客名居左；「关于 / 归档 / 订阅 / 分类 / 搜索......」+ 深浅色切换按钮居右，均等间距排列
- **等宽布局**：导航栏、正文、页脚统一使用同一个容器宽度，视觉更整齐
- **首页文章列表**：只显示标题和日期（标题居左，日期居右）
- **真搜索功能**：基于 [Fuse.js](https://www.fusejs.io/) 的客户端模糊搜索，构建时自动生成 `search-index.json`，无需任何后端或第三方服务；搜索按钮和「关于/归档/订阅/分类」排在一起、位于深浅色切换按钮左边，点击或按 `/` 键弹出搜索框
- **评论系统**：接入 [giscus](https://giscus.app)（基于 GitHub Discussions），宽度与导航栏/正文保持一致，并且会跟随站点的深浅色切换实时同步主题
- **网站图标 & 头像**：favicon 等图标放在 `static/` 下，路径在 `hugo.toml` 的 `[params.assets]` 里配置；「关于」页面展示 `params.avatar` 指定的头像，没填则自动显示作者姓名首字
- **文章封面图**：在文章 front matter 填 `cover` 字段即可，图片显示在文章顶部，宽度与正文容器一致，圆角 10px
- **文章目录**：有二级以上标题的文章会自动生成目录，悬浮显示在文章容器右侧（屏幕较窄时自动隐藏，不影响阅读）
- **无刷新导航**：点击站内链接（导航栏、文章列表、翻页等）只会替换正文内容，不会整页刷新，浏览体验更流畅；直接输入网址或分享链接依然是完整页面，SEO 不受影响
- **深色 / 浅色模式**：右上角一键切换，会记住你的选择，刷新页面也不会闪烁
- **归档页**：按年份自动分组展示所有文章
- **分类页**：自动生成分类总览及每个分类下的文章列表
- **RSS 订阅**：内置生成 `index.xml`

## 📁 目录结构

```
blog/
├── hugo.toml                  # 站点配置文件
├── content/
│   ├── about.md                # 「关于」页面
│   ├── archive.md              # 「归档」页面
│   ├── privacy.md              # 「隐私政策」页面
│   ├── guestbook/              # 「留言」页面
│   ├── categories/             # 「分类」页面
│   ├── media/                  # 「书影音」页面
│   └── posts/                  # 文章都放在这里
├── layouts/                    # 页面模板
│   ├── _default/
│   ├── partials/                # 导航栏、页脚、搜索弹窗
│   ├── shortcodes/              # media / media-grid 等短代码
│   └── index.searchindex.json   # 搜索索引生成模板
├── static/
│   ├── css/style.css            # 全站样式
│   ├── img/                     # 文章配图
│   └── js/                      # 主题切换 & 搜索逻辑
├── archetypes/posts.md         # 新建文章的默认模板
└── hugo.toml                   # 站点配置
```

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
| 颜色 / 字体 / 间距 | `static/css/style.css` 顶部的 CSS 变量 |
| 首页每页文章数量 | `hugo.toml` 里 `[pagination]` 的 `pagerSize` |
| 网站图标（favicon） | 默认自动用博客标题首字生成，想换成自己的图片：改 `layouts/_default/baseof.html` 里 favicon 那几行，指向你放在 `static/` 下的图片文件即可 |
| 个人头像 | 把图片放进 `static/images/`，然后在 `hugo.toml` 的 `params.avatar` 填 `/images/文件名.jpg`；不填则自动显示首字母头像 |
| 文章封面图 | 在文章 front matter 加 `cover: "/images/xxx.jpg"`（图片放进 `static/images/`） |
| 目录悬浮显示的最小屏幕宽度 | `static/css/style.css` 里搜 `1240px` 那处媒体查询，改成你想要的断点 |

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

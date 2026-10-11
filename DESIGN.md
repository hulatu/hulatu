---
version: beta
name: hulatu-bearneo
description: >
  ⚠️ 2026-10-10 晚**整份重写**。本站的视觉体系**不再是自建的「纸账 + 印章」系统** ——
  那一天整站迁移到了上游 hugo-bearneo 主题（`themes/hugo-bearneo/`，27 个文件逐字节未改），
  自建的 6 个 CSS 模块 / 6 个 JS 全部删除。
  所以下面登记的令牌**全部是上游主题的真值**，唯一真值在
  `themes/hugo-bearneo/layouts/partials/style.html` —— 整份 CSS 内联进每个页面
  （327 个产物 HTML 各一份，普通页 8142 字节 / gzip 2458、文章页 11929 / 3227、
  含代码块的 5 页 14114 / 3706；改完记得回读体积，别凭印象）。
  站点层只在 19 个文件里做了最小偏离，逐条列在正文「站点层偏离」一节。
  **改样式前先读那一节**：绝大多数视觉问题应该在上游那一份里改，
  而不是在站点层再叠一层规则 —— 那是上一版自建主题最后变得无法维护的原因。

colors:
  # ── 浅色（默认）─────────────────────────────
  bg-primary: "#fdfdfd"        # 页面底色，几乎纯白
  bg-secondary: "#f2f4f7"      # 行内 code 底 / 表头底 / 控件底
  text-primary: "#1a1a1a"      # 正文与标题
  text-secondary: "#444"       # 引用块 / 图片说明
  text-tertiary: "#8c8c8c"     # 日期列 / 目录文字
  link: "#0066cc"              # 链接
  link-visited: "#551a8b"      # 列表页已访问链接
  border: "#d0d7de"            # 表格线 / 图片描边 / 分割

  # ── 深色（`prefers-color-scheme: dark`，**没有手动开关**）──
  # 只覆盖上面 8 个，--width-max / 字体 / 字号三组不动。
  dark:
    bg-primary: "#121212"
    bg-secondary: "#1c1f24"
    text-primary: "#e5e5e5"
    text-secondary: "#b3b3b7"
    text-tertiary: "#a0a0a0"
    link: "#6da6ff"
    link-visited: "#b388ff"
    border: "#30363d"

typography:
  font-primary: 'Verdana, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC", sans-serif'
  font-secondary: "monospace"
  size-primary: "1em"
  size-secondary: "0.8em"
  body-line-height: 1.5
  content-line-height: 1.6
  note: >
    上游只有 `Verdana, sans-serif`。Verdana 不含汉字，中文一直靠浏览器兜底 ——
    macOS 上看不出差别，Windows / Android 上会落到宋体或老版思源黑。
    站点层把中文字体显式写进栈里（`custom_head.html` 第 01 段），这是**唯一**动过字体的地方。
    行高**刻意保持上游的 1.5 / 1.6**，不覆盖：我一度改成 1.78（中文方块字没有 x-height 的
    视觉补偿，1.6 读长文偏挤），但用户对照参考站 yinji.org 后选了「和参考站一致」。

layout:
  width-max: 720px            # 唯一的宽度令牌。没有 --content-width / --radius / 间距阶梯
  body-padding: 20px
  heading-margin: "16px 0"    # 上游 h1~h6 一律 16px 上下；正文里由站点层加大上间距
  breakpoints:
    - 800px                   # 唯一断点：TOC 隐藏 + #minipic 图片放开宽度
  note: >
    上游**没有**间距阶梯（--space-1/2/3）、**没有**圆角档位（--radius-sm/chip/pill）、
    **没有**投影令牌。需要圆角时直接写 4px（上游对表格 / 图片 / code / 高亮块一律 4px）。
    上一版那套 `--space-*` / `--radius-*` / `--shadow-*` 随自建主题一起删了，
    别再照旧文档的写法引用。

radius: 4px                  # 全站唯一一档（表格 / 图片 / 行内 code / 高亮块）
hit-target: "无硬性下限"      # 上游没有 44px 触控区约定；站点层只给评论区的「评论」开关补了 min-height: 44px
---

# 设计规范 —— hulatu.com

> 一句话：**本站的视觉体系就是上游 Hugo Bear Neo 的**，站点层只做了 19 个文件的最小偏离。
> 这份文档的作用不是「描述我们自己的设计系统」，而是**登记那 19 个文件**，
> 以及把「为什么不改」的理由留下来 —— 免得下一轮改造又把上游的东西重做一遍。

---

## 0. 这份文档怎么用

| 你想做的事 | 去哪儿 |
| --- | --- |
| 改颜色 / 字体 / 宽度 / 圆角 | `themes/hugo-bearneo/layouts/partials/style.html` 的 `:root`。**改上游**，不要在站点层叠 |
| 改正文排版（标题间距、中文字体） | `layouts/partials/custom_head.html` 第 02 段 |
| 改首页 | `layouts/index.html`（结构）+ `content/_index.md`（文案：简介、支持链接、五个平台） |
| 改关于页的介绍块 | `content/about.md`（**纯 Markdown，没有头像、也没有页面标题**）|
| 改支持页 / 换收款码 | `content/donate.md`（结构 + 文案）+ `custom_head.html` 第 08 段（样式） |
| 改文末「系列」/「上一篇 / 下一篇」 | 模板 `layouts/_default/single.html` + `custom_head.html` 第 09 / 10 段 |
| 改 `/roll/` 两组之间的分隔线 | `content/roll.md` 里那条**裸 `<hr>`**（不要加 class，样式走主题的 `hr`） |
| 改代码块配色 | `custom_head.html` 第 12 段（浅/深两套）。⚠️ 前提是 `hugo.toml` 的 `[markup.highlight] noClasses = false`，改回 true 会让代码块变成看不见 |
| 改归档页「系列」横向入口 | 模板 `layouts/_default/archive.html` + `custom_head.html` 第 09 段 |
| 改链接页（朋友 / 聚合站 / 点评） | `content/roll.md` —— **全站唯一的链接页**，一条平铺 14 项（前 3 朋友、后 11 聚合站，无小标题） |
| 改导航 | `hugo.toml` 的 `[[menu.main]]`，**不用碰模板** |
| 改页脚 | `layouts/partials/footer.html` + `hugo.toml` 的 `[params] copyright` / `copyrightNote` / `licenseName` / `licenseURL` |
| 改评论区 | `layouts/partials/giscus.html` + `assets/js/giscus.js` + `custom_head.html` 第 07 段 |
| 改 robots / `noindex` | `layouts/_default/baseof.html` 的 robots 分支（见第 5 节） |
| 想加回被删的功能 | 先读本文档第 6 节「已删除的功能」——**每一条都写了删它的理由** |

⚠️ 主题目录 `themes/hugo-bearneo/` 是**上游逐字节副本**（2026-10-10 用 `diff -r` 验过）。
真要改它，改完请在本文档第 5 节登记一行 —— 否则下一次跟上游同步会静默覆盖。

---

## 1. 设计谱系

```
Bear Blog（极简博客服务，Verdana + 720px + 虚线 hr）
      ↓ 社区移植
hugo-bearneo（上游主题，本站现在用的就是它，逐字节未改）
      ↓ 站点层借鉴
yinji.org（同样基于 hugo-bearneo，是「别人怎么用这个主题」的现成答案）
      ↓
hulatu.com（本站：上游主题 + 11 个站点层覆盖文件）
```

**本站自己的设计主张只剩三条**，全部落在站点层，且都很小：

1. **中文字体要显式声明**（上游的 Verdana 栈不含汉字）。
2. **正文标题要有层级**（上游 h1~h6 一律 `margin: 16px 0`，标题和上下段的距离一样）。
3. **列表行的日期列不能写死宽度**（上游按它自己的 `"02 Jan."` 7 字符定 80px，
   本站用 ISO 的 `2006-01-02` 10 字符，写死就每行折两行）。

除此之外，**没有第四条**。上一版那套「纸账 + 印章」的语言（冷白纸画布、印章红、
衬线标题、发丝线承担层级、四档圆角、44px 触控区、view-transition 转场、三档时长）
**整体作废**，不要再往这些方向提方案。

---

## 2. 令牌

**唯一真值**：`themes/hugo-bearneo/layouts/partials/style.html` 顶部。
下面这份是摘抄，改上游之后请回来对一次。

### 颜色

浅色 8 个 + 深色 8 个，见文件头 `colors:`。三个要点：

- **只有一个强调色**：链接蓝 `#0066cc`（深色 `#6da6ff`）。没有品牌色、没有印章红。
- **深色只覆盖 8 个颜色变量**，宽度 / 字体 / 字号不动。
- **深色没有开关**：`@media (prefers-color-scheme: dark)`，完全跟随系统。
  右上角那个切换按钮**已经删掉**（上游没有），`content/privacy.md` 已同步改文案。
- ⚠️ **与 yinji.org 逐值相同**（2026-10-11 实测）：两站的 `:root` 浅色 13 行 + 深色 9 行
  **一个字节都不差**，因为两边都是上游 Bear Neo 的原样。
  所以用户 2026-10-11 提的「配色参考 yinji」**无需任何改动** —— 本来就一致。
  真正有差异的只有字体栈（见下）和几处排版补丁（见第 5 节）。

#### 代码块配色（2026-10-11 新增，**浅色 / 深色两套**）

上面说的「深色只覆盖 8 个颜色变量」**不包括代码块** —— 代码块另有一组 `--code-*` 变量，
由站点层在**含代码块的页面**上输出（见第 5 节第 12 段）。

| 令牌 | 浅色 | 深色 | 用于 |
| --- | --- | --- | --- |
| `--code-fg` | `#24292f` | `#e5e5e5` | 普通标识符、标点 |
| `--code-comment` | `#656d76` | `#8b949e` | 注释 `.c .c1 .cm …` |
| `--code-keyword` | `#cf222e` | `#ff7b72` | 关键字 `.k .kn .kd …` |
| `--code-string` | `#0a3069` | `#a5d6ff` | 字符串 `.s .s1 .s2 …` |
| `--code-number` | `#0550ae` | `#79c0ff` | 数字 `.mi .mf …`、运算符 `.o .ow` |
| `--code-function` | `#8250df` | `#d2a8ff` | 函数 `.nf .fm`、类名 `.nc`、装饰器 `.nd` |
| `--code-builtin` | `#953800` | `#ffa657` | 内置 `.nb .bp`、变量 `.nv .vi …` |
| `--code-tag` | `#116329` | `#7ee787` | 标签 `.nt`、插入 `.gi` |

底色**沿用** `--bg-color-secondary`（`#f2f4f7` / `#1c1f24`），与行内 `code` 同一个底；
两者的区别靠 1px `--border-color` 边框，不是靠换底 —— 这样代码块不会在页面里「打补丁」。
深浅两套的每一个 token 对各自底色都在 **4.5:1 以上**（WCAG AA，
最低是浅色注释 4.76:1、浅色函数 4.58:1）。

⚠️ 这**不是**上游或 yinji 的做法 —— 两边用的都是 Hugo 默认的 monokai 内联色，
而它在本站**完全不可读**（详见第 5 节第 12 段的实测数据）。这是本站的一处**有意改进**。

### 字体

| 角色 | 栈 | 用在哪儿 |
| --- | --- | --- |
| `--font-primary` | `Verdana, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC", sans-serif`（站点层补） | 正文、标题 |
| `--font-secondary` | `monospace` | `<time>`、`<code>` |

- ⚠️ yinji 的写法是 `"Verdana","PingFang SC", sans-serif` —— **本站前两项与它逐字相同**
  （macOS 上解析结果完全一样：拉丁走 Verdana、汉字走苹方），只是**多挂了三个跨平台回退**，
  在 Windows / Android 上才不会掉到宋体。所以「字体参考 yinji」也**无需改动**。
- ⚠️ 上游**没有** `--font-serif`（衬线标题）也没有 `--font-meta`（等宽元信息）这两个概念 ——
  那是上一版自建主题的。现在日期和代码共用 `monospace`，标题和正文共用 Verdana。

### 尺寸

| 令牌 | 值 | 说明 |
| --- | --- | --- |
| `--width-max` | `720px` | **唯一的宽度令牌**。没有内容列 / 页头列之分 |
| `body` padding | `20px` | 左右上下都是 20px |
| `--font-size-primary` | `1em` | 正文 |
| `--font-size-secondary` | `0.8em` | 页脚 / 图片说明 |
| `time` | `15px` | 硬编码，不走令牌 |
| 圆角 | `4px` | 全站唯一一档 |
| 断点 | `800px` | 唯一一档 |

---

## 3. 布局与节奏

- **单列**。`body { max-width: 720px; margin: auto; padding: 20px }`。
  正文、页头、页脚共用同一条左右边界。
- **层级靠空白和虚线，不靠投影**：上游没有 `box-shadow` 令牌，
  唯一的阴影是图片放大遮罩上的 `0 8px 32px rgba(0,0,0,.3)`。
- **`hr` 是虚线**：`hr { border: 0; border-top: 1px dashed }`。
  首页「Hi! 简介」和「Recent Posts:」之间那条分隔就是它，**不用加类名**。
- **`content` 的 line-height 是 1.6**，`body` 是 1.5。正文比外壳松一点，这是上游的设计。

---

## 4. 组件

### 页头

```html
<header>
  <a href="/" class="title"><h1>胡拉图说</h1></a>
  <nav>…</nav>
</header>
```

- **没有头像、没有 logo 图、没有图标按钮**。全站唯一的 `<h1>` 就是这里的站名 ——
  列表页（`/archive/`、`/weekly/`）**没有页面级 h1**，这是上游的设计（Bear Blog 同款）。
- 页头**不吸顶**（`position` 默认 static）。

### 导航

**8 项，全部由 `hugo.toml` 的 `[[menu.main]]` 驱动**，模板里一个链接都不写死：

| 标签（英文） | 落点 | 页面标题 |
| --- | --- | --- |
| `Home` | `/` | 首页 |
| `Hub` | `https://profile.hulatu.com/` | ——**不是本站页面**，是个人主页子站（2026-10-11 新增，weight 15 卡在 Home 右侧） |
| `About` | `/about/` | 关于 |
| `Now` | `/now/` | 现在 |
| `Links` | `/roll/` | 收藏（**收藏 + 友链合并页**，2026-10-11 起） |
| `Weekly` | `/weekly/` | 周刊 |
| `Posts` | `/archive/` | 归档 |
| `RSS` | `/index.xml` | ——**不是页面**，是全站订阅源（2026-10-11 新增，weight 60 排最右） |

⚠️ `RSS` 那一项与页脚那行 `Subscribe via RSS` 指向**同一个** `/index.xml`。
它不以 `http(s)` 开头，所以 `externalLinksNewTab` 那套不会给它加 `target="_blank"`
（与页脚那个 RSS 链接行为一致：原地打开）。也**没有「当前页高亮」的概念**。

⚠️ `Hub` 是**唯一一项跨站外链**（`https://profile.hulatu.com/`，个人主页子站，独立部署在
`sites/profile/`）。因为以 `https://` 开头，`nav.html` 会给它加 `target="_blank"
rel="noopener noreferrer"` —— 点它**新窗口打开**，与 `RSS` 的原地打开不同，这是有意的。
⚠️ 它同样**没有「当前页高亮」**（外部站点不参与本站的 `RelPermalink` 比对）。
⚠️ 导航项一多，窄屏就会折行：`nav` 靠站点层 `custom_head.html` 第 00 段的
`display: flex; flex-wrap: wrap; column-gap: 8px`（并清掉末项的 `margin-right`）
保证折行只发生在**项与项之间**。没有这段时 392px 视口会把 `RSS` 拆成 `RS`/`S`。

⚠️ **`/roll/` 是全站唯一的链接页**（2026-10-11 起）。**一条平铺，共 14 条**，
两组之间只用**一条不带文字的裸 `<hr>`** 分开（所以 DOM 上是**两个 `<ul>`**：3 + 11 —— 这是预期，
别当 bug 去「修」）：
（2026-10-11 当天先分成「## 朋友」/「## 博客聚合平台」两组，稍后照 yinji 去掉了小标题）：
- 前 **3 条是朋友**：花墨 / Cytrogen / 梁某银的博客。**不含千古壹号**（用户明确说不要；
  它的 `blog-list` 就是下面「中文博客琅琊榜」那条，已经在平台那批里了）。
- 后 **11 条是聚合站 / 目录站**（原「博客圈与组织」）。
- ⚠️ 分组现在**只靠那条横线和顺序**表达，页面上没有小标题 —— 细节见第 4 节
  「收藏 `/roll/`」。
- 结尾照 yinji 还有一行 `&hellip;更新中`。

⚠️ **条目格式照 yinji.org/roll**：`- [名称](地址)：一句话点评`。
⚠️ **14 条点评 2026-10-11 晚已由作者自己写全**（3 位朋友 + 11 个平台，每条都有一句）——
**别再当漏写去补**。架构上仍留了口子：要加就直接接在中文冒号后面，不用改别处。

⚠️ **`/links/` 这一页已经删除**（2026-10-11）：旧地址 `/links/` 与更早的 `/friends/`
**都 301 到 `/roll/`**（见 `static/_redirects`）。**别再拆回两页** —— 用户已经用一次合并
否掉了「两份清单互不重叠」那套说法。

⚠️ 顺序由 `weight` 决定，与 `hugo.toml` 里的书写顺序无关。
`Hub` 的 weight 是 **15**（卡在 `Home` 10 与 `About` 20 之间），所以必然落在 `Home` **右边**；
`Weekly` 的 weight 是 **45**（卡在 `Links` 40 与 `Posts` 50 之间），
这样它必然落在 `Posts` **左边** —— 2026-10-11 用户要求的位置。

增删导航只动 `hugo.toml`；外链自动开新窗口（`externalLinksNewTab = true`，在 `nav.html` 里判）。

### 首页

**逐条照 yinji.org**：

```
## Hi!                       ← content/_index.md 里，h2
> 总得留下点什么吧。            ← 引用块
一名不谈地理…的工科研究生。       ← 段落
如果觉得…可以选择 [支持] 我。      ← 段落，中间夹一个指向 /donate/ 的链接（2026-10-11 新增）
[公众号] / [少数派] / [小红书]   ← 一行链接（Markdown 段落，Goldmark 自动成 <p>）
/ [知乎] / [即刻]                 五个平台，2026-10-11 换掉了原来的 RSS / 周刊 / 关于 / 花园
<hr>                         ← 虚线，模板输出
<h3>Recent Posts:</h3>       ← 英文，和导航同一套语言
<ul class="recent-posts">    ← 5 条，日期 + 标题
```

- **文案全在 `content/_index.md`**，模板只负责分隔线和列表。
- **列表后面什么都没有** —— 没有「查看全部文章 →」那类尾巴。全站文章入口交给导航的 `Posts`。
- 条数由 `params.homeRecentCount` 控制（当前 5），设 `0` 就退回上游原样（只剩正文）。
- `.recent-posts` 的样式在 `custom_head.html` 第 04 段：
  CSS Grid 两列（定宽日期 + 弹性标题），比上游 `ul.blog-posts` 的 `flex: 0 0 80px` 稳。
  ⚠️ 日期颜色用 `var(--text-color-tertiary)` 而不是 yinji 写死的 `#999` ——
  `#999` 在深色主题下对比度不足。
- ⚠️ **列表必须与 `Recent Posts:` 标题左对齐**（用户 2026-10-11 明确要求「靠近最左边，
  和 yinji.org 一样」）。靠 `.recent-posts { padding-left: 0 }` 顶掉上游
  `content ul { padding-left: 1.5em }`。实测两者左边界同为 x≈140（yinji 是 141/141）。
  **这条规则一旦失效，列表会缩进约 40px** —— 排查方向见下方「样式块里的注释泄漏」。
- ✅ **2026-10-11 第二轮：五个几何值全部改成 yinji 的值**（用户「按照 yinji 的设计」）。
  原本本站刻意做得更紧凑，现在逐值一致：

  | 规则 | 本站（旧） | 现在 = yinji |
  | --- | --- | --- |
  | `grid-template-columns` | `104px 1fr` | `120px 1fr` |
  | `time` 字号 | `.85rem` | `.95rem` |
  | `li` `margin-bottom` | `.85rem` | `1.2rem` |
  | `li` `line-height` | `1.5` | `1.3` |
  | `ul` `margin-top` | `1.4rem` | `2rem` |

  同时删掉本站多加的 `align-items: baseline` 与 `gap: 4px`（yinji 没有），
  以及原来的 `@media (max-width: 480px)` 单列回退（120px 定宽列在最窄内容区
  352px 下仍留 232px 给标题，实测不溢出，yinji 也没有这条）。
  **实测 A/B（同一视口、同一 `Recent Posts:` 标题排版）**：两站的
  h3 都在 y 52.5–66.5、首条文字顶都在 y 109.0、标题左边缘都在 x 260.0、
  行距都 29.0px —— **逐像素一致**。
- ⚠️ **简介正文不包 `<content>`**（2026-10-11 改，与 yinji 一致、与上游不同）。
  上游 `index.html` 是 `<content>{{ .Content }}</content>`；包着的话首页简介会吃
  `content { line-height: 1.6 }` 两条，结果是行高 1.6（yinji 走 body 的 1.5）。
  去掉这一层之后两站首页的节奏逐项一致。`<hr>` / `<h3>` / `<ul.recent-posts>`
  本来就在 `<content>` 外面，不受影响。

#### 那五个平台链接（2026-10-11）

| 顺序 | 标签 | 落点 |
| --- | --- | --- |
| 1 | 公众号 | `https://img.hulatu.com/post/bk7UaF.webp`（**二维码大图**） |
| 2 | 少数派 | `https://sspai.com/u/hulatu/updates` |
| 3 | 小红书 | `https://www.xiaohongshu.com/user/profile/68a9d4e5…` |
| 4 | 知乎 | `https://www.zhihu.com/people/hulatu` |
| 5 | 即刻 | `https://web.okjike.com/u/25B20BAD-…` |

- 顺序是用户指定的，别按字母或热度重排。
- ⚠️ **公众号没有网页主页**，只能给二维码图。用户 2026-10-11 选了「点开看大图」
  （不做悬停浮层、也不在首页常显二维码）—— 所以这一行**仍然是五个纯文字链接**，
  没有新增任何样式。每条都带 `title` 提示（「点开看二维码，扫码关注…」等）。
- **地址的唯一真相来源是 `content/about.md` 的「平台」段**，改的时候两边一起改。

#### 支持入口与 `/donate/` 页（2026-10-11）

首页那句「如果觉得我的网站对你有帮助，可以选择 **[支持]** 我」里的 `支持`
是一个**站内链接**，指向独立页 **`/donate/`**（`content/donate.md`）。

> 用户原话：「首页的『支持』链接里放之前赞赏我的二维码」。
> 两个二维码（微信 + 支付宝）**只有一个**，没有第二个候选方案 ——
> 在「首页就地展开 / 独立页 / 点开看大图」三选一里，用户选了**独立 `/donate/` 页**。

- 这一页是**从旧自建主题搬回来的**：旧站的打赏块是
  `layouts/partials/donate.html` + `hugo.toml` 的 `[params.donate]`，挂在**关于页**里；
  迁移到上游 hugo-bearneo 时整块（含 `[params.donate]`）被删，
  只剩 `static/images/donate/` 两张图没删 —— 这次就是把这笔资产重新接上。
- **两个码常显**，没有折叠。旧版折在 `<details>` 里是因为它挤在关于页的
  自我介绍和栏目导航之间；这一页本身就是内容，没有「别抢戏」的问题。
- 布局：`.donate-qrs` 是 `grid` + `repeat(auto-fit, minmax(150px, 220px))` +
  `justify-content: center`。宽屏两列、每列被 `220px` 卡住并整行居中
  （**不用 `1fr`** —— 那会把两个码推到内容区最左最右、中间空一大块）；
  窄屏自动落成一列。
- **收款码是站内静态资源**（`/images/donate/*.webp`，440×440 / 435×435，
  自带白静区、无损 WebP），不走图床、不套 Cloudflare 变换。
  ⚠️ **换码姿势**：把新图裁成「二维码本体 + 白静区」的正方形 webp 覆盖同名文件，
  然后去 Cloudflare 后台 Purge 一次 `/images/donate/*` —— 那条路径配了 30 天缓存，
  不 purge 的话老访客看到的还是旧码。
- 收款方显示名沿用旧配置的 `hututu(**朋)`，写成行内代码（`` `…` ``）而不是裸文本 ——
  裸写 `**` 在 Markdown 里是强调符，靠「后面没有配对的 `**`」才没被解析成粗体，不值得赌。
- front matter：`hideDate: true` + `toc: false`（与 `/now/` 同一套）+ `noindex: true`
  （与 `/privacy/` 一致 —— 两者都是「不是内容」的站点家具页）。

### 关于页 `/about/` 的介绍块（2026-10-11，**没有头像**）

正文最上面那块「名字 + 一行简介 + 关注方向」现在是一段**最朴素的 Markdown**：

```
胡拉图（朋朋）
食品领域研究生 · 郑州
记录思考、跑步、写作；分享一些工具折腾经历。
关注方向： 跑步 / 写作 / 工具折腾 / 思考 / 观察
```

- 结构就在 `content/about.md`：`# 胡拉图（朋朋）` + 三段文字，**没有包任何 div**；
  `custom_head.html` 第 03 段**刻意留空**（保留段号是为了不动 04~08 的编号，与 06 段同一做法）。
- **至此全站一张头像都没有了** —— 页头那张 2026-10-10 已全站撤掉，这是最后一张。
  `static/images/avatar.webp` 因此**又变回没有引用的孤儿文件**（第 8 节第 9 条）：
  别顺手删，也别以为它还在用。
- 一天之内翻了两次，**别再重走**：
  ① 原状：头像独占一行、压在名字上面（旧站的样子）；
  ② 上午：「头像放右边、设计好看一点」→ 两栏结构（`.about-intro` > `.about-intro-body` + `<img>`），
     120px 圆头像贴右，窄屏落成一列、头像 `order: -1` 回到最上面；中间还试过「头像再往左 200px」；
  ③ 同一天稍后：「算了，先把关于页的头像去除，不显示了」→ **整套撤掉**，
     连 `.about-intro*` 三组规则和那条 `@media (max-width: 480px)` 一起删。
- 撤掉之前踩过的两个坑，留给「万一哪天又要头像」时用：
  - ⚠️ 主题有一条全局 `img { margin-left: auto; margin-right: auto }`（它靠这个把正文插图居中）。
    在**列方向**的 flex 里，交叉轴上的 auto 外边距**优先级高于 `align-items`** ——
    窄屏落成一列时头像会自己跑到中间，而文字是左对齐的，看着像没对齐。要显式写 `margin: 0` 压掉。
  - ⚠️ 两栏那版里 `.about-intro-body` 必须写 `min-width: 0` —— flex 子项默认 `min-width: auto`，
    「关注方向」那行长串会把左栏顶宽、把头像挤出内容区。
- ⚠️ 首尾元素的 16px 外边距**现在不用管了**：介绍块变回「内容区的普通子元素」，
  **而且首元素就是它**（2026-10-11 去掉了页面标题，见下），
  16px 上边距会跟 `<main>` / `<header>` 的 0 边距折叠穿透 —— 与 yinji 一致。
  ⚠️ 别为了「消掉它」再加 `content > :first-child { margin-top: 0 }`：
  那条规则 2026-10-11 已删，它会把首行顶到导航栏下面（见第 5 节第 ③ 条规矩）。
- ⚠️ **页面标题整行不显示**（2026-10-11 新增，照 yinji.org/about.html）：
  front matter 写 `hideTitle: true`。理由：**导航里那项 About 已经在指示「你在哪一页」**，
  正文顶上再写一遍「关于」是冗余。标题只留在 `<title>`（「关于 | 胡拉图说」）和导航高亮里。
  实测（统一截图参数，量「导航文字下沿 → 正文首行文字上沿」）：
  **`/about/` 28.0px、`/now/` 28.5px、`/roll/` 28.0px** —— 三个无标题页完全一致，
  与 yinji 同值。`/privacy/`（未去标题，作对照）是 34.0px（多出的是 h1 那一行）。
  ⚠️ `/privacy/` 与 `/donate/` **仍然保留页面标题** —— 用户只点名了 About 和 Now。
  想统一：给那两页也加 `hideTitle: true` 即可（`/donate/` 的「支持」标题下面紧跟两个收款码，
  去不去掉是另一回事，改了要自己看一眼）。

### 收藏 `/roll/`（2026-10-11 照 yinji 改成平铺）

导航里的 `Links` 指向的就是这一页。**全站唯一的链接清单**（友链页 `/links/` 已删，301 到这里）。

形态**逐条照 yinji.org/roll**：

```
<title>收藏 | 胡拉图说</title>     ← 标题只在这里 + 导航高亮
[没有 h1]
这里是我常读、常逛的地方，还有几个我认识的朋友。…
想交换友链，写信给我。
• 花墨：一个很有设计感、很温暖的网站。
• Cytrogen：一个在美国上学的中国女孩，…
• …（共 14 条，一条平铺的 <ul>）
…更新中
```

- ⚠️ **页面标题整行不出现** —— front matter 的 `hideTitle: true`（与 `hideDate` 是两个开关）。
  yinji 的 `/roll/` 也没有 `<h1>`，标题只在 `<title>` 和导航高亮里。
- ⚠️ **一条平铺，没有分组小标题。** 2026-10-11 上午还是「## 朋友」+「## 博客聚合平台」
  两组，当天稍后用户要求照 yinji 改成平铺，两个 `##` 就删了。
  **分组信息现在只体现在顺序上**（前 3 条是朋友，后 11 条是聚合平台）。
  如果哪天想让这个区分重新显形，**别再加 `##` 小标题**（那会破坏平铺），
  在两组之间插一条不带文字的分隔即可。
- ⚠️ **别再拆回两页**（第 6 节），也**别把 14 条并成两栏**。
- 条目格式 `- [名称](地址)：一句话点评`，冒号后是作者自己写的点评。
  ⚠️ 列表项里不要在 `</a>` 和中文冒号之间手写空格（见第 5 节 `render-link.html`）。
- 结尾照 yinji 补了一行 `&hellip;更新中`。
- ✅ **两组之间有一条全宽虚线**（2026-10-11，**改了两次**）：

  | 版本 | 形态 | 用户的评价 |
  | --- | --- | --- |
  | ① 当天上午 | 40px 短横线（`.roll-break`，实线，样式写在站点层第 11 段） | — |
  | ② 当天稍晚 | **裸 `<hr>`** —— 与首页 `Hi!` / `Recent Posts:` 之间那条**完全同源** | 「我想要全宽、断裂的分割线，首页那一款」 |

  ② 现在的做法是 **一行 CSS 都不写**：`content/roll.md` 里就是一个裸 `<hr>`，
  走主题自带的 `hr { border: 0; border-top: 1px dashed }`。
  **实测**（2x 截图逐像素）：宽 **719.5px**（= body content 宽 720px，**与正文等宽**）、
  高 1px、虚线节奏 `dash 2.5px + gap 2.5px`（相邻暗像素间距恒为 `1,1,1,1,1,5`）。
  ⚠️ 别再给它加 class 或自定义宽度 —— 能靠现成元素做到，就别加新类名。
  想改观感就改主题的 `hr`（但那是全站的，首页那条也一起变）。
- ⚠️ **`<hr>` 会把这一页拆成两个 `<ul>`**（3 条朋友 + 11 条聚合站）——
  Goldmark 遇到裸 HTML 块元素就会封闭当前列表。这是**预期行为**：
  视觉上仍是一个连续列表，语义上也正好是两组（屏幕阅读器会说「列表，3 项」+「列表，11 项」）。
  ⚠️ 两个 `<ul>` 的 1em 外边距与 `hr` 的 0.5em 折叠后正好 **16px**，与首页那条相同 ——
  不需要再压边距（第一版压过，现在不必了）。
- `hideTitle: true` 现在**服务三个页面**（`/roll/` `/about/` `/now/`，见第 4 节）。

### 归档 `/archive/` 与周刊 `/weekly/`

两页都走「上游 `list.html` 的形态」：**搜索框 + 篇数 + 按年分组的列表**。

- `/weekly/` 用站点层 `layouts/_default/list.html`（上游那份的 5 处界面文案英译中 + 删标签墙）。
- `/archive/` 用 `layouts/_default/archive.html`（**站点层新增**，因为 `/archive/` 是普通内容页
  不是 section，上游没有对应模板）。内容 = `posts` + `weekly` 全部 125 篇，按年分组。
- ⚠️ **两页都没有页面级 `<h1>`**，与上游一致。
- ⚠️ **都没有分页**（上游不用 `.Paginate`）。`/weekly/page/1..3/` 与首页 `/page/*` 的旧地址
  在 `static/_redirects` 里 301 兜底。
- ⚠️ **都没有标签墙**（上游 `list.html` 底部会铺全部标签，本站 184 个，五屏蓝色链接）。
  用户在 2026-10-10 明确不要标签云，`/tags/` 索引页也一并 `disableKinds` 关掉
  （`/tags/xxx/` 词条页仍然生成，文章下方的标签链接照常可用）。

#### `/archive/` 顶部的「系列」入口（2026-10-11 新增，当天二次改版）

位置在「共 N 篇。」下面、文章列表上面。**一个系列 = 一行**：系列名（含篇数）在左，
该系列的篇目在右**横向铺开**，超宽自动换行。

```
居家流水账 4 篇   第一天　第三天　第四天　第五天
综述写作 5 篇     确定主题　文献管理　投喂文献（上）　投喂文献（下）　作图工程
跑步 12 篇        平价跑步装备(实用篇)　70 天后跑步 10 km，我还是喜欢跑步　…
```

- ⚠️ **没有分割线、没有折叠、没有箭头**（用户 2026-10-11 原话：「请不要有分割线等
  多余的设计，简单的设计成一个个系列，水平排布」）。
  第一版是「每个系列一个 `<details>`、默认收起、行间一条发丝线」，**已被否掉**；
  模板也从 `<details>/<summary>/<ol>` 换成了 `<div class="series-row">` +
  `<span class="series-name">` + `<span class="series-posts">`（`<a>` 直接铺，不套 `<li>`）。
  **别再退回折叠形态，也别把发丝线加回来。**
- 站里现有 **3 组 21 篇**：跑步 12 / 综述写作 5 / 居家流水账 4，靠 content 的
  `series:` 字段表达（**字符串，一篇只能属于一个系列**）。
- 数据用 `where $posts "Params.series" $name` + `.ByDate`（**升序 = 连载顺序**）。
  与文章页文末的「系列坐标带」**同一套口径**，所以两处算出的篇序号必然一致。
- 系列名旁边的标题前缀（「综述写作之-」「居家流水账-」）会剥掉，
  完整标题留在 `title` 属性里（悬停可见）。剥法与文章页那处一致。
- 系列名用 `min-width: 6em`（不是固定宽度）：三个名字长度不一
  （跑步 2 字 / 综述写作 4 字 / 居家流水账 5 字），给个下限让篇目基本对齐在同一条竖线上，
  更长的名字自动撑开、不会被裁。
- ⚠️ `.series-posts` 必须写 `min-width: 0`，否则 flex 子项默认 `min-width: auto`，
  长串会把行撑破。
- 样式在 `custom_head.html` 第 09 段（`.archive-series` / `.series-row` / `.series-name`
  / `.series-label-count` / `.series-posts`），**没有印章红**，只用正文色 + 三级灰。
- 横向铺开在窄屏的代价：最长的「跑步 12 篇」在 352px 内容宽下会折到 5~6 行，
  整块约 320px 高。**这是用户明确选的形态** —— 如果哪天觉得太高，
  正确做法是加回折叠，**不是**把发丝线加回来。

### 文章页

- **面包屑** + `<h1>` 标题 + 日期行 + 正文 + **标签行** + **文末两段导航** + 评论区 + 目录。
- ⚠️ **文末只有标签行，没有分类行**。2026-10-11 当天曾经短暂地加过一行
  `● 分类`（理由是「125 篇里 0 篇有分类链接，而 8 个分类词条页与 `categories` 字段都在」），
  用户当天就否掉了：「把我文章页底部的分类去掉」。
  **理由：分类的入口在页首面包屑的第三段**（`首页 / 收藏 / 工具`），
  文末再来一遍是重复；而**标签是文章页独有的**（面包屑里没有），所以只留标签。
  ⚠️ 想找分类入口看 `layouts/partials/breadcrumbs.html`，**别再加回文末那一行**。
- **标题行也可以整行藏掉**：front matter 写 `hideTitle: true`（站点层 `single.html` 识别）。
  目前**只有 `/roll/`** 用它 —— 那一页照 yinji.org/roll 做成一条平铺的收藏清单，
  页面上不出标题（标题只留在 `<title>` 和导航高亮里）。与 `hideDate` 是两个独立开关。
- **日期行可以单独藏掉**：front matter 写 `hideDate: true`（站点层 `single.html` 识别）。
  用在 `/about/`、`/now/`、`/roll/`、`/donate/` 这几个独立页 —— 它们挂一个「最后修改于某天」
  没有意义。⚠️ **`date` 字段本身别删**，RSS / og meta 还要用。
- 上游原本把标题和日期**写死给 `blog` 段**，导致 `/weekly/` 的 24 篇、`/about/`、`/privacy/`
  全都渲染成「没有标题没有日期的裸正文」。站点层去掉了这层条件。
- **代码块没有红绿灯、没有复制按钮** —— 上游只有 `pre code` 的底色和圆角。已删。

#### 代码块的语法配色（2026-10-11 **修复**，不是新增）

> 用户原话：「我的博客代码区域的色彩显示，阅读体验不太好」

**先说实话：改之前它不是「不好看」，是「看不见」。** 详见第 5 节第 12 段的完整成因。

```
改前（monokai 内联色 vs 主题强制的浅色底 #f2f4f7）
  普通标识符 #f8f8f2   对比度 1.03:1   ← 完全看不见
  函数名     #a6e22e   对比度 1.41:1   ← 完全看不见
  字符串     #e6db74   对比度 1.29:1   ← 完全看不见
  数字       #ae81ff   对比度 2.58:1   ← 几乎看不见
  关键字     #f92672   对比度 3.44:1   ← 勉强
  注释       #75715e   对比度 4.45:1   ← 勉强
```

改后**每一个 token 都在 WCAG AA（≥4.5:1）以上**，浅色 / 深色各一套（配色表见第 2 节「代码块配色」）。

- 底色**沿用** `--bg-color-secondary`，与行内 `code` 同一个底；两者靠 1px 边框区分，
  不靠换底 —— 这样代码块不会在页面里「打补丁」。
- **修法的关键在 `hugo.toml`，不在 CSS**：必须 `[markup.highlight] noClasses = false`
  让 Chroma 别再写内联样式，CSS 才够得着它。**改回 `true` 会立刻退化回「看不见」。**
- 配色在 `custom_head.html` 第 12 段，**只给含代码块的 5 个页面输出**。

实测（`/posts/2026/10/07/engineering-students-use-macbook/`）：像素采样确认底色 `#f2f4f7`，
字色分别是 `#0a3069`（字符串，最多）/ `#656d76`（注释）/ `#24292f`（标识符）/ `#cf222e`（关键字），
**内联 monokai 色 0 处残留**。

- **图片有 CSS-only 放大**（`imageZoom = true`）：点图弹近黑遮罩 + 右上角 ✕。
  纯 `:checked` 实现，没有 JS，也没有上一版那个带 `focus-trap` 的灯箱。

#### 面包屑（2026-10-11 新增，只有文章页有）

```
首页 / 文章 / 工具                    ← 普通文章（101 篇，3 段）
首页 / 周刊                          ← 周刊（24 篇，2 段）
────────────────────────────────────
# 工科研究生用 Mac，也可以很完美
```

用户最初的要求是「加上面包屑导航，使得更专业」；
当天稍后又补了一句「面包屑设计里，加入我的分类」—— 所以**第三段是分类**，
接下来这一节按「先讲为什么只给文章页挂、再讲三段各是什么」写。

**全站 327 页分四类，只有文章页真有层级**，所以只给它挂：

| 类型 | 页数 | 挂不挂 | 为什么 |
| --- | --- | --- | --- |
| 文章页 `/posts/年/月/日/slug/` | 125 | ✅ | 有层级：首页 → 文章/周刊 → 本篇 |
| 标签 / 分类词条页 | 192 | ❌ | 顶部已经有「筛选：Apple / 取消筛选」，再加面包屑是重复 |
| 首页、`/about/`、`/now/`、`/roll/`… | 9 | ❌ | 一级页面，**导航高亮已经指示位置**；「首页 / 关于」是纯冗余 |
| `/archive/` `/weekly/` 列表页 | 2 | ❌ | 同上（一级页面） |

⚠️ 第三类里的 `/roll/` `/about/` `/now/` 是**当天刚去掉页面标题的**。
在那三页顶上再加一行，会把它们重新垫高、把「正文首行距导航 28px」那个刚对齐的结果改掉。
**别顺手给它们加。**

**三段各是什么**：

| 段 | 文本 | 落点 | 说明 |
| --- | --- | --- | --- |
| 1 | 首页 | `/` | 固定 |
| 2 | **文章** / **周刊** | `/archive/` / `/weekly/` | 按 `type` 分：`posts`→文章（导航里那项 `Posts` 就是 `/archive/`）；`weekly`→周刊 |
| 3 | **分类名** | `/categories/<分类>/` | 取 `.GetTerms "categories"` 的**第一个** |

**第三段的两个判断**（都是实测过才这么写的）：

- ⚠️ **周刊刻意不加第三段**。周刊文章的 `categories` 就是 `["周刊"]`，
  与第二段的栏目名**一模一样** → 加了会变成「首页 / 周刊 / 周刊」。
  **这不是漏写，是「栏目名 == 分类名」时去重。**
  所以 24 篇周刊是 2 段、101 篇普通文章是 3 段（实测 `{3: 101, 2: 24}`）。
- ⚠️ **每篇只有一个分类**（实测 125 篇 / 8 个值 / **无多分类**），所以直接取第一个。
  万一以后出现多分类的文章，这里只会显示**第一个** —— 面包屑本来就只表达一条路径，
  多分类要全列出来是另一件事。
- 取分类用 `.GetTerms "categories"` 而不是 `.Params.categories`：
  前者给的是**词条页对象**（有 `.LinkTitle` 和 `.RelPermalink`），
  后者只有字面字符串，还得自己拼 URL。
- 8 个分类的词条页**都真实存在**（`/categories/思考/` 等），所以第三段一定点得进去。
  实测面包屑里出现的分类分布与内容层完全一致：
  思考 38 / 记录 17 / 工具 16 / 运动 11 / 学习科研 10 / 饮食 5 / 健康 4（**不含「周刊」**）。

**只显示「祖先」，不显示当前页标题** —— 这是与常规面包屑唯一的不同：

- 紧接着就是 `<h1>`，同一个标题连着写两遍是冗余；
- 本站标题偏长（「工科研究生用 Mac，也可以很完美」17 字），
  窄屏上最后一段必然折行，把这一行撑成两行。

⚠️ **SEO 那份不受影响**：JSON-LD 里是**完整的**（首页 / 文章 / 分类 / 当前文章，**4 段**；
周刊是 3 段）。视觉精简 + 数据完整，两者不冲突。
实测 125 页的 JSON-LD 全部能被 `json.loads` 解成 `BreadcrumbList` 对象，
`itemListElement` 长度 = 可见段数 + 1，且 `position` 从 1 连续。

**样式**（`custom_head.html` 第 13 段，挂在 `$longForm` 上）：
字号 `0.85rem`、颜色 `--text-color-tertiary`（**默认不抢眼**，悬停才变 `--link-color`）、
**无底色 / 无边框 / 无圆角**，分隔符 `/` 由 CSS 的 `li + li::before` 画 ——
与首页那行平台链接（`公众号 / 少数派 / …`）同一套写法，**别改成 `›` 或 `>`**。

**实测几何**（2x 截图按行统计暗像素）：

| 量 | 值 |
| --- | --- |
| 面包屑墨迹带（3 段：首页/文章/学习科研） | y 144.5 – 156.0，高 **11.5px**，横跨 x 143 → 299（宽 **156px**） |
| 导航底 → 面包屑顶 | **26.5px** |
| 面包屑底 → `<h1>` 顶 | **30.5px** |
| 周刊页（2 段） | y 144.5 – 156.0，横跨 x 143 → 213（宽 **70px**）—— 位置与 3 段完全相同 |
| **窄屏 420px 下** | y 144.0 – 156.0，高 **12.0px** —— 与宽屏的 11.5px 基本一致，**不折行** |
| 对照：`/roll/`（无面包屑）导航底 → 正文首行 | **28.0px**，未被影响 |

⚠️ 最长的组合是「首页 / 文章 / 学习科研」（4+2+4 字 + 2 个分隔符），
在 352px 内容宽下墨迹只有 149px，**离折行还有很大余量**。
新增分类后**总段数仍是 3**，宽度没有质的变化。

**实现要点**（细节全写在 `layouts/partials/breadcrumbs.html` 的注释里）：
- JSON-LD 与 `<nav>` 在**同一个 partial** —— JSON-LD 允许出现在 `<body>` 里，
  不必为了「规范」把它拆去 head 再算一遍层级。
- ⚠️ `<script type="application/ld+json">{{ $ld | jsonify | safeJS }}</script>`
  **三个坑**：① 不加 `safeJS` 整段 JSON 会被包成**带引号的 JS 字符串**（Schema.org 不认）；
  ② 中间**不能插任何别的过滤器**（它们把 `jsonify` 的 `template.HTML` 降级成普通 string，
  后面再加 `safeJS` 也救不回来）；③ `replace` **不能走管道**
  （Go 模板把管道值当**最后一个参数**，而 Hugo 的 `replace` 要它当**第一个**）。
  好在 `jsonify` 自己就会把 `<` `>` `&` 转义成 `\u003c` `\u003e` `\u0026`，
  所以**不需要**任何额外的 `</script>` 加固 —— 加了反而错。

#### 文末两段导航（2026-10-11 新增，只挂长文页）

顺序：标签行 → **① 系列坐标带** → **② 上一篇 / 下一篇** → 评论区。
先答「我在这组连载里的哪一篇」（纵向），再答「时间线上的前后邻居」（横向），最后才是评论。

**① 系列坐标带**（只有连载文章有，21 篇）

```
────────────────────────────────────────────  ← 发丝线
系列 · 综述写作                       第 2 / 5 篇
上一篇  1  确定主题
下一篇  3  投喂文献（上）
```

- 数据口径与 `/archive/` 的系列入口**完全一致**（同一个 `series` 字段 + `.ByDate` 升序），
  所以两处的「第 N / M 篇」必然一致。**改一处要回来对另一处。**
- ⚠️ 只有 `len $seriesGroup > 1` 才渲染 —— 单篇的「系列」是自相矛盾的。
- ⚠️ 系列内上下篇用 `index $seriesGroup (sub $seriesPos 2)` 求，
  **别用 `.NextInSection` / `.PrevInSection`** —— 那两个按 section 的全站日期序，
  会把系列之外的文章算成邻居。

**② 上一篇 / 下一篇**（全站 125 篇都有）

```
────────────────────────────────────────────  ← 发丝线（与上面那段相邻时去掉，见下）
上一篇                                    下一篇
综述写作之-确定主题        写给2025年12月考研的朋友
```

- 口径：`posts` + `weekly` 合起来按 `.ByDate.Reverse` 排一列，当前页下标 `i`，
  `i-1` → 更新的那篇（标「下一篇」）、`i+1` → 更早的那篇（标「上一篇」）。
  **即「上一篇 = 更早、下一篇 = 更晚」**，与系列带的上下篇方向一致
  （系列带也是 上一篇 = 升序里更靠前 = 更早）。两处方向必须一致，
  否则同一页里两个「上一篇」会指向相反的方向。
- ⚠️ **别用 `.PrevInSection` / `.NextInSection`**：那是 section 内的顺序，
  weekly 和 posts 会被割成两条线，周刊的邻居就丢了。
- ⚠️ 两列 `grid` 而不是 flex：`1fr 1fr` 让左右两栏宽度相等，长标题不会把另一条挤扁。
- 最新一篇没有「下一篇」、最早一篇没有「上一篇」—— 模板会补一个
  `.post-nav-empty` 空槽（`visibility: hidden`）占位，否则只剩一条时会掉到左边那列。
  实测只有 2 页有空槽（`personal-profile` / `engineering-students-use-macbook`）。
- ⚠️ **两段相邻时只有一条发丝线**：`.post-series + .post-nav` 把后一条的
  `border-top` 去掉、只留间距。连载文章两段都有，非连载文章只有 ②。
- 样式在 `custom_head.html` 第 09 / 10 段，**没有印章红**。
- ⚠️ 历史：文末「上一篇 / 下一篇」2026-10-05 曾整条删过一次（当时的理由是它和相关文章
  `if/else` 互斥、从没渲染过）。2026-10-11 用户要求加回来 —— 这次**和系列带并存**，
  不互斥。别再把它们做成二选一。

### 目录 TOC

- `position: fixed` 贴右侧栏（`left: calc((100vw + 720px) / 2)`），**≤800px 整块隐藏**。
- **默认完全隐形**：`.toc-nav a { color: transparent }`，不悬停只看得见一排灰色短横
  （`::before` 画的 16/12/8px 胶囊，按层级递减宽度、递增右间距）。
  悬停整块才显形，当前小节是 `--text-color-primary`。
- 这是**用户 2026-10-10 明确选的**「完全照搬：默认隐形」（试运行站里那版常显被否）。
  `custom_head.html` 第 06 段**刻意留空**并写明了这件事。
- 只有一篇文章**正文里有两个以上标题**时才值得挂；`toc: false` 可以逐页关掉。

### 评论区 giscus

- **只给长文页挂**：`and .IsPage (in (slice "posts" "weekly") .Type)`，且尊重单篇 `comments: false`。
  列表页 / 关于页 / 隐私页 / `/now/` `/roll/` 都不挂。
- **默认收起**，靠 `.is-open` 类切 `.giscus-body` 的 `max-height` + `visibility`
  —— **不是 `display: none`**，否则收起时 iframe 量到 0 高，点开就跳。
- **样式极简**（2026-10-11 用户要求「去掉框框」）：没有任何边框 / 底色 / 圆角，
  只剩加粗的**「评论」**二字 + 右边一个 `::after` 画的标记。
  ⚠️ 标记 2026-10-11 又改了一次：**从描边的 V 形折线换成实心三角**（用户要求）。
  画法是「0 宽高 + 三边框」的经典实心三角（左右透明撑宽、上边框实色撑高）→ ▼，
  展开时 `rotate(180deg)` 翻成 ▲。**与第 09 段的折叠箭头不是同一套画法，别互相抄。**
  ⚠️ `width` / `height` 必须写 0，给了尺寸就变成梯形。
  ⚠️ `minify` 会把 `border-top: 5px solid currentColor` 压成 `border-top:5px solid`
  （`currentColor` 是 border-color 的初始值，属可省略）—— 按压缩后写法 grep 会假阴性。
  ⚠️ 触控命中区靠 `.giscus-toggle` 自己的 `min-height: 44px` 达标，**不加 padding**
  —— 加了会把这一行撑高、推掉下面的排版。`::before` 空着，留给以后往外扩命中区。
  ⚠️ 类名 / ID 是和 `assets/js/giscus.js` 的契约（5 个 id + `.is-open` 类），改名要两边一起改；
  本次改版只动 CSS 与那层没用的 `.giscus-inner` 包装，**JS 一行未改**。
- `mapping = "pathname"`，所以**只要 URL 不变，老评论直接接上**（本次迁移 URL 未变，已验）。
- `giscus.js` 是**全站唯一的 JS 文件**（`assets/js/giscus.js`，指纹化成 `/js/giscus.min.<hash>.js`）。

### 页脚

照 yinji.org，四行，**全英文**（顺序是 2026-10-11 用户指定的）：

```
Made with Hugo Bear Neo.
Copyright © 2025-2026, hulatu.
Subscribe via RSS or just Say hello.                  ← 2026-10-11 从第 1 行挪到第 3 行
This site is licensed under CC BY-NC-SA 4.0 · Privacy · 🗺️ Sitemap.
```

- 上游把「版权」和「🗺️ Sitemap」挤在**同一行**，站点层补了一个 `<br>` 拆开。
- ⚠️ `copyright` 是文本节点输出，Go 的 `html/template` 会转义 `&` ——
  `hugo.toml` 里必须写**字面量 `©`**，写成 `&copy;` 会原样显示成 `&copy;` 六个字符。
- 四个开关：`hideRSSAndEmail` / `hideMadeWithLine` / `hideCopyright` / `hideSitemap`。

2026-10-11 用户改了四处（理由都留在 `layouts/partials/footer.html` 的注释里）：

1. **订阅行从第 1 行挪到第 3 行**（用户原话「第 1 行放到第 3-4 行之间」）——
   实现上只是把整块 `{{ if … hideRSSAndEmail … }}` 搬到版权块后面。
   ⚠️ **每块自带结尾的 `<br />`**（只有最后的授权行没有），搬动时别把 `<br />` 搬丢：
   少一个会让两行并成一行，而**构建 0 警告**，页面上只是「看着像少了点什么」。
2. **`say hello` → `Say hello`** —— 只改链接文字的首字母，其余一字未动。
3. **末行整句改英文**，并补上 **`Privacy` → `/privacy/`** 的链接。
   它原本在旧自建主题的页脚里（`<a href=/privacy/>隐私</a>`），迁移到上游页脚后
   一度**没了入口**（导航里没有它）。
4. **「CC BY-NC-SA 4.0」变成链接**，指向 `https://creativecommons.org/licenses/by-nc-sa/4.0/`。

⚠️ `copyrightNote` 走的是 `{{ . }}` **文本输出**，写 Markdown 链接不会生效 ——
所以 CC 那一段拆成三个参数：`copyrightNote` / `licenseName` / `licenseURL`。
⚠️ `Privacy` 挂在 `hideSitemap` 这个开关里面：关掉 Sitemap 会连它一起关
（它们本来就是同一行「站点元信息」，分开管没有意义）。

---

## 5. 站点层偏离（19 个文件，18 行）

| 文件 | 偏离 | 为什么 |
| --- | --- | --- |
| `layouts/_default/baseof.html` | ① `.Site.LanguageCode` → `.Site.Language.Locale`；② 补回 robots 分支 | ① 前者 Hugo 0.158 起弃用，将来移除会让整站构建失败；② 上游**完全没有** robots 输出，而本站有两类页面本来就该 noindex（见下） |
| `layouts/_default/single.html` | 去掉 `if eq .Type "blog"` 外层门槛；加 `hideDate` / `hideTitle`；加文末「系列坐标带」+「上一篇 / 下一篇」；加评论区 | 上游把标题日期写死给 `blog` 段；其余都是站点层新增（见第 4 节） |
| `layouts/_default/list.html` | 5 处界面文案英译中；删底部标签墙 | 上游文案写死英文、没走 i18n；用户不要标签云 |
| `layouts/_default/rss.xml` | 三处：① 补回 `<?xml-stylesheet?>`（指向 `/rss.xsl`）+ `xmlns:content`；② 首页 feed 改成**只收文章页**（`Type` ∈ `posts`/`weekly`）；③ 补 `atom:updated` / `category` / 摘要式 `description` / 全文 `content:encoded`，并存 `params.RSS.pageLimit` 上限（20） | ① 上游那份（= Hugo 内置模板）不带样式表引用 → 浏览器直接打开 `/index.xml` 只剩 raw XML（用户报「RSS 页面设计没了」）；② 迁移后新增的 `/about/` `/now/` `/roll/` `/privacy/` `/donate/` `/archive/` 都是 content 根下的普通页，会被一并收进订阅；③ 上游只发全文 `description`、没有「更新于」和分类 |
| `layouts/_default/archive.html` | **新增**（且比上游 `list.html` 多一段「系列」横向入口） | `/archive/` 是内容页不是 section，上游无对应模板 |
| `layouts/_default/_markup/render-link.html` | **新增**：`</a>` 后**不留换行** | 上游模板末尾多一个换行，行内链接后紧跟中文标点时会被折叠成一个空格（「花墨 ：点评」）。迁移后实测 **26 页 / 70 处**，其中 `/roll/` 一页 15 处。见下 |
| `layouts/index.html` | **新增**（且简介正文**不包 `<content>`**，与上游不同、与 yinji 一致） | 上游首页只有 `{{ .Content }}`，等于空页；`<content>` 那层见第 4 节「首页」 |
| `layouts/partials/nav.html` | 完全由 `[[menu.main]]` 驱动 | 上游把 `Home` / `Blog` 写死，和 `[menu]` 语义打架 |
| `layouts/partials/footer.html` | 版权独立成行；`Say hello` 大写；末行英文化 + `Privacy` 链接 + CC 带链接 | 上游版权和 Sitemap 挤一行，配置不出来；后三处是 2026-10-11 用户要求 |
| `layouts/partials/breadcrumbs.html` | **新增**：面包屑 `<nav>` + `BreadcrumbList` JSON-LD | 上游与 yinji 都没有面包屑；只给有层级的文章页挂（见第 4 节） |
| `layouts/partials/custom_head.html` | 19 段补丁样式 + GoatCounter（03 / 06 / 11 留空；08 / 15 按页输出；09+10 / 12 / 13 / 16 / 18 / 19 各只给一类页；14 / 17 全站） | 见下 |
| `layouts/404.html` | **新增** | 上游默认只有 `<h1>404</h1>` + 一行颜文字 |
| `layouts/_default/_markup/render-heading.html` | **新增**：标题末尾的 `#` 锚点 | 上游没有这个钩子（Goldmark 只给 id、不给可点入口） |
| `layouts/partials/orphan-safe.html` | **新增**：标题末 2 字包 `nowrap` | 中文标题的孤行问题（取回旧主题的做法） |
| `layouts/partials/back-top.html` | **新增**：返回顶部（只长文页） | 上游没有；**纯 CSS 滚动驱动动画，零 JS**。⚠️ 同日曾有过「阅读进度条」，已按用户要求删除 |
| `layouts/partials/code-copy.html` + `assets/js/code-copy.js` | **新增**：代码块复制按钮（只含代码的页） | 上游没有 |
| `layouts/partials/giscus.html` + `assets/js/giscus.js` | **新增** | 上游没有评论区 |

### ⚠️ `render-link.html` 那个换行（2026-10-11 修）

上游模板最后一行是 `<a {{ $attributes }}>{{ $text }}</a>` **加一个换行**，Hugo 原样写进产物；
行内链接后面紧跟中文标点时 HTML 把换行折叠成一个空格 → 渲染成「花墨 ：一个很有设计感的网站」。
**26 个页面、70 处**中招（`/roll/` 15 处）。对照 yinji.org/roll 的产物**没有**这个换行 ——
是上游模板的疏漏，不是设计。

站点层覆盖那份只在末尾加了 `{{- /* … */ -}}` 把空白吃掉，其余与上游逐字一致。
- 验收：`re.findall(r"</a>\n[，。：；！？、）」』》〈【（]", html)` 应为 **0**。
- ⚠️ 内容层**不要**在 `</a>` 和中文标点之间手写空格来「补」—— 源文件贴紧写就对了。

### 订阅源：两个 feed、只收文章页、以及「RSS 页面」长什么样（2026-10-11）

**全站只有两个 `.xml`**，靠 `hugo.toml` 的 `[outputs]` 把 section / taxonomy / term 都压回 HTML-only：

| 地址 | 内容 | 条数上限 |
| --- | --- | --- |
| `/index.xml` | **全站文章**（`posts` + `weekly`），导航最右那项和页脚 `Subscribe via RSS` 都指这儿 | 20 |
| `/weekly/index.xml` | **只有周刊**（`content/weekly/_index.md` 的 front matter 单独开了 `outputs: ["HTML","RSS"]`） | 20 |

`/posts/index.xml` **不存在**（`section = ["HTML"]`）—— 想知道「全站文章」看主源就够了。

**① 只收文章页。** 首页那一路的页面集合是
`where site.RegularPages "Type" "in" (slice "posts" "weekly")`。
`/about/` `/now/` `/roll/` `/privacy/` `/donate/` `/archive/` 都是 `content/` **根目录**下的
普通页，`Type` 是 `page`，一条都进不来。
⚠️ **不要改成按 `front matter` 的 `noindex` 过滤** —— `noindex` 表达的是「别让搜索引擎收录」，
与「要不要进订阅」是两件事（`/donate/` 恰好两者都占，但挡住它的是这里的 Type 白名单）。
⚠️ 周刊那一路走 `.RegularPages`（本 section 自己的页面），本来就是全文章，不用再过滤。

**② 「RSS 页面」靠 `static/rss.xsl` 渲染。** feed 是给订阅器吃的 RSS 2.0，
但浏览器直接打开 `/index.xml` 时会**按 feed 顶部那行**去取样式表：

```
<?xml-stylesheet type="text/xsl" href="https://hulatu.com/rss.xsl"?>
```

→ 渲染成「大标题 + 一句话简介 + 订阅源 · 共 N 篇 + 每篇标题/日期/摘要」的一页 HTML
（浅色 / 深色两套，`prefers-color-scheme` 跟随系统）。**少了这行，浏览器给的就是一片 raw XML。**
⚠️ 地址必须用 `site.BaseURL` 拼**绝对**地址。写成相对的 `rss.xsl`，在 `/weekly/index.xml`
那边会解析成 `/weekly/rss.xsl` → 404（`rss.xsl` 只放在站点根）。
⚠️ `rss.xsl` **只读 5 个字段**：`channel/title`、`channel/description`、
`item` 的 `title` / `link` / `pubDate` / `description`。改 feed 里的字段名要同步改它。
⚠️ 日期用的是 `substring(pubDate, 6, 11)` —— 依赖「`Mon, 02 Jan 2006`」这个 RFC-822 格式
（得到 `07 Oct 2026`），换日期格式会连带把它弄坏。

**③ 条目字段。** 除 `title` / `link` / `pubDate` / `guid` 外还发：

- `atom:updated`（`Lastmod`，RFC3339）—— 文章页有「更新于」靠 `scripts/sync-lastmod.py` 刷，
  feed 只有 `pubDate` 的话订阅端感知不到一篇被修订过。`Lastmod` 等于 `Date` 的也照发。
- `<category>` —— 分类与标签各来一遍（`rss.xsl` 不渲染它，是给订阅器/聚合站分类用的）。
- `<description>` = `.Summary | plainify | htmlUnescape`（**摘要**，纯文本）。
- `<content:encoded>` = `.Content | transform.XMLEscape | safeHTML`（**全文**，HTML 当文本带走）。
  ⚠️ 旧站这里还套过一个 `partials/formula.html` 把 `$$…$$` 换成 `<p class="formula">`，
  那个 partial 随自建主题删了，**别照抄那一行**（会直接构建失败）。

**④ `<lastBuildDate>` 用「最新一篇的 `Lastmod`」，不是构建时间。** 否则每天推送的
跑步数据 / 依赖同步这类不带新内容的构建，会让订阅端以为 feed 更新了。

⚠️ **Chromium 家族对 XSLT 弹横幅**（`This site uses XSLT; that functionality is being removed…`，
实测 Chromium 155 有）。**feed 本身不受影响** —— 订阅器根本不看 `<?xml-stylesheet?>`，
只有「浏览器直接打开」这一种用法有未来风险；Firefox / Safari 目前仍正常。
真要长期保底，就是把这一页改成一条 `_redirects` 规则指到一个真 HTML 页（尚未做）。

### ⚠️ robots / `noindex` 的现状（2026-10-11）

`baseof.html` 里恢复的条件与旧站**逐字相同**：

```
{{- $noindex := or (eq .Data.Plural "tags") (eq .Data.Plural "categories") (eq .Kind "404") (eq .Params.noindex true) -}}
```

生效范围实测 **196 页** = 184 个标签词条页 + 8 个分类词条页
+ `/privacy/` + `/posts/` + `/donate/` + `/404.html`，
与线上旧站口径一致（`curl` 逐页比对过；`/donate/` 是 2026-10-11 新加的一页）。

⚠️ **只恢复了 meta，没有恢复 `layouts/sitemap.xml`**（用户 2026-10-11 的选择）——
所以 `/privacy/`、`/posts/`、`/donate/` **仍然留在 sitemap 里**。爬虫读到 meta 不会收录，
但地址仍会先交给它一次。要彻底干净，得再加一份 sitemap 模板把 `not .Params.noindex` 排掉。

### `custom_head.html` 的 19 段

| 段 | 内容 | 生效范围 |
| --- | --- | --- |
| 01 | 中文字体栈（`--font-primary`，比 yinji 多挂三个跨平台回退） | 全站 |
| 02 | 正文标题上间距加大 | 全站 |
| 03 | **刻意留空**：关于页的头像已整块撤掉，这一节不再输出任何 CSS（段号保留） | — |
| 04 | `.recent-posts`（首页列表；`padding-left: 0` 对齐标题，几何值逐值照 yinji） | 全站（历史例外，见下） |
| 05 | `ul.blog-posts` 的日期列改按内容定宽（上游写死 80px，装不下 ISO 日期） | 全站 |
| 06 | **刻意留空**：TOC 不覆盖，保持上游「默认隐形」 | — |
| 07 | giscus 评论区样式（2026-10-11 简化：去掉所有框；标记换成**实心三角**） | 全站 |
| 08 | `.donate-*`（`/donate/` 的两个收款码） | **仅 `/donate/`** |
| 09 | `.post-series` + `.archive-series` / `.series-*`（系列坐标带 + 归档横向入口）<br>＋ **`.tag-index`**（归档页底部的全部标签平铺，2026-10-11 照 yinji 补回） | **长文页 + `/archive/`（126 页）** |
| 10 | `.post-nav` / `.post-nav-*`（文末上一篇 / 下一篇） | **长文页** |
| 11 | **刻意留空**：`/roll/` 两组之间的分隔线（第一版是 40px 短横线，现已改用**裸 `<hr>`** 走主题样式） | — |
| 12 | 代码高亮配色（浅 / 深两套 `--code-*` 变量 + `.highlight` 的那批 token 规则） | **仅含代码块的 5 页** |
| 13 | `.breadcrumbs`（面包屑；显示「首页 / 栏目 / 分类」） | **仅文章页（125 页）** |
| 14 | `content .nowrap` + `.table-wrap`（都是由「内容」决定出不出现的） | **全站**（见下：这类不能按页型守卫） |
| 19 | `.heading-anchor`（标题锚点 `#`；模板层也只在文章页输出它） | **仅长文页（125 页）** |
| 15 | `.notfound-*`（404 页两段结构） | **仅 404** |
| 16 | `.back-top`（返回顶部，含 reduced-motion 覆盖） | **仅长文页（125 页）** |
| 17 | `html { scroll-behavior: smooth }` + 其 reduced-motion 覆盖 | **全站** |
| 18 | `.code-copy`（代码块复制按钮） | **仅含代码块的页（5 页）** |
| — | 文件末尾：**GoatCounter**（上游 `baseof.html` 没有统计挂载点，只能挂这个钩子） | 全站 |

#### ⚠️ 第 12 段：为什么代码配色必须动 `hugo.toml`

这是本站少见的「**配置错、CSS 修不了**」的问题，值得完整记一次。

**症状**：用户报「代码区域的色彩显示，阅读体验不太好」。
实测发现不是审美问题 —— 解析出来是：

```
背景         #f2f4f7        ← 浅色（来自主题）
普通标识符   #f8f8f2  1.03:1  ← monokai 的近白色，看不见
字符串       #e6db74  1.29:1  ← monokai 的淡黄，看不见
数字         #ae81ff  2.58:1
关键字       #f92672  3.44:1
```

**成因（两套配色被缝在一起）**：

1. Hugo 的 `markup.highlight.noClasses` **默认是 `true`** → Chroma 把颜色写成**内联 style**：
   `<pre style="color:#f8f8f2;background-color:#272822">`（monokai = 深色主题）。
2. 主题 `style.html` 里有 `code { background-color: var(--bg-color-secondary) }` 和
   `div.highlight code { background-color: var(--bg-color-secondary) }` → 给代码块铺了**浅色**底。
3. `<code>` 铺满 `<pre>`，于是 **pre 的深色底被完全盖住**，只剩深色主题的**字色**留在浅色底上。

**为什么不能只改 CSS**：内联 style 的优先级高于任何选择器（除非 `!important`）。
所以修法必须是「先让 Chroma 别写内联色」：

```
① hugo.toml:  [markup.highlight] noClasses = false   → 输出 class="kn" 这类短类名
② 配色由第 12 段提供，浅 / 深两套跟随 prefers-color-scheme
```

**顺带丢掉的**：内联里的 `tab-size: 4` 也没了，第 12 段补上了 `pre.chroma { tab-size: 4 }` ——
不补的话制表符按浏览器默认 8 字符算，Python 代码的缩进会塌。

**守卫**：判据 `and .IsPage (strings.Contains .Content "class=\"highlight\"")`。
⚠️ 用 `.Content` 而不是 `.RawContent "```"` —— 后者抓不到 `{{< highlight >}}` 短代码。
⚠️ 那批类名（`.k` `.p` `.s` `.m` …）只有 1~2 个字母，**必须带 `.highlight` 前缀**，
裸写会误伤站点其他元素。
⚠️ 类名是和 Chroma 的契约，Hugo 升级后若 token 命名变了要回来看一眼。

#### 第 11 段：为什么现在是空的

`/roll/` 两组之间的分隔线**改了两版**，第二版一行 CSS 都不需要了：

| 版本 | 做法 | 用户的话 |
| --- | --- | --- |
| ① | 站点层写 `.roll-break { width: 2.5rem; … }` + `.RelPermalink` 守卫 | 「插一条不带文字的细分隔（不破坏平铺）」 |
| ② | **裸 `<hr>`**，走主题自带的 `hr { border: 0; border-top: 1px dashed }` | 「我想要全宽、断裂的分割线，首页那一款」 |

② 之后本节没有任何输出 —— **能靠一个现成元素做到，就别加新类名**。
详细实测（宽 719.5px、虚线节奏、两个 `<ul>` 的成因）见第 4 节「收藏 `/roll/`」。

⚠️ 02 段原本还有两条，**2026-10-11 都删了**：

1. `content { text-autospace: normal }`（「盘古之白」）—— 拿 `/roll/` 的产物做 A/B
   （同一份 HTML 只改这一条），`normal` / `auto` / `ideograph-alpha` / `no-autospace`
   四种取值**四张截图逐字节相同**（Chromium 155 = Helium 0.19.2.1）；
   而且 `normal` 本来就是该属性的**初始值**。**是死声明，删掉零视觉影响**，
   顺带与 yinji 对齐（它没有这条）。真要盘古之白，正确写法是
   `text-autospace: ideograph-alpha`，且需要一个真的实现了它的浏览器。
2. `content > :first-child { margin-top: 0 }` —— 见下面第 ③ 条规矩，
   它**只在一个页面上生效**（`/roll/`），而那个页面正是「首行贴住导航栏」的元凶。

#### 三条必须记住的规矩

**① 按页守卫（2026-10-11 起）** ——「类名只出现在**一个**页面上的规则，一律包进
`{{ if eq .RelPermalink … }}`」。目前**只剩 08 一段**（`/donate/`）。
03 与 11 曾经也是，但都已整段删除、只留注释（11 段是 `/roll/` 的分隔线，
改用裸 `<hr>` 后不再需要任何 CSS）。
- **09 + 10 一起包在 `{{ if or $longForm (eq .RelPermalink "/archive/") }}` 里** ——
  它们不是「一个页面」，而是「文章页 + 归档页」共 126 页；剩下 200 个页面
  （首页、`/about/`、`/now/`、`/roll/`、`/tags/*` …）一个字都不需要，白搭约 1.7 KB。
  守卫条件与模板里的挂载条件**一一对应**，改模板的挂载条件要回来改这里：
  `$longForm` → `single.html` 的文末两段（125 页）+ 第 00 段的守卫；
  `/archive/` → `archive.html` 的横向总览与底部标签平铺（1 页）。
- ⚠️⚠️ **守卫的选择器必须带作用域，别用裸元素选择器 —— 2026-10-11 栽过一次。**
  第 00 段（导航折行）最初写的是裸 `nav { display:flex }`。`nav` 是**元素选择器**，
  会命中全站每个 `<nav>`，而**一篇文章页上就有 5 个**：
  页头菜单 / `.breadcrumbs` / `.post-series` / `.post-nav` / `nav#TableOfContents`。
  第 09 段给 `.post-series` **只写了 margin/padding/border、从没写 `display`**，
  于是吃到了那条 `display:flex`：系列名与上下篇被当 flex 项**并排**（链接被推到 x=412，
  **右边空 208px**），TOC 的 `<ul>` 被撑到 224.8px、**溢出它 180px 的容器 92.8px**。
  `.post-nav` 侥幸没事，只因它自己写了 `display:grid`。
  **改成 `header nav` / `header nav a` 后全部复原。**
  **规矩**：在 `custom_head.html` 写元素选择器（`nav` / `a` / `img` / `table`…）之前，
  先数一遍「目标页面里有几个这个标签」；有第二个用途就必须加限定。
  ⚠️ 同理，**给一组选择器加 `display` 之前，先确认组里每个成员原本没有自己的 `display`** ——
  覆盖掉别人写的布局是最难查的一类回归（构建 0 警告、肉眼像「设计就是这样」）。
- 守卫用 `.RelPermalink` 而不是 front matter 开关：根目录独立页没有 `[permalinks]` 规则，
  URL 就是 `/about/`、`/donate/`，不会漂。万一改名，症状是**可见的**
  （两个码退回成上下大图），不会静默出错。
- **12 段是另一种守卫**：判据是「这一页有没有代码块」，用
  `and .IsPage (strings.Contains .Content "class=\"highlight\"")` ——
  327 页里只有 **5 页**命中，其余 322 页不白搭那约 1.7 KB。
  ⚠️ 别用 `strings.Contains .RawContent "```"`：那样抓不到 `{{< highlight >}}` 短代码写法。
- ⚠️ 04 的 `.recent-posts` 是**历史例外**：它也只在首页出现，却一直没包守卫。
  它很小且早于这条规矩，**故意不动它** —— 不为「统一」去改一段与需求无关的样式。

**② ⚠️ 样式块里的模板注释一旦「提前收尾」，会静默吞掉紧随其后的那条规则** ——
Go 模板注释里**绝对不能出现 C 风格注释的收尾符**（星号紧跟斜杠）。它会把注释提前收掉；
收尾符后面如果正好跟着右花括号对，**构建一句错误都不报**，但注释后半段会当成普通文字
输出到页面上。落在 `<style>` 里时，CSS 解析器会把这些文字当成下一个选择器的开头，
**紧跟其后的那条规则整条失效**。
2026-10-11 在本文件第 03 段踩过一次：正文里举了个例子（想说明样式块内的注释会被
minify 剥掉），结果把紧随其后的 `.recent-posts` 规则一起吞了，**首页列表缩进了约 40px**
（用户报的正是这个）。
- **验收不变式**：`<style>` 块里**不应该出现任何中文**。模板注释泄漏一定会带中文进来，
  所以「扫一遍全部产物的 `<style>`，看有没有中文字符」就能一次抓住这类问题。

**③ ⚠️ 「正文首元素去上边距」这类规则，先确认它在几个页面上真生效。**
02 段曾有一条 `content > :first-child { margin-top: 0 }`，注释写着「否则标题下方会多一截空白」。
2026-10-11 用户报「Links 页面的第一行，距离导航栏太近了，与 yinji 的并不一样」

- 它在**文章页上其实一直没起作用**：文章页 `<content>` 前面是日期行 `<p>`，
  日期行的 `margin-bottom: 16px` 与正文首段的 `margin-top` **相邻折叠**（取较大者）——
  `max(16, 16)` 和 `max(16, 0)` 都是 16px。所以有没有这条规则，文章页长得一样。
- 它真正生效的**只有同时去掉标题与日期的页**（当时是 `/roll/` 一个，
  2026-10-11 加入 `/about/` 与 `/now/` 后是**三个**）：这些页的 `<content>` 前面
  既没有 `<h1>` 也没有日期行，首段的 16px 上边距本来会和 `<main>` / `<header>`
  的 0 边距折叠穿透、给出呼吸；被这条规则归零后只剩行盒自身的空隙 ≈12.5px，
  **看着就是「贴住导航栏」**。

**实测**（2x 截图逐行取最暗像素，换算回 CSS px，量「导航文字下沿 → 正文首行文字上沿」；
⚠️ **三页必须在同一批截图里量**，`--window-size` 的高度不同会得出不同数字）：
- 有这条规则：**12.5px**；yinji 没有：**28.5px** —— 差的正是这 16px。
- 删掉之后：`/roll/` **28.0px**、`/about/` **28.0px**、`/now/` **28.5px**
  （对照：未去标题的 `/privacy/` 34.0px），**与 yinji 同值。别再把它加回来。**

- **教训**：一条「某处会多一截空白」的防御性规则，如果**只在极少数页面上真生效**，
  它就更可能是在**制造**问题而不是修复问题。改这类规则前先数清楚它命中几个页面
  （`grep` 类名 / 枚举挂载条件），别只看注释怎么写的。

**④ ⚠️⚠️ 守卫该按「页型」还是按「内容」—— 判据是问它由谁决定。**

2026-10-11 做标题锚点时踩了这个：我把 `.heading-anchor` 的样式包在
`{{ if $longForm }}`（只长文页）里，结果是
**`/about/` `/now/` `/privacy/` `/` 四页的 `<h1>` 旁裸露着一个 `#`** ——
它们不是长文页，但**正文里都有 h2**，所以 `render-heading.html` 照样输出了锚点，
而 `opacity: 0` 那条规则不在它们的 `<style>` 里，`#` 就以默认样式显示出来了。

- **有 h2** 由**内容**决定（正文写了就有）；**是不是文章页**由**目录结构**决定。**两件事。**
- **判据**：问一句「它会出现，是因为这一页**是**某种类型，还是因为这一页**写了**什么？」

⚠️ **但当天的最终解法不是「一律全站」—— 而是把类型判断上移到模板层。**
用户当天又两次反馈「非文章页面的 `#` 不要直接显示」，最终没有继续在 CSS 上打补丁：
`render-heading.html` 自己加了 `$longForm` 判断（**非文章页根本不输出 `#`**），
CSS 顺势收进第 19 段的 `{{ if $longForm }}` 守卫。于是：

| 元素 | 谁决定它出不出现 | 守卫方式 |
| --- | --- | --- |
| `content .nowrap`、`.table-wrap` | **作者在正文里写了什么** → 模板判断不了 | **全站输出** |
| `.heading-anchor`（标题锚点） | 本来也是内容决定，但**可以改成只看页型** —— 因为「要不要在非文章页给小节直链」本身就是个页面级决定 | **模板 + CSS 两边同判 `$longForm`** |
| 返回顶部 / 404 样式 / 面包屑 | **页面类型** | 按页型 / URL / Kind 守卫 |

⇒ **通则**：能被归成「页面级决定」的就上移到模板层去判断，**模板和 CSS 用同一个条件**
（两处不一致就会出现「HTML 有、CSS 没有」的裸露，或「CSS 有、HTML 没有」的白搭体积）；
剩下的「内容决定」的元素只能全站输出。

**验收哨兵**（这类故障在构建期**完全不报错**）：逐页做两向比对 ——
① 「HTML 里出现了某个类名」但「这一页的 `<style>` 里没有对应规则」→ **裸露**；
② 反过来，CSS 有规则但页面里不会出现该类名 → **白搭体积**。
①**必须为 0**；② 只会出现在「同判页型、但该页恰好没有该元素」的页面上
（例如 125 个长文页里只有 88 页有 h2/h3，剩下 37 页带着锚点 CSS 却用不到），属可接受。

```
for f in 全部产物:
    s = 读文件
    css = ''.join(re.findall(r'<style[^>]*>(.*?)</style>', s, re.S))
    若 ('<a class=heading-anchor' in s) 且 ('heading-anchor' not in css): 报错   # ① 必须 0
    若 class 名在 css 里但不在 s 里: 记账（②，看是否在预期内）
```

**⑤ ⚠️ 从旧主题搬一个组件回来时，要连它的 CSS 一起搬 —— 光有 HTML 标记是空转的。**
孤行保护的 `orphan-safe.html` 输出 `<span class="nowrap">`，
而**主题从没定义过 `.nowrap`**（实测 grep 为 0 处）。
所以「取回 partial + 接上 4 处模板调用」之后：构建 0 警告、产物里能看到 span、
**但换行位置一点没变** —— 它只是个普通行内元素。
补上 `content .nowrap { white-space: nowrap }` 才真正生效。
⇒ 凡是「搬回来的痕迹只体现在 HTML 里」的改动，都要额外问一句
**「它靠哪条 CSS 起作用？那条在不在？」**

#### 内联 CSS 体积（2026-10-11 第四轮实测）

`<style>` 全块按字节 + Python `gzip.compress(d, 9)` 口径：

| 页面 | raw / gzip | 页数 | 补丁大小 |
| --- | --- | --- | --- |
| 普通页（首页 / `/about/` / `/now/` / `/roll/` / `/weekly/` / 词条页…） | **7943 / 2389** | 199 | 1519 B |
| 长文页（125 篇）与 `/archive/` | **9595 / 2725** | 121 | 3171 B |
| **含代码块的页** | **11272 / 3109** | 5 | 4848 B |
| `/donate/` | **8369 / 2483** | 1 | 1945 B |

主题自己那块固定 **6424 B**（每页都有）。三档增量的来源：

- 长文页 / 归档页 **+1652 B** = 09 段（系列坐标带 + 归档横向入口）+ 10 段（上下篇）
- 含代码块的页 **+3329 B**（在长文页基础上再 +1677 B）= 12 段的 `--code-*` 变量与
  12 组 token 规则。这一档只有 5 页
- `/donate/` **+426 B** = 08 段的两个收款码

**注释不计入体积**（`minify` 会把 `<style>` 里的 CSS 注释全部剥掉），只有规则算数。

⚠️ 历史对照：2026-10-10 刚迁移时普通页是 **8142 / 2447**（补丁 1718 B）；
更早（撤头像之前）是 2046 B 补丁 / 8470 B 总计，其中 328 B 是上面第 ② 条说的**注释泄漏**。

---

## 6. 已删除的功能（2026-10-10，**别再提案**）

用户在第二轮明确选了「**完全照 Bear Neo，功能也删干净**」。下面每一条都写了删它的理由 ——
**如果哪天想加回来，先回答「它要解决的成本还在吗」**，成本没了就别加。

| 已删 | 原来解决什么 | 为什么现在不需要 |
| --- | --- | --- |
| 站内搜索面板（`search-index.json` + `/` 或 `⌘K`） | 334 页里找文章 | 上游有列表页的标题过滤（`postSearch`，当前开启），够用；全文索引要自带一份 JSON + 面板，代价远大于收益 |
| 深浅色手动切换按钮 | 想手动锁定主题 | 上游 `prefers-color-scheme` 完全跟随系统。**手动开关要记忆选择**（LocalStorage），而「跟随系统」是零配置的正确答案 |
| 图片灯箱（`lightbox.js` + focus-trap） | 看大图 | 上游有 CSS-only 的 `imageZoom`，零 JS |
| 书影音页 `/media/` + 豆瓣同步 | 记录读过的书、看过的影像 | ⚠️ **这是本次删除里影响最大的一条**：`sync-douban-media` 技能、`data/media.json`、`static/images/media/` 一起变成了孤儿。要恢复的话，得同时把页面模板和同步链路加回来（⚠️ 那三样**2026-10-11 已随清理删除**，从 git 历史取） |
| 结算页 `/stats/` | 字数、篇数、跑步里程 | 上游没有；`data/runs.json` 仍在（`profile.hulatu.com` 要用），只是本站不再展示 |
| 公式渲染（`formula.html`） | 数学公式 | 上游只有 Mermaid。文章里没有公式 |
| ~~阅读进度条~~ + 回到顶部 | 长文定位 | 上游没有。⚠️ **2026-10-11 两个都曾按「只挂长文页」取回**，但**当天用户就要求把进度条删掉**（「进度条不要，去掉」）—— 所以现在**只有返回顶部**，进度条已整段删除（HTML / CSS / keyframes / reduced-motion 覆盖全清）。**别再提进度条。** |
| 归档页的「按年索引」+「年 → 月」双层折叠 | 334 页里跳转 | 换成上游的「按年分组 + 搜索框」，用更少的控件做同一件事。⚠️ 其中**「系列胶囊」2026-10-11 以新形态回来了**（横向一行、无折叠无分隔线，见第 4 节），但**按年索引与月折叠仍然没有** |
| 页头头像（全站） | 品牌感 | 上游没有头像概念。副效应：页头比带头像时高约 32px，**有意** |
| 关于页正文头像（`/about/`） | 让介绍块好看一点 | 2026-10-11 先按「头像放右边」做成两栏，当天又被用户否掉（「算了，先把关于页的头像去除，不显示了」）。**至此全站一张头像都没有**。副效应：`static/images/avatar.webp` 变成孤儿 —— ⚠️ 该文件**2026-10-11 已随清理删除** |
| 友链页 `/links/` 独立成页 | 把「人」和「我逛的站」分成两份清单 | 2026-10-11 用户要求把 3 位朋友放进导航里那项 Links（`/roll/`）—— 于是两页并成一页，`/links/` 301 到 `/roll/`。**别再拆回去**。当天稍后 `/roll/` 又照 yinji 改成**一条平铺**（连分组小标题也去掉了） |
| `layout: "about"` / `"archive"` 等一页一模板 | 每页一种版式 | 上游只有 `single` / `list` 两个模板，站点层只给 `/archive/` 保留了一个 |

⚠️ **下面这些 2026-10-11 从「已删」里被用户点名拿了回来**，别再当死代码清掉：

| 拿回来的 | 现在的形态 |
| --- | --- |
| **系列**（`series:` 字段的出口） | 文章页文末「坐标带」+ `/archive/` 顶部横向入口（第 4 节），**两处同口径** |
| **文末「上一篇 / 下一篇」** | 全站 125 篇都有，与系列带**并存不互斥**（第 4 节） |

---

## 7. Do / Don't

### Do

- 改视觉先问「这是上游的东西还是站点层的？」—— 上游的东西去 `themes/` 改，改完在本文件第 5 节登记。
- 用 `hr` 就直接写 `<hr>`，它本来就是虚线。
- 加独立页时记得两个键：`hideDate: true`（不挂日期行）+ `toc: false`（短页面不挂目录）。
- 新增根级内容页 → 回 `static/_headers` 补一条 `Cache-Control`（这条规矩 2026-10-07 立）。
- 改完 CSS 重新量体积：从产物抽 `<style>` 按字节 + `gzip -9`（**Python 口径**，别混 CLI 口径）。
- 验证产物用 `/tmp` 目录 + `--cleanDestinationDir`：`hugo server` 开着会覆盖 `public/`。

### Don't

- **别在站点层叠规则去修上游的问题**。上一版自建主题就是这条路走到 6 个 CSS 模块、
  一层覆盖一层，最后没人能说清某个值是从哪来的。
- 别引入 `--space-*` / `--radius-*` / `--shadow-*` / `--font-serif` / `--font-meta` —— 这些令牌**不存在**了。
- 别给列表页加页面级 `<h1>`（上游没有，全站唯一的 h1 是页头站名）。想加也行，但要一次改两处模板并登记。
- 别把链接拆成两页（`/roll/` 收藏 + `/links/` 友链）—— 2026-10-11 已合并成一页，
  拆开就是「两份清单互不重叠」那套说法，用户已经否掉了。
- 别把 `&copy;` 写进 `hugo.toml` 的 `copyright`，会被转义成字面量。
- **别在 Go 模板注释里写 C 风格注释的收尾符**（星号紧跟斜杠）。它会把注释提前收掉，
  后半段当普通文字输出到页面上；落在 `<style>` 里时还会**吞掉紧随其后的那条 CSS 规则**，
  而**构建 0 警告**。2026-10-11 因此让首页列表缩进了 40px（见第 5 节末尾）。
- 别在 `<style>` 里塞任何会输出中文的东西 —— 中文字符出现在样式块里就是「注释泄漏」的信号。
- 别为了「以后可能用」把 `/img/*`、`/css/*` 这类匹配不到文件的 `_headers` 规则加回来。

---

## 8. 已知缺口

1. **⚠️ 125 张「每篇一张」的分享卡片图变成了孤儿**（这条最值得优先决定）。
   自建主题的 `head-meta.html` 会按 slug 拼 `images/og/<slug>.png` 输出 `og:image`；
   上游 `seo_tags.html` 走 Hugo 内置的 `_internal/opengraph.html`，
   只认 front matter 的 `images` / `hugo.toml` 的 `params.images` ——
   于是现在**每一页的 `og:image` 都是同一张 `images/share.webp`**，
   `static/images/og/` 下那 125 个文件（每个内容页一张）没有任何模板引用。
   要恢复：在站点层加一份 `layouts/partials/seo_tags.html`（上游那份 + 一段按 slug 取图的
   `og:image` 覆盖），代价是站点层覆盖文件从 12 个变成 13 个，
   且以后要跟上游同步这一个 partial。**先没做，等用户拍板。**
   ⚠️ **2026-10-11 更新**：用户要求把旧东西清干净，那 125 张 `static/images/og/*.png`
   与生成脚本 `scripts/gen-og.js` **已一并删除**。所以要恢复的话不只是加模板 ——
   还得先从 git 历史取回 `gen-og.js` 重跑一遍图片
   （`git log --diff-filter=D --name-only -- scripts/gen-og.js` 能定位到删除那次提交）。
2. ~~**`/media/` 的删除留下了孤儿链路**~~ → **2026-10-11 已删除**
   （`scripts/sync-douban.py`、`data/media.json`、`static/images/media/`）。
   ⚠️ **唯一还没处理的是** `sites/profile/data/profile.json` 里的 `media_recent`
   和「书影音」导览项 —— 它们仍指向一个不存在的页面。**要不要恢复 `/media/` 是用户的决定。**
3. ~~**`scripts/fetch-image-dims.py` 已经不起作用**~~ → **2026-10-11 已删除**
   （脚本 + `data/image_dims.json` + `publish.sh` 里的调用）。
   ⚠️ 顺带实测确认：这条**本来也不构成实际问题** —— 三个图片最多的页面 CLS 是
   **0 / 0 / 0.0087**（唯一那 0.0087 的贡献源还是 `p` / `h2`，不是图片）。
   所以别照旧说法去「补回宽高」。
4. **`scripts/sync-lastmod.py` 也不再有可见产出**：它刷 front matter 的 `lastmod`，
   而自建主题的「更新于」那一行随迁移删除了。`lastmod` 现在只喂 RSS / sitemap。
5. ~~**`scripts/css-critical-coverage.py` 已作废**~~ → **2026-10-11 已删除**。
6. ~~`admin/` 面板里的「系列 series」输入框没人读~~ —— **2026-10-11 已解决**：
   `series` 重新有了两个出口（文章页文末的坐标带 + `/archive/` 顶部的横向入口），
   `admin/` 里那个输入框现在是**有效的**。⚠️ 它仍应保持**字符串**语义（一篇只能属于一个系列），
   别改成数组。
7. **列表页没有页面级 h1**（见第 4 节），SEO / 无障碍上是个小缺口，是有意接受上游行为的代价。
8. **深色主题下正文图片的描边**用的是 `--border-color`（`#30363d`），在 `#121212` 上几乎看不见 ——
   上游如此，未改。
9. ~~`static/images/avatar.webp` 又变回孤儿文件~~ → **2026-10-11 已删除**。
   同目录的 `static/images/donate/` 两张赞赏码**仍在用**（`/donate/` 页），**别再当死资源删**。
10. **`/privacy/` 与 `/posts/` 仍然留在 sitemap 里**：2026-10-11 只恢复了 robots meta
   （三页已正确输出 `noindex, follow`，覆盖 196 页），**没有**恢复旧站的 `layouts/sitemap.xml`
   —— 那是用户当时的选择。爬虫读到 meta 不会收录，但地址仍会先交给它一次。
   要彻底干净，得再加一份 sitemap 模板把 `not .Params.noindex` 排掉。

---
version: alpha
name: hulatu-design-system
description: >
  「胡拉图说」的设计系统 —— 一份把 Bear Blog / hugo-bearneo 的极简血统，
  与「纸账 + 印章」这套中文个人博客身份揉在一起的设计参考。锚点是：冷白纸画布、
  单一印章红、衬线标题 + 等宽元信息、发丝线（hairline）承担层级而不用投影、
  圆角收在 10–12px。整站读起来应该像一本有人偶尔盖了个章的账本，而不是一个套了
  卡片的 App。这份文档供 AI 编码助手在改模板 / CSS 时对齐视觉语言使用。

colors:
  # ── 浅色：冷白纸 ─────────────────────────────
  paper: "#f6f6f8"           # 页面底色（画布）
  surface: "#ffffff"         # 极少数需要"抬起"的表面：搜索面板 / 浮层
  surface-2: "#ececf1"       # 行悬停底 / 计数徽章底
  ink: "#1d1d1f"             # 标题与正文
  ink-soft: "#3f3f45"        # 次级正文 / 页面说明
  muted: "#56565c"           # 元信息 / 说明文字
  line: "#e4e4e9"            # 发丝分隔线（默认层级手段）
  line-strong: "#d3d3da"     # 输入框 / 强调分隔线

  # ── 印章红：唯一的结构性强调色 ────────────────
  accent: "#c73e2f"          # 印章红。链接悬停 / 激活 / 焦点环 / 签名时刻
  accent-ink: "#a83226"      # 印泥底上可读的红（对比度 ≥ 5.7:1）
  accent-soft: "#fbeae7"     # 印泥淡痕：极淡的红底
  on-accent: "#fff8f5"       # 红底上的字

  # ── 深色：墨染夜色 ───────────────────────────
  dark-paper: "#0b0b10"
  dark-surface: "#1c1c1f"
  dark-surface-2: "#2a2a2f"
  dark-ink: "#f5f5f7"
  dark-ink-soft: "#c9c9ce"
  dark-muted: "#a1a1a8"
  dark-line: "#2c2c31"
  dark-line-strong: "#3a3a40"
  dark-accent: "#ef7b64"
  dark-accent-ink: "#ff9a86"
  dark-accent-soft: "#3a1e1a"
  dark-on-accent: "#250d08"

typography:
  # 注意：下面这几条是 2026-10-05 从 assets/css/critical.css:222-237 **逐字抄回来**的完整回退链。
  # 此前这里是缩写版（衬线漏了 "Noto Serif CJK SC" / "STSong" / "SimSun" / "Times New Roman"，
  # 无衬线漏了 "Segoe UI" / "Hiragino Sans GB" / "Helvetica Neue" / Arial，等宽漏了后两个中文族），
  # 而这份文档是给 AI 读的 token 源 —— 栈短了会让后来者写出另一条回退链。
  # 衬线栈的**顺序有意义**：前三个都是思源 / Noto 系，本机都没装才会一路落到 Songti SC；
  # 把 Songti SC 写到最前面，在装了思源的机器上就会抢走优先级。改 CSS 时记得回来同步。
  font-serif:
    fontFamily: '"Source Han Serif SC", "Noto Serif SC", "Noto Serif CJK SC", "Songti SC", "STSong", "SimSun", Georgia, "Times New Roman", serif'
    use: 站点名 / 页标题 / 文章标题 / 卡片标题
  font-sans:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif'
    use: 正文 / 导航 / 按钮 / 说明
  font-meta:
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", monospace'
    use: 日期 / 字数 / 期号等以数字为主的元信息（等宽 → 列表里日期成列不抖）
  font-mono:
    fontFamily: 'ui-monospace, "SF Mono", "SFMono-Regular", "Cascadia Code", Menlo, Consolas, "Liberation Mono", monospace'
    use: 代码块与行内代码。**和 font-meta 是两个 token，别合并** —— critical.css 的注释写明「两者的演进方向不同：--font-mono 将来可能换成要下载的编程字体，元信息不该跟着变重」

  # 字号尺度：16px 基准 × 1.2；正文单独一档 17px
  text-2xs: 0.72rem
  text-xs: 0.86rem
  text-sm: 1rem
  text-md: 1.2rem
  text-lg: 1.44rem
  text-xl: 1.73rem
  text-2xl: 2.07rem
  text-reading: 1.0625rem        # 正文 17px

  # 文章排版
  reading-leading: 1.8
  block-gap: 2rem                # 段间距（手机 1.5rem）
  post-title-size: 2.375rem      # 38px（手机 1.75rem）
  h2-size: 2rem                  # 32px（手机 1.5rem）
  h3-size: 1.5rem                # 24px（手机 1.25rem）
  tracking-title: 0.02em
  tracking-label: 0.06em
  tracking-num: 0.04em

rounded:
  row: 10px
  base: 12px
  card: 12px
  pill: 999px

spacing:
  # 4px 步进
  s1: 0.25rem
  s2: 0.5rem
  s3: 0.75rem
  s4: 1rem
  s5: 1.25rem
  s6: 1.5rem
  s8: 2rem
  s10: 2.5rem
  s12: 3rem
  s14: 3.5rem

layout:
  content-width: 680px           # 正文与页头共用，左右边缘严丝合缝
  gutter: "clamp(20px, 5vw, 32px)"
  header-height: 68px
  anchor-offset: "calc(var(--header-h) + 0.75rem)"

components:
  site-header:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    height: "{layout.header-height}"
    borderBottom: "1px solid {colors.line}"   # 滚动后出现
    note: "纸底 + 滚动时一条发丝线。不靠毛玻璃。"
  site-brand:
    typography: "{typography.font-serif}"
    textColor: "{colors.ink}"
    hover: "{colors.accent}"
  nav-link:
    typography: "{typography.font-sans}"
    textColor: "{colors.muted}"
    activeTextColor: "{colors.ink}"
    activeIndicator: "2px {colors.accent} 短下划线"
  post-list:
    backgroundColor: transparent
    borderTop: "1px solid {colors.line}"
    note: "不再是一张白卡。列表直接落在纸上，行与行用发丝线分。"
  post-row:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    borderBottom: "1px solid {colors.line}"
    padding: "var(--space-3) 0"
    hoverTextColor: "{colors.accent}"
    hoverBackground: none
    note: "悬停只改标题色，不做整行位移 + 底色块。三种列表行（post-row / minimal-row / archive-item）共用同一套节奏：padding var(--space-3) 0 + line-height 1.5 + 字号 text-sm → 单行 48px。"
  post-row-title:
    typography: "{typography.font-serif}"
    fontSize: "{typography.text-sm}"
  post-row-date:
    typography: "{typography.font-meta}"
    textColor: "{colors.muted}"
  tag-chip:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    borderColor: "{colors.line}"
    rounded: "{rounded.pill}"
    hoverTextColor: "{colors.accent}"
    hoverBorderColor: "color-mix(in srgb, {colors.accent} 45%, {colors.line})"
    hoverShadow: none   # 全站 hover 不带影 —— 见 Elevation「阴影只给浮层」
  post-cat-chip:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
  article-image:
    rounded: "{rounded.row}"
    border: "1px solid {colors.line}"
    captionTypography: "{typography.text-xs}"
    captionColor: "{colors.muted}"
  article-link:
    textColor: "{colors.accent-ink}"
    decoration: "underline, offset 2px, thickness 1px"
  code-block:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    border: "1px solid {colors.line}"
  toc-rail:
    textColor: "{colors.muted}"
    activeTextColor: "{colors.accent}"
    activeIndicator: "2px {colors.accent} 左竖线"
  donate:
    triggerBackground: "{colors.surface}"
    triggerTextColor: "{colors.ink-soft}"
    triggerBorder: "1px solid {colors.line}"
    rounded: "{rounded.pill}"
    note: "触发器是「可选动作」不是主 CTA，走中性的描边四态（与 tag-chip 同一套，无影）；节标题前那颗小菱形已改中性线色，这一页的红只留角色行前的小点与行内链接。"
  media-card:
    backgroundColor: "{colors.paper}"
    border: "1px solid {colors.line}"
    rounded: "{rounded.row}"
    note: "书影音卡片保留 ±1.2° 的轻微旋转 —— 这是全站唯一的装饰性'贴纸'，只做点缀，不承担结构。"
  overlay:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.line}"
    rounded: "{rounded.card}"
    shadow: "0 24px 64px rgba(0,0,0,0.13)"   # 阴影只留给真正的浮层
  footer:
    textColor: "{colors.muted}"
    borderTop: "1px solid {colors.line}"
    typography: "{typography.text-xs}"
---

## Overview

「胡拉图说」是一本**中文个人博客**，它的设计身份来自一个具体比喻：**纸账 + 印章**。浅色是冷白纸（`{colors.paper}`），深色是墨染夜色（`{colors.dark-paper}`），全站只有一个强调色 —— 印章红（`{colors.accent}`），像盖在账本角落的一枚章。标题用衬线（`{typography.font-serif}`）承担叙事，正文用系统无衬线承担阅读，而以数字为主的元信息（日期、字数、期号）交给等宽字体（`{typography.font-meta}`），让列表里的日期天然成列、扫视时不左右抖。

这份系统的血统里有一段很明确：它借鉴了 [Bear Blog](https://bearblog.dev) 与它的 Hugo 移植 [hugo-bearneo](https://github.com/rokcso/hugo-bearneo) —— **极简、文本优先、不啰嗦、快**。Bear 的精神是「纸 + 字」，几乎不用容器去框内容。

但本站在实现过程中，装饰性容器（白色卡片、投影、大圆角、页头毛玻璃）一度盖过了「纸」本身。**这份文档的立场是：让纸和线赢，别让卡片和玻璃赢。** 因为「纸账」这个比喻本来就指向 Bear Blog 的克制 —— 一本账本没有投影，只有横线和墨。

设计目标按优先级排列：

1. **文本优先。** 正文永远是主角。任何容器、装饰、动效都不许和正文抢注意力。
2. **层级靠线，不靠影。** 用 `{colors.line}` 发丝线和表面色的深浅差表达层级；投影只留给真正浮在页面之上的东西（搜索面板、灯箱、移动端菜单）。
3. **一个强调色，且用得稀缺。** 印章红只在「可交互 / 当前状态 / 一个签名时刻」出现。稀缺才有力量。
4. **圆角收在 10–12px。** 22px 的大圆角读起来像「App」，不像「博客」。
5. **快是设计的一部分。** 关键 CSS 内联、零阻塞渲染、不加载外部字体，这些不是工程细节，是这套审美的一部分 —— Bear Blog 的「super-fast」就是它的长相。

## 设计谱系（和 Bear Blog / bearneo 的关系）

| 维度 | Bear Blog / bearneo | 本站（目标状态） |
|---|---|---|
| 画布 | 纯色，近乎无装饰 | 冷白纸 `{colors.paper}` / 墨夜 `{colors.dark-paper}` |
| 容器 | 几乎没有卡片，内容直接铺在页面上 | **收敛掉装饰卡**，列表落在纸上，发丝线分行 |
| 层级 | 靠留白与字号 | 留白 + 字号 + 发丝线 |
| 强调色 | 极少 | 一个印章红，稀缺使用 |
| 字体 | 系统栈，不下载字体 | 衬线标题 + 无衬线正文 + 等宽元信息（不下载字体） |
| 功能 | 上赞 / 搜索 / 年份分组 / 目录 / 图放大 / 外链处理 | 搜索 / 目录双形态 / 灯箱 / 年份归档 / 外链 ↗ / 周刊 / 打赏（仅关于页）/ 评论 |
| 深色 | 有 | 「墨染夜色」，有 |

**和 bearneo 的差异是有意保留的：** 本站比 Bear Blog 多一份「编辑感」—— 衬线标题、等宽元信息、印章红，这些是身份，不该为了极简而抹掉。要收敛的只是**容器与装饰**，不是**声音**。

## Colors

### 品牌与强调
- **印章红**（`{colors.accent}` — `#c73e2f`）：全站唯一的结构性强调色。用于链接悬停、当前状态、焦点环、主按钮、以及一个「签名时刻」（见 Components）。
- **印泥淡痕**（`{colors.accent-soft}` — `#fbeae7`）：极淡的红底，用于分类胶囊、搜索高亮、选中态。它是「盖过章留下的痕」，不是第二种颜色。
- **印泥红字**（`{colors.accent-ink}` — `#a83226`）：当红字要压在印泥淡痕上时用它，保证小字对比度 ≥ 5.7:1。**不要**在淡红底上直接用 `{colors.accent}`（只有 4.33:1，不过 AA）。

### 表面
- **纸**（`{colors.paper}` — `#f6f6f8`）：页面画布，也是默认表面。**大多数内容直接坐在纸上。**
- **浮层白**（`{colors.surface}` — `#ffffff`）：只给真正"抬起"的表面 —— 搜索面板、灯箱控制、移动端下拉菜单。日常卡片不该用它。
- **纸背**（`{colors.surface-2}` — `#ececf1`）：行悬停底、计数徽章底、代码块底。
- **发丝线**（`{colors.line}` — `#e4e4e9`）：默认的层级手段。分隔、描边、输入框边界都靠它。
- **强线**（`{colors.line-strong}` — `#d3d3da`）：需要更明确边界时（输入框、强调分隔）。

### 文字
- **墨**（`{colors.ink}` — `#1d1d1f`）：标题与正文。
- **淡墨**（`{colors.ink-soft}` — `#3f3f45`）：页面说明、次级正文。
- **灰**（`{colors.muted}` — `#56565c`）：元信息、说明文字、页脚。

### 深色
深色不是「反色」，是「墨染夜色」：纸变成近黑的蓝调 `{colors.dark-paper}`，印章红提亮为 `{colors.dark-accent}`（深底上纯红会发闷）。深色下**只需要重写颜色**，四态、间距、圆角全部复用。

## Typography

### 三个字体，三种角色
1. **衬线**（`{typography.font-serif}`）—— 站点名、页标题、文章标题、卡片标题。**衬线负责"叙事"**：它是本站编辑感的来源。
2. **无衬线**（`{typography.font-sans}`）—— 正文、导航、按钮、说明。**无衬线负责"阅读与结构"**。
3. **等宽**（`{typography.font-meta}`）—— 日期、字数、期号。**等宽负责"元信息"**，让数字成列。

   > 代码块另有一个 token：`{typography.font-mono}`（2026-10-05 补登记，此前漏在文档外）。
   > 它和 `font-meta` **刻意分开**：`--font-mono` 将来可能换成要下载的编程字体，
   > 而元信息不该跟着变重 —— 理由写在 `critical.css` 的注释里。别把两者合并成一个。

> 这三条分工是从 [Wired 的编辑系统](https://getdesign.md) 借来的：*serif for narrative, sans for structure, mono for taxonomy*。不要跨界 —— 标题不要用无衬线，正文不要用等宽。

### 层级

| 用途 | 字号 | 字重 | 行高 | 字体 |
|---|---|---|---|---|
| 文章标题 | `{typography.post-title-size}` 38px | 500 | 1.45 | 衬线 |
| H2 | `{typography.h2-size}` 32px | 500 | 1.4 | 衬线 |
| H3 | `{typography.h3-size}` 24px | 500 | 1.4 | 衬线 |
| H4 | `{typography.text-reading}` 17px（与正文同号） | 700 | 1.4 | 衬线 |
| 正文 | `{typography.text-reading}` 17px | 400 | 1.8 | 无衬线 |
| 列表标题 | `{typography.text-sm}` 16px | 400–700 | 1.5 | 衬线 |
| 元信息 | `{typography.text-xs}` ≈13.8px | 400 | 1.6 | 等宽 |
| 角标 | `{typography.text-2xs}` ≈11.5px | 400 | 1.6 | 无衬线 |

> **「字重」这一列是「请求值」，不是「渲染值」。** 衬线栈在 macOS 落到 **Songti SC，只有 400 / 700 两档**，所以表里的 `500` 会解析成 **400 Regular**。目前实际渲染：文章标题 = 400、H2 = 400、H3 = 400（三者都请求 `500`；文章标题 2026-10-02 补、H2/H3 2026-10-04 补）；**H4 请求并渲染 `700`** —— 它和正文同号，唯一能区分层级的就是字重，一旦也跟着降到 500 就会和正文一模一样。换到有 Medium 的字体（如思源宋体）时，前三个 `500` 会自己落到 Medium，H4 仍是 700。

### 原则
- **正文行高 1.8**，段间距 `{typography.block-gap}` 2rem。中文密排需要这个呼吸，别为了"紧凑"压到 1.6。
- **中文标题只给一点点字距**（`{typography.tracking-title}` 0.02em）。拉丁式的大字距套在汉字上会散架。
- **文章标题不做 `text-wrap: balance`**（2026-10-02）。`.post-title` 必须写死 `text-wrap: wrap`，让它排到最右再自然换行。`balance` 按「各行的字符数尽量相等」去排，标题一多行，第一行就必然停在半途、右边空一大块 —— 它治的是英文标题的孤词，代价却是**每一条**多行标题都短一截。同理也别引入 `text-wrap: pretty`：Text Module Level 4 这批特性（`pretty` / `balance` / `hyphens` / `line-break`）的设计目标几乎都是英文场景，在中文里反而会让行「提前换行」，正是同一个症状。这条规则留在**内联的关键 CSS** 里，不能挪去异步包：标题在文章页首屏，异步包到达后重排会让换行位置当场跳一下。
- **不下载外部字体。** 用系统栈。这既是性能，也是审美（Bear Blog 的轻）。
- 元信息里的汉字（「发布于」「字」「篇」）要显式接回无衬线栈，不要让系统按 monospace 去猜中文 —— 否则 macOS 和 Windows 会各猜一套。

## Layout

### 间距
- **4px 步进**：`{spacing.s1}` 4px · `{spacing.s2}` 8px · `{spacing.s3}` 12px · `{spacing.s4}` 16px · `{spacing.s6}` 24px · `{spacing.s8}` 32px · `{spacing.s10}` 40px · `{spacing.s12}` 48px。
- 段间距 `{typography.block-gap}` 2rem；H2 上间距 = 段距 + 24px，H3 上间距 = 段距 + 16px。

### 栅格与容器
- **正文与页头共用 `{layout.content-width}` 680px**，内边距留在外层（`{layout.gutter}`）。这样导航栏和正文的左右边缘严丝合缝。
- 只有组件自己的内层宽度才特意更窄（404 文案 24em 之类）。**打赏盒原先还有一条 `max-width: 30rem`** —— 2026-10-02 第四轮把它收进关于页的 `.about-section` 之后删掉了：它不再是「挂在卡片外面的特例」，宽度交给页面结构。
- 文章页在 ≥1152px 时，目录从正文中段移到右侧刻度栏（`toc-rail`）；更窄时排回正文开头。

### 响应式
- **≤760px**：正文降一档（17→15px）、H2/H3 各降一档、页头收成 logo + 图标 + 汉堡下拉。
- **≤600px**：页脚由横排转竖排居中。
- 断点只有**三档**：**1152 / 760 / 600**，不追设备型号。1152 是「侧边目录放不放得下」的阈值
  （2026-09-29 从 1280 降下来，见上一条），760 / 600 是移动端的两级微调。
  注意 1152 那一档在 `critical-post.css` 里是**成对**的：一条 `min-width: 1152px`
  + 文件末尾两条 `max-width: 1151.98px`（一条藏刻度栏、一条显示 `.post-toc-inline`）
  + `single.html` 里的说明注释，**改一处必须四处同改**。
  （原文写「只设两个（760 / 600）」，2026-10-05 修正 —— 它和本文档上一条、以及
  `MAINTENANCE.md` 的「响应式断点速查」都对不上。）

## Elevation & Depth

| 层级 | 手段 | 用途 |
|---|---|---|
| 0 — 平 | 无边框无影 | **默认。绝大多数内容就活在这一层。** |
| 1 — 发丝线 | 1px `{colors.line}` | 列表分行、输入框边界、卡片描边 |
| 2 — 纸背 | `{colors.surface-2}` 底色 | 行悬停、计数徽章、代码块 |
| 3 — 浮层 | `{colors.surface}` + `{colors.line}` + `0 24px 64px rgba(0,0,0,.13)` | **仅**搜索面板 / 灯箱 / 移动菜单 / 返回顶部 |

**核心原则：层级优先用线和表面色，阴影是最后手段。** 这是从 [Notion](https://getdesign.md)（hairline elevation）和 [Linear](https://getdesign.md)（surface ladder，几乎不用投影）借来的纪律。一张卡片上叠 `box-shadow` + `border` + 大圆角，是三重重量的浪费 —— 通常只需要那条线。

### 线的语法

全站只有两种线，各管一件事，不要混用：

| 线 | 含义 | 用在哪 |
|---|---|---|
| **1px 实线** `{colors.line}` / `{colors.line-strong}` | **结构性分节** | 列表分行、区域边界、代码块栏、脚注区、关于页分节（打赏块就是其中一节）、手机菜单项 |
| **1px 虚线** | **临时 / 异常状态** | 目前只有一处：图片加载失败（`.article-image:has(img.is-failed)`） |

**为什么定这条规矩：** 2026-10-02 之前，同样是「分节」，关于页用虚线、归档页用实线、内联目录用虚线、脚注区用实线 —— 读者看不出虚实之别意味着什么，线就退化成装饰。定完之后虚线只在一个地方出现，**它一出现就说明「这里有东西坏了」**。

## Motion

**三档时长，一条缓动。** 定义在 `critical.css` 的 `:root`：

| Token | 值 | 管什么 |
|---|---|---|
| `--dur-fast` | 0.15s | 悬停 / 聚焦 / 颜色变化 —— 「即时回应」，多一分就显迟钝 |
| `--dur-base` | 0.22s | 展开 / 淡入 / 位移 —— 「看得见的变化」，要看清过程但不能等 |
| `--dur-slow` | 0.4s | 图片入场 / 页面转场 —— 「大块移动」，块越大越要慢，否则会糊 |
| `--ease` | `cubic-bezier(0.32, 0.72, 0, 1)` | 全站唯一曲线（快出慢入）。`--ctrl-transition` 也走它 |

**为什么要有词表：** 2026-10-02 之前，全站有 **10 个**不同的过渡时长（0.15s ×36、0.2s ×13、0.25s ×10、0.18s ×9、0.22s ×6、0.3/0.4/0.5/0.6/0.04s 各 1），其中只有 `--ctrl-transition` 是 token，其余全是硬编码；缓动更是清一色裸 `ease` —— 那是浏览器默认值，等于「没做决定」。这些值彼此只差 1–3 帧，读者感觉不到快慢，只觉得「这里好像跟别处不太一样」。收敛之后，动效才成了一套语言。

**两个刻意的例外**（写在这里，免得以后被当成漏网之鱼）：
- `@keyframes hero-in` 用自己的 `cubic-bezier(0.2, 0.7, 0.2, 1)` —— 卷首入场是一次性动画，要的是「推上来」不是「滑上来」，不属于通用状态切换。时长仍走 `--dur-slow`。
- `::view-transition-group(page-title)` 用 0.32s，比页面档（`--dur-base`）慢 0.1s —— 让标题**领着**页面走，是刻意的错位。

**reduced-motion 是「换一种做法」，不是「把时长归零」：** `prefers-reduced-motion: reduce` 下直接 `animation: none`，而不是只把时长压到 0.01ms —— 后者动画仍然会「跑」，只是在一瞬间跑完，元素照样「跳」到终态，而这一跳正是敏感用户要避开的东西。

**位移（`translateY`）只给卡片和主按钮：** 悬停位移全站只剩 `.notfound-btn`（-1px）一处。控件（图标按钮、胶囊、文字链接、打赏按钮）靠颜色与底色回应，不抬 —— 抬 1px 是 App 目录的习惯动作，不是纸的语言。2026-10-02 从 7 处收到 2 处；**2026-10-05 再减到 1 处** —— 文末「上一篇 / 下一篇」整条移除（见「文章列表」末条），`.post-nav-card` 的 `translateY(-2px)` 随之消失。

## Shapes

| Token | 值 | 用途 |
|---|---|---|
| `{rounded.row}` | 10px | 列表行、图片、标签 |
| `{rounded.base}` | 12px | 按钮、输入框、卡片、浮层 |
| `{rounded.pill}` | 999px | 胶囊（分类 / 标签 / 翻页 / 打赏按钮） |

**为什么不是 22px：** 大圆角是「移动 App」的语言。博客的容器语言应该更接近印刷品 —— 接近方，或只有轻微圆角。[Notion 12px](https://getdesign.md)、[Linear 12px](https://getdesign.md)、[Wired 0px](https://getdesign.md) 都指向同一个方向。

## Components

### 页头
- **纸底 + 滚动时一条发丝线。** 不做毛玻璃：`backdrop-filter` 在固定元素上每帧重算，是滚动掉帧的大头，而中文长文博客里它带来的观感收益很小。
- 左：logo（30px）+ 站点名（衬线）。中：导航（无衬线，`{colors.muted}`；当前项 `{colors.ink}` + 2px 印章红短下划线）。右：搜索 / 深浅色 / RSS 三个图标 + 汉堡。

### 文章列表
- **直接落在纸上**，列表顶部一条 `{colors.line}`。
- 每一行：衬线标题（左）+ 等宽日期（右，`{colors.muted}`），行间 `{colors.line}` 发丝线，行内边距 `{spacing.s3}` 纵向。
- **归档页的条目行与这套完全一致**（2026-10-02 晚改）：标题在左、日期贴最右，复用同一个 `grid-template-columns: minmax(0, 1fr) auto`。区别只有一处 —— 归档的 `align-items` 用 `baseline` 而**不是**首页的 `center`：归档标题会换行，`center` 会把日期丢到两行之间的半空，`baseline` 才咬得住第一行。DOM 顺序也照视觉顺序排（标题在前），不用 CSS `order` 硬掰。详见 MAINTENANCE.md「归档页」。
- **悬停只把标题变 `{colors.accent}`。** 不做整行 `translateY` + 底色块 —— 那是卡片的语言。
- **标题不截断**（2026-10-02 第三轮）。列表行、分类/标签/周刊的极简列表 —— 两处渲染文章标题的地方一律**自由换行**，不用 `line-clamp` 也不用 `text-overflow: ellipsis`。被截掉的那半句，正是读者判断「要不要点进去」的全部依据；省下的那点行高不值这个价。行高随内容变，行间发丝线不变。
  **2026-10-04 补第三处**：书影音卡片页的 `.media-title`（书影音标题）与 `.media-creator`（作者名）原先还挂着 `white-space: nowrap` + `ellipsis` —— 当时只按「列表行」去搜、漏了卡片页。卡片列宽在手机上只有 135–170px，一本中文书名就能吃掉整行，截断在这里比列表里触发得更早。现已一并放开。
  **2026-10-05 文末上下篇整条移除**（用户拍板，见 `blog-upgrade-review.html` 的 A1）：`single.html` 里它与「相关文章」是 `if/else` 互斥，而 124 篇没有一篇算不出相关文章 —— 那一支从未渲染，`.post-nav*` 的样式与 `[` `]` 快捷键都是死代码。**文末现在只有「相关文章」**；「要按顺序读一组」走 `series` 字段（见「系列」一节），不再靠位置相邻。
- 分类角标用 `post-cat-chip`（印泥淡痕底 + 印泥红字）。

### 系列（Series）
- **连载 / 主题合集按 `series` 字段组织，出口在归档页。** `content` 的 front matter 写 `series: "综述写作"`（当前三组：综述写作之- 5 篇、居家流水账- 4 篇、跑步 12 篇），归档页 `archive.html` 按它分组，按日期升序（= 连载顺序 / 发表顺序）渲染。**「跑步」是主题合集不是连载** —— 序号表达的是「按日期的第几篇」，不是「第几 part」；一组连载和一组合集在这套渲染里长得一样，这是刻意的：读者要的是「这组里有什么、从哪读起」，不是体裁标签。
- **形态是一行胶囊**（2026-10-05 定稿，第一版的 `<details>` + 标题行被用户否掉：「要更小的胶囊设计」）。左边「系列名 + N 篇」，右边一排小胶囊：每颗 = 等宽序号 + 短标题。胶囊走全站既有的控件描边四态（`--ctrl-*`，与 `.tag-chip` 同一套：底 · 字 · 边，无影），只有 hover / active 才出现印泥淡痕与红字 —— 这是「红必须稀缺」的直接应用：**一排胶囊是常驻元素，红只能在互动那一刻出现。**
- **标题里的系列前缀要剥掉**（「综述写作之-确定主题」→「确定主题」）：系列名就在左边一行，前缀是重复的，不剥掉胶囊没法小。完整标题留在 `title` 属性里，鼠标停一下还能看到。
- **为什么出口在归档页而不是文末。** 用户 2026-10-05 拍板：文末只留「相关文章」，不加系列条。归档页本来就是「一页看全站」的地方，系列在那里是目录的一部分；放到文末则每篇文章都要多背一段与当前阅读无关的目录。
- 组与组之间只用一条 `{colors.line}` 发丝线，组内靠间距；「系列」这行标签走等宽小字（和 `.archive-month` 同档），系列名走衬线 —— 标签 / 标题 / 元信息三种字体各守其位。

### 搜索（面板）
- 形态：顶部输入框，中部结果 / 空态，底部两行**分类 / 标签筛选**（行内横向滚动）。
- **筛选**用文章页那套 `●` / `#` 前缀语言（`.search-chip[data-facet="categories"]::before` / `[data-facet="tags"]::before`），点一次筛选、再点一次取消；选中后**可以不带关键词**直接浏览该类全部文章。分类全列（13 个），标签只列出现 ≥3 篇的（28 个），长尾走行尾「全部标签 ›」。
- **空态**显示快捷键提示（`/` 或 `⌘K`）与最近 5 次搜索词。最近搜索是**全站唯一一处 `localStorage`** —— 它和「深浅色跟随系统、刷新不记忆」（2026-09-28 的设计决策）不冲突：那条决策约束的是**主题**，搜索历史是用户的输入产物，不记住才是丢东西。键名 `hulatu:search:recent`，读写都包在 `try/catch` 里（隐私模式静默降级）。
- **写入时机是「提交」而不是每次击键**：Enter 打开结果、点开一条结果、关面板时输入框已有 ≥2 个字。否则「跑」「跑步」「跑步装」会被当成三次搜索存进去。

### 正文
- 链接：`{colors.accent-ink}` + 1px 下划线（offset 2px）。正文里的链接是全站少数几个该用红的地方。
- 图片：`{rounded.row}` 圆角 + `{colors.line}` 描边 + 居中小字说明。点击进灯箱。
- 代码块：`{colors.surface-2}` 底 + 发丝线描边 + `{rounded.base}`。语言标签 + 复制按钮。
- 外链：行尾一个 ↗ 标记（用 mask，颜色随字色）。

### 目录
- 宽屏：右侧刻度栏，当前项印章红 + 2px 左竖线。
- 窄屏：排在正文开头，可折叠。

### 签名时刻（Signature）
- **印章。** 全站允许一处"用力"的地方 —— 例如关于页头像旁、或文章标题旁的一枚印章红印记。它是身份的锚点，**只此一处**，不要复制到每个标题。

### 书影音卡片
- 保留 ±1.2° 的轻微旋转与悬停回正 —— 这是全站唯一的装饰性"贴纸"。参照 [Notion 的贴纸调色板原则](https://getdesign.md)：**装饰永不承担结构**，它只负责让页面有一点人的手温。

### 关于页
- **段落里的链接用「行内链接」，不要升格成组件**（2026-10-02 第四轮）。「我是谁」段里那条指向《关于我》全文的链接，全站基础规则是 `a { color: inherit; text-decoration: none }` —— 裸 `<a>` 和正文**完全同色、没有下划线**，读起来就是句子的一部分，看不出可以点，所以它必须显式上样式。
  **但要上的是「链接的样式」，不是「一个组件」。** 它一度被做成一条链接行（`.about-feature-link`：发丝线描边 + `{colors.surface-2}` 纸背底 + 常显箭头，形态与「网站导览 / 订阅」那些行完全一致）—— 形态本身没错，但那是**列表行**的语言；插进散文里就成了「一句话读到一半，中间冒出一个带边框的方块」，读起来像广告位而不像句子的一部分。现在退回**行内链接**：`{colors.accent}` + 1px 下划线（`text-underline-offset: 2px`），和全站正文链接（`.post-content a`）同一套语言。
  实现见 `critical-info.css` 的 `.about-section > p a`。**刻意没有复制** `.post-content a` 那套「下划线从左划出」的背景渐变 —— 为一段散文里的单条链接再维护一份画线技术不值得，hover 只做颜色变化。**链接文字也不带书名号**（页面上写「关于我」，不写「《关于我》」）：红字 + 下划线已经说明它是个可点的标题，再加书名号就是第二重标记，反而把它从「句子里的一个词」推成一个「条目」—— 和上面那版「链接行」是同一个方向上的过度设计。
- **打赏块全站只此一处，而且它就是这一页的一个 `.about-section`**（2026-10-02 第四轮）。文章页已移除：每篇文末都挂一个收款码，等于「每篇都在要钱」；收成一页之后，它变成「想支持我的人找得到」的地方，而不是每篇的固定家具。
  它原先挂在 `.about-body` 卡片**外面**，于是得自己写 `border-top` 和 `max-width: 30rem` 居中，在本文档里留下两条「只有它这样」的特例。现在收进 `.about-body`，成为与「我是谁 / 网站导览 / 订阅 / 平台 / 联系」平级的第 6 节，分隔线直接吃现成的 `.about-section + .about-section`，两条特例一起删掉。
  **折叠触发器是「可选动作」，不是主 CTA。** 它一度走 `--ctrl-solid-*`（印章红实心 + 红晕投影）—— 那是「这就是那个动作」的信号，而这一页的主线是「读我是谁 / 逛栏目」，结果是这个按钮成了整页视觉最重的元素，比页标题还抢眼。现在换成中性的 `--ctrl-*` 描边四态（与 `tag-chip` 同一套：底 · 字 · 边三样，无影）。**红也不再落在节标题前那颗小菱形上**（2026-10-04 改，见下一条）。
  **展开区不套外框。** 两个收款码本身就是白底 + 发丝线的卡片，再包一层就是「卡片里的卡片」—— 层级交给间距和码自己的边框。
  配置、换图的正确姿势、以及「换图后要去 Cloudflare Purge」见 MAINTENANCE.md 的「打赏」一行。
- **节标题前那颗菱形改中性**（2026-10-04）。关于页 `.about-body` 有 6 个 section（我是谁 / 网站导览 / 订阅 / 平台 / 联系 / 支持），原先**每节标题前都点一颗印章红菱形 —— 一页 6 处红**，把「印章红必须稀缺」（设计目标第 3 条）摊成了底色。红的语义是「可交互 / 当前状态 / 焦点 / 一个签名时刻」，一个纯装饰的分节标记不在其列。
  现在 `.about-section h2::before` 的 `background` 从 `{colors.accent}` 改为 `{colors.line-strong}` —— 与 `.about-body` 的分节线（`.about-section + .about-section`）**同色**，两者在「线的语法」里同属「结构性分节」。**形保留、色去掉**：45° 旋转的方仍是「印章的方」，只是不再用红。
  改完之后这一页的红只剩三处有语义的地方：角色行前那个 5px 小点（2026-09-29 定下的「本页一处红」）、段落里的行内链接、可交互元素的 hover / active 态。

### 404 页（2026-10-05 重做）
- **两段结构：上半「这一页不在账上」，下半「去哪儿」。** 上半是唯一的一级标题（`<h1>`），
  大字 404 降级成纯水印（继续 `aria-hidden`）；下半给两条**互补**的出路 ——
  「逛逛别处」按栏目逛（解决「我知道要找哪一类」），「最近更新」按时间看（解决「随便看看」）。
  此前整页从 `<h2>` 起头、没有任何 `<h1>`，是站内唯一一处这样的页面。
- **大字 404 不是红的。** 它是 `color-mix(in srgb, {colors.muted} 55%, {colors.paper})` 的水印，
  字体走 `{typography.font-meta}`（数字交给等宽，和列表里的日期同一档）。
  理由：这一页的红已经落在「回首页」那个实心主按钮上（`--ctrl-solid-*`），
  一个装饰数字再抢一次红，同一页就有两处红 —— 而 `{colors.accent}` 的规矩是「稀缺才有力量」。
  改中性之后层级反而更清楚：**水印（最浅）→ 标题（墨）→ 正文（灰）→ 按钮（红）**。
  别用 `{colors.line-strong}`：它和纸底的对比只有约 1.4:1，4.2rem 的大字会淡到看不见。
- **「逛逛别处」是两列账本，不是卡片。** 语言照抄关于页的 `about-link-list`
  （无卡片、无投影、靠发丝线分行、hover 只变字色 + 右移），但排成两列 —— 六个入口排一列太高；
  ≤600px 收回一列。**刻意不给整行底色**：Don't 里明写「不要在 hover 上挂底色块」。
- **「随便看一篇」是构建时抽签**（Hugo 的 `shuffle`），所以每次发布换一篇。
  不做「每次刷新换一篇」：那要把整个文章列表塞进页面，为一个 404 页多背几十 KB 不划算。

## Do's and Don'ts

### Do
- 让正文直接坐在 `{colors.paper}` 上，用 `{colors.line}` 发丝线表达层级。
- 把印章红留给「可交互 / 当前状态 / 焦点 / 一个签名时刻」。其他地方要强调，先想想能不能用字重和留白。
- 标题用衬线、正文用无衬线、元信息用等宽 —— 三条线各守其位。
- 圆角收在 10–12px。
- 保持 680px 正文宽度与 17px / 1.8 的阅读节奏。
- 深色模式当「墨染夜色」做，不是简单反色。

### Don't
- **不要给列表、卡片套白色容器 + 投影 + 大圆角** —— 那是 App 的语言，不是账本的语言。
- **不要在卡片上同时用阴影和描边。** 二选一，通常选线。
- **不要在卡片里再套一层卡片**（2026-10-02 第四轮）。关于页的打赏块原本在 `.about-body` 卡片里又开了一个描边面板，而面板里的两个收款码**本身**就是白底 + 发丝线的卡片 —— 三层面板套三个盒子，正是本文档要收敛的那种装饰。判据很简单：**内层元素自己已经有边框或底色时，外层就只给间距。**
- **不要在 hover 上挂投影**（2026-10-02 第二轮）。控件的 hover 只靠「底 · 字 · 边」三样回应；`--ctrl-hover-shadow` 已整体删除。影只留给真正的浮层，以及印章红实心主按钮那层强调光晕。
- **不要引入第二个强调色。** 全站只有印章红。
- **不要用毛玻璃做常驻页头。**
- **不要在印泥淡痕底上直接用 `{colors.accent}`** —— 用 `{colors.accent-ink}`。
- **不要下载外部字体**，也不要给标题加大字距。
- **不要截断文章标题**（2026-10-02 第三轮）。`-webkit-line-clamp` / `white-space: nowrap` + `text-overflow: ellipsis` 都不许挂在标题上 —— 标题是列表里唯一的信息，截它等于把列表变成一串「…」。要收紧高度就调行内边距（`{spacing.s3}`），不要调标题。
- **不要为了极简删掉功能。** 搜索、目录、灯箱、周刊、打赏、评论都是保留项；要收敛的是装饰，不是能力。

## 改造路线图（Roadmap）

> 按优先级排列。P0 = 收益最大、最该先动；P2 = 锦上添花。

**P0 — 把「卡片」退回「纸 + 线」**
1. `.post-list` 去掉 `background: var(--surface)` + `border` + `box-shadow`，列表直接落在纸上；行间改 `{colors.line}` 发丝线。
2. `.post-row:hover` 去掉 `background` 与 `translateY`，只保留标题变红。
3. `.group-card` / `.category-card` / `.media-card` 撤掉 `--shadow-sm`，层级改用发丝线 + 纸背色。

**P1 — 圆角与阴影收敛**
4. `--radius-card` 22→12px，`--radius` 16→12px，`--radius-row` 14→10px。
5. 全局清理 `--shadow-sm` / `--shadow-md`：只保留给 `.search-box` / `.lightbox-*` / 移动端 `.nav-links` / `.back-top`。

**P1 — 页头去玻璃**
6. `.site-header` 去掉或大幅降低 `backdrop-filter`，改纸底 + 滚动时出现 1px 底线。

**P2 — 印章红更稀缺**
7. 复核所有 `var(--accent)` 出现处：保留链接 / 悬停 / 激活 / 焦点 / 签名时刻；把纯装饰性的（如阅读进度条、导航装饰线）考虑降为 `{colors.ink-soft}` 或降饱和。
   - **2026-10-02 第一轮已做**：正文一屏内的红从 6 处收到 3 处 —— `*强调*` 着重号、引用块左框与引号、`ul/ol` marker、脚注 marker 全部退回中性灰阶；只保留 h2 前竖条（章节路标）、正文链接（可点目标）、文末印章（落款）三种语义。`critical-post.css` 的 `var(--accent)` 从 27 降到 20。
   - **2026-10-04 已做**：关于页 `h2::before` 的红菱形 → `{colors.line-strong}`（一页 6 处红 → 0，详见「关于页」一节）。
   - **2026-10-05 拍板，这一项收口**：最后两处未复核红 —— `post-cat-chip::before` 的 `●` 与 `post-tag-chip::before` 的 `#` —— **保留印章红，不降级**。判据：它们是「**可点的分类 / 标签目标**」的前缀标记，落在「可交互」那一条语义里（不是纯装饰），而且搜索面板新增的筛选胶囊用的是同一对前缀 —— 两处不一致反而会让读者重新学一遍符号。阅读进度条同样保留（2026-10-02 已定稿：红可以留，但常驻元素压到 2px，越细越像墨线）。**全站至此没有「未复核红」**；以后要再加红，先回答「它承担的是哪一条语义」（可交互 / 当前状态 / 焦点 / 签名时刻）。

**P2 — 借一点 bearneo 的能力**
8. 首页可选做「年份分组」（归档页已有此能力）；上赞（Kudos）可选。

## Known Gaps
- 本站不加载外部字体，衬线栈在非中文系统上会回退到 Georgia / Times，观感与 Source Han Serif 有差异 —— 这是刻意的性能取舍，不是缺陷。
- ~~动效时长未纳入本文档 token~~ —— **2026-10-02 已补**：见上面 `## Motion`，三档 `--dur-fast` / `--dur-base` / `--dur-slow` 加一条 `--ease`；建表时替换 84 处时长字面量（10 个值 → 3 档），同期另删掉 4 条永不触发的死 transition，所以最终是 **80 处引用**；无裸 `ease`、无词表外时长（除 `hero-in` 的曲线与 `page-title` 的 0.32s 两个已登记的例外）。
- 印章「签名时刻」的具体形态（尺寸 / 位置 / 是否做旧）尚未定稿，属设计决策待办。
- ~~深色模式目前只重写颜色，未单独校一遍深色下的印章红与印泥淡痕观感。~~ —— **2026-10-02 第二轮实测**：**红色本身没问题，反而比浅色更稳**（`accent-ink` 在 `accent-soft` 上：深色 7.40:1 / 浅色 5.72:1；`accent` 在 `accent-soft` 上：深色 5.57:1 / 浅色 4.33:1），所以这条划掉。
- ~~真正没校的是「深色浮层」~~ —— **2026-10-02 第三轮已实施**。原问题：搜索面板 / 灯箱 / 手机菜单共用一套浮层逻辑，深色下**全部失去层次** —— 搜索遮罩 `rgba(20,22,26,.42)` 是深灰，比深色页面底 `#0b0b10` **更亮**，「压暗」变成「提亮」（页面 L\* 3.14 → 4.61，ΔL\* **+1.47**；浅色对照 **−34.12**）；`.search-box` 底是 `var(--paper)`，与页面**完全同色**（ΔL\* = 0）；`--shadow-md` 又是黑影叠近黑底。结论是**不是「看不见面板」，是「浮不起来」**。
  **解法（方案 C）**：深色下「压暗」这条路物理上走不通（`--paper` 的 L\* 只有 3.14，遮罩再黑也只能压掉 3 点），所以**把方向反过来 —— 遮罩用纯黑压实、面板抬亮**。抽三个 token 落在 `critical.css` 的 `:root`：
  | token | 浅色（原值，渲染不变） | 深色 | 消费者 |
  |---|---|---|---|
  | `--scrim` | `rgba(20,22,26,.42)` | `rgba(0,0,0,.62)` | 搜索遮罩 / 手机菜单 |
  | `--scrim-deep` | `rgba(10,12,16,.88)` | `rgba(0,0,0,.92)` | 灯箱遮罩 |
  | `--overlay-surface` | `var(--paper)` | `var(--surface)` | 搜索面板 / 手机菜单 |

  实测深色：搜索「面板 − 遮罩」= **+9.20**（浅色 +34.11，方向一致，量级差是物理限制）；灯箱页面 − 遮罩 = +2.89。
  注意 `--overlay-surface` 在两个主题下**指向不同 token**，这是刻意的：浅色 `--surface`(#fff, L\*=100) 比 `--paper`(#f6f6f8, L\*=96.94) **还亮**，面板若用它就成了「比页面更亮的白纸」而不是浮层 —— 浅色下浮层的对比由遮罩提供，面板与页面同色才对。`.back-top` **不走** `--overlay-surface`，它背后没有遮罩、得自己跟页面对比（浅色下 `--surface` 的纯白正是它可见的原因）。
- ~~间距刻度仍有 3 个刻度外值~~ —— **2026-10-02 第三轮已收口**：①`.post-content a` 的 `padding-bottom: 1px` **保留**（它是**线宽**不是间距：下划线是 1px 的 `linear-gradient`，这个 padding 是让线不贴字形的间隙，收进 4px 步进会把线推远成「另一条装饰线」）—— 顺带纠一处文档笔误，这个值在 `.post-content a` 上，不在 `.post-content p` 上；②右侧目录 `padding: 0 0 0 18px` → 抽成 `--toc-indent: calc(6px + var(--space-3))`（6px 是刻意的字面量，不能用 `var(--tick)`：`--tick` 是逐级 6/5/4/3，用它会让层级越深缩进越**小**）；③`.code-block-dots` 的 `gap: 6px` → `var(--space-1)`（4px，随手写的，无特殊理由）。
- ~~`core.css` 里有 42 条「孤儿注释」~~ —— **2026-10-02 第三轮已清理完**。**先修正这个数字**：原记录按注释**行**数，多行注释的每一行都被记了一次。按**块**数复核（对 `git show HEAD:assets/css/core.css`）：**57 个注释块、其中 25 个是纯标题、18 个标题下面完全没有规则**（这 18 个与 `MAINTENANCE.md` 早先记的「18 个空板块」吻合）。清理后：**22 个注释块、4 个纯标题、0 个孤儿**（这 4 个标题下面都有规则）。
  按「**注释跟规则走**」逐块处理：有独立理由的 **10 块挪到了它现在所属的规则旁边**（`critical.css`：`view-transition-name` 的「每页只能一个同名元素」、`text-wrap: balance` 组、锚点落点偏移；`critical-post.css`：代码块内层去重、插图 focus 环半径、`.js` 才渐显；`critical-info.css`：关于页 `> p` 的特异性；`post.css`：giscus 用 `max-height + visibility` 而非 `display:none` 的原因）；过时的 **就地删除**（关于页 7 条描述的是 2026-09-29 已废弃的「左柱 / 粉红光晕 / 3rem 分隔线」旧版式，删掉才不会误导）；纯标题无规则的删标题。文件头那段「关于本文件里的『空板块』」的说明也随之作废，换成一句**判据**：这条规则在首屏第一帧用不用得到。
- **3 条标题自然换行后末行很短**（2026-10-02，`text-wrap` 改动的已知代价）：全站 124 条标题里，桌面端（38px / 680px 容器）**只有 9 条**会换行，其中 3 条末行 ≤2 字 ——「当我谈喜欢 or 讨厌的博客，我在谈些什么」末行只剩「么」（该条总宽 713.8px，只超容器 33.8px）、「生活在不同的算法中，仿佛生活在两个世界」末行「世界」、「少年你和伙伴，一起走过时间海（抒情篇）」末行「篇）」。这是中文自然换行的偶发代价，**不是缺陷**；`balance` 能消掉它，但要牺牲所有多行标题的第一行。真要处理，改那 3 条标题的文案比改 CSS 有效。
- ~~`### 层级` 表里「文章标题 字重 500」与实现不符~~ —— **2026-10-02 第三轮已按「对齐文档」解决**：给 `.post-title` 补了 `font-weight: 500`（此前全站**没有任何 `font-weight` 声明**，也没有 `h1 { font-weight }` 规则，所以它落在浏览器对 `h1` 的默认值 **700**）。
  ⚠️ 但要记住一个**渲染事实**：`--font-serif` 在 macOS 落到 **Songti SC，它只有 400 / 700 两个字重**，所以 `500` 会**解析成 400 Regular** —— 也就是标题实际比改之前**细了一档**（这是预期的，不是 bug）。如果哪天字体栈换成思源宋体（有 500 Medium），同一个 `500` 会自动落到 Medium。**别为了让 500「真的生效」去加载外部字体**，那和「不下载外部字体」的原则冲突。
- ~~**同一个表里 H2 / H3 的「字重 500」仍与实现不符**~~ —— **2026-10-04 已按「对齐文档」解决**：给 `.post-content h1, h2, h3` 补了 `font-weight: 500`。补之前它们和 `.post-title` 一样没有声明，落在浏览器默认的 **700 Bold** 上 —— 结果是**章标题（h2/h3）比篇标题还重**。现在 h1/h2/h3 请求 500（本机 Songti 渲染为 400，与篇标题一致），正文标题层级整体变平，更像杂志正文。
  ⚠️ **`.post-content h4` 刻意没有跟着降到 500，而是显式写死 700。** 它和正文同号（`{typography.text-reading}` 17px），唯一能区分层级的手段就是字重 —— 本机 Songti 把 500 解析成 400，h4 一旦也写 500 就和正文**一模一样**，小标题直接「消失」。这是「对齐文档」这条路上唯一必须偏离的一处，理由已写进 `critical-post.css` 的注释。

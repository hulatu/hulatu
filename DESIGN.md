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
  font-serif:
    fontFamily: '"Source Han Serif SC", "Noto Serif SC", "Songti SC", Georgia, serif'
    use: 站点名 / 页标题 / 文章标题 / 卡片标题
  font-sans:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    use: 正文 / 导航 / 按钮 / 说明
  font-meta:
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, "PingFang SC", monospace'
    use: 日期 / 字数 / 期号等以数字为主的元信息（等宽 → 列表里日期成列不抖）

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
  header-height: 64px
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
    padding: "12px 0"
    hoverTextColor: "{colors.accent}"
    hoverBackground: none
    note: "悬停只改标题色，不做整行位移 + 底色块。"
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
    buttonBackground: "{colors.accent}"
    buttonTextColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
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
| 功能 | 上赞 / 搜索 / 年份分组 / 目录 / 图放大 / 外链处理 | 搜索 / 目录双形态 / 灯箱 / 年份归档 / 外链 ↗ / 周刊 / 打赏 / 评论 |
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

> 这三条分工是从 [Wired 的编辑系统](https://getdesign.md) 借来的：*serif for narrative, sans for structure, mono for taxonomy*。不要跨界 —— 标题不要用无衬线，正文不要用等宽。

### 层级

| 用途 | 字号 | 字重 | 行高 | 字体 |
|---|---|---|---|---|
| 文章标题 | `{typography.post-title-size}` 38px | 500 | 1.45 | 衬线 |
| H2 | `{typography.h2-size}` 32px | 500 | 1.5 | 衬线 |
| H3 | `{typography.h3-size}` 24px | 500 | 1.5 | 衬线 |
| 正文 | `{typography.text-reading}` 17px | 400 | 1.8 | 无衬线 |
| 列表标题 | `{typography.text-sm}` 16px | 400–700 | 1.5 | 衬线 |
| 元信息 | `{typography.text-xs}` ≈13.8px | 400 | 1.6 | 等宽 |
| 角标 | `{typography.text-2xs}` ≈11.5px | 400 | 1.6 | 无衬线 |

### 原则
- **正文行高 1.8**，段间距 `{typography.block-gap}` 2rem。中文密排需要这个呼吸，别为了"紧凑"压到 1.6。
- **中文标题只给一点点字距**（`{typography.tracking-title}` 0.02em）。拉丁式的大字距套在汉字上会散架。
- **不下载外部字体。** 用系统栈。这既是性能，也是审美（Bear Blog 的轻）。
- 元信息里的汉字（「发布于」「字」「篇」）要显式接回无衬线栈，不要让系统按 monospace 去猜中文 —— 否则 macOS 和 Windows 会各猜一套。

## Layout

### 间距
- **4px 步进**：`{spacing.s1}` 4px · `{spacing.s2}` 8px · `{spacing.s3}` 12px · `{spacing.s4}` 16px · `{spacing.s6}` 24px · `{spacing.s8}` 32px · `{spacing.s10}` 40px · `{spacing.s12}` 48px。
- 段间距 `{typography.block-gap}` 2rem；H2 上间距 = 段距 + 24px，H3 上间距 = 段距 + 16px。

### 栅格与容器
- **正文与页头共用 `{layout.content-width}` 680px**，内边距留在外层（`{layout.gutter}`）。这样导航栏和正文的左右边缘严丝合缝。
- 只有组件自己的内层宽度才特意更窄（打赏盒 30rem、404 文案 24em 之类）。
- 文章页在 ≥1152px 时，目录从正文中段移到右侧刻度栏（`toc-rail`）；更窄时排回正文开头。

### 响应式
- **≤760px**：正文降一档（17→15px）、H2/H3 各降一档、页头收成 logo + 图标 + 汉堡下拉。
- **≤600px**：页脚由横排转竖排居中。
- 断点只设两个（760 / 600），不追设备型号。

## Elevation & Depth

| 层级 | 手段 | 用途 |
|---|---|---|
| 0 — 平 | 无边框无影 | **默认。绝大多数内容就活在这一层。** |
| 1 — 发丝线 | 1px `{colors.line}` | 列表分行、输入框边界、卡片描边 |
| 2 — 纸背 | `{colors.surface-2}` 底色 | 行悬停、计数徽章、代码块 |
| 3 — 浮层 | `{colors.surface}` + `{colors.line}` + `0 24px 64px rgba(0,0,0,.13)` | **仅**搜索面板 / 灯箱 / 移动菜单 / 返回顶部 |

**核心原则：层级优先用线和表面色，阴影是最后手段。** 这是从 [Notion](https://getdesign.md)（hairline elevation）和 [Linear](https://getdesign.md)（surface ladder，几乎不用投影）借来的纪律。一张卡片上叠 `box-shadow` + `border` + 大圆角，是三重重量的浪费 —— 通常只需要那条线。

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
- 左：logo（25px）+ 站点名（衬线）。中：导航（无衬线，`{colors.muted}`；当前项 `{colors.ink}` + 2px 印章红短下划线）。右：搜索 / 深浅色 / RSS 三个图标 + 汉堡。

### 文章列表
- **直接落在纸上**，列表顶部一条 `{colors.line}`。
- 每一行：衬线标题（左）+ 等宽日期（右，`{colors.muted}`），行间 `{colors.line}` 发丝线，行内边距 `{spacing.s3}` 纵向。
- **悬停只把标题变 `{colors.accent}`。** 不做整行 `translateY` + 底色块 —— 那是卡片的语言。
- 分类角标用 `post-cat-chip`（印泥淡痕底 + 印泥红字）。

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
- **不要引入第二个强调色。** 全站只有印章红。
- **不要用毛玻璃做常驻页头。**
- **不要在印泥淡痕底上直接用 `{colors.accent}`** —— 用 `{colors.accent-ink}`。
- **不要下载外部字体**，也不要给标题加大字距。
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

**P2 — 借一点 bearneo 的能力**
8. 首页可选做「年份分组」（归档页已有此能力）；上赞（Kudos）可选。

## Known Gaps
- 本站不加载外部字体，衬线栈在非中文系统上会回退到 Georgia / Times，观感与 Source Han Serif 有差异 —— 这是刻意的性能取舍，不是缺陷。
- 动效时长（view transition 0.22–0.32s、控件四态 0.15s）未纳入本文档 token，实际以 `critical.css` 的 `--ctrl-transition` 与 `--ease` 为准。
- 印章「签名时刻」的具体形态（尺寸 / 位置 / 是否做旧）尚未定稿，属设计决策待办。
- 深色模式目前只重写颜色，未单独校一遍深色下的印章红与印泥淡痕观感。

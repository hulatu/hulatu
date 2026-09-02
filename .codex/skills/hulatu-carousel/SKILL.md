---
name: hulatu-carousel
description: Convert a Hugo Markdown article into a 6–10 slide minimalist Chinese Douyin image carousel (1080×1440 PNG) using the HULATU design system and ImageMagick rendering. Use when the user asks to turn a blog post into Douyin (or Xiaohongshu) carousel images, carousel copy, or a Douyin caption.
---

# HULATU Carousel

把 Hugo Markdown 长文转成「胡拉图说」风格的抖音图文。输出 6–10 张 1080×1440 PNG、`carousel.md`、`caption.md`、`manifest.json`。

## 输入与输出

输入一篇 Hugo Markdown 文章（如 `content/posts/<slug>/index.md`）。输出写到文章同级的 `douyin/` 目录：

```text
content/posts/<slug>/douyin/
├── 01-cover.png … 08-cta.png   # 每页一张 PNG
├── carousel.md                 # 分页图文脚本
├── caption.md                  # 抖音文案 + 标题建议 + 话题
└── manifest.json               # 幻灯片结构化数据（render 脚本的输入）
```

## 工作流

1. **读取与提取**：读取文章，提取标题、简介、正文、个人经历、主要论点、例子、结论；忽略 Hugo 导航、目录、图片 URL、打赏/评论等与内容无关的模块。
2. **分析并搭结构**：按 [references/content-rules.md](references/content-rules.md) 确定页数与每页观点。默认 8 页，允许 6–10 页；一页一个观点，绝不凑页数。
3. **写文案**：按 content-rules.md 的字段规范写 `manifest.json`（每页含 type/title/body 等字段）。
4. **渲染**：按 [references/design-system.md](references/design-system.md) 渲染，执行：

   ```bash
   node <skill目录>/scripts/render.js <manifest.json> <douyin目录>
   ```

   render 脚本用「SVG + ImageMagick」确定性渲染，无浏览器、无 npm 依赖；自动探测系统字体。若未安装 ImageMagick：`brew install imagemagick`。不要用其他方式重绘版式。
5. **校验并修复**：逐张打开 PNG 检查文字溢出/截断/重叠、对比度、字号、边距、页码与版式一致性；发现问题改文案或模板后重渲，直到全部通过。
6. **收尾**：生成 `carousel.md`（完整分页脚本）与 `caption.md`（抖音文案、3 个标题建议、话题），确认 `manifest.json` 与图片一一对应。

## 视觉与修改入口

- 设计语义（色彩/字体/栅格/版式规则）：`references/design-system.md`。
- 落地实现：`scripts/render.js` 顶部的 Design Tokens 与版式函数；`--keep-svg` 会把每页合并 SVG 写到 `douyin/.preview/` 供检查。
- 改动视觉时保持 design-system.md 与 render.js 一致；没有用户明确要求时，不允许脱离「米白底 + 黑字 + 少量砖红 + 大量留白」。

## 硬约束

- 不杜撰事实、不夸大结论，保留作者原语气（第一人称、坦诚、克制）。
- 不用 emoji、网络梗、夸张标点、虚构引用；标题不做点击诱导。
- 封面与 CTA 之外的每一页都只讲一个观点，正文 30–80 字，标题 ≤ 18 字。

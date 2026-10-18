#!/usr/bin/env node
/* 给每篇文章生成分享卡（OG image，1200×630）。
 *
 * 为什么要有这个脚本
 * ------------------
 * 全站 337 个页面原来共用 `static/images/share.webp` 一张图 —— 分享到微信、
 * 群、Twitter，任何一篇文章的卡片都长得一模一样。这个脚本给每篇文章生成
 * 一张自己的卡，由 `layouts/_partials/opengraph.html` 按 slug 取用。
 *
 * ── 2026-10-17：整份重写 ──────────────────────────────────────────────
 * 上一版（2026-10-11 随「清干净」删掉）画的是**旧设计系统**：
 * 纸底 #f6f6f8、印章红方块、宋体标题、衬线站名。
 * 那套语言在 2026-10-10 迁到 Bear Neo 时**整体作废**了
 * （DESIGN.md 第 1 节：「纸账 + 印章」不要再往这些方向提方案）。
 * 所以这里不是「改几个色值」，是按现在的真值重画：
 *
 *   底    #fdfdfd  (--bg-color-primary)
 *   墨    #1a1a1a  (--text-color-primary)
 *   三级  #6e6e6e  (--text-color-tertiary，2026-10-18 浅色提亮后的值)
 *   线    #d0d7de  (--border-color)
 *
 * ⚠️ **刻意不用 `--link-color`（#0066cc）**。那个蓝在站点里只表示「这是个链接」，
 *    而卡片上没有可点的东西 —— 用了会让颜色失去语义，且和「只有一个强调色、
 *    而且要稀缺」这条设计原则相悖。整张卡只有墨色、灰、虚线。
 *
 * 字体也照抄站点栈：正文 Verdana + PingFang SC，日期等宽。
 * 视觉语言只用站点已有的东西：**虚线**（主题的 hr）+ 左对齐 + 大留白。
 * 没有方块、没有圆角卡片、没有投影、没有品牌色块 —— 和页面一致。
 *
 * 用法
 * ----
 *   NODE_PATH=<node_modules> node scripts/gen-og.js
 *   NODE_PATH=... node scripts/gen-og.js --limit=3      # 只生成前 3 张，调试用
 *   NODE_PATH=... node scripts/gen-og.js --only=<slug>  # 只生成某一篇
 *
 * 输出：static/images/og/<slug>.png
 * 用 slug 而不是文件名做图名 —— 文件名里有「：」「！」「+」「，」这类字符，
 * 进 URL 要转义，而 slug 都是干净的英文。
 *
 * 依赖：sharp（只用来把 SVG 光栅化成 PNG，不画任何东西）。
 *       中文字体走系统栈，不下载字体 —— 与「不下载外部字体」那条原则一致。
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('找不到 sharp。请设置 NODE_PATH 指向装着 sharp 的 node_modules，例如：');
  console.error('  NODE_PATH=/Users/hulatu/.workbuddy-ai/binaries/node/workspace/node_modules node scripts/gen-og.js');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'static', 'images', 'og');

/* ── 设计 token（与 themes/hugo-bearneo/layouts/partials/style.html 的 :root 一一对应）── */
const PAPER = '#fdfdfd';
const INK = '#1a1a1a';
const MUTED = '#6e6e6e';
const LINE = '#d0d7de';

const SANS = 'Verdana, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const MONO = 'Menlo, "SF Mono", Consolas, monospace';

const W = 1200;
const H = 630;
const PAD = 80;

/* ── 文本度量 ────────────────────────────────────────────────────────────
   中文按 1 个宽度单位、ASCII 按 0.5 算。
   ⚠️ 这里**只是用来挑字号档位**，不需要精确 —— 但 ASCII 的系数不能取太小：
      Verdana 的拉丁字符比宋体宽，旧脚本按 0.5 算时，含大量英文的标题
      （「AI 时代，也应该拥抱英语」）会显得比中文标题挤。0.55 更接近实际。 */
function vlen(s) {
  let n = 0;
  for (const ch of s) n += ch.codePointAt(0) < 256 ? 0.55 : 1;
  return n;
}

/* 按视觉宽度挑字号。容量 = (1200 - 80*2) / 字号 = 1040 / 字号。 */
function pickSize(v) {
  if (v <= 12) return { size: 76, perLine: 13 };
  if (v <= 24) return { size: 66, perLine: 15 };
  if (v <= 42) return { size: 54, perLine: 19 };
  return { size: 44, perLine: 23 };
}

function wrap(text, perLine, maxLines) {
  const lines = [];
  let cur = '';
  let w = 0;
  for (const ch of text) {
    const cw = ch.codePointAt(0) < 256 ? 0.55 : 1;
    if (w + cw > perLine && cur) {
      lines.push(cur);
      cur = '';
      w = 0;
    }
    cur += ch;
    w += cw;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    /* 只在**真的**被截断时才加省略号；正好 maxLines 行不加 */
    kept[maxLines - 1] = kept[maxLines - 1].slice(0, -1) + '…';
    return kept;
  }
  return lines;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── 画一张卡 ───────────────────────────────────────────────────────────── */
function ogSvg({ title, date }) {
  const { size, perLine } = pickSize(vlen(title));
  const lines = wrap(title, perLine, 3);
  const lineH = Math.round(size * 1.36);

  /* 标题整块的中心固定在 y=372（上下两条虚线之间偏上一点），行数变了也不漂 */
  const firstY = Math.round(372 - ((lines.length - 1) * lineH) / 2 + size * 0.34);

  const titleSvg = lines
    .map(
      (l, i) =>
        `<text x="${PAD}" y="${firstY + i * lineH}" font-family='${SANS}' font-size="${size}" fill="${INK}">${esc(l)}</text>`
    )
    .join('\n');

  /* 虚线：3-3 的 dash，与主题 `hr { border-top: 1px dashed }` 的节奏接近 */
  const dash = 'stroke-dasharray="3 3"';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${PAPER}"/>
<line x1="${PAD}" y1="72" x2="${W - PAD}" y2="72" stroke="${LINE}" stroke-width="1.5" ${dash}/>
<text x="${PAD}" y="146" font-family='${SANS}' font-size="23" letter-spacing="3" fill="${MUTED}">胡拉图说</text>
${titleSvg}
<line x1="${PAD}" y1="505" x2="${W - PAD}" y2="505" stroke="${LINE}" stroke-width="1.5" ${dash}/>
<text x="${PAD}" y="562" font-family='${MONO}' font-size="25" fill="${MUTED}">${esc(date)}</text>
<text x="${W - PAD}" y="562" text-anchor="end" font-family='${MONO}' font-size="22" fill="${MUTED}">hulatu.com</text>
</svg>`;
}

/* ── 读文章清单 ───────────────────────────────────────────────────────────
   用 `hugo list all` 而不是自己扫文件 —— 它已经处理好 draft、permalink、
   slug 生成这些事，是站内唯一的「真相来源」。
   ⚠️ 这里取到的 `slug` 必须与模板里 `.Slug` 的值一致，否则图生成了却取不到。 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQ = false;
      } else field += c;
    } else if (c === '"') {
      inQ = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadArticles() {
  const out = execFileSync('/opt/homebrew/bin/hugo', ['list', 'all'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const rows = parseCsv(out);
  const head = rows[0];
  const idx = (name) => head.indexOf(name);
  const iP = idx('path');
  const iS = idx('slug');
  const iT = idx('title');
  const iD = idx('date');
  const iK = idx('kind');
  const iSec = idx('section');

  return rows
    .slice(1)
    .filter((r) => r.length > iSec)
    .filter((r) => r[iK] === 'page' && (r[iSec] === 'posts' || r[iSec] === 'weekly'))
    .map((r) => ({
      path: r[iP],
      slug: r[iS],
      title: r[iT],
      date: (r[iD] || '').slice(0, 10),
    }))
    .filter((a) => a.slug && a.title);
}

/* ── 主流程 ─────────────────────────────────────────────────────────────── */
async function main() {
  const args = process.argv.slice(2);
  const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.slice(8)) : 0;

  let arts = loadArticles();
  if (only) arts = arts.filter((a) => a.slug === only);
  if (limit) arts = arts.slice(0, limit);

  if (!arts.length) {
    console.log('没有匹配的文章。');
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const t0 = Date.now();
  let total = 0;
  const bad = [];
  let sizeSeen = '';

  for (const a of arts) {
    /* slug 里出现非 ASCII 就说明这篇没写 slug（hugo 拿中文文件名兜底了）。
       这种图名进 URL 要转义，跳过并记下来，而不是硬生成一个编码可疑的文件。 */
    if (/[^\x20-\x7e]/.test(a.slug)) {
      bad.push(a);
      continue;
    }
    const svg = ogSvg(a);
    const out = path.join(OUT_DIR, `${a.slug}.png`);
    /* ⚠️ 这里**不能**传 { density: 96 }。sharp 对 SVG 输入会按 density/72
       缩放画布 —— 96 会让 1200×630 变成 1600×840（踩过：图是生成了，
       但尺寸不是 OG 图的标准值，而且白白多占 78% 的像素）。
       SVG 自己写了 width/height，用默认密度就正好是 1200×630。

       palette: true 走 8 位调色板 PNG：这张图只有「白底 + 黑字 + 一点蓝」，
       量化后 45KB → 24KB 左右，肉眼无差别（纯色底 + 抗锯齿文字是量化的最佳场景）。 */
    const info = await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9, palette: true })
      .toFile(out);
    total += info.size;
    if (!sizeSeen) sizeSeen = `${info.width}×${info.height}`;
  }

  const ms = Date.now() - t0;
  console.log(`生成 ${arts.length - bad.length} 张，尺寸 ${sizeSeen}，共 ${(total / 1024 / 1024).toFixed(2)} MB，用时 ${ms} ms`);
  console.log(`输出目录：${path.relative(ROOT, OUT_DIR)}`);
  if (bad.length) {
    console.log(`\n⚠️  ${bad.length} 篇没有英文 slug，已跳过（图名会带中文，进 URL 要转义）：`);
    for (const b of bad) console.log(`   ${b.path}`);
    console.log('   给这些文章的 front matter 补一个 slug: "some-english-slug" 再重跑。');
  }
}

main().catch((e) => {
  console.error('失败：', e.message);
  process.exit(1);
});

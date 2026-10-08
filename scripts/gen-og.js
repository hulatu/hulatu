#!/usr/bin/env node
/* 给每篇文章生成分享卡（OG image，1200×630）。
 *
 * 为什么要有这个脚本
 * ------------------
 * layouts/partials/head-meta.html 里一直有个 `cover` 字段，可以给单篇指定分享图，
 * 但**一篇文章都没用过** —— 于是 100 多篇文章分享到微信、微博、群里，全都是同一张
 * static/images/share.webp。这个脚本在构建前跑一遍，给每篇生成一张自己的卡。
 *
 * 视觉
 * ----
 * 直接照搬 DESIGN.md 的 token，不发明新东西：
 *   纸底   #f6f6f8  (= --paper)
 *   墨     #1d1d1f  (= --ink)
 *   灰     #56565c  (= --muted)
 *   发丝线 #e4e4e9  (= --line)
 *   印章红 #c73e2f  (= --accent)
 *   红底字 #fff8f5  (= --on-accent)
 * 字体也照抄那三条分工：标题衬线、站点名衬线、日期与域名等宽。
 * 等于把设计系统画成了一张图。
 *
 * 用法
 * ----
 *   NODE_PATH=<node_modules 路径> node scripts/gen-og.js
 *   NODE_PATH=... node scripts/gen-og.js --limit=3        # 只生成前 3 张，调试用
 *   NODE_PATH=... node scripts/gen-og.js --only=writing-tools
 *
 * 输出：static/images/og/<slug>.png
 * 用 slug 而不是文件名做图名 —— 文件名里有「：」「！」「+」「，」这类字符，
 * 进 URL 要转义，而 slug 都是干净的英文。
 *
 * 依赖：sharp（只用来把 SVG 光栅化成 PNG，不画任何东西）。
 *       中文字体走系统栈（Songti SC / PingFang SC / Menlo），不下载字体，
 *       和「不下载外部字体」那条原则一致。
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

/* ── 设计 token（和 assets/css/critical.css 的 :root 一一对应）───────────── */
const PAPER = '#f6f6f8';
const INK = '#1d1d1f';
const MUTED = '#56565c';
const LINE = '#e4e4e9';
const ACCENT = '#c73e2f';
const ON_ACCENT = '#fff8f5';

const SERIF = '"Songti SC", "STSong", "SimSun", Georgia, serif';
const SANS = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const MONO = 'Menlo, "SF Mono", Consolas, monospace';

const W = 1200;
const H = 630;
const PAD = 72;

/* ── 文本度量 ────────────────────────────────────────────────────────────
   中文按 1 个宽度单位、ASCII 按 0.5 算 —— 和 DESIGN.md 里「中英混排空距」
   那条的直觉一致（拉丁字符大约只有汉字一半宽）。够用，不必精确。 */
function vlen(s) {
  let n = 0;
  for (const ch of s) n += ch.codePointAt(0) < 256 ? 0.5 : 1;
  return n;
}

/* 按视觉宽度挑字号。容量 = (1200 - 72*2) / 字号。
   实测全站最长标题 23.5 个宽度单位，落在 68px 那一档（每行 15 字 → 2 行）。 */
function pickSize(v) {
  if (v <= 13) return { size: 78, perLine: 13 };
  if (v <= 26) return { size: 68, perLine: 15 };
  if (v <= 45) return { size: 56, perLine: 18 };
  return { size: 46, perLine: 22 };
}

function wrap(text, perLine, maxLines) {
  const lines = [];
  let cur = '';
  let w = 0;
  for (const ch of text) {
    const cw = ch.codePointAt(0) < 256 ? 0.5 : 1;
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
    // 只在**真的**被截断时才加省略号；正好 maxLines 行不加
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
  const lineH = Math.round(size * 1.34);
  // 标题整块的中心固定在 y=300，行数变了也不会上下漂
  const firstY = Math.round(300 - ((lines.length - 1) * lineH) / 2 + size * 0.34);

  const titleSvg = lines
    .map(
      (l, i) =>
        `<text x="${PAD}" y="${firstY + i * lineH}" font-family='${SERIF}' font-size="${size}" fill="${INK}">${esc(l)}</text>`
    )
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${PAPER}"/>
<rect x="${PAD}" y="72" width="56" height="56" rx="9" fill="${ACCENT}"/>
<text x="${PAD + 28}" y="112" text-anchor="middle" font-family='${SERIF}' font-size="34" fill="${ON_ACCENT}">胡</text>
<text x="${PAD + 76}" y="112" font-family='${SERIF}' font-size="30" fill="${INK}">胡拉图说</text>
${titleSvg}
<line x1="${PAD}" y1="505" x2="${W - PAD}" y2="505" stroke="${LINE}" stroke-width="2"/>
<text x="${PAD}" y="556" font-family='${MONO}' font-size="27" fill="${MUTED}">${esc(date)}</text>
<text x="${W - PAD}" y="556" text-anchor="end" font-family='${MONO}' font-size="25" fill="${MUTED}">hulatu.com</text>
</svg>`;
}

/* ── 读文章清单 ───────────────────────────────────────────────────────────
   用 `hugo list all` 而不是自己扫文件 —— 它已经处理好 draft、permalink、
   slug 生成这些事，是站内唯一的「真相来源」（后台的 permalink 缓存也用它）。 */
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
    // slug 里出现非 ASCII 就说明这篇没写 slug（hugo 拿中文文件名兜底了）。
    // 这种图名进 URL 要转义，跳过并记下来，而不是硬生成一个编码可疑的文件。
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

       palette: true 走 8 位调色板 PNG：这张图只有「纸底 + 墨字 + 一点红」，
       量化后 45KB → 24KB，肉眼无差别（纯色底 + 抗锯齿文字是量化的最佳场景）。
       137 张加起来从 6MB 降到 3MB 左右。 */
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

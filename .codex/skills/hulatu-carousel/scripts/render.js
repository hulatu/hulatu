#!/usr/bin/env node
/**
 * HULATU Carousel renderer — SVG + ImageMagick
 *
 * Usage:
 *   node render.js <manifest.json> <output-directory> [--dry-run] [--keep-svg]
 *
 * Reads manifest.json (slide objects per references/content-rules.md),
 * computes the layout deterministically, emits SVG layers, and renders
 * 1080×1440 PNG slides with ImageMagick (no browser, no npm dependencies).
 *
 * Env overrides:
 *   HULATU_FONT_BODY / HULATU_FONT_HEADING — font file paths
 *   MAGICK — path to ImageMagick binary (default: magick/convert on PATH)
 *
 * --dry-run 只生成 SVG 并做文案检查，不渲染 PNG。
 * --keep-svg 将每页的合并 SVG 写入 <out>/.preview/ 供人工检查。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

/* ============ 胡拉图 Design Tokens（与 references/design-system.md 保持一致） ============ */
const W = 1080;
const H = 1440;
const M = { x: 100, top: 110, bottom: 96 };
const COLORS = {
  bg: '#F7F6F2',
  ink: '#171717',
  muted: '#6B6B6B',
  hairline: '#D9D7D0',
  accent: '#A34A32',
};

const FONT_CANDIDATES = {
  body: [
    process.env.HULATU_FONT_BODY,
    '/System/Library/Fonts/Hiragino Sans GB.ttc',
    '/System/Library/AssetsV2/com_apple_MobileAsset_Font7/3419f2a427639ad8c8e139149a287865a90fa17e.asset/AssetData/PingFang.ttc',
    '/System/Library/Fonts/Supplemental/Songti.ttc',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    'C:/Windows/Fonts/msyh.ttc',
  ].filter(Boolean),
  heading: [
    process.env.HULATU_FONT_HEADING,
    '/System/Library/Fonts/STHeiti Medium.ttc',
    '/System/Library/AssetsV2/com_apple_MobileAsset_Font7/3419f2a427639ad8c8e139149a287865a90fa17e.asset/AssetData/PingFang.ttc',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
    'C:/Windows/Fonts/msyhbd.ttc',
  ].filter(Boolean),
};

/* ============ 工具与基础函数 ============ */

function usage() {
  console.error('用法: node render.js <manifest.json> <输出目录> [--dry-run] [--keep-svg]');
  process.exit(1);
}

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plain(v) {
  return String(v ?? '').replace(/<[^>]+>/g, '').trim();
}

function findFont(role) {
  for (const p of FONT_CANDIDATES[role]) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function findMagick() {
  const names = [];
  if (process.env.MAGICK) names.push(process.env.MAGICK);
  names.push('magick', 'convert');
  for (const n of names) {
    const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [n], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split('\n')[0];
  }
  for (const p of ['/opt/homebrew/bin/magick', '/usr/local/bin/magick', '/usr/local/bin/convert']) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function defaultFileName(i, total, type) {
  const n = String(i + 1).padStart(2, '0');
  if (i === 0) return `${n}-cover.png`;
  if (i === total - 1) return `${n}-cta.png`;
  if (type === 'quote') return `${n}-quote.png`;
  if (type === 'list') return `${n}-list.png`;
  return `${n}.png`;
}

/* ============ 文本度量与换行 ============ */

function isCJK(ch) {
  const c = ch.codePointAt(0);
  return c >= 0x2e80 && c <= 0x9fff;
}

function cw(ch, fs) {
  const c = ch.codePointAt(0);
  if (isCJK(ch) || (c >= 0x3000 && c <= 0x303f) || (c >= 0xff00 && c <= 0xffef)) return fs;
  if (c === 0x20) return fs * 0.3;
  if (c >= 0x30 && c <= 0x39) return fs * 0.56;
  if (c >= 0x41 && c <= 0x5a) return fs * 0.64;
  if (c >= 0x61 && c <= 0x7a) return fs * 0.52;
  return fs * 0.45;
}

function tokenize(text) {
  const tokens = [];
  let cur = '';
  let curCJK = null;
  for (const ch of Array.from(text)) {
    const isC = isCJK(ch);
    if (curCJK === null) curCJK = isC;
    if (isC !== curCJK) {
      tokens.push({ text: cur, cjk: curCJK });
      cur = ch;
      curCJK = isC;
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push({ text: cur, cjk: curCJK });
  return tokens;
}

function wrapRuns(runs, fs, maxW) {
  const lines = [];
  let cur = [];
  let curW = 0;
  const pushLine = () => {
    if (!cur.length) return;
    lines.push({ runs: cur, width: curW });
    cur = [];
    curW = 0;
  };

  for (const run of runs) {
    const size = run.size || fs;
    for (const token of tokenize(run.text)) {
      if (!token.cjk) {
        const w = token.text.split('').reduce((s, ch) => s + cw(ch, size), 0);
        if (curW + w > maxW && cur.length) pushLine();
        if (w > maxW) {
          for (const ch of token.text) {
            const cw1 = cw(ch, size);
            if (curW + cw1 > maxW && cur.length) pushLine();
            cur.push({ text: ch, size, color: run.color, font: run.font, width: cw1 });
            curW += cw1;
          }
        } else {
          cur.push({ text: token.text, size, color: run.color, font: run.font, width: w });
          curW += w;
        }
      } else {
        for (const ch of token.text) {
          const w = cw(ch, size);
          if (curW + w > maxW && cur.length) pushLine();
          cur.push({ text: ch, size, color: run.color, font: run.font, width: w });
          curW += w;
        }
      }
    }
  }
  pushLine();
  return lines;
}

function parseBody(body, baseColor) {
  const raw = String(body ?? '').trim();
  const paras = [];
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  let hasP = false;
  while ((m = pRe.exec(raw))) {
    hasP = true;
    paras.push(parseParagraph(m[1], baseColor));
  }
  if (!hasP && raw) paras.push(parseParagraph(raw, baseColor));
  return paras;
}

function parseParagraph(html, baseColor) {
  const runs = [];
  const parts = String(html).split(/(<strong[^>]*>|<\/strong>)/g);
  let strong = false;
  for (const part of parts) {
    if (/^<strong/i.test(part)) {
      strong = true;
      continue;
    }
    if (part === '</strong>') {
      strong = false;
      continue;
    }
    const text = part.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
    if (!text) continue;
    runs.push({ text, color: strong ? COLORS.accent : baseColor, font: strong ? 'heading' : 'body' });
  }
  return { runs };
}

/* ============ 版式绘制模型 ============ */

function newSlide() {
  return { shapes: [], texts: [] };
}

function rect(s, x, y, w, h, fill) {
  s.shapes.push({ kind: 'rect', x, y, w, h, fill });
}

function circle(s, cx, cy, r, fill) {
  s.shapes.push({ kind: 'circle', cx, cy, r, fill });
}

function text(s, x, y, content, size, color, font, anchor) {
  s.texts.push({ x, y, content, size, color, font, anchor });
}

function lineRuns(x, y, line, anchor) {
  const out = [];
  let ox = x;
  for (const r of line.runs) {
    out.push({ x: ox, y, content: r.text, size: r.size, color: r.color, font: r.font, anchor });
    ox += r.width;
  }
  return out;
}

/* ============ 各版式 ============ */

const CONTENT_TOP = 200;
const CONTENT_BOTTOM = 1310;

function masthead(s, kicker) {
  const base = 140;
  circle(s, M.x + 7, base - 11, 7, COLORS.accent);
  text(s, M.x + 30, base, '胡拉图说', 30, COLORS.ink, 'heading');
  if (kicker) text(s, W - M.x, base, kicker, 26, COLORS.muted, 'body', 'end');
}

function pager(s, page, total) {
  rect(s, M.x, 1320, W - M.x * 2, 1, COLORS.hairline);
  text(s, M.x, 1368, `${String(page).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, 26, COLORS.muted, 'body');
  text(s, W - M.x, 1368, '胡拉图说', 26, COLORS.muted, 'body', 'end');
}

function blockHeight(items) {
  return items.reduce((sum, it) => sum + it.h + (it.gapAfter || 0), 0);
}

function layoutCover(s, d) {
  const titleLines = wrapRuns([{ text: d.title || '', size: 84, color: COLORS.ink, font: 'heading' }], 84, W - M.x * 2);
  const subLines = d.subtitle
    ? wrapRuns([{ text: d.subtitle, size: 36, color: COLORS.muted, font: 'body' }], 36, W - M.x * 2)
    : [];
  const items = [
    { h: d.tag ? 39 : 0, gapAfter: d.tag ? 64 : 0 },
    { h: titleLines.length * 84 * 1.3, gapAfter: subLines.length ? 44 : 96 },
    { h: subLines.length * 36 * 1.7, gapAfter: subLines.length ? 96 : 0 },
    { h: d.meta ? 36 : 0, gapAfter: 0 },
  ];
  const total = blockHeight(items);
  let y = CONTENT_TOP + Math.max(0, (CONTENT_BOTTOM - CONTENT_TOP - total) / 2);

  if (d.tag) {
    const tagBaseline = y + 28 * 0.85;
    circle(s, M.x + 7, tagBaseline - 11, 7, COLORS.accent);
    text(s, M.x + 30, tagBaseline, d.tag, 28, COLORS.accent, 'heading');
    y += 39 + 64;
  }
  for (const line of titleLines) {
    for (const t of lineRuns(M.x, y + 0.85 * 84, line)) s.texts.push(t);
    y += 84 * 1.3;
  }
  y += subLines.length ? 44 : 96;
  for (const line of subLines) {
    for (const t of lineRuns(M.x, y + 0.85 * 36, line)) s.texts.push(t);
    y += 36 * 1.7;
  }
  if (subLines.length) y += 96;
  if (d.meta) text(s, M.x, y + 0.85 * 26, d.meta, 26, COLORS.muted, 'body');
  return total;
}

function layoutContent(s, d) {
  const titleLines = wrapRuns([{ text: d.title || '', size: 68, color: COLORS.ink, font: 'heading' }], 68, W - M.x * 2);
  const paras = parseBody(d.body, COLORS.ink).map((p) => wrapRuns(p.runs, 40, W - M.x * 2));
  const bodyH = paras.reduce((sum, ls) => sum + ls.length * 40 * 1.75 + 40, 0) - (paras.length ? 40 : 0);
  const total = titleLines.length * 68 * 1.3 + 60 + bodyH;
  let y = CONTENT_TOP + Math.max(0, (CONTENT_BOTTOM - CONTENT_TOP - total) / 2);

  for (const line of titleLines) {
    for (const t of lineRuns(M.x, y + 0.85 * 68, line)) s.texts.push(t);
    y += 68 * 1.3;
  }
  y += 60;
  for (const ls of paras) {
    for (const line of ls) {
      for (const t of lineRuns(M.x, y + 0.85 * 40, line)) s.texts.push(t);
      y += 40 * 1.75;
    }
    y += 40;
  }
  return total;
}

function layoutList(s, d) {
  const titleLines = wrapRuns([{ text: d.title || '', size: 62, color: COLORS.ink, font: 'heading' }], 62, W - M.x * 2);
  const items = (d.items || []).map((it) =>
    wrapRuns([{ text: String(it), size: 40, color: COLORS.ink, font: 'body' }], 40, W - M.x * 2 - 100),
  );
  let total = titleLines.length * 62 * 1.3 + 72;
  for (const ls of items) total += ls.length * 40 * 1.6 + 52;
  total -= 52;
  let y = CONTENT_TOP + Math.max(0, (CONTENT_BOTTOM - CONTENT_TOP - total) / 2);

  for (const line of titleLines) {
    for (const t of lineRuns(M.x, y + 0.85 * 62, line)) s.texts.push(t);
    y += 62 * 1.3;
  }
  y += 72;
  items.forEach((ls, i) => {
    const firstBaseline = y + 0.85 * 40;
    text(s, M.x, firstBaseline, String(i + 1).padStart(2, '0'), 38, COLORS.accent, 'heading');
    for (const line of ls) {
      for (const t of lineRuns(M.x + 100, y + 0.85 * 40, line)) s.texts.push(t);
      y += 40 * 1.6;
    }
    y += 52;
  });
  return total;
}

function layoutQuote(s, d) {
  const runs = [{ text: '「', size: 52, color: COLORS.accent, font: 'heading' }];
  runs.push(...parseBody(d.body, COLORS.ink)[0].runs);
  runs.push({ text: '」', size: 52, color: COLORS.accent, font: 'heading' });
  const lines = wrapRuns(runs, 52, W - M.x - 146);
  const srcH = d.src ? 28 * 1.6 : 0;
  const total = lines.length * 52 * 1.7 + (d.src ? 56 + srcH : 0);
  const y = CONTENT_TOP + Math.max(0, (CONTENT_BOTTOM - CONTENT_TOP - total) / 2);

  rect(s, M.x, y, 6, lines.length * 52 * 1.7, COLORS.accent);
  let ty = y;
  for (const line of lines) {
    for (const t of lineRuns(M.x + 46, ty + 0.85 * 52, line)) s.texts.push(t);
    ty += 52 * 1.7;
  }
  if (d.src) text(s, M.x + 46, ty + 56 + 0.85 * 28, d.src, 28, COLORS.muted, 'body');
  return total;
}

function layoutCta(s, d) {
  const cx = W / 2;
  const titleLines = wrapRuns([{ text: d.title || '', size: 76, color: COLORS.ink, font: 'heading' }], 76, W - M.x * 2);
  const subLines = d.body
    ? wrapRuns([{ text: plain(d.body), size: 34, color: COLORS.muted, font: 'body' }], 34, W - M.x * 2)
    : [];
  const items = [
    { h: 28 * 1.5, gapAfter: 48 },
    { h: titleLines.length * 76 * 1.3, gapAfter: 56 },
    { h: 2, gapAfter: 56 },
    { h: subLines.length * 34 * 1.6, gapAfter: subLines.length ? 44 : 0 },
    { h: 32 * 1.6, gapAfter: 0 },
  ];
  const total = blockHeight(items);
  let y = CONTENT_TOP + Math.max(0, (CONTENT_BOTTOM - CONTENT_TOP - total) / 2);

  text(s, cx, y + 0.85 * 28, d.kicker || '', 28, COLORS.accent, 'heading', 'middle');
  y += 28 * 1.5 + 48;
  for (const line of titleLines) {
    for (const t of lineRuns(cx - line.width / 2, y + 0.85 * 76, line)) s.texts.push(t);
    y += 76 * 1.3;
  }
  y += 56;
  rect(s, cx - 48, y, 96, 2, COLORS.hairline);
  y += 56;
  for (const line of subLines) {
    for (const t of lineRuns(cx - line.width / 2, y + 0.85 * 34, line)) s.texts.push(t);
    y += 34 * 1.6;
  }
  y += 44;
  text(s, cx, y + 0.85 * 32, 'hulatu.com', 32, COLORS.ink, 'body', 'middle');
  return total;
}

function buildSlide(d, page, total) {
  const s = newSlide();
  masthead(s, d.kicker || '');
  const t = d.type || 'content';
  let contentH = 0;
  if (t === 'cover') contentH = layoutCover(s, d);
  else if (t === 'list') contentH = layoutList(s, d);
  else if (t === 'quote') contentH = layoutQuote(s, d);
  else if (t === 'cta') contentH = layoutCta(s, d);
  else contentH = layoutContent(s, d);
  pager(s, page, total);
  if (contentH > CONTENT_BOTTOM - CONTENT_TOP) {
    console.warn(`  ⚠ 第 ${String(page).padStart(2, '0')} 页内容高度 ${Math.round(contentH)}px 超过内容区，可能溢出，请精简文案。`);
  }
  return s;
}

/* ============ SVG 输出与渲染 ============ */

function svgXml(s, layer) {
  const p = [];
  p.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  if (layer === 'base') p.push(`<rect width="${W}" height="${H}" fill="${COLORS.bg}"/>`);
  for (const sh of s.shapes) {
    if (layer === 'med') continue;
    if (sh.kind === 'rect') p.push(`<rect x="${sh.x}" y="${sh.y}" width="${sh.w}" height="${sh.h}" fill="${sh.fill}"/>`);
    else p.push(`<circle cx="${sh.cx}" cy="${sh.cy}" r="${sh.r}" fill="${sh.fill}"/>`);
  }
  for (const t of s.texts) {
    const want = layer === 'med' ? 'heading' : 'body';
    if (t.font !== want) continue;
    const anchor = t.anchor ? ` text-anchor="${t.anchor}"` : '';
    p.push(`<text x="${t.x}" y="${t.y}" font-size="${t.size}" fill="${t.color}"${anchor}>${esc(t.content)}</text>`);
  }
  p.push('</svg>');
  return p.join('\n');
}

function mergedSvg(s) {
  const p = [];
  p.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  p.push(`<rect width="${W}" height="${H}" fill="${COLORS.bg}"/>`);
  for (const sh of s.shapes) {
    if (sh.kind === 'rect') p.push(`<rect x="${sh.x}" y="${sh.y}" width="${sh.w}" height="${sh.h}" fill="${sh.fill}"/>`);
    else p.push(`<circle cx="${sh.cx}" cy="${sh.cy}" r="${sh.r}" fill="${sh.fill}"/>`);
  }
  for (const t of s.texts) {
    const anchor = t.anchor ? ` text-anchor="${t.anchor}"` : '';
    p.push(
      `<text x="${t.x}" y="${t.y}" font-size="${t.size}" fill="${t.color}" font-family="${t.font === 'heading' ? 'STHeiti Medium' : 'Hiragino Sans GB'}"${anchor}>${esc(t.content)}</text>`,
    );
  }
  p.push('</svg>');
  return p.join('\n');
}

function validateCopy(slide, i) {
  const problems = [];
  const t = slide.type || 'content';
  const title = plain(slide.title);
  const body = plain(slide.body);

  if (!['cover', 'content', 'list', 'quote', 'cta'].includes(t)) {
    problems.push(`type 非法: ${t}`);
  }
  if (t === 'cover') {
    if (title.length > 20) problems.push(`封面标题 ${title.length} 字，建议 ≤ 18`);
  } else if (t === 'cta') {
    if (!slide.title) problems.push('CTA 页缺 title');
  } else {
    if (title.length > 18) problems.push(`标题 ${title.length} 字，建议 ≤ 18`);
    if (t === 'list') {
      if (!Array.isArray(slide.items) || slide.items.length < 3 || slide.items.length > 4) {
        problems.push('list 页 items 应为 3–4 条');
      }
    } else if (t !== 'quote') {
      if (body.length < 30) problems.push(`正文仅 ${body.length} 字，建议 30–80`);
      if (body.length > 90) problems.push(`正文 ${body.length} 字，建议 ≤ 80`);
    }
  }
  if (problems.length) {
    console.warn(`  ⚠ 第 ${String(i + 1).padStart(2, '0')} 页: ${problems.join('；')}`);
  }
}

/* ============ 主流程 ============ */

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) usage();

  const manifestPath = path.resolve(args[0]);
  const outDir = path.resolve(args[1]);
  const dryRun = args.includes('--dry-run');
  const keepSvg = args.includes('--keep-svg');
  const slides = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(slides) || slides.length < 4 || slides.length > 12) {
    console.error(`manifest 应为 4–12 页的数组，当前 ${Array.isArray(slides) ? slides.length : '非数组'}`);
    process.exit(1);
  }

  const magick = findMagick();
  if (!magick && !dryRun) {
    console.error('未找到 ImageMagick。请安装（brew install imagemagick）或设置环境变量 MAGICK。');
    process.exit(1);
  }
  const fontBody = findFont('body');
  const fontHeading = findFont('heading');
  if ((!fontBody || !fontHeading) && !dryRun) {
    console.error(`字体缺失：body=${fontBody || '未找到'} heading=${fontHeading || '未找到'}`);
    console.error('可设置 HULATU_FONT_BODY / HULATU_FONT_HEADING 指定字体文件路径。');
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  if (keepSvg || dryRun) fs.mkdirSync(path.join(outDir, '.preview'), { recursive: true });

  console.log(dryRun ? 'dry-run 模式：只生成 SVG，不渲染 PNG' : `ImageMagick: ${magick}`);
  console.log(`正文字体: ${fontBody || '（dry-run 跳过）'}`);
  console.log(`标题字体: ${fontHeading || '（dry-run 跳过）'}`);
  console.log(`共 ${slides.length} 页 → ${outDir}`);

  let failed = 0;
  const total = slides.length;

  slides.forEach((slide, i) => {
    validateCopy(slide, i);
    const file = slide.file || defaultFileName(i, total, slide.type);
    const name = file.replace(/\.png$/, '');
    const s = buildSlide(slide, i + 1, total);

    if (dryRun || keepSvg) {
      fs.writeFileSync(path.join(outDir, '.preview', `slide-${String(i + 1).padStart(2, '0')}.svg`), mergedSvg(s));
    }
    if (dryRun) {
      console.log(`  · ${name}.svg 已生成`);
      return;
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hulatu-'));
    const baseSvg = path.join(tmp, 'base.svg');
    const medSvg = path.join(tmp, 'med.svg');
    const pngPath = path.join(outDir, file);
    fs.writeFileSync(baseSvg, svgXml(s, 'base'));
    fs.writeFileSync(medSvg, svgXml(s, 'med'));

    const res = spawnSync(
      magick,
      ['-font', fontBody, baseSvg, '-background', 'none', '-font', fontHeading, medSvg, '-composite', pngPath],
      { encoding: 'utf8', timeout: 90000 },
    );
    fs.rmSync(tmp, { recursive: true, force: true });

    if (res.status !== 0 || !fs.existsSync(pngPath)) {
      console.error(`  ✗ ${file} 渲染失败：${res.stderr.slice(0, 300)}`);
      failed += 1;
      return;
    }

    const dim = spawnSync(magick, [pngPath, '-format', '%w×%h', 'info:'], { encoding: 'utf8' });
    const dark = spawnSync(magick, [pngPath, '-colorspace', 'Gray', '-threshold', '50%', '-format', '%[fx:1-mean]', 'info:'], { encoding: 'utf8' });
    const okDim = dim.stdout.trim() === `${W}×${H}`;
    const ink = dark.status === 0 ? parseFloat(dark.stdout) : 0;
    const okInk = ink > 0.002 && ink < 0.25;
    if (!okDim) {
      console.error(`  ✗ ${file} 尺寸 ${dim.stdout.trim()}，应为 ${W}×${H}`);
      failed += 1;
    } else if (!okInk) {
      console.error(`  ✗ ${file} 墨迹占比异常 (${(ink * 100).toFixed(2)}%)，疑似空白页`);
      failed += 1;
    } else {
      console.log(`  ✓ ${file}  墨迹 ${(ink * 100).toFixed(1)}%`);
    }
  });

  if (failed) {
    console.error(`\n${failed} 页渲染失败，请检查 manifest 与字体。`);
    process.exit(1);
  }
  if (!dryRun && keepSvg) console.log(`\nSVG 预览已写入 ${path.join(outDir, '.preview')}`);
  console.log('\n全部完成。记得逐张打开 PNG 检查排版。');
}

module.exports = { buildSlide, svgXml, mergedSvg, W, H, COLORS };

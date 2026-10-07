/* ============================================================================
   博客后台的前端。
   无框架、无构建步骤 —— 直接改这个文件、刷新页面就生效。
   所有写操作都走 /api/*，真正的文件读写和命令执行都在 admin/server.py 里。
   ========================================================================== */

'use strict';

// 这个标记是给 index.html 底部的兜底提示用的：脚本只要加载成功就置位，
// 于是「被当成静态文件打开、app.js 404」那种情况就能被识别出来，
// 页面会显示一句「请通过后台服务打开」而不是一片空白。别删。
window.__BLOG_ADMIN_BOOTED__ = true;

/* ---------------------------------------------------------------- 状态 --- */

const S = {
  view: 'list',          // list | editor
  kind: 'posts',         // posts | weekly | pages
  status: 'all',         // all | draft | published
  q: '',
  sort: 'mtime',         // mtime | date | title
  cat: null,
  tag: null,
  docs: [],
  tax: { categories: [], tags: [], series: [] },
  site: null,
  doc: null,             // 当前打开的文章（含 body / frontRaw / fields）
  dirty: false,
  tab: 'settings',       // settings | source | preview
  previewBase: '',
  tagExpanded: false,
};

const KIND_LABEL = { posts: '文章', weekly: '周刊', pages: '页面' };
const KIND_HINT = {
  posts: '普通文章，正文走 /posts/年/月/日/slug/',
  weekly: '周刊，带期号徽章，另有独立的 RSS',
  pages: '独立页面（关于 / 归档 / Now 这类），直接挂在站点根目录',
};

/* 左栏导航的小图标。行内 SVG，不引外部资源 —— 首页是被 server.py 内联发出的，
   多一个 <link> 就多一处「静态打开时 404」的风险（见 MAINTENANCE 的已知的坑）。 */
const KIND_ICON = {
  posts: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 3.5h8L18.5 8.5v12h-13z"/><path d="M13.5 3.5v5h5"/><path d="M8.5 12.5h7M8.5 16h4.5"/></svg>',
  weekly: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3.5v3M16 3.5v3"/><path d="M8 14h3"/></svg>',
  pages: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.2 3.6 7.6 12 12l8.4-4.4z"/><path d="M3.6 12 12 16.4 20.4 12"/><path d="M3.6 16.2 12 20.6l8.4-4.4"/></svg>',
};

/* Markdown 工具栏图标。原来这里混着 ❝ ☑ 🔗 🖼 这些字符 —— 其中好几个在
   macOS 上会被系统按**彩色 emoji** 渲染，跟旁边的 B / H2 / </> 单色字形
   完全不是一个风格，整条工具栏看起来像拼的。
   统一换成同一套 1.7 描边 SVG（B / I / S / H2 / H3 / </> / • / 1. 这些
   本来就是通用写法，保持文字不变）。 */
const MDI = (() => {
  const s = (d, extra = '') =>
    `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ` +
    `stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}${extra}</svg>`;
  return {
    quote: s('<path d="M3.5 21.5c3 0 7-1 7-8V5.5c0-1.25-.756-2.017-2-2H4.5c-1.25 0-2 .75-2 1.972V11.5c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20.5c0 1 0 1 1 1z"/><path d="M15.5 21.5c3 0 7-1 7-8V5.5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11.5c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>'),
    task: s('<rect x="3.7" y="3.7" width="16.6" height="16.6" rx="4"/><path d="M8.3 12.3l2.7 2.7 5-5.5"/>'),
    link: s('<path d="M10.4 13.6a3.5 3.5 0 0 0 5 0l2.4-2.4a3.5 3.5 0 0 0-5-5l-1.1 1.1"/><path d="M13.6 10.4a3.5 3.5 0 0 0-5 0l-2.4 2.4a3.5 3.5 0 0 0 5 5l1.1-1.1"/>'),
    image: s('<rect x="3.7" y="4.9" width="16.6" height="14.2" rx="3"/><circle cx="9" cy="10.1" r="1.5"/><path d="M4.8 17.5 9.7 13l3.2 2.9 2.9-2.4 3.5 3"/>'),
    codeblock: s('<rect x="3.7" y="4.9" width="16.6" height="14.2" rx="3"/><path d="M10.5 9.8 8.1 12l2.4 2.2M13.5 9.8 15.9 12l-2.4 2.2"/>'),
    table: s('<rect x="3.7" y="4.9" width="16.6" height="14.2" rx="2.6"/><path d="M3.7 9.6h16.6M3.7 14.4h16.6M9.7 4.9v14.2"/>'),
    hr: s('<path d="M3.7 12h16.6" stroke-width="2"/>'),
    anchor: s('<path d="M12 9.2v11"/><circle cx="12" cy="5.7" r="2.4"/><path d="M5.2 12.6c0 3.8 3 6.8 6.8 6.8s6.8-3 6.8-6.8"/><path d="M8.3 12.6H5.2M18.8 12.6h-3.1"/>'),
  };
})();

/* ---------------------------------------------------------------- 工具 --- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 320);
  }, kind === 'bad' ? 4200 : 2200);
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }
  if (!res.ok) throw new Error((data && data.error) || `请求失败（${res.status}）`);
  return data;
}

const fmtDate = iso => (String(iso || '').match(/^\d{4}-\d{2}-\d{2}/) || [''])[0];

function dateToInput(raw) {
  const m = String(raw || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : '';
}

function localOffset() {
  const m = -new Date().getTimezoneOffset();
  const a = Math.abs(m);
  return (m >= 0 ? '+' : '-') + String(Math.floor(a / 60)).padStart(2, '0') + ':' + String(a % 60).padStart(2, '0');
}

function dateFromInput(v, raw) {
  if (!v) return raw || '';
  const off = (String(raw || '').match(/([+-]\d{2}:\d{2}|Z)$/) || [])[1] || localOffset();
  return (v.length === 16 ? v + ':00' : v) + off;
}

/* 弹层 --------------------------------------------------------------- */

function modal({ title, body, foot, wide, onMount }) {
  const host = $('#modal');
  $('#modal-card').className = 'modal-card' + (wide ? ' wide' : '');
  $('#modal-card').innerHTML = `
    <div class="modal-head">
      <h2>${esc(title)}</h2><span class="spacer"></span>
      <button class="icon-btn" data-close aria-label="关闭">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>
      </button>
    </div>
    <div class="modal-body">${body}</div>
    ${foot ? `<div class="modal-foot">${foot}</div>` : ''}`;
  host.hidden = false;
  host.onclick = e => { if (e.target === host) closeModal(); };
  $$('[data-close]', host).forEach(b => b.onclick = closeModal);
  if (onMount) onMount($('#modal-card'));
}

function closeModal() { $('#modal').hidden = true; $('#modal-card').innerHTML = ''; }

/* ------------------------------------------------------------ 数据加载 --- */

async function loadSite() {
  try {
    S.site = await api('/api/site');
    renderRail();
  } catch (e) { toast('读不到仓库状态：' + e.message, 'bad'); }
}

async function loadDocs() {
  const data = await api('/api/list');
  S.docs = data.docs;
  S.tax = data.taxonomy;
  renderRail();
  if (S.view === 'list') renderMain();
}

/* ---------------------------------------------------------------- 左栏 --- */

function renderRail() {
  const counts = { posts: 0, weekly: 0, pages: 0 };
  const drafts = { posts: 0, weekly: 0, pages: 0 };
  S.docs.forEach(d => {
    counts[d.kind] = (counts[d.kind] || 0) + 1;
    if (d.fields.draft) drafts[d.kind] = (drafts[d.kind] || 0) + 1;
  });

  $('#rail-nav').innerHTML = ['posts', 'weekly', 'pages'].map(k => `
    <button class="rail-item ${S.kind === k && S.view === 'list' ? 'is-on' : ''}" data-kind="${k}">
      ${KIND_ICON[k]}
      <span>${KIND_LABEL[k]}</span>
      ${drafts[k] ? `<span class="drafts">${drafts[k]} 草稿</span>` : ''}
      <span class="n">${counts[k] || 0}</span>
    </button>`).join('');

  $$('#rail-nav .rail-item').forEach(b => b.onclick = () => {
    S.kind = b.dataset.kind; S.cat = null; S.tag = null;
    goList(); renderRail(); renderMain();
  });

  $$('#status-chips .chip').forEach(c => {
    c.classList.toggle('is-on', c.dataset.status === S.status);
    c.onclick = () => { S.status = c.dataset.status; renderRail(); renderMain(); };
  });

  $('#cat-chips').innerHTML = S.tax.categories.map(c => `
    <button class="chip ${S.cat === c.name ? 'is-on' : ''}" data-cat="${esc(c.name)}">
      ${esc(c.name)}<span class="c">${c.count}</span></button>`).join('') || '<span class="hint">（还没有分类）</span>';
  $$('#cat-chips .chip').forEach(b => b.onclick = () => {
    S.cat = S.cat === b.dataset.cat ? null : b.dataset.cat;
    renderRail(); renderMain();
  });

  const tags = S.tagExpanded ? S.tax.tags : S.tax.tags.slice(0, 28);
  $('#tag-chips').innerHTML = tags.map(t => `
    <button class="chip ${S.tag === t.name ? 'is-on' : ''}" data-tag="${esc(t.name)}">${esc(t.name)}</button>`).join('');
  $$('#tag-chips .chip').forEach(b => b.onclick = () => {
    S.tag = S.tag === b.dataset.tag ? null : b.dataset.tag;
    renderRail(); renderMain();
  });
  const hidden = S.tax.tags.length - tags.length;
  $('#tag-note').innerHTML = (hidden > 0 || S.tagExpanded)
    ? `<button data-tag-toggle>${S.tagExpanded ? '收起' : `还有 ${hidden} 个`}</button>` : '';
  const tg = $('[data-tag-toggle]');
  if (tg) tg.onclick = () => { S.tagExpanded = !S.tagExpanded; renderRail(); };

  const g = S.site && S.site.git;
  if (g) {
    $('#git-state').innerHTML = g.dirty
      ? `<span class="dirty">● ${g.dirty} 处改动未提交</span>　发布时会一起提交`
      : `● 工作区干净　分支 <b>${esc(g.branch)}</b>`;
  }
  const running = S.site && S.site.preview && S.site.preview.running;
  $('#preview-dot').classList.toggle('is-on', !!running);
  $('#btn-preview').title = running ? '本地预览正在运行，点开站点' : '启动本地预览（hugo server）';
}

/* ------------------------------------------------------------ 列表视图 --- */

function visibleDocs() {
  const q = S.q.trim().toLowerCase();
  let out = S.docs.filter(d => d.kind === S.kind);
  if (S.status === 'draft') out = out.filter(d => d.fields.draft);
  if (S.status === 'published') out = out.filter(d => !d.fields.draft);
  if (S.cat) out = out.filter(d => (d.fields.categories || []).includes(S.cat));
  if (S.tag) out = out.filter(d => (d.fields.tags || []).includes(S.tag));
  if (q) {
    out = out.filter(d => {
      const hay = [
        d.fields.title, d.path, d.fields.summary, d.fields.description, d.fields.slug,
        (d.fields.categories || []).join(' '), (d.fields.tags || []).join(' '), d.fields.series,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }
  const by = {
    mtime: (a, b) => b.mtime - a.mtime,
    date: (a, b) => String(b.fields.date || '').localeCompare(String(a.fields.date || '')),
    title: (a, b) => String(a.fields.title || '').localeCompare(String(b.fields.title || ''), 'zh'),
  }[S.sort];
  return out.sort(by);
}

function goList() {
  if (S.dirty && !confirm('当前文章有未保存的改动，确定离开吗？')) return false;
  S.view = 'list'; S.doc = null; S.dirty = false;
  return true;
}

function renderMain() {
  if (S.view === 'editor') return;      // 编辑器自己管自己的 DOM
  const list = visibleDocs();
  const active = [S.cat && `分类：${S.cat}`, S.tag && `标签：${S.tag}`,
                  S.status !== 'all' && (S.status === 'draft' ? '只看草稿' : '只看已发布')].filter(Boolean);

  $('#main').innerHTML = `
  <div class="list-view">
    <div class="list-head">
      <h1>${KIND_LABEL[S.kind]}</h1>
      <span class="count">${list.length} 篇${S.docs.filter(d => d.kind === S.kind).length !== list.length ? ` / 共 ${S.docs.filter(d => d.kind === S.kind).length}` : ''}</span>
      <span class="spacer"></span>
      <label class="search">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
             stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>
        <input id="q" placeholder="搜标题、标签、正文外的字段…" value="${esc(S.q)}">
        <kbd>⌘K</kbd>
      </label>
      <select class="sel" id="sort">
        <option value="mtime" ${S.sort === 'mtime' ? 'selected' : ''}>按修改时间</option>
        <option value="date" ${S.sort === 'date' ? 'selected' : ''}>按发布日期</option>
        <option value="title" ${S.sort === 'title' ? 'selected' : ''}>按标题</option>
      </select>
      <button class="btn btn-primary" id="btn-new">＋ 新建</button>
    </div>

    ${active.length ? `<div class="filter-bar">
      <span class="label">筛选中</span>
      <span class="tagline">${active.map(a => `<span class="chip is-on">${esc(a)}</span>`).join('')}</span>
      <button class="btn btn-sm btn-ghost" id="btn-clear">清空</button>
    </div>` : ''}

    <div class="list-body">
      <div class="list-inner">
        ${list.length ? list.map(docRow).join('') : emptyHtml()}
      </div>
    </div>
  </div>`;

  const qi = $('#q');
  qi.oninput = debounce(() => { S.q = qi.value; renderMain(); $('#q').focus(); }, 180);
  $('#sort').onchange = e => { S.sort = e.target.value; renderMain(); };
  $('#btn-new').onclick = () => newDocModal(S.kind);
  const clr = $('#btn-clear');
  if (clr) clr.onclick = () => { S.cat = null; S.tag = null; S.status = 'all'; renderRail(); renderMain(); };

  $$('.doc').forEach(el => {
    const d = S.docs.find(x => x.path === el.dataset.path);
    el.onclick = e => {
      if (e.target.closest('button')) return;
      openDoc(d.path);
    };
    $$('button[data-act]', el).forEach(b => b.onclick = e => {
      e.stopPropagation();
      const act = b.dataset.act;
      if (act === 'open') openDoc(d.path);
      if (act === 'preview') openInSite(d);
      if (act === 'trash') trashDoc(d);
    });
  });
}

/* 空态。分两种：这个分组一篇都没有，和被筛选条件筛空了 —— 提示语不一样，
   不然「还没有内容」和「搜不到」长得一样，会让人以为文章丢了。 */
function emptyHtml() {
  const total = S.docs.filter(d => d.kind === S.kind).length;
  const none = total === 0;
  return `
  <div class="empty">
    <svg class="empty-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5.5 3.5h8L18.5 8.5v12h-13z"/><path d="M13.5 3.5v5h5"/><path d="M8.5 13h7M8.5 16.5h4"/>
    </svg>
    <b>${none ? `还没有${KIND_LABEL[S.kind]}` : '这里没有匹配的内容'}</b>
    <p>${none ? '点右上角「＋ 新建」开始写第一篇。'
              : '换个关键词，或者把左边的筛选条件清掉。'}</p>
  </div>`;
}

function docRow(d) {
  const f = d.fields || {};
  const badges = [
    f.draft ? '<span class="badge badge-draft">草稿</span>' : '<span class="badge badge-live">已发布</span>',
    f.issue ? `<span class="badge badge-issue">第 ${esc(f.issue)} 期</span>` : '',
    f.series ? `<span class="badge badge-series">系列 · ${esc(f.series)}</span>` : '',
  ].join(' ');
  const chips = [
    ...(f.categories || []).map(c => `<span class="badge">${esc(c)}</span>`),
    ...(f.tags || []).slice(0, 5).map(t => `<span class="badge">#${esc(t)}</span>`),
    (f.tags || []).length > 5 ? `<span class="badge">+${f.tags.length - 5}</span>` : '',
  ].join(' ');
  const sum = f.summary || f.description || '';
  return `
  <article class="doc ${f.draft ? 'is-draft' : ''}" data-path="${esc(d.path)}">
    <div class="doc-title"><span class="badges">${badges}</span>${esc(f.title || d.file)}</div>
    <div class="doc-side">
      <button class="btn btn-sm" data-act="preview" title="在本地站点里打开">预览</button>
      <button class="btn btn-sm" data-act="open">编辑</button>
      <button class="btn btn-sm btn-danger" data-act="trash" title="移到废纸篓">删除</button>
    </div>
    ${sum ? `<div class="doc-sum">${esc(sum)}</div>` : ''}
    <div class="doc-meta">
      <span>${fmtDate(f.date) || '—'}</span>
      <span class="sep">·</span><span>约 ${d.words} 字</span>
      <span class="sep">·</span><span>改于 ${esc(d.mtimeText)}</span>
      ${f.slug ? `<span class="sep">·</span><code>${esc(f.slug)}</code>` : ''}
      ${chips ? `<span class="sep">·</span>${chips}` : ''}
    </div>
  </article>`;
}

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* ------------------------------------------------------------ 打开文章 --- */

async function openDoc(path) {
  if (!goListGuard()) return;
  try {
    const doc = await api('/api/doc?path=' + encodeURIComponent(path));
    S.doc = doc; S.view = 'editor'; S.dirty = false; S.tab = 'settings';
    renderEditor();
  } catch (e) { toast('打不开：' + e.message, 'bad'); }
}

function goListGuard() {
  return !(S.dirty && !confirm('当前文章有未保存的改动，确定离开吗？'));
}

function renderEditor() {
  const d = S.doc, f = d.fields || {};
  const isWeekly = d.kind === 'weekly';
  const isPage = d.kind === 'pages';
  const slug = f.slug || '';

  $('#main').innerHTML = `
  <div class="editor">
    <div class="editor-bar">
      <button class="btn btn-sm" id="btn-back">← 返回</button>
      <span class="badge ${f.draft ? 'badge-draft' : 'badge-live'}" id="status-badge">${f.draft ? '草稿' : '已发布'}</span>
      <span class="path" title="${esc(d.path)}">${esc(d.path)}</span>
      <span class="spacer"></span>
      <button class="btn btn-sm btn-danger" id="btn-trash">删除</button>
      <button class="btn btn-sm" id="btn-save" title="保存（⌘S）">保存</button>
      <button class="btn btn-sm btn-primary" id="btn-publish-one">保存并发布</button>
    </div>

    <div class="editor-body" id="editor-body">
      <div class="editor-main">
        <textarea class="title-input" id="title" rows="1" placeholder="标题">${esc(f.title || '')}</textarea>
        <div class="md-bar" id="md-bar">
          <button class="tool" data-md="bold" title="加粗 ⌘B"><b>B</b></button>
          <button class="tool" data-md="italic" title="斜体 ⌘I"><i>I</i></button>
          <button class="tool" data-md="strike" title="删除线"><s>S</s></button>
          <button class="tool" data-md="code" title="行内代码">&lt;/&gt;</button>
          <span class="divider"></span>
          <button class="tool" data-md="h2" title="二级标题">H2</button>
          <button class="tool" data-md="h3" title="三级标题">H3</button>
          <button class="tool" data-md="quote" title="引用">${MDI.quote}</button>
          <button class="tool" data-md="ul" title="无序列表">•</button>
          <button class="tool" data-md="ol" title="有序列表">1.</button>
          <button class="tool" data-md="task" title="待办">${MDI.task}</button>
          <span class="divider"></span>
          <button class="tool" data-md="link" title="链接 ⌘L">${MDI.link}</button>
          <button class="tool" data-md="image" title="插入图片">${MDI.image}</button>
          <button class="tool" data-md="codeblock" title="代码块">${MDI.codeblock}</button>
          <button class="tool" data-md="table" title="表格">${MDI.table}</button>
          <button class="tool" data-md="hr" title="分隔线">${MDI.hr}</button>
          <span class="divider"></span>
          <button class="tool" data-md="anchor" title="给中文标题补 {#pinyin} 锚点">${MDI.anchor}</button>
          <span class="spacer"></span>
          <span class="stat" id="stat"></span>
        </div>
        <div class="md-area" id="md-area">
          <textarea id="body" spellcheck="false" placeholder="在这里开始写作……（可以直接把图片拖进来）">${esc(d.body)}</textarea>
        </div>
      </div>

      <aside class="editor-side">
        <div class="tabs">
          <button class="tab ${S.tab === 'settings' ? 'is-on' : ''}" data-tab="settings">设置</button>
          <button class="tab ${S.tab === 'source' ? 'is-on' : ''}" data-tab="source">源码</button>
          <button class="tab ${S.tab === 'preview' ? 'is-on' : ''}" data-tab="preview">预览</button>
        </div>
        <div class="tab-body" id="tab-body"></div>
      </aside>
    </div>
  </div>`;

  autoGrow($('#title'));
  $('#title').oninput = e => { autoGrow(e.target); markDirty(); };

  $('#btn-back').onclick = () => { if (goListGuard()) { S.view = 'list'; S.doc = null; S.dirty = false; renderMain(); } };
  $('#btn-save').onclick = () => saveDoc(false);
  $('#btn-publish-one').onclick = () => saveDoc(true);
  $('#btn-trash').onclick = () => trashDoc(d);

  $$('#md-bar .tool').forEach(b => b.onclick = () => mdAction(b.dataset.md));

  const body = $('#body');
  body.oninput = () => { updateStat(); markDirty(); };
  body.onkeydown = e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      body.setRangeText('  ', body.selectionStart, body.selectionEnd, 'end');
      updateStat(); markDirty();
    }
  };
  setupDrop(body.closest('#md-area'));

  $$('.tab').forEach(t => t.onclick = () => { S.tab = t.dataset.tab; renderEditor(); });
  renderTab();
  updateStat();
  updateSaveBtn();

  // 打开「预览」标签时自动把 hugo server 拉起来
  if (S.tab === 'preview') ensurePreview().then(() => renderTab());
}

function autoGrow(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 220) + 'px';
}

function updateStat() {
  const b = $('#body').value;
  const chars = b.replace(/\s+/g, '').length;
  const lines = b.split('\n').length;
  $('#stat').textContent = `约 ${chars} 字 · ${lines} 行`;
}

function markDirty() {
  S.dirty = true;
  updateSaveBtn();
}

function updateSaveBtn() {
  const btn = $('#btn-save');
  if (!btn) return;
  btn.textContent = S.dirty ? '保存 •' : '保存';
  btn.classList.toggle('is-dirty', S.dirty);
}

/* ------------------------------------------------------------ 设置面板 --- */

function renderTab() {
  const host = $('#tab-body');
  if (!host) return;
  if (S.tab === 'settings') host.innerHTML = settingsHtml();
  if (S.tab === 'source') host.innerHTML = sourceHtml();
  if (S.tab === 'preview') host.innerHTML = previewHtml();
  if (S.tab === 'settings') bindSettings();
  if (S.tab === 'source') bindSource();
  if (S.tab === 'preview') bindPreview();
}

function settingsHtml() {
  const d = S.doc, f = d.fields || {};
  const isWeekly = d.kind === 'weekly';
  const isPage = d.kind === 'pages';
  const sum = String(f.summary || '');
  const desc = String(f.description || '');

  const tokenField = (key, label, hint, values, suggestions) => `
    <div class="field">
      <label>${label}</label>
      <div class="token-box" data-token="${key}">
        ${(values || []).map(v => `<span class="token">${esc(v)}<button data-rm="${esc(v)}" aria-label="移除">×</button></span>`).join('')}
        <input placeholder="输入后回车" list="dl-${key}">
      </div>
      <datalist id="dl-${key}">${(suggestions || []).map(s => `<option value="${esc(s)}">`).join('')}</datalist>
      <div class="suggest">${(suggestions || []).slice(0, 8)
        .filter(s => !(values || []).includes(s))
        .map(s => `<button class="chip" data-add="${key}:${esc(s)}">＋ ${esc(s)}</button>`).join('')}</div>
      ${hint ? `<div class="hint">${hint}</div>` : ''}
    </div>`;

  return `
  <div class="field">
    <label>slug（URL 最后一段）</label>
    <div class="row">
      <input class="input mono" id="f-slug" value="${esc(f.slug || '')}" placeholder="留空则用文件名">
      <button class="btn btn-sm" id="btn-slug" title="按标题生成拼音">生成</button>
    </div>
    <div class="hint" id="slug-hint">${f.slug
      ? `访问地址：<code>${esc(d.url || '')}</code>`
      : '⚠️ 留空的话 URL 里会是一串中文（分享出去是百分号编码），建议填一个英文短语。'}</div>
  </div>

  <div class="field-pair">
    <div class="field">
      <label>发布日期</label>
      <input class="input" type="datetime-local" id="f-date" value="${dateToInput(f.date)}">
      <div class="hint">决定 URL 里的年月日</div>
    </div>
    <div class="field">
      <label>状态 <span class="badge ${f.draft ? 'badge-draft' : 'badge-live'}" id="draft-label">${f.draft ? '草稿' : '已发布'}</span></label>
      <label class="switch" style="padding-top:5px">
        <input type="checkbox" id="f-draft" ${f.draft ? 'checked' : ''}>
        <span class="track"></span>
        <span class="switch-label">标记为草稿</span>
      </label>
      <div class="hint">打开＝草稿，不会出现在线上</div>
    </div>
  </div>

  <div class="field">
    <label>摘要 summary <span class="hint" id="sum-count" style="margin:0"></span></label>
    <textarea class="textarea" id="f-summary" placeholder="首页列表里的一句话简介">${esc(sum)}</textarea>
    <div class="hint">建议 1 句话、90 字以内。留空的话列表里会没有简介。</div>
  </div>

  <div class="field">
    <label>描述 description <span class="hint" id="desc-count" style="margin:0"></span></label>
    <textarea class="textarea" id="f-description" placeholder="搜索结果和分享卡片上显示的描述">${esc(desc)}</textarea>
    <div class="hint ${desc.trim() ? '' : 'warn'}">建议 60–90 字。中文搜索结果大约只显示 78 字，写长了会被截断；留空会退回用 summary，分享出去常常是一句没头没尾的短句。</div>
  </div>

  ${tokenField('categories', '分类', '从现有分类里挑，别为此造新词。', f.categories, S.tax.categories.map(c => c.name))}
  ${tokenField('tags', '标签', '从现有标签里挑，否则标签云会越来越碎。', f.tags, S.tax.tags.map(t => t.name))}

  ${isWeekly ? `
  <div class="field">
    <label>期号 issue</label>
    <input class="input mono" id="f-issue" type="number" min="1" value="${esc(f.issue || '')}" placeholder="例如 25">
    <div class="hint">填了才会在文章顶部显示「周刊 · 第 N 期」徽章</div>
  </div>` : ''}

  ${isPage ? `
  <div class="field">
    <label>版式 layout</label>
    <input class="input mono" id="f-layout" value="${esc(f.layout || '')}" placeholder="留空 = 通用版式">
    <div class="hint">留空走 <code>layouts/_default/single.html</code>。填 <code>about</code> 之类会去找 <code>layouts/_default/about.html</code>，那个模板必须已经存在。</div>
  </div>` : ''}

  ${!isWeekly && !isPage ? `
  <div class="field">
    <label>系列 series</label>
    <input class="input" id="f-series" value="${esc(f.series || '')}" list="dl-series" placeholder="留空 = 单篇">
    <datalist id="dl-series">${S.tax.series.map(s => `<option value="${esc(s.name)}">`).join('')}</datalist>
    <div class="hint">只有「属于一组连载」时才填，名字要和同组其它篇完全一致（归档页按它分组）。</div>
  </div>` : ''}

  <div class="field">
    <label>其它</label>
    <label class="switch" style="margin-bottom:9px">
      <input type="checkbox" id="f-comments" ${f.comments === false ? '' : 'checked'}>
      <span class="track"></span><span class="switch-label">开启评论</span>
    </label>
    ${isPage ? `
    <label class="switch">
      <input type="checkbox" id="f-noindex" ${f.noindex ? 'checked' : ''}>
      <span class="track"></span><span class="switch-label">不被搜索引擎收录（noindex）</span>
    </label>` : ''}
  </div>

  <div class="field">
    <label>更新于 lastmod</label>
    <input class="input mono" value="${esc(f.lastmod || '—')}" disabled>
    <div class="hint">不用手改：<code>publish.sh</code> 会给这次真正改过的文章自动刷成当前时间，文章页的「更新于」靠它。</div>
  </div>`;
}

function bindSettings() {
  const d = S.doc;

  $('#f-slug').oninput = e => {
    markDirty();
    const h = $('#slug-hint');
    h.innerHTML = e.target.value
      ? '保存后生效，访问地址会变成 <code>/…/' + esc(e.target.value) + '/</code>'
      : '⚠️ 留空的话 URL 里会是一串中文（分享出去是百分号编码），建议填一个英文短语。';
  };

  $('#btn-slug').onclick = async () => {
    const title = $('#title').value.trim();
    if (!title) return toast('先写个标题', 'bad');
    const b = $('#btn-slug');
    b.disabled = true; b.textContent = '…';
    try {
      const { slug } = await api('/api/slug?title=' + encodeURIComponent(title));
      if (!slug) return toast('转写不出来，自己填一个吧', 'bad');
      $('#f-slug').value = slug;
      $('#f-slug').dispatchEvent(new Event('input'));
    } catch (e) { toast(e.message, 'bad'); }
    finally { b.disabled = false; b.textContent = '生成'; }
  };

  ['f-date', 'f-summary', 'f-description', 'f-series', 'f-issue', 'f-layout'].forEach(id => {
    const el = $('#' + id);
    if (el) el.oninput = markDirty;
  });

  const draft = $('#f-draft');
  if (draft) draft.onchange = () => {
    // 状态徽章挪到了字段标签里（原来贴在开关右边，开关是「关」的样子、
    // 旁边却写着「已发布」，读起来像「已发布 = 关」）。开关本身现在只表示
    // 「标记为草稿」这一件事，语义不再打架。
    const lbl = $('#draft-label');
    lbl.textContent = draft.checked ? '草稿' : '已发布';
    lbl.className = 'badge ' + (draft.checked ? 'badge-draft' : 'badge-live');
    const b = $('#status-badge');
    b.textContent = draft.checked ? '草稿' : '已发布';
    b.className = 'badge ' + (draft.checked ? 'badge-draft' : 'badge-live');
    markDirty();
  };
  ['f-comments', 'f-noindex'].forEach(id => { const el = $('#' + id); if (el) el.onchange = markDirty; });

  const count = (id, out, cap) => {
    const el = $('#' + id), o = $('#' + out);
    if (!el || !o) return;
    const upd = () => { o.textContent = `${el.value.trim().length} 字${el.value.trim().length > cap ? '（偏长）' : ''}`; };
    el.addEventListener('input', upd); upd();
  };
  count('f-summary', 'sum-count', 90);
  count('f-description', 'desc-count', 90);

  bindTokens();
}

function bindTokens() {
  $$('[data-token]').forEach(box => {
    const key = box.dataset.token;
    const input = $('input', box);
    const commit = () => {
      const v = input.value.trim();
      if (!v) return;
      const cur = currentTokens(box);
      if (!cur.includes(v)) {
        box.insertBefore(mkToken(v), input);
      }
      input.value = '';
      markDirty();
    };
    input.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
      if (e.key === 'Backspace' && !input.value) {
        const toks = $$('.token', box);
        if (toks.length) { toks[toks.length - 1].remove(); markDirty(); }
      }
    };
    input.onblur = commit;
    box.onclick = e => { if (e.target === box) input.focus(); };
    $$('.token button', box).forEach(b => b.onclick = () => { b.closest('.token').remove(); markDirty(); });
  });
  $$('[data-add]').forEach(b => b.onclick = () => {
    const [key, val] = b.dataset.add.split(/:(.+)/);
    const box = $(`[data-token="${key}"]`);
    if (box && !currentTokens(box).includes(val)) box.insertBefore(mkToken(val), $('input', box));
    markDirty();
  });
}

function currentTokens(box) { return $$('.token', box).map(t => t.firstChild.textContent.trim()); }

function mkToken(v) {
  const el = document.createElement('span');
  el.className = 'token';
  el.innerHTML = `${esc(v)}<button aria-label="移除">×</button>`;
  $('button', el).onclick = () => { el.remove(); markDirty(); };
  return el;
}

function sourceHtml() {
  const d = S.doc;
  return `
  <div class="field">
    <label>front matter 源码</label>
    <textarea class="src-editor" id="f-src" spellcheck="false">${esc(d.frontRaw || '')}</textarea>
    <div class="hint warn">这里改的是 <code>---</code> 之间的整块内容，保存时会原样写回（表单里那些字段也会被它覆盖）。
      平时用「设置」标签就够了；只有要写嵌套结构（比如关于页的 <code>about:</code>）时才来这儿。</div>
  </div>`;
}

function bindSource() {
  const ta = $('#f-src');
  ta.oninput = markDirty;
}

function previewHtml() {
  const d = S.doc;
  const running = S.previewBase;
  const url = running && d.url ? S.previewBase + d.url : '';
  return `
  <div class="preview-pane">
    <div class="preview-tools">
      <span class="url" title="${esc(url)}">${esc(url || '（还没有可预览的地址）')}</span>
      <button class="btn btn-sm" id="btn-reload" ${url ? '' : 'disabled'}>刷新</button>
      <button class="btn btn-sm" id="btn-wide" ${url ? '' : 'disabled'}>全屏</button>
    </div>
    ${url
      ? `<iframe class="preview-frame" id="pv" src="${esc(url)}"></iframe>`
      : `<div class="preview-empty">
           <p>${S.previewBase ? '这篇还没保存，或者 slug/日期改过还没生效 —— 先保存一次。'
                              : '本地预览还没启动。'}</p>
           <button class="btn btn-primary" id="btn-start-pv">启动本地预览</button>
         </div>`}
  </div>`;
}

function bindPreview() {
  const reload = $('#btn-reload');
  if (reload) reload.onclick = () => { const f = $('#pv'); f.src = f.src; };
  const wide = $('#btn-wide');
  if (wide) wide.onclick = () => {
    const url = S.previewBase + S.doc.url;
    modal({
      title: '预览 · ' + (S.doc.fields.title || S.doc.file), wide: true,
      body: `<iframe src="${esc(url)}" style="width:100%;height:100%;border:0;background:#fff"></iframe>`,
      foot: `<span class="note">${esc(url)}</span><span class="spacer"></span>
             <button class="btn" data-close>关闭</button>
             <button class="btn" id="btn-newtab">在浏览器里打开</button>`,
      onMount: root => {
        $('#btn-newtab', root).onclick = () => window.open(url, '_blank');
      },
    });
  };
  const start = $('#btn-start-pv');
  if (start) start.onclick = async () => {
    start.disabled = true; start.textContent = '正在启动 hugo server…';
    await ensurePreview();
    renderTab();
  };
}

/* ------------------------------------------------------------ Markdown --- */

function mdAction(kind) {
  const ta = $('#body');
  ta.focus();
  const wrap = (b, a = b) => {
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e);
    ta.setRangeText(b + (sel || '') + a, s, e, 'end');
    if (!sel) ta.setSelectionRange(s + b.length, s + b.length);
  };
  const prefix = p => {
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const start = value.lastIndexOf('\n', s - 1) + 1;
    let end = value.indexOf('\n', e);
    if (end === -1) end = value.length;
    const lines = value.slice(start, end).split('\n');
    const has = lines.every(l => !l.trim() || l.startsWith(p));
    const out = lines.map(l => {
      if (!l.trim()) return l;
      return has ? l.slice(p.length) : p + l;
    }).join('\n');
    ta.setRangeText(out, start, end, 'end');
  };
  const insert = text => {
    const s = ta.selectionStart;
    ta.setRangeText(text, s, ta.selectionEnd, 'end');
  };

  switch (kind) {
    case 'bold': wrap('**'); break;
    case 'italic': wrap('*'); break;
    case 'strike': wrap('~~'); break;
    case 'code': wrap('`'); break;
    case 'h2': prefix('## '); break;
    case 'h3': prefix('### '); break;
    case 'quote': prefix('> '); break;
    case 'ul': prefix('- '); break;
    case 'ol': prefix('1. '); break;
    case 'task': prefix('- [ ] '); break;
    case 'link': {
      const url = prompt('链接地址', 'https://');
      if (!url) return;
      const { selectionStart: s, selectionEnd: e, value } = ta;
      const sel = value.slice(s, e) || '链接文字';
      ta.setRangeText(`[${sel}](${url})`, s, e, 'end');
      break;
    }
    case 'image': imageModal(); return;
    case 'codeblock': insert('\n```\n' + '' + '\n```\n'); break;
    case 'table': insert('\n| 列 1 | 列 2 |\n| --- | --- |\n| 内容 | 内容 |\n'); break;
    case 'hr': insert('\n---\n'); break;
    case 'anchor': return anchorHint();
  }
  ta.focus();
  updateStat();
  markDirty();
}

function anchorHint() {
  modal({
    title: '关于中文标题锚点',
    body: `
      <p style="margin-top:0">正文里的小标题如果带中文，链接里会变成
      <code>#%e4%b9%a0%e6%83%af</code> 这种百分号编码。给它补一个显式锚点就行：</p>
      <pre class="log" style="min-height:auto">## 习惯养成 {#xi-guan-yang-cheng}</pre>
      <p>不想手动写：不用管它。<code>publish.sh</code> 在每次发布前会调用
      <code>scripts/add-heading-anchors.py</code>，用 macOS 自带的拼音库自动把缺的锚点补齐。</p>`,
    foot: '<span class="spacer"></span><button class="btn btn-primary" data-close>知道了</button>',
  });
}

function imageModal() {
  modal({
    title: '插入图片',
    body: `
      <div class="field">
        <label>图片地址</label>
        <input class="input mono" id="img-url" placeholder="https://img.hulatu.com/post/xxxx.jpeg">
        <div class="hint">正文图的老路子：先传到图床，再把地址贴过来。模板会自动套 Cloudflare 图片变换压缩。</div>
      </div>
      <div class="field">
        <label>说明文字（alt）</label>
        <input class="input" id="img-alt" placeholder="这张图是什么">
        <div class="hint">会写进 <code>alt</code> 和图片下方的图注，别留空。</div>
      </div>
      <div class="field">
        <label>或者，从本地选一张</label>
        <input type="file" id="img-file" accept="image/*">
        <div class="hint warn">本地图片会被存进 <code>static/images/uploads/</code> 并随仓库一起提交（体积会进 git 历史）。
        长期看还是传图床更干净。</div>
      </div>`,
    foot: `<span class="spacer"></span>
           <button class="btn" data-close>取消</button>
           <button class="btn btn-primary" id="img-ok">插入</button>`,
    onMount: root => {
      $('#img-ok', root).onclick = async () => {
        const ta = $('#body');
        const alt = $('#img-alt').value.trim();
        const file = $('#img-file').files[0];
        let src = $('#img-url').value.trim();
        if (file) {
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'X-File-Name': encodeURIComponent(file.name), 'Content-Type': 'application/octet-stream' },
              body: file,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '上传失败');
            src = data.src;
            toast('已存到 ' + data.path, 'ok');
          } catch (e) { return toast(e.message, 'bad'); }
        }
        if (!src) return toast('填个地址，或者选一张本地图片', 'bad');
        const s = ta.selectionStart;
        ta.setRangeText(`![${alt}](${src})`, s, ta.selectionEnd, 'end');
        ta.focus(); updateStat(); markDirty();
        closeModal();
      };
    },
  });
}

/* 拖拽图片到正文 */
function setupDrop(area) {
  if (!area) return;
  const ta = $('#body');
  ['dragenter', 'dragover'].forEach(ev => area.addEventListener(ev, e => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault(); area.classList.add('is-dropping');
  }));
  ['dragleave', 'drop'].forEach(ev => area.addEventListener(ev, e => {
    if (ev === 'dragleave' && area.contains(e.relatedTarget)) return;
    area.classList.remove('is-dropping');
  }));
  area.addEventListener('drop', async e => {
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    for (const f of files) {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'X-File-Name': encodeURIComponent(f.name), 'Content-Type': 'application/octet-stream' },
          body: f,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '上传失败');
        const alt = f.name.replace(/\.[^.]+$/, '');
        const s = ta.selectionStart;
        ta.setRangeText(`![${alt}](${data.src})\n`, s, ta.selectionEnd, 'end');
        ta.focus(); updateStat(); markDirty();
        toast('已插入 ' + data.src, 'ok');
      } catch (err) { toast(f.name + '：' + err.message, 'bad'); }
    }
  });
}

/* ------------------------------------------------------------ 保存 --- */

function collectFields() {
  const f = {};
  const title = $('#title').value.trim();
  if (title) f.title = title;
  const slug = $('#f-slug').value.trim();
  f.slug = slug;
  const dateEl = $('#f-date');
  if (dateEl) f.date = dateFromInput(dateEl.value, (S.doc.fields || {}).date);
  if ($('#f-draft')) f.draft = $('#f-draft').checked;
  if ($('#f-summary')) f.summary = $('#f-summary').value.trim();
  if ($('#f-description')) f.description = $('#f-description').value.trim();
  if ($('#f-series')) f.series = $('#f-series').value.trim();
  if ($('#f-issue')) f.issue = $('#f-issue').value.trim();
  if ($('#f-layout')) f.layout = $('#f-layout').value.trim();
  if ($('#f-comments')) f.comments = $('#f-comments').checked;
  if ($('#f-noindex')) f.noindex = $('#f-noindex').checked;
  ['categories', 'tags'].forEach(k => {
    const box = $(`[data-token="${k}"]`);
    if (box) f[k] = currentTokens(box);
  });
  return f;
}

async function saveDoc(thenPublish) {
  if (!S.doc) return false;
  const btn = $('#btn-save');
  btn.disabled = true;
  try {
    const payload = { path: S.doc.path, body: $('#body').value };
    if (S.tab === 'source') payload.frontRaw = $('#f-src').value;
    else payload.fields = collectFields();

    const updated = await api('/api/save', { method: 'POST', body: payload });
    S.doc = updated;
    S.dirty = false;
    updateSaveBtn();
    updateStat();
    // 保存后 URL 可能变了（改了 slug / 日期），把预览地址同步过去
    if (S.tab === 'preview') renderTab();
    toast('已保存', 'ok');
    await loadDocs();
    if (thenPublish) publishModal();
    return true;
  } catch (e) {
    toast('保存失败：' + e.message, 'bad');
    return false;
  } finally {
    btn.disabled = false;
  }
}

/* ------------------------------------------------------------ 新建 --- */

async function newDocModal(kind = 'posts') {
  let k = kind;
  let issueInfo = null;

  const body = () => `
    <div class="kind-tabs" id="kind-tabs">
      ${['posts', 'weekly', 'pages'].map(x => `
        <button class="kind-tab ${k === x ? 'is-on' : ''}" data-k="${x}">
          <b>${KIND_LABEL[x]}</b><small>${KIND_HINT[x]}</small>
        </button>`).join('')}
    </div>

    <div class="field">
      <label>标题</label>
      <input class="input" id="n-title" placeholder="文章标题" autofocus>
    </div>

    <div class="field">
      <label>文件名</label>
      <input class="input mono" id="n-file" placeholder="会自动跟随标题">
      <div class="hint" id="n-file-hint"></div>
    </div>

    ${k !== 'pages' ? `
    <div class="field">
      <label>slug（URL 最后一段）</label>
      <div class="row">
        <input class="input mono" id="n-slug" placeholder="留空则用文件名">
        <button class="btn btn-sm" id="n-slug-gen">生成</button>
      </div>
      <div class="hint">建议填：留空的话 URL 是一串中文。</div>
    </div>` : ''}

    ${k === 'weekly' ? `
    <div class="field">
      <label>期号</label>
      <input class="input mono" id="n-issue" type="number" min="1">
      <div class="hint" id="n-issue-hint"></div>
    </div>` : ''}

    ${k === 'pages' ? `
    <div class="field">
      <label>加入顶部导航</label>
      <label class="switch" style="margin-bottom:8px">
        <input type="checkbox" id="n-menu">
        <span class="track"></span><span class="switch-label">在导航栏加一个入口</span>
      </label>
      <div class="field-pair" id="n-menu-opts" style="display:none">
        <input class="input" id="n-menu-name" placeholder="导航里显示的名字">
        <input class="input mono" id="n-menu-weight" type="number" placeholder="排序权重">
      </div>
      <div class="hint">会往 <code>hugo.toml</code> 的 <code>[menu]</code> 段追加一条（改前会先备份不了，但改动很小、只有 3 行）。</div>
    </div>` : ''}

    <div class="field">
      <label>分类</label>
      <div class="token-box" data-token="categories">
        ${k === 'weekly' ? '<span class="token">周刊<button aria-label="移除">×</button></span>' : ''}
        <input placeholder="输入后回车">
      </div>
      <div class="suggest">${S.tax.categories.slice(0, 8).map(c =>
        `<button class="chip" data-add="categories:${esc(c.name)}">＋ ${esc(c.name)}</button>`).join('')}</div>
    </div>

    <div class="field">
      <label>标签</label>
      <div class="token-box" data-token="tags"><input placeholder="输入后回车"></div>
      <div class="suggest">${S.tax.tags.slice(0, 10).map(t =>
        `<button class="chip" data-add="tags:${esc(t.name)}">＋ ${esc(t.name)}</button>`).join('')}</div>
    </div>

    <div class="field">
      <label>状态</label>
      <label class="switch">
        <input type="checkbox" id="n-draft" checked>
        <span class="track"></span><span class="switch-label">先存成草稿（推荐）</span>
      </label>
    </div>`;

  const mount = root => {
    const title = $('#n-title', root);
    const file = $('#n-file', root);
    const hint = $('#n-file-hint', root);
    let fileTouched = false;

    const defaultFile = () => {
      const t = title.value.trim();
      if (k === 'weekly') {
        const n = issueInfo ? issueInfo.cn : '';
        return n ? `胡拉图的周刊-第${n}期.md` : (t ? t + '.md' : '');
      }
      return t ? t + '.md' : '';
    };
    const syncFile = () => {
      if (fileTouched) return;
      file.value = defaultFile();
      hint.textContent = file.value ? `会创建 content/${k === 'posts' ? 'posts/' : k === 'weekly' ? 'weekly/' : ''}${file.value}` : '';
    };
    title.oninput = syncFile;
    file.oninput = () => { fileTouched = true; syncFile(); };

    // 周刊：自动取下一期期号
    if (k === 'weekly') {
      api('/api/next-issue').then(info => {
        issueInfo = info;
        const n = $('#n-issue', root);
        if (n && !n.value) n.value = info.issue;
        if ($('#n-issue-hint', root)) $('#n-issue-hint', root).textContent = `现有最大期号是 ${info.issue - 1}，这里预填了第 ${info.issue} 期。`;
        syncFile();
      }).catch(() => {});
    }

    const menu = $('#n-menu', root);
    if (menu) {
      const opts = $('#n-menu-opts', root);
      menu.onchange = () => { opts.style.display = menu.checked ? '' : 'none'; };
      title.addEventListener('input', () => {
        const nm = $('#n-menu-name', root);
        if (nm && !nm.value) nm.placeholder = title.value.trim() || '导航名';
      });
    }

    bindTokensIn(root);

    $('#n-slug-gen', root) && ($('#n-slug-gen', root).onclick = async e => {
      const t = title.value.trim();
      if (!t) return toast('先写标题', 'bad');
      e.target.disabled = true;
      try {
        const { slug } = await api('/api/slug?title=' + encodeURIComponent(t));
        if (!slug) return toast('转写不出来，自己填一个吧', 'bad');
        $('#n-slug', root).value = slug;
      } catch (err) { toast(err.message, 'bad'); }
      finally { e.target.disabled = false; }
    });

    $$('#kind-tabs .kind-tab', root).forEach(b => b.onclick = () => {
      k = b.dataset.k;
      reopen();
    });
    title.focus();
  };

  const reopen = () => modal({
    title: '新建', body: body(),
    foot: `<span class="spacer"></span><button class="btn" data-close>取消</button>
           <button class="btn btn-primary" id="n-ok">创建并编辑</button>`,
    onMount: root => { mount(root); $('#n-ok', root).onclick = () => submit(root); },
  });

  const submit = async root => {
    const t = $('#n-title', root).value.trim();
    if (!t) return toast('标题不能为空', 'bad');
    const payload = {
      kind: k,
      title: t,
      filename: $('#n-file', root).value.trim() || t,
      draft: $('#n-draft', root).checked,
      categories: currentTokens($('[data-token="categories"]', root)),
      tags: currentTokens($('[data-token="tags"]', root)),
    };
    if ($('#n-slug', root)) payload.slug = $('#n-slug', root).value.trim();
    if ($('#n-issue', root)) payload.issue = $('#n-issue', root).value.trim();
    if ($('#n-menu', root) && $('#n-menu', root).checked) {
      payload.addToMenu = true;
      payload.menuName = $('#n-menu-name', root).value.trim() || t;
      payload.menuWeight = $('#n-menu-weight', root).value.trim();
    }
    try {
      const doc = await api('/api/create', { method: 'POST', body: payload });
      closeModal();
      toast(doc.menuAdded ? '已创建，并加进顶部导航' : '已创建', 'ok');
      await loadDocs();
      await loadSite();
      S.doc = doc; S.view = 'editor'; S.dirty = false; S.tab = 'settings';
      renderEditor();
    } catch (e) { toast('创建失败：' + e.message, 'bad'); }
  };

  reopen();
}

/* 弹窗里的 token 组件（复用绑定逻辑，作用域限定在弹窗内） */
function bindTokensIn(root) {
  $$('[data-token]', root).forEach(box => {
    const input = $('input', box);
    const commit = () => {
      const v = input.value.trim();
      if (!v) return;
      if (!currentTokens(box).includes(v)) box.insertBefore(mkToken(v), input);
      input.value = '';
    };
    input.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
      if (e.key === 'Backspace' && !input.value) {
        const toks = $$('.token', box);
        if (toks.length) toks[toks.length - 1].remove();
      }
    };
    input.onblur = commit;
    box.onclick = e => { if (e.target === box) input.focus(); };
    $$('.token button', box).forEach(b => b.onclick = () => b.closest('.token').remove());
  });
  $$('[data-add]', root).forEach(b => b.onclick = () => {
    const i = b.dataset.add.indexOf(':');
    const key = b.dataset.add.slice(0, i), val = b.dataset.add.slice(i + 1);
    const box = $(`[data-token="${key}"]`, root);
    if (box && !currentTokens(box).includes(val)) box.insertBefore(mkToken(val), $('input', box));
  });
}

/* ------------------------------------------------------------ 删除 --- */

async function trashDoc(d) {
  const t = (d.fields && d.fields.title) || d.file;
  if (!confirm(`把《${t}》移到废纸篓？\n\n不是永久删除，可以从废纸篓找回。`)) return;
  try {
    const res = await api('/api/trash', { method: 'POST', body: { path: d.path } });
    toast('已移到废纸篓', 'ok');
    if (S.doc && S.doc.path === d.path) { S.view = 'list'; S.doc = null; S.dirty = false; }
    await loadDocs(); await loadSite();
    renderMain();
    console.info('移到：', res.movedTo);
  } catch (e) { toast('删除失败：' + e.message, 'bad'); }
}

/* ------------------------------------------------------------ 预览 --- */

async function ensurePreview() {
  if (S.previewBase) {
    const st = await api('/api/preview').catch(() => null);
    if (st && st.running) return S.previewBase;
  }
  const st = await api('/api/preview/start', { method: 'POST', body: {} });
  if (!st.running) throw new Error('hugo server 没起来，看看终端里的输出');
  S.previewBase = st.base;
  S.site = { ...(S.site || {}), preview: st };
  renderRail();
  return S.previewBase;
}

async function openInSite(d) {
  if (!d.url) return toast('这篇还没有可访问的地址，先保存一次', 'bad');
  try {
    const base = await ensurePreview();
    window.open(base + d.url, '_blank');
  } catch (e) { toast(e.message, 'bad'); }
}

$('#btn-preview').onclick = async () => {
  const running = S.site && S.site.preview && S.site.preview.running;
  if (running) { window.open(S.previewBase || `http://127.0.0.1:${S.site.preview.port}/`, '_blank'); return; }
  const b = $('#btn-preview');
  b.disabled = true;
  try {
    const base = await ensurePreview();
    toast('预览已启动', 'ok');
    window.open(base + '/', '_blank');
  } catch (e) { toast(e.message, 'bad'); }
  finally { b.disabled = false; }
};

/* ------------------------------------------------------------ 发布 --- */

$('#btn-publish').onclick = () => publishModal();

function publishModal() {
  modal({
    title: '发布上线',
    body: `
      <p style="margin-top:0;color:var(--muted);font-size:13px">
        会执行仓库里的 <code>./publish.sh</code>：先跑几个前置脚本（抓图片尺寸、刷花园页快照、补中文锚点、刷新 lastmod），
        然后 <b>把当前所有改动一起提交</b>、推送 GitHub。Cloudflare Pages 收到推送后自动重建。
      </p>
      <div class="log" id="pub-log">准备中…</div>`,
    foot: `<span class="spacer"></span>
           <button class="btn" id="pub-close">关闭</button>`,
    onMount: () => { $('#pub-close').onclick = closeModal; runPublish(); },
  });
}

async function runPublish() {
  const log = $('#pub-log');
  const write = (text, cls = '') => {
    const span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = text + '\n';
    log.appendChild(span);
    log.scrollTop = log.scrollHeight;
  };
  log.textContent = '';
  try {
    const res = await fetch('/api/publish', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    if (!res.ok || !res.body) throw new Error('发布接口没响应');
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === 'log') write(ev.line);
        if (ev.type === 'done') {
          write(ev.ok ? '✓ 发布完成，Cloudflare 会自动重建' : `✗ 发布中断（退出码 ${ev.code}），上面的日志里有原因`,
                ev.ok ? 'ok' : 'bad');
          toast(ev.ok ? '已推送，等 Cloudflare 重建' : '发布失败，看日志', ev.ok ? 'ok' : 'bad');
          await loadSite();
          await loadDocs();
        }
      }
    }
  } catch (e) {
    write('✗ ' + e.message, 'bad');
    toast('发布失败：' + e.message, 'bad');
  }
}

/* ------------------------------------------------------------ 导航菜单 --- */

function menuModal() {
  const items = (S.site && S.site.menu) || [];
  const rows = () => $$('#menu-rows .menu-row').map(r => ({
    name: $('input[name=name]', r).value.trim(),
    url: $('input[name=url]', r).value.trim(),
    weight: Number($('input[name=weight]', r).value) || 0,
  }));

  const row = (it, i) => `
    <div class="menu-row" style="display:grid;grid-template-columns:1fr 1.4fr 64px 28px;gap:6px;margin-bottom:6px">
      <input class="input" name="name" value="${esc(it.name || '')}" placeholder="名字">
      <input class="input mono" name="url" value="${esc(it.url || '')}" placeholder="/now/">
      <input class="input mono" name="weight" type="number" value="${esc(it.weight || '')}" placeholder="排序">
      <button class="icon-btn" data-del-row aria-label="删除这一条">×</button>
    </div>`;

  modal({
    title: '顶部导航菜单',
    body: `
      <p style="margin-top:0;color:var(--muted);font-size:13px">
        对应 <code>hugo.toml</code> 里的 <code>[[menu.main]]</code>。数字越小排越前。
      </p>
      <div id="menu-rows">${items.map(row).join('')}</div>
      <button class="btn btn-sm" id="menu-add">＋ 加一条</button>`,
    foot: `<span class="spacer"></span>
           <button class="btn" data-close>取消</button>
           <button class="btn btn-primary" id="menu-save">保存</button>`,
    onMount: root => {
      const bindDel = () => $$('[data-del-row]', root).forEach(b => b.onclick = () => b.closest('.menu-row').remove());
      bindDel();
      $('#menu-add', root).onclick = () => {
        $('#menu-rows', root).insertAdjacentHTML('beforeend', row({ weight: 9 }, 0));
        bindDel();
      };
      $('#menu-save', root).onclick = async () => {
        try {
          await api('/api/menu', { method: 'POST', body: { menu: rows() } });
          closeModal(); toast('导航已更新，记得发布', 'ok');
          await loadSite();
        } catch (e) { toast('保存失败：' + e.message, 'bad'); }
      };
    },
  });
}

/* ------------------------------------------------------------ 键盘 --- */

document.addEventListener('keydown', e => {
  const mod = e.metaKey || e.ctrlKey;
  if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); return; }
  if (mod && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (S.view === 'editor') saveDoc(false);
    return;
  }
  if (mod && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (S.view !== 'list') { if (goListGuard()) { S.view = 'list'; S.doc = null; renderMain(); } }
    const q = $('#q'); if (q) q.focus();
    return;
  }
  if (mod && e.key.toLowerCase() === 'b' && S.view === 'editor') { e.preventDefault(); mdAction('bold'); }
  if (mod && e.key.toLowerCase() === 'i' && S.view === 'editor') { e.preventDefault(); mdAction('italic'); }
});

window.addEventListener('beforeunload', e => {
  if (S.dirty) { e.preventDefault(); e.returnValue = ''; }
});

/* 主题切换 ------------------------------------------------------------- */

// 主题要在任何渲染之前定下来，否则选了深色的人每次刷新都会先闪一下白
const savedTheme = localStorage.getItem('blog-admin-theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

$('#btn-theme').onclick = () => {
  const cur = document.documentElement.dataset.theme
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = cur === 'dark' ? 'light' : 'dark';
  localStorage.setItem('blog-admin-theme', document.documentElement.dataset.theme);
};

/* ------------------------------------------------------------ 启动 --- */

(async function boot() {
  try {
    await Promise.all([loadSite(), loadDocs()]);
    if (!S.site.hugoOk) {
      toast('没找到 hugo 命令，预览和新建会不可用', 'bad');
    }
    renderMain();
    // 侧栏底部补一个「导航菜单」入口
    const foot = $('.rail-actions');
    const menuBtn = document.createElement('button');
    // 不用 btn-ghost：窄屏堆叠时它是整宽的一行，透明底会看起来像一行游离的文字
    menuBtn.className = 'btn';
    menuBtn.textContent = '导航菜单';
    menuBtn.style.gridColumn = '1 / -1';
    menuBtn.onclick = menuModal;
    foot.parentNode.insertBefore(menuBtn, foot);
  } catch (e) {
    $('#main').innerHTML = `<div class="empty">
      <b>连不上后台服务</b>
      <p>${esc(e.message)}</p>
      <p>确认 <code>admin/server.py</code> 还在跑（终端窗口别关）。</p>
    </div>`;
  }
})();

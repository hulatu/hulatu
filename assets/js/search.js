// search.js —— 中文友好增强版
(function () {
  const btn = document.querySelector('.search-trigger');
  const box = document.getElementById('search-overlay');
  const closeBtn = document.getElementById('search-close');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const empty = document.getElementById('search-empty');
  if (!btn || !box) return;

  let fuse = null, posts = [], loaded = false, loading = false, timer;

  /* ---------- 索引加载（带状态反馈） ---------- */
  async function load() {
    if (loaded || loading) return;
    loading = true;
    showTip('索引加载中…');
    const url = document.querySelector('script[data-search-index]')?.dataset.searchIndex || '/search-index.json';
    try {
      posts = await fetch(url).then((r) => r.json());
      fuse = new Fuse(posts, {
        keys: [
          { name: 'title', weight: 0.5 },
          { name: 'categories', weight: 0.1 },
          { name: 'summary', weight: 0.15 },
          { name: 'content', weight: 0.05 },
        ],
        threshold: 0.35,
        ignoreLocation: true,   // 关键修复：匹配在正文深处也有效，中文搜索的命门
        minMatchCharLength: 1,  // 允许单字中文查询
      });
      loaded = true;
      input.value.trim() ? doSearch() : showRecent();
    } catch (e) {
      showTip('索引加载失败，请刷新重试');
      console.warn(e);
    }
    loading = false;
  }

  /* ---------- 工具 ---------- */
  const esc = (t) => { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; };

  // 高亮命中词
  function hi(text, q) {
    const i = (text || '').toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }

  // 从正文里截取命中处前后的一段上下文，而不是永远显示开头
  function snippet(p, q) {
    const body = p.content || p.summary || '';
    const i = body.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(p.summary || p.date || '');
    const s = Math.max(0, i - 20), e = Math.min(body.length, i + q.length + 50);
    return (s > 0 ? '…' : '') + hi(body.slice(s, e), q) + (e < body.length ? '…' : '');
  }

  /* ---------- 渲染 ---------- */
  function showTip(text) { results.innerHTML = ''; empty.textContent = text; empty.hidden = false; }

  function render(list, q) {
    results.innerHTML = '';
    if (!list.length) { showTip('没有找到与「' + q + '」相关的内容'); return; }
    empty.hidden = true;
    list.slice(0, 15).forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML = '<a href="' + p.permalink + '"><strong>' + hi(p.title, q) +
                     '</strong><small>' + snippet(p, q) + '</small></a>';
      results.appendChild(li);
    });
  }

  // 空查询时展示最近更新，打开不再是空白
  function showRecent() {
    if (!posts.length) return showTip('暂无内容');
    empty.textContent = '最近更新';
    empty.hidden = false;
    results.innerHTML = '';
    [...posts].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, 6)
      .forEach((p) => {
        const li = document.createElement('li');
        li.innerHTML = '<a href="' + p.permalink + '"><strong>' + esc(p.title) +
                       '</strong><small>' + esc(p.date || '') + '</small></a>';
        results.appendChild(li);
      });
  }

  /* ---------- 搜索（120ms 防抖） ---------- */
  function doSearch() {
    if (!loaded) return;
    const q = input.value.trim();
    q ? render(fuse.search(q).map((r) => r.item), q) : showRecent();
  }

  /* ---------- 开关与键盘 ---------- */
  function open() {
    box.hidden = false;
    document.body.style.overflow = 'hidden';   // 锁背景滚动
    load().then(() => input.focus());
  }
  function close() {
    box.hidden = true;
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  box.addEventListener('click', (e) => { if (e.target === box) close(); }); // 点击搜索框以外的遮罩区域时收起弹层
  results.addEventListener('click', (e) => { if (e.target.closest('a')) close(); }); // 修复：pjax 跳转时收起弹层
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === '/' && box.hidden && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault(); open();   // 任意页面按 / 唤起
    }
  });

  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(doSearch, 120); });

  // 方向键在结果间移动，Enter 打开（链接默认行为）
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = [...results.querySelectorAll('a')];
    if (!links.length) return;
    e.preventDefault();
    const i = links.indexOf(document.activeElement);
    e.key === 'ArrowDown' ? (links[i + 1] || links[0]).focus()
                          : (i <= 0 ? input : links[i - 1]).focus();
  });
})();

(function () {
  "use strict";

  var btn = document.getElementById("search-btn") || document.querySelector("[data-open-search]");
  if (!btn) return;

  var panel = null;
  var input = null;
  var list = null;
  var footer = null;
  var releaseTrap = null;
  var index = [];
  var loaded = false;
  var results = [];
  var active = -1;
  var lastTrigger = null;
  var totalHits = 0;
  var usedFallback = false;
  // 兜底路径要和 Hugo 实际输出的文件名一致（outputFormats.SearchIndex 的 baseName）
  var INDEX_URL = btn.getAttribute("data-index") || "/search-index.json";

  // 最多渲染多少条。原版是 20 且没有任何排序，等于「谁新谁在前」。
  var MAX_RESULTS = 30;

  // 字段权重：标题 >> 标签 > 分类 > 摘要 > 描述 > 正文。
  // 正文权重压得很低，是为了「召回」而不是「排序」—— 正文里偶然出现一个字，
  // 不该把一篇标题里根本没有该词的文章顶到前面去。
  var W = { title: 100, tag: 60, category: 40, summary: 30, description: 20, body: 8 };

  function ensure() {
    if (panel) return;
    panel = document.createElement("div");
    panel.className = "search-panel";
    panel.hidden = true;
    panel.innerHTML =
      '<div class="search-backdrop" data-close></div>' +
      '<div class="search-box" role="dialog" aria-modal="true" aria-label="搜索">' +
        '<div class="search-head">' +
          '<svg class="search-head-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
          '<input class="search-input" type="search" placeholder="搜索标题、标签、摘要和正文…" autocomplete="off" spellcheck="false" aria-label="搜索关键词">' +
          '<button type="button" class="search-close" data-close aria-label="关闭">Esc</button>' +
        '</div>' +
        '<div class="search-results" role="listbox"></div>' +
        '<div class="search-footer"></div>' +
      '</div>';
    document.body.appendChild(panel);

    input = panel.querySelector(".search-input");
    list = panel.querySelector(".search-results");
    footer = panel.querySelector(".search-footer");
    /* 2026-09-30 修（既有缺陷，与 lightbox.js 同一处笔误）：querySelector("[data-close]")
       只拿到第一个匹配 = 背景层 .search-backdrop，右上角那个写着「Esc」的关闭按钮
       其实没有监听。手机上没有键盘，这个按钮是唯一的显式关闭入口，必须能点。 */
    Array.prototype.forEach.call(panel.querySelectorAll("[data-close]"), function (el) {
      el.addEventListener("click", close);
    });
    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("keydown", onKey);
  }

  function loadIndex() {
    if (loaded) return;
    fetch(INDEX_URL)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { index = (d && d.items) || []; loaded = true; render(input.value); })
      .catch(function () { index = []; loaded = true; render(input.value); });
  }

  function open() {
    ensure();
    panel.hidden = false;
    document.body.classList.add("search-open");
    input.value = "";
    render("");
    loadIndex();
    // 焦点锁在搜索框里（Tab 不会跑到背后的页面上），并直接落到输入框
    releaseTrap = window.hulatuFocusTrap(panel.querySelector(".search-box"), input);
  }

  function close() {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    document.body.classList.remove("search-open");
    if (releaseTrap) {
      releaseTrap();
      releaseTrap = null;
    }
    // 焦点还给「打开搜索的那个按钮」：404 页上可能是正文里的按钮，不一定在页头
    (lastTrigger || btn).focus();
    lastTrigger = null;
  }

  function toggle() {
    if (panel && !panel.hidden) close();
    else open();
  }

  /* ==================== 检索与排序 ====================
     2026-10-02 重写。旧实现是：

         hay = title + " " + summary + " " + description
         match = hay.indexOf(q) !== -1
         results = index.filter(match).slice(0, 20)

     三个问题叠在一起，导致「搜索不智能」：

       1) 没有相关度。谁命中都算 1 分，结果按索引顺序（时间倒序）排，
          于是「最新」被当成了「最相关」。
       2) slice(0, 20) 是硬截断。中文单字「我」在 122 篇里命中 75 篇，
          标题就叫《关于我》的那篇恰好最老，永远排在第 122 位 → 直接被砍掉。
          用户的感受就是「我」搜不到《关于我》，但「关于」搜得到 ——
          其实两个都搜不到，只是命中数少的那个更接近上限而已。
       3) 只搜标题和摘要开头，正文完全没进索引。

     现在改成：分字段加权打分 → 按分数排序 → 取前 30。
     于是「标题里就有这个词」永远压过「正文里碰巧出现一次」，
     跟文章新旧无关（时间只在同分时当兜底）。
  ==================================================== */

  function normalize(s) { return String(s == null ? "" : s).toLowerCase(); }

  // tags / categories 在前端可能是数组、字符串、甚至 null，统一成数组
  function listOf(v) {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }

  // 把查询切成词：中英文都按空白和常见分隔符切。
  // 中文没有词边界，不切词时整串当一个短语，靠后面的单字兜底再拆。
  function terms(q) {
    return normalize(q).split(/[\s,，、;；|]+/).filter(Boolean);
  }

  // CJK 统一表意文字（含扩展 A、兼容区）。兜底拆字只对中文做，
  // 拉丁字母绝不能拆 —— 否则「zzzzz」会被拆成 5 个 z，
  // 然后去正文里翻出一堆含 z 的文章，用户会一脸问号。
  var CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
  function allCJK(s) {
    for (var i = 0; i < s.length; i++) {
      if (!CJK.test(s.charAt(i))) return false;
    }
    return s.length > 0;
  }

  function countOccurrences(hay, needle) {
    if (!needle) return 0;
    var n = 0, i = 0;
    while ((i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
    return n;
  }

  // 单字段得分。出现次数走对数衰减：出现 1 次得满权重，第 2 次只多 0.45 倍……
  // 否则一篇 800 字的正文里「我」出现 30 次，会靠刷词把标题命中挤下去。
  function scoreField(text, term, weight) {
    if (!text) return 0;
    var c = countOccurrences(normalize(text), term);
    if (!c) return 0;
    return weight * (1 + Math.log(c) * 0.45);
  }

  function scoreItem(item, ts, byChar) {
    var tags = listOf(item.tags).join(" ");
    var cats = listOf(item.categories).join(" ");
    var total = 0;
    for (var i = 0; i < ts.length; i++) {
      var t = ts[i];
      var s = scoreField(item.title, t, W.title) +
              scoreField(tags, t, W.tag) +
              scoreField(cats, t, W.category) +
              scoreField(item.summary, t, W.summary) +
              scoreField(item.description, t, W.description) +
              scoreField(item.body, t, W.body);
      if (!s) return 0;   // AND 语义：任一词一个字段都没命中，整条淘汰
      total += s;
    }
    // 标题和查询完全一致，直接置顶（搜「关于我」时，《关于我》必须第一个）
    if (!byChar && normalize(item.title) === normalize(ts.join(""))) total += 300;

    // 标题覆盖率加成：查询词占标题的多大比例。
    // 搜「我」时，《关于我》(覆盖 1/3) 应该比《我是个爱折腾的人》(1/8) 更像目标 ——
    // 前者的标题几乎就是为这个字写的。没有这条，长标题光靠「命中一次」
    // 就能跟短标题打平，短标题反而排不到前面。
    if (!byChar) {
      var th = normalize(item.title);
      if (th) {
        var covered = 0;
        for (var k = 0; k < ts.length; k++) {
          covered += ts[k].length * countOccurrences(th, ts[k]);
        }
        total += W.title * 0.5 * Math.min(1, covered / th.length);
      }
    }
    return total;
  }

  function search(q) {
    var ts = terms(q);
    if (!ts.length) return { hits: [], terms: ts, fallback: false };

    var i, s, scored = [];
    for (i = 0; i < index.length; i++) {
      s = scoreItem(index[i], ts, false);
      if (s > 0) scored.push({ item: index[i], score: s });
    }

    // 短语查不到时，退化成「这几个字都得有」。
    // 中文没有词边界，用户写「关于我」能命中，但写「我关」按短语就查不到；
    // 拆成单字做 AND 至少能给出「同时包含我、关」的文章，体感上不再是「搜不到」。
    // 只对 2–4 个纯汉字生效：太长会退化成「随便什么字都有」，拉丁字母更不能拆。
    var fallback = false;
    if (!scored.length && ts.length === 1 && ts[0].length >= 2 && ts[0].length <= 4 && allCJK(ts[0])) {
      fallback = true;
      ts = ts[0].split("");
      for (i = 0; i < index.length; i++) {
        s = scoreItem(index[i], ts, true);
        if (s > 0) scored.push({ item: index[i], score: s });
      }
    }

    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      // 同分才比时间，新的在前。时间只是兜底，不能盖过相关度。
      return (b.item.date || "").localeCompare(a.item.date || "");
    });

    return { hits: scored, terms: ts, fallback: fallback };
  }

  /* ==================== 渲染 ==================== */

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 高亮「所有词的所有出现」，不只是第一处。旧实现只 mark 第一处，
  // 搜「我」时一篇里出现十次也只标一个，看着像没搜到。
  function highlight(text, ts) {
    var safe = escapeHtml(text);
    if (!ts || !ts.length) return safe;
    var lower = safe.toLowerCase();
    var ranges = [];
    for (var i = 0; i < ts.length; i++) {
      var t = ts[i], at = 0;
      while (t && (at = lower.indexOf(t, at)) !== -1) {
        ranges.push([at, at + t.length]);
        at += t.length;
      }
    }
    if (!ranges.length) return safe;
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    // 合并重叠区间，否则「关于我」里「关于」和「我」的 <mark> 会互相嵌套
    var merged = [ranges[0]];
    for (var k = 1; k < ranges.length; k++) {
      var last = merged[merged.length - 1];
      if (ranges[k][0] <= last[1]) last[1] = Math.max(last[1], ranges[k][1]);
      else merged.push(ranges[k]);
    }
    var out = "", pos = 0;
    for (var j = 0; j < merged.length; j++) {
      out += safe.slice(pos, merged[j][0]) + "<mark>" + safe.slice(merged[j][0], merged[j][1]) + "</mark>";
      pos = merged[j][1];
    }
    return out + safe.slice(pos);
  }

  function containsAny(text, ts) {
    if (!text) return false;
    var hay = normalize(text);
    for (var i = 0; i < ts.length; i++) {
      if (ts[i] && hay.indexOf(ts[i]) !== -1) return true;
    }
    return false;
  }

  // 从正文里截一段「命中位置附近」的上下文，让用户知道为什么这篇会出现在结果里
  function snippetAround(text, ts) {
    if (!text) return "";
    var lower = normalize(text), at = -1;
    for (var i = 0; i < ts.length; i++) {
      var p = lower.indexOf(ts[i]);
      if (p !== -1 && (at === -1 || p < at)) at = p;
    }
    if (at === -1) return "";
    var start = Math.max(0, at - 18);
    var end = Math.min(text.length, at + 58);
    return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  }

  function matchSource(item, ts) {
    if (containsAny(item.title, ts)) return "title";
    if (containsAny(listOf(item.tags).join(" "), ts) || containsAny(listOf(item.categories).join(" "), ts)) return "tag";
    if (containsAny(item.summary, ts) || containsAny(item.description, ts)) return "summary";
    return "body";
  }

  // 摘要行：优先显示真正命中的那一层。如果只有正文命中，
  // 就换成正文片段 —— 不然用户看到的摘要里一个关键词都没有，会很困惑。
  function pickSummary(item, ts) {
    if (containsAny(item.summary, ts)) return item.summary;
    if (containsAny(item.description, ts)) return item.description;
    var sn = snippetAround(item.body, ts);
    if (sn) return sn;
    return item.summary || item.description || "";
  }

  function render(q) {
    var res = search(q);
    var ts = res.terms;
    active = -1;
    totalHits = res.hits.length;
    usedFallback = res.fallback;
    results = res.hits.slice(0, MAX_RESULTS).map(function (r) { return r.item; });

    if (!loaded) {
      list.innerHTML = '<p class="search-empty">正在加载索引…</p>';
      footer.textContent = "↑↓ 选择　Enter 打开　Esc 关闭";
      return;
    }
    if (!ts.length) {
      list.innerHTML = '<p class="search-empty">输入关键词，搜索标题、标签、摘要和正文</p>';
      footer.textContent = "↑↓ 选择　Enter 打开　Esc 关闭";
      return;
    }
    if (!results.length) {
      list.innerHTML = '<p class="search-empty">没有找到相关文章，试试更短的关键词</p>';
      footer.textContent = "↑↓ 选择　Enter 打开　Esc 关闭";
      return;
    }

    list.innerHTML = results.map(function (item) {
      var src = matchSource(item, ts);
      var meta = escapeHtml(item.date || "") + (src === "body" ? "　·　正文匹配" : "");
      return '<a class="search-result" href="' + escapeHtml(item.url) + '" role="option">' +
        '<span class="search-result-title">' + highlight(item.title, ts) + "</span>" +
        '<span class="search-result-summary">' + highlight(pickSummary(item, ts), ts) + "</span>" +
        '<span class="search-result-meta">' + meta + "</span>" +
      "</a>";
    }).join("");

    var head = usedFallback ? "按单字匹配　·　" : "";
    if (totalHits > results.length) {
      footer.textContent = head + "命中 " + totalHits + " 篇，显示前 " + results.length + " 篇　·　↑↓ 选择　Enter 打开　Esc 关闭";
    } else {
      footer.textContent = head + totalHits + " 个结果　·　↑↓ 选择　Enter 打开　Esc 关闭";
    }
  }

  function setActive(i) {
    var els = list.querySelectorAll(".search-result");
    if (active >= 0 && els[active]) els[active].classList.remove("is-active");
    active = i;
    if (active >= 0 && els[active]) {
      els[active].classList.add("is-active");
      els[active].scrollIntoView({ block: "nearest" });
    }
  }

  function onKey(e) {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); if (results.length) setActive((active + 1) % results.length); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); if (results.length) setActive((active - 1 + results.length) % results.length); return; }
    if (e.key === "Enter" && results.length) {
      e.preventDefault();
      var target = active >= 0 ? results[active] : results[0];
      window.location.href = target.url;
    }
  }

  function isTyping(el) {
    var t = el && el.tagName;
    return t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || (el && el.isContentEditable);
  }

  Array.prototype.forEach.call(document.querySelectorAll("#search-btn, [data-open-search]"), function (t) {
    t.addEventListener("click", function () {
      lastTrigger = t;
      toggle();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !isTyping(e.target)) { e.preventDefault(); lastTrigger = btn; open(); }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); lastTrigger = btn; toggle(); }
  });
})();

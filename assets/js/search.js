(function () {
  "use strict";

  var btn = document.getElementById("search-btn") || document.querySelector("[data-open-search]");
  if (!btn) return;

  var panel = null;
  var input = null;
  var list = null;
  var footer = null;
  var index = [];
  var loaded = false;
  var results = [];
  var active = -1;
  var INDEX_URL = btn.getAttribute("data-index") || "/index.json";

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
          '<input class="search-input" type="search" placeholder="搜索标题、摘要、描述…" autocomplete="off" spellcheck="false" aria-label="搜索关键词">' +
          '<button type="button" class="search-close" data-close aria-label="关闭">Esc</button>' +
        '</div>' +
        '<div class="search-results" role="listbox"></div>' +
        '<div class="search-footer"></div>' +
      '</div>';
    document.body.appendChild(panel);

    input = panel.querySelector(".search-input");
    list = panel.querySelector(".search-results");
    footer = panel.querySelector(".search-footer");
    panel.querySelector("[data-close]").addEventListener("click", close);
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
    input.focus();
  }

  function close() {
    if (!panel) return;
    panel.hidden = true;
    document.body.classList.remove("search-open");
    btn.blur();
  }

  function toggle() {
    if (panel && !panel.hidden) close();
    else open();
  }

  function normalize(s) { return (s || "").toLowerCase(); }

  function match(item, q) {
    if (!q) return true;
    var hay = [item.title, item.summary, item.description].join(" ");
    return normalize(hay).indexOf(normalize(q)) !== -1;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function highlight(text, q) {
    var safe = escapeHtml(text);
    if (!q) return safe;
    var idx = safe.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return safe;
    return safe.slice(0, idx) + "<mark>" + safe.slice(idx, idx + q.length) + "</mark>" + safe.slice(idx + q.length);
  }

  function render(q) {
    var trimmed = (q || "").trim();
    results = trimmed ? index.filter(function (item) { return match(item, trimmed); }).slice(0, 20) : [];
    active = -1;

    if (!loaded) {
      list.innerHTML = '<p class="search-empty">正在加载索引…</p>';
      footer.textContent = "↑↓ 选择　Enter 打开　Esc 关闭";
      return;
    }
    if (!results.length) {
      list.innerHTML = '<p class="search-empty">' + (trimmed ? "没有找到相关文章，试试更短的关键词" : "输入关键词，搜索标题、摘要和描述") + "</p>";
      footer.textContent = "↑↓ 选择　Enter 打开　Esc 关闭";
      return;
    }

    list.innerHTML = results.map(function (item) {
      return '<a class="search-result" href="' + escapeHtml(item.url) + '" role="option">' +
        '<span class="search-result-title">' + highlight(item.title, trimmed) + "</span>" +
        '<span class="search-result-summary">' + highlight(item.summary, trimmed) + "</span>" +
        '<span class="search-result-meta">' + escapeHtml(item.date || "") + "</span>" +
      "</a>";
    }).join("");
    footer.textContent = results.length + " 个结果　·　↑↓ 选择　Enter 打开　Esc 关闭";
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
    t.addEventListener("click", toggle);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !isTyping(e.target)) { e.preventDefault(); open(); }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); toggle(); }
  });
})();

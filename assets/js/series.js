// series.js —— 系列阅读进度（localStorage，无后端）
// 文章页：把当前文章标记为已读；系列页：回填已读状态并计算进度。
(function () {
  "use strict";

  var KEY = "series-read";
  var MAX_PER_SERIES = 500;

  function readStore() {
    try {
      var raw = localStorage.getItem(KEY);
      var data = raw ? JSON.parse(raw) : {};
      return data && typeof data === "object" ? data : {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function pathOf(url) {
    try {
      return new URL(url, location.href).pathname.replace(/\/+$/, "") || "/";
    } catch (e) {
      return String(url || "");
    }
  }

  /* 文章页：记录当前文章属于哪个系列，并标记为已读 */
  function markCurrent() {
    var marker = document.querySelector(".series-marker[data-series]");
    if (!marker) return;
    var series = marker.getAttribute("data-series");
    if (!series) return;

    var path = pathOf(location.href);
    var store = readStore();
    var list = Array.isArray(store[series]) ? store[series] : [];
    if (list.indexOf(path) !== -1) return;

    list.push(path);
    if (list.length > MAX_PER_SERIES) list = list.slice(-MAX_PER_SERIES);
    store[series] = list;
    writeStore(store);
  }

  /* 系列页：回填已读状态与进度条 */
  function paintProgress() {
    var catalog = document.getElementById("series-catalog");
    if (!catalog) return;

    var series = catalog.getAttribute("data-series");
    var links = catalog.querySelectorAll(".series-item-link[data-url]");
    if (!series || !links.length) return;

    var store = readStore();
    var done = Array.isArray(store[series]) ? store[series] : [];
    var count = 0;

    Array.prototype.forEach.call(links, function (link) {
      var isRead = done.indexOf(pathOf(link.getAttribute("data-url"))) !== -1;
      var item = link.closest ? link.closest(".series-item") : null;
      if (item) item.classList.toggle("is-read", isRead);
      if (isRead) count += 1;
    });

    var total = links.length;
    var pct = total ? Math.round((count / total) * 100) : 0;

    var fill = document.getElementById("series-progress-fill");
    if (fill) fill.style.width = pct + "%";

    var text = document.getElementById("series-progress-text");
    if (text) text.textContent = "已读 " + count + " / " + total;

    var track = document.querySelector("#series-progress .series-progress-track");
    if (track) track.setAttribute("aria-valuenow", String(count));
  }

  function run() {
    markCurrent();
    paintProgress();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  document.addEventListener("pjax:complete", run);
})();

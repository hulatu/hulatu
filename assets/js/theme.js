(function () {
  "use strict";

  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var btn = document.getElementById("theme-btn");
  var STORAGE_KEY = "theme";

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b0b10" : "#f6f6f8");
    updateLabel(theme);
  }

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function storedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function saveTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }

  function updateLabel(theme) {
    if (!btn) return;
    var label = theme === "dark" ? "切换到浅色模式" : "切换到深色模式";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  }

  function sendTheme(theme) {
    var frame = document.querySelector("iframe.giscus-frame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ giscus: { setConfigTheme: theme } }, "https://giscus.app");
    }
  }

  function syncGiscus() {
    sendTheme(currentTheme());
  }

  function toggle() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    saveTheme(next);
    applyTheme(next);
    sendTheme(next);
  }

  function onChange(event) {
    // 一旦用户手动选过主题，就不再跟随系统
    if (storedTheme() === "dark" || storedTheme() === "light") return;
    var theme = event.matches ? "dark" : "light";
    applyTheme(theme);
    sendTheme(theme);
  }

  window.addEventListener("message", function (event) {
    if (event.origin === "https://giscus.app" && event.data && typeof event.data === "object" && event.data.giscus && "discussion" in event.data.giscus) {
      syncGiscus();
    }
  });

  // 页面打开时 data-theme 已由 baseof 的内联脚本设好，这里只同步按钮文案与 giscus
  updateLabel(currentTheme());

  if (btn) btn.addEventListener("click", toggle);

  if (mq.addEventListener) {
    mq.addEventListener("change", onChange);
  } else if (mq.addListener) {
    mq.addListener(onChange);
  }
})();

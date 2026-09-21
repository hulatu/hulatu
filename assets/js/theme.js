(function () {
  "use strict";

  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var btn = document.getElementById("theme-btn");
  var userSet = false;

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateLabel(theme) {
    if (!btn) return;
    var label = theme === "dark" ? "切换到浅色模式" : "切换到深色模式";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b0b10" : "#f6f6f8");
    updateLabel(theme);
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

  function spin() {
    if (!btn) return;
    btn.classList.remove("is-spinning");
    void btn.offsetWidth; // 强制重排，重新触发动画
    btn.classList.add("is-spinning");
  }

  function toggle() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    userSet = true;
    applyTheme(next);
    sendTheme(next);
    spin();
  }

  function onChange(event) {
    // 本次会话内手动切换过后，就不再跟随系统变化；刷新后恢复跟随
    if (userSet) return;
    var theme = event.matches ? "dark" : "light";
    applyTheme(theme);
    sendTheme(theme);
  }

  window.addEventListener("message", function (event) {
    if (event.origin === "https://giscus.app" && event.data && typeof event.data === "object" && event.data.giscus && "discussion" in event.data.giscus) {
      syncGiscus();
    }
  });

  // baseof 内联脚本已设好 data-theme，这里只同步按钮文案
  updateLabel(currentTheme());

  if (btn) btn.addEventListener("click", toggle);

  if (mq.addEventListener) {
    mq.addEventListener("change", onChange);
  } else if (mq.addListener) {
    mq.addListener(onChange);
  }
})();

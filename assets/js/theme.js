(function () {
  "use strict";

  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b0b10" : "#f6f6f8");
  }

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
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

  function onChange(event) {
    var theme = event.matches ? "dark" : "light";
    applyTheme(theme);
    sendTheme(theme);
  }

  window.addEventListener("message", function (event) {
    if (event.origin === "https://giscus.app" && event.data && typeof event.data === "object" && event.data.giscus && "discussion" in event.data.giscus) {
      syncGiscus();
    }
  });

  applyTheme(mq.matches ? "dark" : "light");

  if (mq.addEventListener) {
    mq.addEventListener("change", onChange);
  } else if (mq.addListener) {
    mq.addListener(onChange);
  }
})();

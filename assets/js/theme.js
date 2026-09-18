(function () {
  "use strict";
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b0b10" : "#f6f6f8");
  }

  function onChange(event) {
    applyTheme(event.matches ? "dark" : "light");
  }

  applyTheme(mq.matches ? "dark" : "light");

  if (mq.addEventListener) {
    mq.addEventListener("change", onChange);
  } else if (mq.addListener) {
    mq.addListener(onChange);
  }
})();

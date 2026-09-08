(function () {
  "use strict";
  var root = document.documentElement;
  var btn = document.querySelector(".theme-toggle");
  var meta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b0b10" : "#f6f6f8");
  }

  if (btn) {
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("theme", next);
      // 重播图标入场动画：先移除 class、强制 reflow，再重新加上
      btn.classList.remove("is-animating");
      void btn.offsetWidth;
      btn.classList.add("is-animating");
    });
  }

  document.addEventListener("pjax:complete", function () {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");
  });
})();

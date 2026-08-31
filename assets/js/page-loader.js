// page-loader.js —— 文章页专属模块按需加载
(function () {
  "use strict";

  var loaded = false;

  function needPageJS() {
    return !!document.querySelector(".post-toc-nav, .post-content, #giscus-slot");
  }

  function inject() {
    if (loaded) return;
    loaded = true;
    var tag = document.querySelector("script[data-page-extra]");
    var src = tag && tag.getAttribute("data-page-extra");
    if (!src) return;
    var s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = function () {
      // 让各模块对当前页面内容完成初始化
      if (document.readyState !== "loading") {
        document.dispatchEvent(new CustomEvent("pjax:complete"));
      }
    };
    document.body.appendChild(s);
  }

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
      return;
    }
    if (needPageJS()) inject();
  }

  init();
  document.addEventListener("pjax:complete", function () {
    if (needPageJS()) inject();
  });
})();

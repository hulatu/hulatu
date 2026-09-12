// hot.js —— 热门榜的「热议 / 热读」切换。
// 渐进增强：默认两个榜单都直接铺开（无 JS 也能看全）；
// 只有两个榜单都有数据时，才收起成标签页。
(function () {
  "use strict";

  function init() {
    var cards = document.querySelectorAll("[data-hot]");
    Array.prototype.forEach.call(cards, function (card) {
      if (card.getAttribute("data-hot-ready") === "1") return;

      var tabs = card.querySelector(".hot-tabs");
      var panels = card.querySelectorAll("[data-hot-panel]");
      if (!tabs || panels.length < 2) return;

      card.setAttribute("data-hot-ready", "1");
      card.classList.add("is-tabbed");
      tabs.hidden = false;

      var buttons = tabs.querySelectorAll(".hot-tab");

      function activate(key) {
        Array.prototype.forEach.call(buttons, function (btn) {
          var on = btn.getAttribute("data-hot-tab") === key;
          btn.classList.toggle("is-active", on);
          btn.setAttribute("aria-selected", on ? "true" : "false");
        });
        Array.prototype.forEach.call(panels, function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-hot-panel") === key);
        });
      }

      Array.prototype.forEach.call(buttons, function (btn) {
        btn.addEventListener("click", function () {
          activate(btn.getAttribute("data-hot-tab"));
        });
      });

      activate(panels[0].getAttribute("data-hot-panel"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  document.addEventListener("pjax:complete", init);
})();

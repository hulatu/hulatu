(function () {
  "use strict";

  /* 文章目录：滚动高亮当前章节。
     右侧固定栏和移动端底部抽屉是同一份目录的两个副本，
     所以这里对页面里所有的 .post-toc-nav 一起生效。
     点击行为按位置区分：
       - 右侧栏：自己接管，平滑滚动；
       - 抽屉里：交给浏览器原生锚点跳转，这样抽屉会先关闭、body 先解锁再滚动。 */

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var activeId = null;

  function scrollBehavior() {
    return reduceMotion.matches ? "auto" : "smooth";
  }

  function hashOf(link) {
    var href = link.getAttribute("href") || "";
    return href.charAt(0) === "#" ? decodeURIComponent(href.slice(1)) : "";
  }

  function setActive(links, id) {
    if (!id || id === activeId) return;
    activeId = id;
    links.forEach(function (link) {
      link.classList.toggle("is-active", hashOf(link) === id);
    });
  }

  function init() {
    var navs = Array.prototype.slice.call(document.querySelectorAll(".post-toc-nav"));
    var content = document.querySelector(".post-content");
    if (!navs.length || !content) return;

    var links = [];
    navs.forEach(function (nav) {
      Array.prototype.push.apply(links, Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')));
    });
    if (!links.length) return;

    var targets = links
      .map(function (link) { return document.getElementById(hashOf(link)); })
      .filter(Boolean);
    if (!targets.length) return;

    function sync() {
      var line = window.scrollY + 130;
      var active = targets[0];
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].getBoundingClientRect().top + window.scrollY <= line) active = targets[i];
      }
      setActive(links, active.id);
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        sync();
        ticking = false;
      });
    }, { passive: true });

    navs.forEach(function (nav) {
      nav.addEventListener("click", function (event) {
        var link = event.target.closest("a");
        if (!link || !nav.contains(link)) return;
        if (link.closest(".toc-drawer")) return;
        var target = document.getElementById(hashOf(link));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
        setActive(links, target.id);
      });
    });

    sync();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

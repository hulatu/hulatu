(function () {
  "use strict";

  /* 文章目录的两半逻辑都在这个文件里：
       init()       —— 滚动高亮当前章节；
       initDrawer() —— 移动端底部抽屉的开关、焦点陷阱、ESC；
       initHashAnchor() —— 带着 #锚点 进页面时把标题重新对准（见下面那段注释）。
     右侧固定栏和抽屉是同一份目录的两个副本，所以高亮对页面里所有 .post-toc-nav 一起生效。
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

  /* 移动端目录抽屉：开合、焦点陷阱、ESC 关闭。
     过去这段写在 single.html 的内联脚本里，和上面的高亮逻辑分家；
     现在合并到一处，抽屉和侧栏共用同一份目录数据。 */
  function initDrawer() {
    var btn = document.getElementById("toc-btn");
    var drawer = document.getElementById("toc-drawer");
    if (!btn || !drawer) return;

    var releaseTrap = null;

    function open() {
      drawer.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      document.body.classList.add("toc-open");
      // 焦点锁进抽屉、并落到关闭按钮上（focus-trap.js 由同一个 bundle 提供，排在前面）
      if (window.hulatuFocusTrap) {
        releaseTrap = window.hulatuFocusTrap(drawer, drawer.querySelector(".toc-drawer-close"));
      }
    }

    function close() {
      if (drawer.hidden) return;
      drawer.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("toc-open");
      if (releaseTrap) {
        releaseTrap();
        releaseTrap = null;
      }
      btn.focus();
    }

    btn.addEventListener("click", open);
    drawer.addEventListener("click", function (event) {
      if (event.target.closest("[data-toc-close]") || event.target.closest(".toc-drawer-nav a")) close();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !drawer.hidden) close();
    });
  }

  /* ---------- 带着 #锚点 进页面时的定位 ----------
     点目录、点标题上的 #，都由 CSS 的 scroll-margin-top（--anchor-offset）决定落点。
     真正需要 JS 补一刀的是「从别人的链接点进来」这一步：
       1. 浏览器最初定位时，正文图片、网页字体、评论框往往还没就位，等它们撑高页面，
          目标标题已经偏到上面去了 —— 所以等 load / 字体就绪后再对一次；
       2. 老链接里的 #%e4%b9%a0%e6%83%af 是中文锚点，标题 id 换成拼音后按 id 找不到，
          这时退回按标题文字匹配（标题没改名就还能落到原来的位置）。
     用户自己滚过页面之后就不再插手，免得把人拽回去。 */
  function normalizeText(text) {
    return (text || "").replace(/\s+/g, "").replace(/#+$/, "");
  }

  function findByHeadingText(text) {
    var want = normalizeText(text);
    if (!want) return null;
    var headings = document.querySelectorAll("main h1[id], main h2[id], main h3[id], main h4[id]");
    for (var i = 0; i < headings.length; i++) {
      if (normalizeText(headings[i].textContent) === want) return headings[i];
    }
    return null;
  }

  function anchorOffset(el) {
    var value = parseFloat(window.getComputedStyle(el).scrollMarginTop);
    return isNaN(value) ? 0 : value;
  }

  function initHashAnchor() {
    if (!location.hash || location.hash.length < 2) return;
    var id = location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch (e) {
      /* 不是合法的百分号编码就按原样找 */
    }
    var target = document.getElementById(id) || findByHeadingText(id);
    if (!target) return;

    var userMoved = false;
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (name) {
      window.addEventListener(name, function () { userMoved = true; }, { passive: true, once: true });
    });

    function realign() {
      if (userMoved) return;
      var drift = Math.abs(target.getBoundingClientRect().top - anchorOffset(target));
      // 只在真的偏了的时候纠一次，偏一点就当它已经对准了，免得页面看着在抖
      if (drift <= 4) return;
      try {
        target.scrollIntoView({ block: "start", behavior: "instant" });
      } catch (e) {
        target.scrollIntoView(true);
      }
    }

    window.addEventListener("load", function () {
      window.requestAnimationFrame(realign);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { window.setTimeout(realign, 0); });
    }
    if (document.readyState === "complete") realign();
  }

  document.addEventListener("DOMContentLoaded", function () {
    init();
    initDrawer();
    initHashAnchor();
  });
})();

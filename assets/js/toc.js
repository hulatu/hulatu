(function () {
  "use strict";

  /* 文章目录的逻辑都在这个文件里：
       init()       —— 滚动高亮当前章节；
       initPin()    —— 宽屏刻度栏的「钉住」按钮（钉住后不用悬停也保持展开）；
       initInlineToc() —— 手机上把正文开头那块目录默认收起来；
       initHashAnchor() —— 带着 #锚点 进页面时把标题重新对准（见下面那段注释）。
     同一份目录在页面里有两份副本（宽屏刻度栏 + 正文开头那块），
     所以高亮对页面里所有 .post-toc-nav 一起生效；点哪一份都是这里接管、平滑滚动。 */

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
        var target = document.getElementById(hashOf(link));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
        setActive(links, target.id);
      });
    });

    sync();
  }

  /* ---------- 手机上把正文开头那块目录默认收起来 ----------
     同一份 <details> 在宽屏是展开的（HTML 里带 open），到手机上默认收起更省屏幕；
     只在加载时判断一次，之后用户自己点开 / 收起，脚本不再插手。 */
  function initInlineToc() {
    var block = document.querySelector(".post-toc-inline");
    if (!block) return;
    if (window.matchMedia("(max-width: 760px)").matches) block.open = false;
  }

  /* ---------- 宽屏刻度栏的「钉住」----------
     参考 sspai 文章页的目录：平时只有一列小刻度，鼠标移上去才展开成标题；
     点图钉钉住后，展开状态就不用再靠悬停维持（.post-rail.is-pinned）。
     按钮在 .post-rail 里面，窄屏时整块 display:none，所以窄屏等于不执行。
     状态不跨页面记：和主题切换一样，刷新回到默认的收起态。 */
  function initPin() {
    var rail = document.querySelector(".post-rail");
    var btn = document.getElementById("toc-pin");
    if (!rail || !btn) return;

    btn.addEventListener("click", function () {
      var pinned = rail.classList.toggle("is-pinned");
      btn.setAttribute("aria-pressed", pinned ? "true" : "false");
      btn.setAttribute("aria-label", pinned ? "取消钉住目录" : "钉住目录");
      btn.setAttribute("title", pinned ? "取消钉住目录" : "钉住目录（保持展开）");
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
    initPin();
    initInlineToc();
    initHashAnchor();
  });
})();

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 移动端菜单 ---------- */
  var burger = document.getElementById("nav-burger");
  var nav = document.getElementById("site-nav");

  function setNav(open) {
    if (!burger || !nav) return;
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    nav.classList.toggle("is-open", open);
  }

  if (burger && nav) {
    burger.addEventListener("click", function () {
      setNav(!burger.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setNav(false);
    });
  }

  /* ---------- 文章阅读进度条 ---------- */
  var ticking = false;

  function updateProgress() {
    ticking = false;
    var bar = document.getElementById("reading-progress");
    if (!bar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var y = window.scrollY;
    if (max <= 0 || y < 24) {
      bar.classList.remove("is-visible");
      bar.style.width = "0";
      return;
    }
    bar.classList.add("is-visible");
    bar.style.width = Math.min(100, Math.round((y / max) * 100)) + "%";
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateProgress);
    }
  }

  function initProgress() {
    if (!document.getElementById("reading-progress")) return;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateProgress();
  }

  document.addEventListener("DOMContentLoaded", initProgress);
  document.addEventListener("pjax:complete", updateProgress);

  /* ---------- 回到顶部 ---------- */
  var backTop = document.getElementById("back-top");
  var backTopTicking = false;

  function updateBackTop() {
    backTopTicking = false;
    if (!backTop) return;
    var show = window.scrollY > 600;
    backTop.hidden = !show;
  }

  function onScrollBackTop() {
    if (!backTopTicking) {
      backTopTicking = true;
      window.requestAnimationFrame(updateBackTop);
    }
  }

  if (backTop) {
    window.addEventListener("scroll", onScrollBackTop, { passive: true });
    backTop.addEventListener("click", function () {
      if (reducedMotion) {
        window.scrollTo(0, 0);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  /* ---------- 键盘快捷键 ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.key === "t" || e.key === "T") {
      e.preventDefault();
      if (reducedMotion) {
        window.scrollTo(0, 0);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    if (e.key === "[" || e.key === "]") {
      var link = e.key === "[" ? document.querySelector(".post-nav-prev") : document.querySelector(".post-nav-next");
      if (link && link.href) {
        e.preventDefault();
        link.click();
      }
    }
  });

  /* ---------- PJAX 顶部加载进度条 ---------- */
  var pjaxBar = document.getElementById("pjax-progress");
  var pjaxTimer = null;

  function pjaxStart() {
    if (!pjaxBar) return;
    clearTimeout(pjaxTimer);
    pjaxBar.classList.add("is-loading");
    pjaxBar.style.width = "32%";
  }

  function pjaxDone() {
    if (!pjaxBar) return;
    pjaxBar.style.width = "100%";
    pjaxTimer = setTimeout(function () {
      pjaxBar.classList.remove("is-loading");
      pjaxBar.style.width = "0";
    }, 200);
  }

  document.addEventListener("pjax:start", pjaxStart);
  document.addEventListener("pjax:complete", pjaxDone);
})();

(function () {
  "use strict";

  var scroller = document.scrollingElement || document.documentElement;

  /* ---------- 阅读进度条 ---------- */
  var progress = document.getElementById("reading-progress");
  if (progress) {
    var progressTicking = false;

    function updateProgress() {
      progressTicking = false;
      var max = scroller.scrollHeight - scroller.clientHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / max)) : 0;
      progress.style.transform = "scaleX(" + ratio + ")";
    }

    function onProgressScroll() {
      if (!progressTicking) {
        progressTicking = true;
        window.requestAnimationFrame(updateProgress);
      }
    }

    window.addEventListener("scroll", onProgressScroll, { passive: true });
    window.addEventListener("resize", onProgressScroll, { passive: true });
    updateProgress();
  }

  /* ---------- 回到顶部 / 到达底部 ---------- */
  var nav = document.getElementById("page-nav");
  if (nav) {
    var up = nav.querySelector('[data-scroll-to="top"]');
    var down = nav.querySelector('[data-scroll-to="bottom"]');
    var navTicking = false;

    function nearBottom() {
      return window.innerHeight + Math.ceil(window.scrollY) >= scroller.scrollHeight - 2;
    }

    function updateNav() {
      navTicking = false;
      var show = window.scrollY > 420;
      nav.hidden = !show;
      if (down) down.hidden = nearBottom();
    }

    function onNavScroll() {
      if (!navTicking) {
        navTicking = true;
        window.requestAnimationFrame(updateNav);
      }
    }

    if (up) {
      up.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    if (down) {
      down.addEventListener("click", function () {
        window.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
      });
    }

    window.addEventListener("scroll", onNavScroll, { passive: true });
    window.addEventListener("resize", onNavScroll, { passive: true });
    updateNav();
  }
})();

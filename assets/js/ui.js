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

  /* ---------- 顶栏滚动状态（滚动后浮现发丝分割线） ---------- */
  var header = document.querySelector(".site-header");
  var headerTicking = false;

  function updateHeader() {
    headerTicking = false;
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  function onScrollHeader() {
    if (!headerTicking) {
      headerTicking = true;
      window.requestAnimationFrame(updateHeader);
    }
  }

  if (header) {
    window.addEventListener("scroll", onScrollHeader, { passive: true });
    updateHeader();
  }

  /* ---------- 滚动轻量浮现（仅一次，尊重减弱动效） ---------- */
  var revealObserver = null;

  function initReveal() {
    if (reducedMotion || !("IntersectionObserver" in window)) return;
    if (revealObserver) revealObserver.disconnect();

    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    document.querySelectorAll(".post-list .post-row, .stat-card, .data-panel")
      .forEach(function (el) {
        if (el.classList.contains("reveal-visible")) return;
        el.classList.add("reveal-in");
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 90) {
          el.classList.add("reveal-visible");
          return;
        }
        if (!el.classList.contains("reveal-pending")) {
          el.classList.add("reveal-pending");
        }
        revealObserver.observe(el);
      });
  }

  document.addEventListener("DOMContentLoaded", initReveal);

  /* ---------- 键盘快捷键 ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.key === "[" || e.key === "]") {
      var link = e.key === "[" ? document.querySelector(".post-nav-prev") : document.querySelector(".post-nav-next");
      if (link && link.href) {
        e.preventDefault();
        link.click();
      }
    }
  });
})();

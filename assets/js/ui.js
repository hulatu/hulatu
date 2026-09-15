(function () {
  "use strict";

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

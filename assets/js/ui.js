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

  /* ---------- 顶栏滚动状态（分割线 + 自动隐藏）与返回顶部 ---------- */
  var header = document.querySelector(".site-header");
  var backTop = document.getElementById("back-top");
  var readingProgress = document.getElementById("reading-progress");
  var headerTicking = false;
  var lastScrollY = window.scrollY;

  function updateHeader() {
    headerTicking = false;
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
      if (y > lastScrollY && y > 120) {
        header.classList.add("is-hidden");
      } else if (y < lastScrollY) {
        header.classList.remove("is-hidden");
      }
    }
    if (backTop) backTop.classList.toggle("is-visible", y > 400);
    if (readingProgress) {
      var doc = document.documentElement;
      var total = doc.scrollHeight - doc.clientHeight;
      readingProgress.style.width = (total > 0 ? (y / total) * 100 : 0) + "%";
    }
    lastScrollY = y;
  }

  function onScrollHeader() {
    if (!headerTicking) {
      headerTicking = true;
      window.requestAnimationFrame(updateHeader);
    }
  }

  window.addEventListener("scroll", onScrollHeader, { passive: true });
  updateHeader();

  if (backTop) {
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
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

  /* ---------- 复制标题链接 ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (e) {
        reject(e);
      }
      document.body.removeChild(ta);
    });
  }

  function showToast(msg) {
    var toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("is-show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove("is-show");
    }, 1600);
  }

  var headingAnchors = document.querySelectorAll(".heading-anchor");
  if (headingAnchors.length) {
    Array.prototype.forEach.call(headingAnchors, function (anchor) {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        var base = location.href.split("#")[0];
        copyText(base + anchor.getAttribute("href")).then(function () {
          showToast("链接已复制");
        }).catch(function () {
          showToast("复制失败，请手动复制");
        });
      });
    });
  }

  /* ---------- 图片渐进加载（blur-up） ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".article-image img"), function (img) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add("is-loaded");
    } else {
      img.addEventListener("load", function () {
        img.classList.add("is-loaded");
      });
    }
  });

  /* ---------- 代码块复制 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-code-copy]"), function (btn) {
    btn.addEventListener("click", function () {
      var block = btn.closest(".code-block");
      var code = block ? block.querySelector("pre code, pre") : null;
      if (!code) return;
      copyText(code.textContent).then(function () {
        btn.textContent = "已复制";
        setTimeout(function () { btn.textContent = "复制"; }, 1500);
      }).catch(function () {
        showToast("复制失败");
      });
    });
  });
})();

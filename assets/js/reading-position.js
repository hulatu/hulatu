(function () {
  "use strict";

  var btn = document.getElementById("continue-reading");
  if (!btn) return;

  var currentPath = location.pathname;
  var saved = read(currentPath);
  var ticking = false;

  function storage() {
    try {
      return window.localStorage;
    } catch (e) {
      return null;
    }
  }

  function key(path) {
    return "reading-pos:" + path;
  }

  function read(path) {
    var store = storage();
    if (!store) return 0;
    var value = parseInt(store.getItem(key(path)) || "0", 10);
    return isFinite(value) ? value : 0;
  }

  function isArticle() {
    return !!document.querySelector(".post-content");
  }

  function save() {
    if (!isArticle()) return;
    var store = storage();
    if (!store) return;
    var y = window.scrollY;
    if (y > 160) {
      store.setItem(key(currentPath), String(Math.round(y)));
    } else {
      store.removeItem(key(currentPath));
    }
  }

  function updateButton() {
    if (!isArticle()) {
      btn.hidden = true;
      return;
    }
    btn.hidden = saved <= 160;
  }

  function resetForNewPage() {
    currentPath = location.pathname;
    saved = read(currentPath);
    updateButton();
  }

  btn.addEventListener("click", function () {
    if (saved > 0) {
      window.scrollTo({ top: saved, behavior: "smooth" });
    }
    btn.hidden = true;
  });

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      save();
    });
  }, { passive: true });

  window.addEventListener("pagehide", save);
  document.addEventListener("pjax:complete", resetForNewPage);
  document.addEventListener("DOMContentLoaded", resetForNewPage);

  updateButton();
})();

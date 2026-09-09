/* 快捷键面板：按 ? 打开 */
(function () {
  "use strict";
  var overlay = document.getElementById("shortcut-overlay");
  var closeBtn = document.getElementById("shortcut-close");
  if (!overlay) return;

  function isTyping() {
    var el = document.activeElement;
    return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
  }

  function searchOpen() {
    var box = document.getElementById("search-overlay");
    return box && !box.hidden;
  }

  function open() {
    overlay.hidden = false;
    document.body.classList.add("shortcut-open");
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    overlay.hidden = true;
    document.body.classList.remove("shortcut-open");
  }

  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var isQuestion = e.key === "?" || (e.shiftKey && e.code === "Slash");
    if (!isQuestion) return;
    if (isTyping() || searchOpen()) return;
    e.preventDefault();
    if (overlay.hidden) open();
    else close();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
  }
})();

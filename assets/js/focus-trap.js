/* 模态层的焦点陷阱。

   把 Tab / Shift+Tab 限制在容器内部循环，并在打开时把焦点放到指定元素上；
   返回一个 release()，关闭弹层时调用即可解绑。

   搜索面板、目录抽屉、图片灯箱共用这一份实现。它是独立文件，
   在 layouts/partials/scripts.html 的打包顺序里排在最前面，
   所以后面几个脚本运行时 window.hulatuFocusTrap 一定已经存在。 */
(function () {
  "use strict";

  var FOCUSABLE = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])'
  ].join(",");

  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  window.hulatuFocusTrap = function (container, initial) {
    var released = false;

    function focusables() {
      return Array.prototype.filter.call(container.querySelectorAll(FOCUSABLE), isVisible);
    }

    function onKeydown(event) {
      if (event.key !== "Tab") return;
      var list = focusables();
      if (!list.length) return;

      var first = list[0];
      var last = list[list.length - 1];
      var active = document.activeElement;

      // 焦点已经跑到弹层外面（比如刚打开、或鼠标点了别处）：直接拉回来
      if (!container.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeydown, true);
    if (initial && initial.focus) initial.focus();

    return function release() {
      if (released) return;
      released = true;
      document.removeEventListener("keydown", onKeydown, true);
    };
  };
})();

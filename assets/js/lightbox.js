(function () {
  "use strict";

  var figures = Array.prototype.filter.call(
    document.querySelectorAll(".article-image"),
    function (figure) { return !!figure.querySelector("a[href]"); }
  );
  if (!figures.length) return;

  var current = 0;
  var root = null;
  var releaseTrap = null;
  var lastFocused = null;

  // 原图地址直接读链接的 href，跟「JS 不可用时会跳到原图」共用同一个来源
  function sourceOf(figure) {
    var link = figure.querySelector("a[href]");
    return link ? link.getAttribute("href") : "";
  }

  function ensure() {
    if (root) return;
    root = document.createElement("div");
    root.className = "lightbox";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "查看大图");
    root.innerHTML =
      '<div class="lightbox-backdrop" data-close></div>' +
      '<button type="button" class="lightbox-btn lightbox-close" data-close aria-label="关闭">' +
        '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>' +
      "</button>" +
      '<button type="button" class="lightbox-btn lightbox-prev" aria-label="上一张">' +
        '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
      "</button>" +
      '<button type="button" class="lightbox-btn lightbox-next" aria-label="下一张">' +
        '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
      "</button>" +
      '<figure class="lightbox-figure">' +
        '<img class="lightbox-img" src="" alt="">' +
        '<figcaption class="lightbox-caption"></figcaption>' +
      "</figure>" +
      '<div class="lightbox-counter"></div>';
    document.body.appendChild(root);

    /* 2026-09-30 修（既有缺陷）：原来第一行是 querySelector("[data-close]") —— 它只返回
       **第一个**匹配，也就是背景层 .lightbox-backdrop；第二行又给背景层绑了一遍。
       于是右上角那个「X」关闭按钮（同样带 data-close、aria-label="关闭"）从头到尾
       没有监听，点了毫无反应 —— 而它恰恰是手机上最顺手的关闭入口（背景和两侧箭头
       都容易误触）。改成给所有 [data-close] 都绑上。 */
    Array.prototype.forEach.call(root.querySelectorAll("[data-close]"), function (el) {
      el.addEventListener("click", close);
    });
    root.querySelector(".lightbox-prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
    root.querySelector(".lightbox-next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
    document.addEventListener("keydown", onKey);

    /* 左右滑动换图（2026-09-30 补）。手机上换图原来只能去点两侧那两个 46px 的箭头，
       而它们在小屏上距边只有 8px、还压在图片边缘上，很难点。
       用 Pointer Events（触摸 / 鼠标 / 笔一套走通），按下与抬起之间横向位移超过 40px、
       且明显大于纵向位移才算滑动 —— 后者是为了不和「点一下关闭」以及纵向手势打架。
       监听挂在 document 上而不是 root 上：手指划出灯箱范围也能收到 pointerup。
       注意**没有**动 click 逻辑，所以「点背景关闭」照旧。 */
    var swipeId = null, swipeX = 0, swipeY = 0;
    root.addEventListener("pointerdown", function (e) {
      if (figures.length < 2) return;
      if (e.target.closest(".lightbox-btn")) return;
      swipeId = e.pointerId;
      swipeX = e.clientX;
      swipeY = e.clientY;
    });
    document.addEventListener("pointerup", function (e) {
      if (swipeId === null || e.pointerId !== swipeId) return;
      swipeId = null;
      var dx = e.clientX - swipeX;
      var dy = e.clientY - swipeY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      step(dx < 0 ? 1 : -1); // 往左划 = 看下一张
    });
    document.addEventListener("pointercancel", function () { swipeId = null; });
  }

  function render() {
    var f = figures[current];
    root.querySelector(".lightbox-img").src = sourceOf(f);
    root.querySelector(".lightbox-img").alt = f.getAttribute("data-caption") || "";
    root.querySelector(".lightbox-caption").textContent = f.getAttribute("data-caption") || "";
    root.querySelector(".lightbox-caption").style.display = f.getAttribute("data-caption") ? "" : "none";
    root.querySelector(".lightbox-counter").textContent = figures.length > 1 ? (current + 1) + " / " + figures.length : "";
    root.classList.toggle("is-single", figures.length <= 1);
  }

  function open(index, trigger) {
    ensure();
    current = index;
    lastFocused = trigger || document.activeElement;
    render();
    root.hidden = false;
    document.body.classList.add("lightbox-open");
    releaseTrap = window.hulatuFocusTrap(root, root.querySelector(".lightbox-close"));
  }

  function close() {
    if (!root || root.hidden) return;
    root.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (releaseTrap) {
      releaseTrap();
      releaseTrap = null;
    }
    // 焦点还给刚才是谁打开的，键盘用户不至于被扔回页面顶部
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    lastFocused = null;
  }

  function step(delta) {
    current = (current + delta + figures.length) % figures.length;
    render();
  }

  function onKey(e) {
    if (!root || root.hidden) return;
    if (e.key === "Escape") { close(); }
    else if (e.key === "ArrowLeft" && figures.length > 1) { step(-1); }
    else if (e.key === "ArrowRight" && figures.length > 1) { step(1); }
  }

  figures.forEach(function (f, i) {
    f.addEventListener("click", function (e) {
      // 带修饰键（新标签打开原图）或中键的点击保持浏览器原生行为，不抢
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      // 鼠标点图和键盘回车走的是同一条路：都别真的跳走，交给灯箱
      e.preventDefault();
      open(i, f.querySelector("a[href]"));
    });
  });
})();

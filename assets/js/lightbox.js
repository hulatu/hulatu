(function () {
  "use strict";

  var closeIcon =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>';
  var prevIcon =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>';
  var nextIcon =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>';

  var overlay = null;
  var img = null;
  var closeBtn = null;
  var prevBtn = null;
  var nextBtn = null;
  var countEl = null;
  var list = [];
  var index = 0;

  function ensure() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.setAttribute("hidden", "");
    overlay.innerHTML =
      '<button type="button" class="lightbox-nav lightbox-prev" aria-label="上一张">' + prevIcon + "</button>" +
      '<img class="lightbox-img" alt="">' +
      '<button type="button" class="lightbox-nav lightbox-next" aria-label="下一张">' + nextIcon + "</button>" +
      '<button type="button" class="lightbox-close" aria-label="关闭灯箱">' + closeIcon + "</button>" +
      '<span class="lightbox-count" aria-live="polite"></span>';
    document.body.appendChild(overlay);
    img = overlay.querySelector(".lightbox-img");
    closeBtn = overlay.querySelector(".lightbox-close");
    prevBtn = overlay.querySelector(".lightbox-prev");
    nextBtn = overlay.querySelector(".lightbox-next");
    countEl = overlay.querySelector(".lightbox-count");

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || closeBtn.contains(e.target)) close();
    });
    prevBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      showAt(index - 1);
    });
    nextBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      showAt(index + 1);
    });
    document.addEventListener("keydown", function (e) {
      if (overlay.hasAttribute("hidden")) return;
      if (e.key === "Escape") {
        close();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        showAt(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        showAt(index + 1);
      }
    });
  }

  function collect() {
    return Array.prototype.slice.call(document.querySelectorAll(".post-content img, .post-cover"));
  }

  function showAt(i) {
    if (!list.length) return;
    index = (i + list.length) % list.length;
    var el = list[index];
    img.src = el.currentSrc || el.src;
    img.alt = el.alt || "";
    countEl.textContent = (index + 1) + " / " + list.length;
    prevBtn.disabled = list.length < 2;
    nextBtn.disabled = list.length < 2;
  }

  function open(el) {
    ensure();
    list = collect();
    index = list.indexOf(el);
    if (index === -1) return;
    showAt(index);
    overlay.removeAttribute("hidden");
    document.body.classList.add("lightbox-open");
    closeBtn.focus();
  }

  function close() {
    overlay.setAttribute("hidden", "");
    document.body.classList.remove("lightbox-open");
    img.src = "";
    list = [];
  }

  function onClick(e) {
    var el = e.target.closest(".post-content img, .post-cover");
    if (el) open(el);
  }

  function bind() {
    document.removeEventListener("click", onClick);
    document.addEventListener("click", onClick);
  }

  document.addEventListener("DOMContentLoaded", bind);
  document.addEventListener("pjax:complete", function () {
    if (overlay && !overlay.hasAttribute("hidden")) close();
    bind();
  });
})();

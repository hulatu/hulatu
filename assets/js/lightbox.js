(function () {
  "use strict";

  var figures = Array.prototype.slice.call(document.querySelectorAll(".article-image[data-full]"));
  if (!figures.length) return;

  var current = 0;
  var root = null;

  function ensure() {
    if (root) return;
    root = document.createElement("div");
    root.className = "lightbox";
    root.hidden = true;
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

    root.querySelector("[data-close]").addEventListener("click", close);
    root.querySelector(".lightbox-backdrop").addEventListener("click", close);
    root.querySelector(".lightbox-prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
    root.querySelector(".lightbox-next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
    document.addEventListener("keydown", onKey);
  }

  function render() {
    var f = figures[current];
    root.querySelector(".lightbox-img").src = f.getAttribute("data-full");
    root.querySelector(".lightbox-img").alt = f.getAttribute("data-caption") || "";
    root.querySelector(".lightbox-caption").textContent = f.getAttribute("data-caption") || "";
    root.querySelector(".lightbox-caption").style.display = f.getAttribute("data-caption") ? "" : "none";
    root.querySelector(".lightbox-counter").textContent = figures.length > 1 ? (current + 1) + " / " + figures.length : "";
    root.classList.toggle("is-single", figures.length <= 1);
  }

  function open(index) {
    ensure();
    current = index;
    render();
    root.hidden = false;
    document.body.classList.add("lightbox-open");
  }

  function close() {
    if (!root) return;
    root.hidden = true;
    document.body.classList.remove("lightbox-open");
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
      if (e.target.closest("a")) return;
      open(i);
    });
  });
})();

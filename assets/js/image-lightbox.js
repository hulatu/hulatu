(function () {
  "use strict";

  var overlay = null;
  var image = null;
  var caption = null;
  var closeBtn = null;
  var lastFocus = null;

  function build() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "image-lightbox";
    overlay.id = "image-lightbox";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "查看大图");

    closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "image-lightbox-close";
    closeBtn.setAttribute("aria-label", "关闭大图");
    closeBtn.innerHTML = "&times;";

    var figure = document.createElement("figure");
    figure.className = "image-lightbox-figure";

    image = document.createElement("img");
    image.className = "image-lightbox-img";
    image.alt = "";

    caption = document.createElement("figcaption");
    caption.className = "image-lightbox-caption";

    figure.appendChild(image);
    figure.appendChild(caption);
    overlay.appendChild(closeBtn);
    overlay.appendChild(figure);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.closest(".image-lightbox-close")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !overlay.hidden) close();
    });
  }

  function open(img) {
    build();
    lastFocus = document.activeElement;

    var preview = img.currentSrc || img.src;
    var full = img.getAttribute("data-full") || preview;
    var alt = img.getAttribute("alt") || "";
    var text = img.getAttribute("data-caption") || "";

    image.alt = alt;
    caption.textContent = text;
    image.src = preview;

    overlay.hidden = false;
    document.body.classList.add("image-lightbox-open");
    closeBtn.focus();

    if (full !== preview) {
      var loader = new Image();
      loader.onload = function () {
        if (!overlay.hidden) image.src = full;
      };
      loader.src = full;
    }
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove("image-lightbox-open");
    image.removeAttribute("src");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    var target = e.target && e.target.closest ? e.target.closest("img[data-lightbox]") : null;
    if (!target) return;
    e.preventDefault();
    open(target);
  });
})();

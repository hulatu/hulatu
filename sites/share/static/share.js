(function () {
  "use strict";

  var buttons = Array.prototype.slice.call(document.querySelectorAll(".filter-chip"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".share-card"));

  if (!buttons.length || !cards.length) return;

  function applyFilter(category) {
    buttons.forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-category") === category);
    });

    cards.forEach(function (card) {
      var match = category === "all" || card.getAttribute("data-category") === category;
      card.classList.toggle("is-hidden", !match);
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.getAttribute("data-category") || "all");
    });
  });
})();

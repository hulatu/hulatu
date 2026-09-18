(function () {
  "use strict";

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function sendTheme(theme) {
    var frame = document.querySelector("iframe.giscus-frame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ giscus: { setConfigTheme: theme } }, "https://giscus.app");
    }
  }

  window.addEventListener("message", function (event) {
    if (event.origin === "https://giscus.app" && event.data && typeof event.data === "object" && event.data.giscus && "discussion" in event.data.giscus) {
      sendTheme(currentTheme());
    }
  });

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  function onChange(event) {
    sendTheme(event.matches ? "dark" : "light");
  }

  if (mq.addEventListener) {
    mq.addEventListener("change", onChange);
  } else if (mq.addListener) {
    mq.addListener(onChange);
  }
})();

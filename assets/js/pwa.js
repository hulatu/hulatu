/* PWA：注册 Service Worker（仅 https / localhost） */
(function () {
  "use strict";
  var proto = location.protocol;
  var host = location.hostname;
  if (!("serviceWorker" in navigator)) return;
  if (proto !== "https:" && host !== "localhost" && host !== "127.0.0.1") return;
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").catch(function () {
      /* 静默失败：不影响正常浏览 */
    });
  });
})();

(function () {
  "use strict";

  var copyIcon =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>';
  var okIcon =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg>';

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (e) {
        reject(e);
      }
      document.body.removeChild(ta);
    });
  }

  function wrap(pre) {
    if (pre.closest(".code-block")) return;
    var code = pre.querySelector("code");
    var langMatch = code && code.className.match(/language-(\S+)/);
    var lang = langMatch ? langMatch[1] : "";

    var block = document.createElement("div");
    block.className = "code-block";

    var header = document.createElement("div");
    header.className = "code-block-header";
    header.innerHTML =
      '<span class="code-lang">' + lang + "</span>" +
      '<button type="button" class="code-copy-btn" title="复制代码" aria-label="复制代码"><span class="code-copy-icon">' + copyIcon + "</span></button>";

    pre.parentNode.insertBefore(block, pre);
    block.appendChild(header);
    block.appendChild(pre);

    var btn = header.querySelector(".code-copy-btn");
    var icon = header.querySelector(".code-copy-icon");
    btn.addEventListener("click", function () {
      var text = code ? code.textContent : pre.textContent;
      copyText(text)
        .then(function () {
          block.classList.add("is-copied");
          icon.innerHTML = okIcon;
          setTimeout(function () {
            block.classList.remove("is-copied");
            icon.innerHTML = copyIcon;
          }, 1600);
        })
        .catch(function () {});
    });
  }

  function scan() {
    document.querySelectorAll(".post-content pre").forEach(wrap);
  }

  document.addEventListener("DOMContentLoaded", scan);
  document.addEventListener("pjax:complete", scan);
})();

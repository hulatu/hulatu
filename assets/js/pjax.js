(function () {
  "use strict";
  var mainSel = "main.container";
  var footerSel = "footer.site-footer";

  function isLinkable(e) {
    if (!e || e.target === "_blank" || e.hasAttribute("download") || e.getAttribute("rel") === "external") return false;
    var href = e.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    if (/\.(xml|json|pdf|zip)$/i.test(href.split("?")[0].split("#")[0])) return false;
    var u;
    try { u = new URL(href, window.location.href); } catch (e2) { return false; }
    return u.origin === window.location.origin && !(u.pathname === window.location.pathname && u.hash);
  }

  function reExecScripts(container) {
    container.querySelectorAll("script").forEach(function (old) {
      var s = document.createElement("script");
      Array.prototype.forEach.call(old.attributes, function (attr) {
        s.setAttribute(attr.name, attr.value);
      });
      s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  }

  function swapFooter(newDoc, main) {
    var newFooter = newDoc.querySelector(footerSel);
    var oldFooter = document.querySelector(footerSel);
    if (newFooter && oldFooter) {
      oldFooter.outerHTML = newFooter.outerHTML;
    } else if (newFooter && !oldFooter) {
      main.insertAdjacentHTML("afterend", newFooter.outerHTML);
    } else if (!newFooter && oldFooter) {
      oldFooter.remove();
    }
  }

  function apply(newHtml, url, push) {
    var doc = new DOMParser().parseFromString(newHtml, "text/html");
    var newMain = doc.querySelector(mainSel);
    var oldMain = document.querySelector(mainSel);
    if (!newMain || !oldMain) {
      window.location.href = url;
      return;
    }
    oldMain.innerHTML = newMain.innerHTML;
    document.title = doc.title;
    var newDesc = doc.querySelector('meta[name="description"]');
    var oldDesc = document.querySelector('meta[name="description"]');
    if (newDesc && oldDesc) oldDesc.setAttribute("content", newDesc.getAttribute("content") || "");
    if (push) history.pushState({ pjax: true }, "", url);
    window.scrollTo(0, 0);
    reExecScripts(oldMain);
    swapFooter(doc, oldMain);
    document.dispatchEvent(new CustomEvent("pjax:complete"));
  }

  function load(url, push) {
    var main = document.querySelector(mainSel);
    if (main) main.classList.add("is-loading");
    document.dispatchEvent(new CustomEvent("pjax:start"));
    fetch(url, { headers: { "X-Requested-With": "fetch" } })
      .then(function (r) {
        if (!r.ok) throw new Error("page load failed");
        return r.text();
      })
      .then(function (html) { apply(html, url, push); })
      .catch(function () { window.location.href = url; })
      .finally(function () {
        if (main) main.classList.remove("is-loading");
      });
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest("a");
    if (!isLinkable(a)) return;
    var href = a.getAttribute("href");
    var url = new URL(href, window.location.href).href;
    if (url !== window.location.href) {
      e.preventDefault();
      load(url, true);
    }
  });

  window.addEventListener("popstate", function () {
    load(window.location.href, false);
  });
})();

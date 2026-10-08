(function () {
  "use strict";

  /* ---------- 移动端菜单 ---------- */
  var burger = document.getElementById("nav-burger");
  var nav = document.getElementById("site-nav");

  function setNav(open) {
    if (!burger || !nav) return;
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    nav.classList.toggle("is-open", open);
  }

  if (burger && nav) {
    burger.addEventListener("click", function () {
      setNav(!burger.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setNav(false);
    });
    /* 点菜单/汉堡以外的任何地方都收起来（2026-09-30 补）。
       手机上原来只能靠「再点一次汉堡」关掉，点正文空白处菜单一直挂着，很别扭。
       注意汉堡自己的点击也会冒泡到这里，所以必须把它和菜单本身排除掉，
       否则「点汉堡展开」会立刻被这里关掉。 */
    document.addEventListener("click", function (e) {
      if (!burger.classList.contains("is-open")) return;
      if (nav.contains(e.target) || burger.contains(e.target)) return;
      setNav(false);
    });
  }

  /* ---------- 顶栏滚动状态（分割线 + 自动隐藏）与返回顶部 ---------- */
  var header = document.querySelector(".site-header");
  var backTop = document.getElementById("back-top");
  var readingProgress = document.getElementById("reading-progress");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var headerTicking = false;
  var lastScrollY = window.scrollY;

  function updateHeader() {
    headerTicking = false;
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
      if (y > lastScrollY && y > 120) {
        header.classList.add("is-hidden");
      } else if (y < lastScrollY) {
        header.classList.remove("is-hidden");
      }
    }
    if (backTop) backTop.classList.toggle("is-visible", y > 400);
    if (readingProgress) {
      var doc = document.documentElement;
      var total = doc.scrollHeight - doc.clientHeight;
      var ratio = total > 0 ? y / total : 0;
      // 只改 transform：整条进度条走合成层，不触发布局
      readingProgress.style.transform = "scaleX(" + ratio + ")";
    }
    lastScrollY = y;
  }

  function onScrollHeader() {
    if (!headerTicking) {
      headerTicking = true;
      window.requestAnimationFrame(updateHeader);
    }
  }

  window.addEventListener("scroll", onScrollHeader, { passive: true });
  updateHeader();

  if (backTop) {
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  }

  /* 2026-10-05：删掉 [ / ] 上下篇快捷键。它 click() 的是 .post-nav-prev / .post-nav-next，
     而那两个元素在 single.html 里与「相关文章」互斥、从未渲染过 —— 按了没反应也不报错，
     是本文件里唯一一条静默失效的监听。文末导航改为只留「相关文章」后，这条彻底没有意义。 */

  /* ---------- 复制标题链接 ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
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

  function showToast(msg) {
    var toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("is-show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove("is-show");
    }, 1600);
  }

  var headingAnchors = document.querySelectorAll(".heading-anchor");
  if (headingAnchors.length) {
    Array.prototype.forEach.call(headingAnchors, function (anchor) {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        var base = location.href.split("#")[0];
        copyText(base + anchor.getAttribute("href")).then(function () {
          showToast("链接已复制");
        }).catch(function () {
          showToast("复制失败，请手动复制");
        });
      });
    });
  }

  /* ---------- 图片渐进加载（blur-up） ---------- */
  /* CSS 里 .js .article-image img 是 opacity: 0，只有 .is-loaded 才亮起来。
     所以「什么时候算完事」必须两个方向都覆盖，否则失败的图永远不亮：
       · 原来只挂 load → 图挂掉就等不到 load，图停在 opacity: 0，
         连带 alt 文字一起透明，读者只看到一个灰色空盒子（静默丢内容）。
       · 原来那句 `img.complete && img.naturalWidth > 0` 也有漏：
         complete 为 true 只说明「浏览器已经给出结论了」，失败同样算 complete。
         于是失败的图会被塞进 else 分支，去等一个永远不会来的 load。
     正确判法：已经 complete 的就当场按 naturalWidth 定生死；还没 complete 的，
     load 和 error 都挂上，谁先来听谁的。 */
  Array.prototype.forEach.call(document.querySelectorAll(".article-image img"), function (img) {
    function settle(cls) {
      img.classList.add(cls);
    }
    if (img.complete) {
      settle(img.naturalWidth > 0 ? "is-loaded" : "is-failed");
      return;
    }
    img.addEventListener("load", function () { settle("is-loaded"); });
    img.addEventListener("error", function () { settle("is-failed"); });
  });

  /* ---------- 代码块复制 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-code-copy]"), function (btn) {
    btn.addEventListener("click", function () {
      var block = btn.closest(".code-block");
      var code = block ? block.querySelector("pre code, pre") : null;
      if (!code) return;
      copyText(code.textContent).then(function () {
        btn.textContent = "已复制";
        setTimeout(function () { btn.textContent = "复制"; }, 1500);
      }).catch(function () {
        showToast("复制失败");
      });
    });
  });

  /* ---------- 阅读位置记忆（2026-10-07 加，2026-10-08 撤） ----------
     这里原先有一个 initResume() IIFE —— 「上次读到 62%」那条提示条的全部逻辑：
     localStorage 读写、8% / 92% / 95% 三档阈值、预渲染闸门、500ms 防抖落盘。

     撤掉的理由：它只在「第二次访问同一篇长文、且这次落在页首」时出现 ——
     触发条件窄，而实现是全站最重的一处。出现率远低于实现成本。

     连带后果（都已同步处理）：
       · 全站 localStorage 从两处回到一处，只剩 search.js 的最近搜索 ——
         search.js 那句「这是全站唯一一处 localStorage」重新成立。
       · content/privacy.md 与 content/colophon.md 里「阅读位置」那条登记已删。
       · single.html 的 `.resume` 结构块、critical-post.css 的 `.resume*` 段一并删除。

     要加回来得四处一起补：single.html 的结构、这里、critical-post.css 的样式，
     以及 privacy.md / colophon.md 两处登记。 */
})();

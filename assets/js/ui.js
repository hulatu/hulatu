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

  /* ---------- 阅读位置记忆（2026-10-07） ----------
     这个站的正文是 17px / 行高 1.8，读着舒服，代价是文章长。真实场景：
     从搜索或相关文章点进一篇长文，读一半去做别的事，回来得从头滚。
     页头那条阅读进度条已经在量位置了，可惜它不记忆 —— 这里补上。

     全站第二处 localStorage（第一处是 search.js 的最近搜索）。
     DESIGN.md 里「深浅色刷新不记忆」约束的是**主题**，和「记住你读到哪儿」
     不是一回事：前者是偏好，后者是读者的劳动成果，不记住才是丢东西。
     content/privacy.md 里「本站自身不使用 LocalStorage」那句已同步改掉。 */
  (function initResume() {
    var box = document.getElementById("resume");
    if (!box) return;                       /* 不是文章页 */
    var pctEl = document.getElementById("resume-pct");
    var goBtn = document.getElementById("resume-go");
    var restartBtn = document.getElementById("resume-restart");
    if (!pctEl || !goBtn || !restartBtn) return;

    var KEY = "hulatu:read:" + location.pathname;

    /* 阈值都是刻意选的：
       · MIN 8%   —— 低于它多半只是「点进来又走了」，不值得提示；
       · MAX 92%  —— 高于它等于读完了，不该再问「要不要继续」；
       · DONE 95% —— 滚到这儿就把记录清掉，下次进来是干净的。 */
    var MIN = 8, MAX = 92, DONE = 95;

    var saveTimer = 0;
    var lastPct = -1;
    var started = false;                    /* 用户真的滚动过没有 */
    var dismissed = false;

    function ratio() {
      var doc = document.documentElement;
      var total = doc.scrollHeight - doc.clientHeight;
      return total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
    }

    function read() {
      try {
        return parseInt(window.localStorage.getItem(KEY) || "0", 10) || 0;
      } catch (e) {
        return 0;   /* 隐私模式下 localStorage 会抛，静默降级成「不记」 */
      }
    }

    function write(pct) {
      try {
        if (pct >= DONE) window.localStorage.removeItem(KEY);
        else window.localStorage.setItem(KEY, String(pct));
      } catch (e) { /* 同上 */ }
    }

    function hide() {
      box.hidden = true;
      dismissed = true;
    }

    /* ---- 显示 ----
       只在「这次从页首开始看」时提示：浏览器前进/后退会自己恢复滚动位置，
       那种情况下人已经在那儿了，再弹一条「上次读到 62%」纯属打扰。 */
    var saved = read();
    if (saved >= MIN && saved <= MAX && window.scrollY < 100) {
      pctEl.textContent = saved + "%";
      box.hidden = false;
      /* 兜一道：有些浏览器在 load 之后才恢复滚动位置，那时再判一次 */
      window.addEventListener("load", function () {
        if (!dismissed && window.scrollY > 100) hide();
      });
    }

    goBtn.addEventListener("click", function () {
      var doc = document.documentElement;
      var total = doc.scrollHeight - doc.clientHeight;
      window.scrollTo({
        top: total * saved / 100,
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });
      hide();
    });

    restartBtn.addEventListener("click", function () {
      try { window.localStorage.removeItem(KEY); } catch (e) { /* 同上 */ }
      hide();
    });

    /* ---- 记录 ----
       不每帧写 localStorage（同步 IO，在滚动里写会把帧切碎）。
       滚动停 500ms 才落一次盘，另外在「页面被藏起来 / 被卸载」时补一刀，
       覆盖「滚到一半直接关标签页」那种情况。

       started 这个闸门是必需的：页面可能被 Speculation Rules 预渲染，
       预渲染中的文档也会收到 visibilitychange —— 没有这道闸，一个从没被
       滚动过的预渲染副本会往 localStorage 写一个 0，把真实进度盖掉。 */
    function flush() {
      if (!started) return;
      var pct = Math.round(ratio() * 100);
      if (pct === lastPct) return;
      lastPct = pct;
      write(pct);
    }

    function schedule() {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(flush, 500);
    }

    window.addEventListener("scroll", function () {
      started = true;
      /* 人一旦自己往下读，这条提示就没用了 —— 让它随滚动消失，
         而不是一直挂在正文顶上占地方。 */
      if (!dismissed && !box.hidden && window.scrollY > 200) hide();
      schedule();
    }, { passive: true });

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flush();
    });
  })();
})();

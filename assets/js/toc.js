(function () {
  "use strict";

  /* 文章目录的逻辑都在这个文件里：
       init()       —— 滚动高亮当前章节 + 把宽屏刻度栏的滚动窗口推到当前标题；
       initInlineToc() —— 手机上把正文开头那块目录默认收起来；
       initHashAnchor() —— 带着 #锚点 进页面时把标题重新对准（见下面那段注释）。
     同一份目录在页面里有两份副本（宽屏刻度栏 + 正文开头那块），
     所以高亮对页面里所有 .post-toc-nav 一起生效；点哪一份都是这里接管、平滑滚动。
     （原先还有第四个 initPin()，管宽屏刻度栏的「钉住」按钮 ——
     2026-10-09 随图钉 #toc-pin 一起删，理由见 single.html 里那段注释。） */

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  /* 目录高亮的状态：当前命中的锚点 id，以及它那条「祖先链」上的所有 <a>。
     记着链是为了滚动时只做差集增删，不每帧全量清 class —— 见 setActive()。 */
  var activeId = null;
  var activeChain = [];

  /* ---------- 宽屏刻度栏的「滚动窗口」（2026-10-09）----------
     收起态的 .post-toc 只有一行高（CSS 里 max-height: var(--hit)），露出来的应该是
     **当前标题** —— 读到哪里，目录里就翻到哪一行，像日历翻页。
     做法是给 .post-toc-nav 一个 translateY，把当前那一行顶进窗口。位移量写进
     CSS 变量 --toc-shift，由样式表消费：
       .post-rail .post-toc-nav { transform: translateY(var(--toc-shift, 0px)) }
     悬停时那条 `transform: none` 负责归零 —— 就是「翻开目录」的那一下。

     ⚠️ 写变量而不是直接写 style.transform：inline 样式任何选择器都盖不住，
     那样悬停就回不到「从头铺开」了。同特异性下 CSS 靠「后出现」取胜，变量方案可行。

     ⚠️ 两个 rect 相减**不需要**去管 transform 和 scrollTop：目录和它里面的行同时被
     同一个 transform 平移、也被同一个 scrollTop 卷动，相减之后两者都抵消掉，
     剩下的就是这一行在目录里的固有偏移（= 第几行 × 行高，行高固定，所以是逐像素准的）。 */
  var railNav = null;
  var railScroller = null;
  var railActive = null;
  var railLinks = [];

  function railEl() {
    return railNav ? railNav.closest(".post-rail") : null;
  }

  function placeRailWindow() {
    if (!railNav || !railActive) return;
    var rail = railEl();
    /* 悬停时不碰 scrollTop —— 窗口已经长开，用户可能正把目录往下滚。
       收起态才归零：窗口是从列表顶端量的，scrollTop 不为 0 会让窗口落在列表中间。 */
    if (railScroller && !(rail && rail.matches(":hover"))) railScroller.scrollTop = 0;
    var rel = railActive.getBoundingClientRect().top - railNav.getBoundingClientRect().top;
    railNav.style.setProperty("--toc-shift", (-rel).toFixed(1) + "px");
  }

  /* 把窗口对准当前锚点。两份目录副本里只有刻度栏那份需要 —— 正文开头那块
     （.post-toc-inline-nav）是完整铺开的，不做窗口。 */
  function aimRailWindow(id) {
    if (!railNav) return;
    railActive = null;
    for (var i = 0; i < railLinks.length; i++) {
      if (hashOf(railLinks[i]) === id) { railActive = railLinks[i]; break; }
    }
    placeRailWindow();
  }

  function scrollBehavior() {
    return reduceMotion.matches ? "auto" : "smooth";
  }

  function hashOf(link) {
    var href = link.getAttribute("href") || "";
    return href.charAt(0) === "#" ? decodeURIComponent(href.slice(1)) : "";
  }

  /* 命中的小节要连带它的各级父级一起亮（做法来自 bearneo 的 toc.html：buildChainFromLink）。
     只亮叶子的话，读到 ### 小节时上面的 ## 还是灰的，看不出「我在哪一章的哪一节」。
     沿 li.parentElement.closest('li') 一层层往上爬，把沿途每个 <a> 收进链里。
     Hugo 生成的目录是 <ul><li><a>A</a><ul><li><a>B</a></li></ul></li></ul>，
     所以 B 的父级 li 就是 A 所在的那个 li，parentLi.querySelector("a") 取到的正是 A 本身
     （A 的 <a> 在嵌套 <ul> 之前，文档序上排第一）。 */
  function chainOf(link) {
    var chain = [];
    if (!link) return chain;
    chain.push(link);
    var li = link.closest("li");
    while (li) {
      var parentLi = li.parentElement ? li.parentElement.closest("li") : null;
      if (parentLi) {
        var parentLink = parentLi.querySelector("a");
        if (parentLink) chain.push(parentLink);
      }
      li = parentLi;
    }
    return chain;
  }

  function setActive(links, id) {
    if (!id || id === activeId) return;
    activeId = id;

    /* 同一份目录有两份副本，hash 相同的 link 都要亮，
       所以先把它们全找出来，再把各自的祖先链并成一条（indexOf 去重）。 */
    var chain = [];
    links.forEach(function (link) {
      if (hashOf(link) !== id) return;
      chainOf(link).forEach(function (el) {
        if (chain.indexOf(el) === -1) chain.push(el);
      });
    });

    /* 只对差集做增删：滚动时每帧都会走到这里，全量 toggle 会把没必要的
       class 变更和随之而来的样式重算都做一遍。 */
    activeChain.forEach(function (el) {
      if (chain.indexOf(el) === -1) el.classList.remove("is-active");
    });
    chain.forEach(function (el) {
      if (!el.classList.contains("is-active")) el.classList.add("is-active");
    });

    activeChain = chain;

    /* 刻度栏那份副本还要把滚动窗口推到这一行（正文开头那块不做窗口，见 aimRailWindow）。 */
    aimRailWindow(id);
  }

  function init() {
    var navs = Array.prototype.slice.call(document.querySelectorAll(".post-toc-nav"));
    var content = document.querySelector(".post-content");
    if (!navs.length || !content) return;

    var links = [];
    navs.forEach(function (nav) {
      Array.prototype.push.apply(links, Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')));
    });
    if (!links.length) return;

    var targets = links
      .map(function (link) { return document.getElementById(hashOf(link)); })
      .filter(Boolean);
    if (!targets.length) return;

    /* 刻度栏那份副本（滚动窗口用，见文件顶部那段）。
       窄屏时 .post-rail 是 display: none，量出来的 rect 全是 0、算出的位移也是 0，
       不会出错，所以这里不额外判断可见性。 */
    railNav = document.querySelector(".post-rail .post-toc-nav");
    if (railNav) {
      railScroller = railNav.closest(".post-toc");
      railLinks = Array.prototype.slice.call(railNav.querySelectorAll('a[href^="#"]'));
      var rail = railEl();
      if (rail) {
        /* 鼠标一离开就把窗口重新对一次：悬停期间用户可能把目录滚过，
           收起后窗口会落在列表中间。 */
        rail.addEventListener("mouseleave", function () {
          if (railScroller) railScroller.scrollTop = 0;
          placeRailWindow();
        });
      }
    }

    /* ---------- 点目录之后把高亮「锁」住 ----------
       不锁的话会看到高亮闪一下（2026-10-02 修）：点击时我们先 setActive(target)，
       但紧接着的第一帧 scroll 事件里，sync() 读到的还是**旧的** scrollY
       （平滑滚动刚起步、几乎没动），于是算出「当前还在原来那一节」，
       把高亮立刻打回去，然后才随着滚动一格格往前挪。
       顺序就成了「目标 → 原来那节 → … → 目标」，中间那下回跳就是那记「闪」。 */
    var activeLocked = false;
    var unlockTimer = 0;

    function unlockHighlight() {
      if (!activeLocked) return;
      activeLocked = false;
      window.clearTimeout(unlockTimer);
      /* 解封时按最终位置重新对一次：锁着这段时间 sync() 一直被挡着，
         不补这一刀的话，高亮会停在我们点的那一节上、和实际位置脱节。 */
      sync();
    }

    function lockHighlight() {
      activeLocked = true;
      window.clearTimeout(unlockTimer);
      /* 首选信号是 scrollend；不支持的浏览器（老 Safari）靠这个兜底。
         700ms 比一次平滑滚动略长，够用，也不会让高亮卡太久。 */
      unlockTimer = window.setTimeout(unlockHighlight, 700);
    }

    /* 用户自己一动手就立刻解封，别让兜底计时器把高亮按住不放。 */
    window.addEventListener("scrollend", unlockHighlight);
    ["wheel", "touchstart", "keydown"].forEach(function (name) {
      window.addEventListener(name, unlockHighlight, { passive: true });
    });

    function sync() {
      if (activeLocked) return;
      var line = window.scrollY + 130;
      var active = targets[0];
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].getBoundingClientRect().top + window.scrollY <= line) active = targets[i];
      }
      setActive(links, active.id);
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        sync();
        ticking = false;
      });
    }, { passive: true });

    var header = document.querySelector(".site-header");

    /* 向下跳时留的呼吸：严格贴顶（0）的话，中文标题的字形上沿正好顶到视口边缘，
       看着挤。5 不是间距 token（--space-* 从 4px 起跳、下一档就是 8px），
       是照着「刚刚不贴边」单独定下来的。 */
    var DOWN_GAP = 5;

    /* ---------- 点目录的落点 ----------
       向下跳时标题**几乎贴到页面最顶端**，只留上面那 5px（不留 --anchor-offset 那 76px）。
       为什么可以不留：顶栏是「向下滚就自动收起」的（见 ui.js 的 updateHeader），
       所以向下跳的过程中它本来就会滑走；这时候还照旧留 76px 就成了一片空白 ——
       读者看到标题悬在页面下方，上面什么都没有，像是没对准。
       反方向（往上跳）必须保持原样：顶栏会随着向上滚动重新露出来，
       这时候 76px 的留位正是需要的，否则标题一落地就被顶栏盖住。
       所以不能把这条写进 CSS 的 scroll-margin-top 里（那是全站锚点共用的，
       脚注的 #fn: / #fnref: 回跳也会跟着变），只能在目录这条点击路径上按方向算。 */
    function scrollToTarget(target) {
      var top = target.getBoundingClientRect().top + window.scrollY;
      var goingDown = top > window.scrollY + 1;
      var offset = goingDown ? DOWN_GAP : anchorOffset(target);

      /* 顺手把顶栏状态定下来：向下跳本来就该收起。
         不这么做的话，「人在页面顶部、顶栏还露着，点一个就在下面的小节」时，
         标题贴顶的同时会被顶栏盖住（ui.js 要滚过 120px 才收起）。
         ui.js 之后的滚动处理会维持这个状态（向下滚它只管收起、不主动展开），
         所以两边不会打架。

         但判断依据必须是**落点** next，不能是 goingDown（2026-10-02 修）：
         goingDown 只看目标在不在下方，而向下跳的 offset 是 DOWN_GAP（5px）。
         当目标只比当前位置低 1~5px 时，next 反而比当前位置还小 —— 页面会往上滚一丁点，
         ui.js 的 updateHeader 立刻判成「向上滚」把 .is-hidden 摘掉，
         顶栏于是先收起再弹回来，闪一下。现在只有 next 真的更大才收。 */
      var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      var next = Math.min(Math.max(top - offset, 0), max);
      if (next > window.scrollY && header) header.classList.add("is-hidden");

      window.scrollTo({ top: next, behavior: scrollBehavior() });
    }

    navs.forEach(function (nav) {
      nav.addEventListener("click", function (event) {
        var link = event.target.closest("a");
        if (!link || !nav.contains(link)) return;
        var target = document.getElementById(hashOf(link));
        if (!target) return;
        event.preventDefault();
        scrollToTarget(target);
        /* 先把高亮定在目标上，再锁住 —— 顺序不能反：
           锁的作用就是挡住「滚动刚起步那几帧里 sync() 拿旧位置算出旧章节」。 */
        setActive(links, target.id);
        lockHighlight();
      });
    });

    sync();
  }

  /* ---------- 手机上把正文开头那块目录默认收起来 ----------
     同一份 <details> 在宽屏是展开的（HTML 里带 open），到手机上默认收起更省屏幕；
     只在加载时判断一次，之后用户自己点开 / 收起，脚本不再插手。 */
  function initInlineToc() {
    var block = document.querySelector(".post-toc-inline");
    if (!block) return;
    if (window.matchMedia("(max-width: 760px)").matches) block.open = false;
  }

  /* ---------- 宽屏刻度栏的「钉住」----------
     2026-10-09 删掉。原先这里有个 initPin()，给 .post-rail 切 .is-pinned，
     让目录不用靠悬停维持展开。
     撤的理由：图钉解决的是「悬停才展开的目录想让它常驻」，而收起态现在**本身就常驻
     显示当前标题**（滚动窗口，见上面 placeRailWindow），要展开也只需把指针移上来 ——
     「多做一次动作换一直保持一个姿势」那个权衡不再成立。
     要加回来得四处一起补：single.html 的按钮、这里、critical-post.css 的
     `.post-toc-pin` 全部规则与三处 `.post-rail.is-pinned …` 展开触发条件。 */

  /* ---------- 带着 #锚点 进页面时的定位 ----------
     点目录、点标题上的 #，都由 CSS 的 scroll-margin-top（--anchor-offset）决定落点。
     真正需要 JS 补一刀的是「从别人的链接点进来」这一步：
       1. 浏览器最初定位时，正文图片、网页字体、评论框往往还没就位，等它们撑高页面，
          目标标题已经偏到上面去了 —— 所以等 load / 字体就绪后再对一次；
       2. 老链接里的 #%e4%b9%a0%e6%83%af 是中文锚点，标题 id 换成拼音后按 id 找不到，
          这时退回按标题文字匹配（标题没改名就还能落到原来的位置）。
     用户自己滚过页面之后就不再插手，免得把人拽回去。 */
  function normalizeText(text) {
    return (text || "").replace(/\s+/g, "").replace(/#+$/, "");
  }

  function findByHeadingText(text) {
    var want = normalizeText(text);
    if (!want) return null;
    var headings = document.querySelectorAll("main h1[id], main h2[id], main h3[id], main h4[id]");
    for (var i = 0; i < headings.length; i++) {
      if (normalizeText(headings[i].textContent) === want) return headings[i];
    }
    return null;
  }

  function anchorOffset(el) {
    var value = parseFloat(window.getComputedStyle(el).scrollMarginTop);
    return isNaN(value) ? 0 : value;
  }

  function initHashAnchor() {
    if (!location.hash || location.hash.length < 2) return;
    var id = location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch (e) {
      /* 不是合法的百分号编码就按原样找 */
    }
    var target = document.getElementById(id) || findByHeadingText(id);
    if (!target) return;

    var userMoved = false;
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (name) {
      window.addEventListener(name, function () { userMoved = true; }, { passive: true, once: true });
    });

    function realign() {
      if (userMoved) return;
      var drift = Math.abs(target.getBoundingClientRect().top - anchorOffset(target));
      // 只在真的偏了的时候纠一次，偏一点就当它已经对准了，免得页面看着在抖
      if (drift <= 4) return;
      try {
        target.scrollIntoView({ block: "start", behavior: "instant" });
      } catch (e) {
        target.scrollIntoView(true);
      }
    }

    window.addEventListener("load", function () {
      window.requestAnimationFrame(realign);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { window.setTimeout(realign, 0); });
    }
    if (document.readyState === "complete") realign();
  }

  document.addEventListener("DOMContentLoaded", function () {
    init();
    initInlineToc();
    initHashAnchor();
  });
})();

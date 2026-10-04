(function () {
  "use strict";

  /* 评论区默认是「已经预加载好、但整块收起来」的状态：
       1) 滚到评论区前 400px 就开始在后台加载 giscus；
       2) 加载完成后不自动展开，标题行一直留着；
       3) 读者点标题行才展开——内容早就好了，展开是瞬间的，不会先白一下；
       4) 再点一次收起；iframe 留在 DOM 里（max-height: 0 + visibility: hidden），
          再点开还是瞬时的，不用重新加载；
       5) 预加载失败（比如 giscus 被墙）时保持静默，读者点了会重新试一次。

     折叠开关是一个 <details> 的 <summary>（#giscus-toggle，胶囊按钮 + 右边 V 形箭头，
     展开时箭头转 180°，与打赏块 .donate-btn 同一套）。
     ⚠️ 那个 <details> **恒带 open**：折叠不靠 details 原生收起，而是靠 .is-open 类
     切 .giscus-body 的 max-height + visibility —— 收起时 iframe 仍保有布局宽度，
     giscus 测算高度不会算出 0，点开才不跳动。JS 里 preventDefault 掉 summary 的
     原生 toggle，展开/收起完全由下面的状态机接管。

     状态机只有一个 state 变量，并镜像到 .giscus-body 的 data-state 上（方便在
     开发者工具里直接看到当前处于哪一步）：

       idle    什么都没做
       loading 后台预加载中（读者没点过，标题仍是「评论」）
       opening 读者点过了，正在等 iframe 出来（标题下方显示「正在加载评论…」）
       ready   iframe 已就绪但还没展开（预加载完成，或读者刚把它收起）
       slow    点开超过 SLOW_MS 还没出来，提示读者再点一次
       open    已展开

     两个超时各管一段，互不干扰：SLOW_MS 只在「读者已经在等」时有意义，
     GIVEUP_MS 只管把没人要的预加载悄悄作废。
     iframe 是用 MutationObserver 盯容器子节点等到的，不用定时轮询。 */

  var body = document.getElementById("giscus-body");
  var slot = document.getElementById("giscus-slot");
  var toggle = document.getElementById("giscus-toggle");
  var box = document.getElementById("giscus-box");
  var loading = document.getElementById("giscus-loading");
  if (!body || !slot || !toggle || !box) return;

  var SLOW_MS = 12000;    // 读者点开之后 12 秒还出不来：提示重新点一次
  var GIVEUP_MS = 120000; // 预加载 2 分钟没结果：悄悄作废，等读者点的时候重新来一次

  var state = "idle";
  var slowTimer = null;
  var giveupTimer = null;
  var frameObserver = null;
  var nearObserver = null;

  function clearTimers() {
    if (slowTimer) {
      clearTimeout(slowTimer);
      slowTimer = null;
    }
    if (giveupTimer) {
      clearTimeout(giveupTimer);
      giveupTimer = null;
    }
  }

  function stopWatchingFrames() {
    if (frameObserver) {
      frameObserver.disconnect();
      frameObserver = null;
    }
  }

  function hasFrame() {
    return !!slot.querySelector("iframe.giscus-frame");
  }

  /* 唯一决定界面的地方：状态一变，展开样式、箭头、提示文字全部跟着走 */
  function setState(next) {
    state = next;
    body.dataset.state = next;
    clearTimers();

    if (next === "open") {
      stopWatchingFrames();
      box.classList.add("is-open");
      toggle.setAttribute("aria-label", "收起评论");
      if (loading) loading.hidden = true;
      return;
    }

    // 其余都是「收起来」的状态
    box.classList.remove("is-open");
    toggle.setAttribute("aria-label", "展开评论");

    if (loading) {
      if (next === "opening") {
        loading.textContent = "正在加载评论…";
        loading.hidden = false;
      } else if (next === "slow") {
        loading.textContent = "加载有点慢，点上方「评论」再试一次";
        loading.hidden = false;
      } else {
        loading.hidden = true;
      }
    }
  }

  function watchForFrame() {
    if (frameObserver || typeof MutationObserver === "undefined") return;
    frameObserver = new MutationObserver(function () {
      if (!hasFrame()) return;
      // 读者在等就展开；只是在预加载就记住「已就绪」
      if (state === "opening") setState("open");
      else if (state === "loading") setState("ready");
    });
    frameObserver.observe(slot, { childList: true, subtree: true });
  }

  function inject() {
    var script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-loading", "lazy");
    for (var key in slot.dataset) {
      script.setAttribute("data-" + key.replace(/([A-Z])/g, "-$1").toLowerCase(), slot.dataset[key]);
    }
    slot.appendChild(script);
  }

  /* 后台预加载：只注入脚本，不展开、不改标题 */
  function preload() {
    if (state !== "idle") return;
    setState("loading");
    watchForFrame();
    inject();
    giveupTimer = setTimeout(function () {
      if (state !== "loading") return;
      slot.innerHTML = ""; // 预加载失败：静默作废，读者点了再重新来一次
      setState("idle");
    }, GIVEUP_MS);
  }

  function requestOpen() {
    if (state === "open") return;
    if (state === "ready") {
      setState("open");
      return;
    }
    if (state === "slow") {
      slot.innerHTML = "";
      setState("idle");
      requestOpen();
      return;
    }

    var firstTime = state === "idle";
    setState("opening");
    watchForFrame();
    if (firstTime) inject();
    slowTimer = setTimeout(function () {
      if (state === "opening") setState("slow");
    }, SLOW_MS);
  }

  /* 点标题行：展开 / 收起。收起时只要 iframe 还在就退回 ready，
     这样再点开是瞬时的，不用重新加载。 */
  function onToggle() {
    if (state === "open") {
      setState(hasFrame() ? "ready" : "idle");
      return;
    }
    requestOpen();
  }

  function watchApproach() {
    if (typeof IntersectionObserver === "undefined") return;
    nearObserver = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        nearObserver.disconnect();
        nearObserver = null;
        preload();
        return;
      }
    }, { rootMargin: "400px 0px" });
    nearObserver.observe(slot);
  }

  toggle.addEventListener("click", function (e) {
    e.preventDefault();
    onToggle();
  });
  setState("idle");

  // 被预渲染（prerender）的页面不提前拉评论：等它真的被打开再挂监听
  if (document.prerendering) {
    document.addEventListener("prerenderingchange", watchApproach, { once: true });
  } else {
    watchApproach();
  }
})();

(function () {
  "use strict";

  /* 评论区默认是「已经预加载好、但整块收起来」的状态：
       1) 滚到评论区前 400px 就开始在后台加载 giscus；
       2) 加载完成后不自动展开，按钮一直留着；
       3) 读者点按钮才展开——内容早就好了，展开是瞬间的，不会先白一下；
       4) 预加载失败（比如 giscus 被墙）时保持静默，读者点了会重新试一次。

     状态机只有一个 state 变量，并镜像到 .giscus-body 的 data-state 上（方便在
     开发者工具里直接看到当前处于哪一步）：

       idle    什么都没做
       loading 后台预加载中（读者没点过，按钮仍是「显示评论」）
       opening 读者点过了，正在等 iframe 出来
       ready   iframe 已就绪但还没展开（预加载完成）
       slow    点开超过 SLOW_MS 还没出来，按钮变「重新加载评论」
       open    已展开，收工

     两个超时各管一段，互不干扰：SLOW_MS 只在「读者已经在等」时有意义，
     GIVEUP_MS 只管把没人要的预加载悄悄作废。
     iframe 是用 MutationObserver 盯容器子节点等到的，不用定时轮询。 */

  var body = document.getElementById("giscus-body");
  var slot = document.getElementById("giscus-slot");
  var btn = document.getElementById("giscus-load-btn");
  var loading = document.getElementById("giscus-loading");
  if (!body || !slot || !btn) return;

  var SLOW_MS = 12000;    // 读者点开之后 12 秒还出不来：按钮变成「重新加载评论」
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

  /* 唯一决定界面的地方：状态一变，按钮文字、禁用、加载提示、展开样式全部跟着走 */
  function setState(next) {
    state = next;
    body.dataset.state = next;
    clearTimers();

    if (next === "open") {
      stopWatchingFrames();
      body.classList.add("is-open");
      btn.hidden = true;
      if (loading) loading.hidden = true;
      return;
    }

    btn.hidden = false;
    btn.disabled = next === "opening";
    btn.textContent = next === "slow" ? "重新加载评论" : "显示评论";
    if (loading) loading.hidden = next !== "opening";
  }

  function watchForFrame() {
    if (frameObserver || typeof MutationObserver === "undefined") return;
    frameObserver = new MutationObserver(function () {
      if (!slot.querySelector("iframe.giscus-frame")) return;
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

  /* 后台预加载：只注入脚本，不展开、不改按钮 */
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

  btn.addEventListener("click", requestOpen);
  setState("idle");

  // 被预渲染（prerender）的页面不提前拉评论：等它真的被打开再挂监听
  if (document.prerendering) {
    document.addEventListener("prerenderingchange", watchApproach, { once: true });
  } else {
    watchApproach();
  }
})();

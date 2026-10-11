/* 代码块「复制」按钮（2026-10-11 从旧「印章」主题取回，重写为无依赖版）
 *
 * 做法：**运行时插入按钮**，不覆盖 Hugo 的代码块渲染钩子。
 *   理由：覆盖 `render-codeblock.html` 意味着自己调 `transform.Highlight`
 *   重写整段高亮输出，还要和 `hugo.toml` 的 `noClasses = false` 协调 ——
 *   为「加一个按钮」重写渲染管线，代价远大于收益。
 *   运行时插入的代价是「JS 到达前没有按钮」，但按钮本来就是渐进增强。
 *
 * ⚠️ 只在**含代码块的页面**加载（判断在 partials/code-copy.html 里），
 *    全站 327 页里只有 5 页命中。
 * ⚠️ 类名 `.code-copy` 是与 custom_head.html 第 18 段的契约，改名要两边一起改。
 * ⚠️ 文案：默认「复制」→ 点击后「**已复制**」→ 1.6 秒回到「复制」。
 *    2026-10-11 当天改过两次：先「已复制」→ 用户要求「显示复制成功」→
 *    收盘时用户又改回「已复制」。**以「已复制」为准**，别再改成「复制成功」。
 *    同一天按钮样式也简化过（去掉边框/圆角，见 custom_head.html 第 18 段）。
 * ⚠️ 用 `pre.innerText` 取代码而不是 `textContent`：Chromium 输出的是
 *    `<span class="line">` 逐行结构，`innerText` 会按**渲染结果**还原换行；
 *    `textContent` 在某些情况下会把多行挤成一行。
 * ⚠️ 必须保留 `fallback()`：`navigator.clipboard` 只在 **HTTPS / localhost**
 *    下可用（本地 `hugo server` 是 http://localhost，算安全上下文，能用；
 *    但若有人从 file:// 打开或用了 http 域名，clipboard 就是 undefined）。
 */
(function () {
  function copyText(text, onDone) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onDone, function () {
        legacy(text, onDone);
      });
      return;
    }
    legacy(text, onDone);
  }

  /* 老办法：临时 textarea + execCommand。已废弃但在所有浏览器里还能用，
     是 clipboard API 失败时唯一的选择。 */
  function legacy(text, onDone) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      onDone();
    } catch (e) {
      /* 静默失败：不弹 alert。按钮文字不变，用户自然知道没成功。 */
    }
    document.body.removeChild(ta);
  }

  function init() {
    var boxes = document.querySelectorAll('div.highlight');
    if (!boxes.length) return;

    Array.prototype.forEach.call(boxes, function (box) {
      /* 已经加过就跳过（防止被重复初始化，例如以后的局部刷新） */
      if (box.querySelector('.code-copy')) return;

      var pre = box.querySelector('pre');
      if (!pre) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy';
      btn.textContent = '复制';
      btn.setAttribute('aria-label', '复制这段代码');

      var timer = null;
      btn.addEventListener('click', function () {
        copyText(pre.innerText, function () {
          btn.textContent = '已复制';
          btn.classList.add('is-done');
          if (timer) clearTimeout(timer);
          timer = setTimeout(function () {
            btn.textContent = '复制';
            btn.classList.remove('is-done');
          }, 1600);
        });
      });

      box.appendChild(btn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

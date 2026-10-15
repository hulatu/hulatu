/**
 * Cloudflare Pages Functions 中间件 —— 订阅源的内容协商（2026-10-15 新增）
 *
 * ── 为什么需要它 ──────────────────────────────────────────────────────
 * Chromium 正在移除 XSLT，浏览器打开 /index.xml 时会弹
 *   This site uses XSLT; that functionality is being removed from this browser…
 * 等它真移除，那一页就从「设计过的 HTML」退化成一片 raw XML。
 * 旧的实现是 feed 顶部挂一行 <?xml-stylesheet?>，靠浏览器自己渲染。
 *
 * 现在改成在边缘按「谁在请求」分派：
 *   浏览器地址栏导航  → /feed/ 或 /feed/weekly/（站点层生成的 HTML 页）
 *   订阅器 / 抓取器   → 原样返回 /index.xml（纯 RSS 2.0）
 * 两个地址一个字都没变，所以订阅者、聚合站、已经导入的订阅全都不用动。
 *
 * ── 判定逻辑（保守优先）─────────────────────────────────────────────
 * 只认 `Sec-Fetch-Dest: document` —— 这是**现代浏览器顶层导航**才会带的头，
 * 订阅器（Feedly / Inoreader / NetNewsWire / Reeder…）与服务端抓取一律不发。
 * 头不存在时才退回到 `Accept` 以 text/html 开头这个较弱的判据。
 * 判定不成立就 `next()`，也就是原样走静态资源 —— 宁可让浏览器看到 XML，
 * 也不能让订阅器拿到 HTML（后者是静默的、用户察觉不到的故障）。
 *
 * ⚠️ 部署前提：Cloudflare Pages 项目的 **Functions 目录**要是默认的
 *    `functions`（仓库根）。若那里被改过或关了 Functions，本文件不会生效 ——
 *    症状是「一切照旧、横幅还在」，**不会报错**。核对方法见 MAINTENANCE.md。
 * ⚠️ 这两页在 Hugo 侧都设了 noindex；这里再补一个 X-Robots-Tag 兜底，
 *    避免爬虫把 /index.xml 当成一个可索引的 HTML 页。
 * ⚠️ 响应头在代码里显式写：static/_headers 只作用于静态资源，
 *    函数返回的响应不吃那些规则。
 */

/** feed 地址 → 浏览器视图地址 */
const FEED_VIEWS = new Map([
  ['/index.xml', '/feed/'],
  ['/weekly/index.xml', '/feed/weekly/'],
]);

export async function onRequest(context) {
  const { request, env, next } = context;

  const url = new URL(request.url);
  const view = FEED_VIEWS.get(url.pathname);
  if (!view) return next();

  // 只处理读请求；HEAD 也交给静态资源，少一次分支。
  if (request.method !== 'GET') return next();

  if (!isBrowserNavigation(request)) return next();

  // 显式取 index.html，不依赖资源服务器对目录索引的处理。
  // ⚠️ 传的是 **Request 而不是 URL 对象**：Fetcher.fetch 的入参是
  //    `Request | string`，URL 对象在本地 Node 桩测试里直接抛
  //    `TypeError: Invalid URL`（实测踩到过），别改回去。
  const asset = await env.ASSETS.fetch(
    new Request(new URL(`${view}index.html`, url.origin).href, {
      headers: { Accept: 'text/html' },
    })
  );
  // 页面不存在（构建产物变了、路径写错了）就退回 XML —— 有页面才换。
  if (!asset.ok) return next();

  return new Response(asset.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      Vary: 'Accept, Sec-Fetch-Dest',
      'X-Robots-Tag': 'noindex, follow',
    },
  });
}

/**
 * 是不是「浏览器地址栏导航」。
 * @param {Request} request
 * @returns {boolean}
 */
function isBrowserNavigation(request) {
  const dest = request.headers.get('Sec-Fetch-Dest');
  if (dest !== null) return dest === 'document';

  const accept = (request.headers.get('Accept') || '').trim().toLowerCase();
  return accept.startsWith('text/html');
}

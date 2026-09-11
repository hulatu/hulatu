/* 胡拉图说 · Service Worker v1 */
const VERSION = "hulatu-v1";
const CORE_ASSETS = ["/", "/manifest.webmanifest", "/logo.png"];

async function cacheCriticalAssets() {
  const cache = await caches.open(VERSION);
  await cache.addAll(CORE_ASSETS);

  try {
    const page = await fetch("/");
    if (!page.ok) return;
    const html = await page.text();
    const urls = new Set();

    const collect = (pattern) => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        urls.add(match[1]);
      }
    };

    collect(/<link[^>]+href=["']([^"']+\.css[^"']*)["']/gi);
    collect(/<script[^>]+src=["']([^"']+\.js[^"']*)["']/gi);

    const tasks = [];
    urls.forEach((src) => {
      try {
        const url = new URL(src, self.location.origin);
        if (url.origin === self.location.origin) {
          tasks.push(cache.add(url.href));
        }
      } catch (e) {}
    });
    await Promise.all(tasks);
  } catch (e) {}
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheCriticalAssets().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 页面导航：网络优先，断网时回退缓存（缓存过的页面可离线读）
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
    );
    return;
  }

  // 静态资源：缓存优先，后台更新
  if (/\.(css|js|png|webp|jpg|jpeg|svg|webmanifest|woff2?|ico|xml|xsl)(\?|$)/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) {
          fetch(req)
            .then((res) => {
              const copy = res.clone();
              caches.open(VERSION).then((cache) => cache.put(req, copy));
            })
            .catch(() => {});
          return hit;
        }
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy));
          return res;
        });
      })
    );
  }
});

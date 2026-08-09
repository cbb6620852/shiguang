// 服务工作者：实现离线可用，同时避免旧缓存导致更新不生效
const CACHE = 'shiguang-v3';
const ASSETS = [
  './', './index.html', './manifest.json', './css/style.css',
  './js/app.js', './js/store.js', './js/llm.js', './js/planner.js',
  './js/nutrition.js', './js/shopping.js', './data/recipes.js', './assets/icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 关键：对 HTML/JS/CSS/菜谱数据用 NetworkFirst，确保更新能及时生效；
// 对图标等静态资源用 CacheFirst，节省流量。
function isCoreAsset(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  return req.mode === 'navigate' ||
         path.endsWith('.html') ||
         path.endsWith('.js') ||
         path.endsWith('.css') ||
         path.endsWith('.json');
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  if (isCoreAsset(e.request)) {
    e.respondWith(
      fetch(e.request)
        .then((resp) => {
          if (!resp || !resp.ok) throw new Error('network fail');
          const cp = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, cp));
          return resp;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((r) => r || fetch(e.request).then((resp) => {
        const cp = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, cp));
        return resp;
      }).catch(() => caches.match('./index.html')))
    );
  }
});

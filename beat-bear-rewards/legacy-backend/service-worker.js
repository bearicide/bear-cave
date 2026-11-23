const cacheName = 'beatbear-release-__REVISION__';
const files = __FILES__;
const paths = new Set(files);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('beatbear-release-') && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('range')) return;
  if (!paths.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const saved = await cache.match(url.pathname);
    return saved || fetch(request);
  })());
});

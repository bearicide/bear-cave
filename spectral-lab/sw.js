const cachePrefix = 'spectral-lab-v';
const cacheName = cachePrefix + '2';
const scope = new URL(self.registration.scope);
const appShell = new URL('index.html', scope).href;
const assetUrls = new Set(
  [appShell, ...["manifest.webmanifest", "icon.svg"].map(path => new URL(path, scope).href)]
);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll([...assetUrls].map(url => new Request(url, {cache: 'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key =>
      key.startsWith(cachePrefix) && key !== cacheName
    ).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin) return;

  if (request.mode === 'navigate' && (url.pathname === scope.pathname ||
      url.pathname === new URL(appShell).pathname)) {
    event.respondWith(fetch(request).catch(async () =>
      (await (await caches.open(cacheName)).match(appShell)) || Response.error()
    ));
  } else if (assetUrls.has(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      return (await cache.match(request)) || fetch(request);
    })());
  }
});

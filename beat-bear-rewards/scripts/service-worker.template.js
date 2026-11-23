const cachePrefix = 'beatbear-rewards-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const cacheName = cachePrefix + '__REVISION__';
const files = __FILES__;
const urls = new Set(files.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try { await (await caches.open(cacheName)).addAll(files); }
    catch (error) { await caches.delete(cacheName); throw error; }
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(cachePrefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  url.hash = '';
  url.search = '';
  // Only known static assets: never intercept account, checkout, webhook or other app requests.
  if (request.method !== 'GET' || !urls.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const saved = await cache.match(url.href);
    if (!saved) return fetch(request);
    const range = request.headers.get('range');
    if (!range) return saved;
    const bytes = await saved.arrayBuffer();
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + bytes.byteLength } });
    const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= bytes.byteLength) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + bytes.byteLength } });
    const headers = new Headers(saved.headers);
    headers.delete('Content-Encoding');
    headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + bytes.byteLength);
    headers.set('Content-Length', String(end - start + 1));
    headers.set('Accept-Ranges', 'bytes');
    return new Response(bytes.slice(start, end + 1), { status: 206, headers });
  })());
});

const cachePrefix = 'beatbear-rewards-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const cacheName = cachePrefix + '8dcf4b204781f159';
const files = ["./","./assets/bear_rewards_banner.png","./assets/bear_stash.png","./assets/cave_reserve.png","./assets/pocket_paws.png","./audio.mjs","./bear.webp","./catalog.mjs","./deadsea.ogg","./gacha-grunge-girls.mp3","./game.mjs","./icon-192.png","./icon-512.png","./icon-maskable.png","./index.html","./loverkrafted.ogg","./manifest.webmanifest","./midi.mjs","./midnight.ogg","./pad-claw.webp","./pad-fang.webp","./pad-paw.webp","./pad-roar.webp","./paw.svg","./pwa.mjs","./rewards.css","./rewards.mjs","./rhythm.mjs","./style.css","./wallet.mjs"];
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

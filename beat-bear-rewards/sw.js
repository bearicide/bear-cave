const cacheName = 'beatbear-release-1a6405f05924';
const files = ["./", "./game.mjs", "./audio.mjs", "./loverkrafted.ogg", "./gacha-grunge-girls.mp3", "./pad-paw.webp", "./pad-roar.webp", "./icon-512.png", "./pad-fang.webp", "./bear.webp", "./icon-192.png", "./paw.svg", "./midnight.ogg", "./rhythm.mjs", "./deadsea.ogg", "./manifest.webmanifest", "./pad-claw.webp", "./midi.mjs", "./pwa.mjs", "./style.css", "./icon-maskable.png", "./index.html"];
const paths = new Set(files.map(path => new URL(path, self.registration.scope).pathname));
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
    const saved = await cache.match(request);
    return saved || fetch(request);
  })());
});

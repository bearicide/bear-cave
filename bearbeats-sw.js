const launch = new URL(self.registration.scope);
const slug = launch.pathname.split('/').pop().replace(/\.html$/, '');
const prefix = 'bearbeats-' + slug + '-';
const cacheName = prefix + 'v2';
const assets = [
  launch.href,
  ...['install.js', slug + '.webmanifest', slug + '-192.png', slug + '-512.png']
    .map((file) => new URL('bearbeats-pwa/' + file, launch).href),
];
if (slug === 'prismatic') assets.push(new URL('cave-shell.js', launch).href);

if (slug === 'knock') assets.push(new URL('assets/bearbeats-knock-card.png', launch).href);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith(prefix) && key !== cacheName)
      .map((key) => caches.delete(key))
  )));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isLaunch = event.request.mode === 'navigate'
    && url.origin === launch.origin && url.pathname === launch.pathname;
  const key = isLaunch ? launch.href : url.href;
  if (!assets.includes(key)) return;

  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    try {
      const response = await fetch(event.request);
      if (response.ok && !response.redirected) {
        await cache.put(key, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const saved = await cache.match(key);
      if (saved) return saved;
      throw error;
    }
  })());
});

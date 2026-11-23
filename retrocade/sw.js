const CACHE = 'mattbear-retrocade-20261123-v4';
const files = [
  "./index.html",
  "../cave-shell.js",
  "./lobby.css",
  "./cabinet.css",
  "./install.js",
  "./arcade.webmanifest",
  "./art/icon-192.png",
  "./art/icon-512.png",
  "./art/mascot.webp",
  "./js/modern-games.js",
  "./js/sprites.js",
  "./js/scenery.js",
  "./art/orbit.webp",
  "./art/coast.webp",
  "./art/lagoon.webp",
  "./art/candy.webp",

  "./css/modern-games.css",
  "./games/neon-vault.html",
  "./games/snake.html",
  "./games/breakout.html",
  "./games/invaders.html",
  "./games/asteroids.html",
  "./games/pong.html",
  "./games/claw.html",
  "./games/bubble.html",
  "./games/memory.html",
  "./games/racer.html",
  "./games/rhythm.html",
  "./games/blocks.html",
  "./games/frog.html",
  "./art/neon-vault.webp",
  "./art/snake.webp",
  "./art/breakout.webp",
  "./art/invaders.webp",
  "./art/asteroids.webp",
  "./art/pong.webp",
  "./art/claw.webp",
  "./art/bubble.webp",
  "./art/memory.webp",
  "./art/racer.webp",
  "./art/rhythm.webp",
  "./art/blocks.webp",
  "./art/frog.webp"
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(files)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('mattbear-retrocade-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
const urls = new Set(files.map(file => new URL(file, self.location).href));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.href === self.registration.scope) url.pathname += 'index.html';
  if (event.request.method !== 'GET' || !urls.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(async cache =>
    (await cache.match(url.href)) || fetch(event.request)
  ));
});

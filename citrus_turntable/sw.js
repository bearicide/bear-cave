'use strict';

const cachePrefix = 'citrus-turntable-';
const cacheName = cachePrefix + 'pwa-1';
const scope = self.registration.scope;
const core = [
  "./",
  "about.html",
  "contact.html",
  "instructions.html",
  "review.html",
  "app.js?v=71",
  "style.css?v=72",
  "style.css?v=65",
  "install.js",
  "manifest.webmanifest",
  "icons/app_180.png",
  "icons/app_192.png",
  "icons/app_512.png",
  "assets/cut_trance.mp3",
  "assets/melodica.mp3",
  "assets/c_funk.mp3",
  "assets/got_funk.mp3",
  "assets/enter_the_party.mp3",
  "assets/funky_one.mp3",
  "assets/disco_con_tutti.mp3",
  "assets/local_forecast_elevator.mp3",
  "assets/griphop.mp3",
  "assets/soul_sync.mp3",
  "assets/dj_fx/dj_horn.mp3",
  "assets/dj_fx/vinyl_scratch.mp3",
  "assets/dj_fx/crowd_reaction.mp3",
  "assets/dj_fx/handclap.mp3",
  "assets/dj_fx/cymbal_hit.mp3",
  "assets/dj_fx/cymbal_rise.mp3",
  "assets/dj_fx/whistle.mp3",
  "assets/dj_fx/cowbell.mp3",
  "assets/dj_fx/laser.mp3",
  "assets/sunset.webp",
  "assets/live_turntable.webp",
  "assets/live_audience.webp",
  "assets/live_light_console.webp",
  "assets/advanced_fx_board.webp",
  "assets/live_oneshot_board.webp",
  "assets/live_dj_table.webp",
  "assets/oneshot_icons.webp"
];
const cachedURLs = new Set(core.map(path => new URL(path,scope).href));
const pages = new Set(["./","about.html","contact.html","instructions.html","review.html"].map(path => new URL(path,scope).pathname));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache =>
    cache.addAll(core.map(path => new Request(new URL(path,scope),{cache:'reload'})))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function cachedRange(response, range) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return null;
  const audio = await response.blob();
  const size = audio.size;
  const start = match[1] ? Number(match[1]) : Math.max(0,size-Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]),size-1) : size-1;
  if (start >= size || start > end) {
    return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
  }
  return new Response(audio.slice(start,end+1),{
    status:206,
    headers:{
      'Content-Type':response.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range':`bytes ${start}-${end}/${size}`,
      'Content-Length':String(end-start+1),
      'Accept-Ranges':'bytes'
    }
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(scope)) return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    if (url.pathname === new URL('index.html',scope).pathname) url.pathname = new URL(scope).pathname;
    if (!pages.has(url.pathname)) return;
    url.search = '';
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(cacheName);
      return (await cache.match(url.href)) || Response.error();
    }));
    return;
  }
  if (!cachedURLs.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const response = await cache.match(url.href);
    if (!response) return fetch(request);
    const range = request.headers.get('Range');
    if (!range) return response;
    return (await cachedRange(response,range)) || fetch(request);
  })());
});

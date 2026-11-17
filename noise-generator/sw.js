const CACHE='noisegenerator-v2';
const ASSETS=['./','./index.html','./manifest.webmanifest','../cave-shell.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('noisegenerator-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
})())});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})
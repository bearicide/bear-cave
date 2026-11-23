import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
const source = readFileSync('./sw.js', 'utf8');
const handlers = {};
const scope = 'https://example.test/bear-cave/beat-bear-rewards/';
const data = new Map();
let skipped = false;
let claimed = false;
const cache = {
  async addAll(paths) { for (const path of paths) data.set(new URL(path, scope).href, new Response('abcdef', { headers: { 'Content-Type': 'audio/ogg' } })); },
  async match(url) { return data.get(url)?.clone(); }
};
const keys = ['beatbear-rewards-' + encodeURIComponent('/bear-cave/beat-bear-rewards/') + '-old', 'beatbear-rewards-other-app-old', 'another-app'];
const deleted = [];
const self = { registration: { scope }, clients: { claim: async () => { claimed = true; } }, skipWaiting: () => { skipped = true; }, addEventListener: (type, fn) => { handlers[type] = fn; } };
vm.runInNewContext(source, {
  self, URL, Response, Headers, encodeURIComponent,
  caches: { open: async () => cache, keys: async () => keys, delete: async key => { deleted.push(key); } },
  fetch: () => { throw Error('Network unavailable'); }
});
let pending;
handlers.install({ waitUntil: promise => { pending = promise; } });
await pending;
assert.ok(data.has(new URL('./assets/bear_stash.png', scope).href));
assert.ok(data.has(new URL('./deadsea.ogg', scope).href));
for (const url of data.keys()) {
  const path = new URL(url).pathname.replace('/bear-cave/beat-bear-rewards/', '');
  if (path) assert.ok(existsSync('./' + path), path + ' must exist');
}
async function request(path, options) {
  let response;
  handlers.fetch({ request: new Request(new URL(path, scope), options), respondWith: promise => { response = promise; } });
  return response;
}
assert.equal(await (await request('./?source=installed')).text(), 'abcdef');
const range = await request('./deadsea.ogg', { headers: { Range: 'bytes=1-3' } });
assert.equal(range.status, 206);
assert.equal(range.headers.get('Content-Range'), 'bytes 1-3/6');
assert.equal(await range.text(), 'bcd');
assert.equal(await (await request('./deadsea.ogg', { headers: { Range: 'bytes=-2' } })).text(), 'ef');
assert.equal((await request('./deadsea.ogg', { headers: { Range: 'bytes=999-' } })).status, 416);
assert.equal(await request('./api/wallet'), undefined);
assert.equal(await request('./checkout'), undefined);
assert.equal(await request('./index.html', { method: 'POST' }), undefined);
handlers.activate({ waitUntil: promise => { pending = promise; } });
await pending;
assert.deepEqual(deleted, [keys[0]]);
assert.equal(claimed, true);
assert.equal(skipped, false);
handlers.message({ data: { type: 'SKIP_WAITING' } });
assert.equal(skipped, true);
const manifest = JSON.parse(readFileSync('./manifest.webmanifest', 'utf8'));
assert.equal(manifest.scope, './');
assert.equal(manifest.start_url, './');
assert.equal(manifest.display, 'standalone');
for (const icon of manifest.icons) assert.ok(existsSync('./' + icon.src));
console.log('PASS: offline shell/art/audio, subdirectory scope, media ranges, API exclusion, cache isolation, updates and install manifest.');

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const types = {'manifest.webmanifest':'application/manifest+json','pwa.mjs':'text/javascript','icon-192.png':'image/png','icon-512.png':'image/png','icon-maskable.png':'image/png','loverkrafted.ogg':'audio/ogg','deadsea.ogg':'audio/ogg','midnight.ogg':'audio/ogg','gacha-grunge-girls.mp3':'audio/mpeg','index.html':'text/html','style.css':'text/css','game.mjs':'text/javascript','audio.mjs':'text/javascript','rhythm.mjs':'text/javascript','paw.svg':'image/svg+xml','bear.webp':'image/webp','midi.mjs':'text/javascript','pad-claw.webp':'image/webp','pad-roar.webp':'image/webp','pad-paw.webp':'image/webp','pad-fang.webp':'image/webp'};
const assets = Object.fromEntries(Object.entries(types).map(([name,type])=>['/'+name,[type,readFileSync('dist/'+name).toString('base64')]]));
const revision = createHash('sha256').update(JSON.stringify(assets)).update(readFileSync('server/service-worker.js')).digest('hex').slice(0, 16);
const worker = readFileSync('server/service-worker.js', 'utf8')
  .replace('__REVISION__', revision)
  .replace('__FILES__', JSON.stringify(['/', ...Object.keys(assets)]));
assets['/sw.js'] = ['text/javascript', Buffer.from(worker).toString('base64')];
mkdirSync('dist/server',{recursive:true});
const engine=readFileSync('dist/rhythm.mjs','utf8').replace(/^export /gm,'');
writeFileSync('dist/server/index.js', engine+'\nconst assets = '+JSON.stringify(assets)+';\n'+readFileSync('server/worker.mjs','utf8'));

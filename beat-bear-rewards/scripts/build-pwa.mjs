import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const project = fileURLToPath(new URL('../', import.meta.url));
const root = existsSync(path.join(project, 'dist/index.html')) ? path.join(project, 'dist') : project;
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(dir, entry.name);
    return entry.isDirectory() ? ((dir !== root || entry.name === 'assets') ? walk(filename) : []) : [filename];
  });
}
const extensions = new Set(['.html', '.css', '.mjs', '.png', '.webp', '.svg', '.ogg', '.mp3', '.webmanifest']);
const files = walk(root).filter(file => file !== path.join(root, 'sw.js') && extensions.has(path.extname(file)) && !path.basename(file).startsWith('_qa')).sort();
const revision = createHash('sha256');
for (const file of files) revision.update(path.relative(root, file)).update(readFileSync(file));
const template = readFileSync(path.join(project, 'scripts/service-worker.template.js'), 'utf8');
revision.update(template);
const output = template.replace('__REVISION__', revision.digest('hex').slice(0, 16))
  .replace('__FILES__', JSON.stringify(['./', ...files.map(file => './' + path.relative(root, file).split(path.sep).join('/'))]));
writeFileSync(path.join(root, 'sw.js'), output);
console.log('PWA: cached shell, ' + files.length + ' assets, tracks and artwork.');

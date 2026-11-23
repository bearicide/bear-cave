import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
const project = fileURLToPath(new URL('../', import.meta.url));
const hosted = existsSync(project + 'dist/index.html');
await build({
  absWorkingDir: project,
  entryPoints: ['src/accounts.mjs'],
  outfile: (hosted ? 'dist/' : '') + 'accounts.mjs',
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true,
  external: ['./wallet.mjs', './backend-config.mjs'], legalComments: 'inline'
});
console.log('Built pinned Supabase account client.');

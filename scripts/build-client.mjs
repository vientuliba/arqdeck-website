import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const clientOptions = {
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  entryPoints: ['app.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  outfile: 'site.js',
  legalComments: 'none',
  banner: { js: '// Generated from app.js, i18n.js and translations.js. Run npm run build:client to update.' },
};

export const buildClient = () => build(clientOptions);
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await buildClient();

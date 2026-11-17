import { mkdir, cp, rm, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { buildClient } from './build-client.mjs';

await buildClient();
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
const localAssets = process.argv.includes('--local-assets');
let html = await readFile('index.html', 'utf8');

if (localAssets) {
  await cp('assets/images', 'dist/assets/images', { recursive: true });
  await cp('share.jpg', 'dist/share.jpg');
} else {
  const manifest = JSON.parse(await readFile('r2-assets.json', 'utf8'));
  const files = new Set([...html.matchAll(/assets\/images\/[\w.-]+/g)].map(match => match[0]));
  files.add('share.jpg');
  for (const file of files) {
    const asset = manifest.assets[file];
    if (!asset) throw new Error(`Asset missing from R2 manifest: ${file}. Run npm run assets:upload.`);
    const sha256 = createHash('sha256').update(await readFile(file)).digest('hex');
    if (sha256 !== asset.sha256) throw new Error(`Asset changed: ${file}. Run npm run assets:upload.`);
    html = html.replaceAll(file, asset.url);
  }
}
await writeFile('dist/index.html', html);
for (const file of ['style.css', 'site.js']) await cp(file, `dist/${file}`);
for (const file of ['404.html', '_headers']) await cp(`public/${file}`, `dist/${file}`);

const runtimeFiles = [
  'system.css', 'system.js', 'layout/layout.css', 'layout/layout.js',
  'motion/motion.css', 'motion/motion.js', 'ui/ui.js', 'ui/base.css',
  'moments/moments.js', 'moments/lib.js',
  'moments/iris-opens/moment.js', 'moments/iris-opens/moment.css',
  'moments/letters-assemble/moment.js', 'moments/letters-assemble/moment.css',
];
for (const file of runtimeFiles) {
  await mkdir(path.dirname(`dist/assets/taste/${file}`), { recursive: true });
  await cp(`assets/taste/${file}`, `dist/assets/taste/${file}`);
}

async function copyDownloads(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.endsWith('.md')) continue;
    const target = path.join(destination, entry.name);
    if (entry.isDirectory()) await copyDownloads(path.join(source, entry.name), target);
    else await cp(path.join(source, entry.name), target);
  }
}
await copyDownloads('downloads', 'dist/downloads');
console.log(`Static production site built in dist/ (${localAssets ? 'local' : 'Cloudflare R2'} images).`);

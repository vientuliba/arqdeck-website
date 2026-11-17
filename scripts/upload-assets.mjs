import { readFile, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const manifestPath = path.join(root, 'r2-assets.json');
const configuration = JSON.parse(await readFile(manifestPath, 'utf8'));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const files = [...new Set([...html.matchAll(/assets\/images\/[\w.-]+/g)].map(match => match[0]))];
if (html.includes('share.jpg')) files.push('share.jpg');
const dryRun = process.argv.includes('--dry-run');
const uploaded = {};

for (const file of files.sort()) {
  const body = await readFile(path.join(root, file));
  const sha256 = createHash('sha256').update(body).digest('hex');
  const extension = path.extname(file);
  const key = `website/${file.slice(0, -extension.length)}.${sha256.slice(0, 16)}${extension}`;
  const contentType = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }[extension];
  if (!contentType) throw new Error(`Unsupported asset type: ${file}`);
  const url = `${configuration.publicBaseUrl}/${key}`;
  const args = ['r2', 'objects', 'put', key, '--bucket-name', configuration.bucket,
    '--file', path.join(root, file), '--content-type', contentType];
  if (dryRun) args.push('--dry-run');
  const result = await run('cf', args, { cwd: root, timeout: 120000, maxBuffer: 1024 * 1024 });
  if (dryRun) { console.log(result.stdout.trim()); continue; }

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Public asset verification failed: ${file} (HTTP ${response.status})`);
  const remote = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(remote).digest('hex') !== sha256) throw new Error(`Content mismatch: ${file}`);
  if (response.headers.get('content-type')?.split(';')[0] !== contentType) throw new Error(`Content type mismatch: ${file}`);
  uploaded[file] = { key, url, sha256, bytes: body.length, contentType };
  console.log(`Uploaded and verified ${file} (${body.length} bytes)`);
}
if (!dryRun) {
  configuration.assets = uploaded;
  await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(configuration, null, 2)}\n`);
  await rename(`${manifestPath}.tmp`, manifestPath);
  console.log(`Verified ${Object.keys(uploaded).length} public assets in ${configuration.bucket}.`);
}

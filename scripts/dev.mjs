import { context } from 'esbuild';
import { clientOptions } from './build-client.mjs';
const compiler = await context(clientOptions);
await compiler.rebuild();
await compiler.watch();
await import('./serve.mjs');

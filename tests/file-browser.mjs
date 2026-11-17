import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const profile = await mkdtemp(path.join(tmpdir(), 'arqdeck-file-test-'));
const chrome = spawn(process.env.CHROME_PATH || 'chromium', [
  '--headless=new', `--user-data-dir=${profile}`, '--remote-debugging-port=0',
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', 'about:blank',
], { stdio: 'ignore' });
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 100 && !port; attempt++) {
    await delay(100);
    try { port = Number((await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); } catch {}
  }
  assert.ok(port, 'Chromium must start');
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timeout);
    message.error ? request.reject(Error(message.error.message)) : request.resolve(message.result);
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => { pending.delete(id); reject(Error(`Timed out: ${method}`)); }, 10000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const command = (method, params) => send(method, params, sessionId);
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Page.bringToFront');
  await command('Emulation.setFocusEmulationEnabled', { enabled: true });
  await command('Page.navigate', { url: pathToFileURL(path.resolve(process.argv[2] || 'index.html')).href });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate('document.readyState === "complete" && !!document.getElementById("language-switch")')) break;
    await delay(100);
  }
  await evaluate('Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 3000))]).then(() => true)');
  assert.equal(await evaluate('location.protocol'), 'file:', 'Test must use the actual file protocol');

  async function click(selector) {
    const point = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.scrollIntoView({block:'center'}); const r=el.getBoundingClientRect(); const x=r.x+r.width/2,y=r.y+r.height/2; return {x,y,hit:el.contains(document.elementFromPoint(x,y))}; })()`);
    assert.ok(point.hit, `${selector} must receive a real pointer click`);
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await delay(200);
  }
  const initial = await evaluate('location.href');
  assert.equal(await evaluate('document.documentElement.lang'), 'lv');
  await click('#language-switch');
  assert.equal(await evaluate('document.documentElement.lang'), 'en', 'Real pointer click must switch file-opened page to English');
  assert.equal(await evaluate('document.querySelector("#products-h").textContent'), 'ArqDeck models');
  console.log('PASS file URL: real pointer click switches to English');
  assert.equal(await evaluate('document.activeElement.id'), 'language-switch', 'Pointer click must focus the switch');
  await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await command('Input.dispatchKeyEvent', { type: 'char', text: '\r', unmodifiedText: '\r', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await delay(200);
  assert.equal(await evaluate('document.documentElement.lang'), 'lv', 'Enter must switch back to Latvian');
  console.log('PASS file URL: Enter switches back to Latvian');
  await click('[data-purchase="full"]');
  assert.equal(await evaluate('document.getElementById("full-status").textContent'), 'Iegādes iespēja drīzumā būs pieejama.');
  await click('#software-upcoming');
  assert.equal(await evaluate('document.getElementById("software-status").textContent'), 'Programmatūra drīzumā būs pieejama lejupielādei.');
  assert.equal(await evaluate('location.href'), initial, 'Placeholder actions must not navigate');
  console.log('PASS file URL: purchase and software notices work without navigation');
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate('scrollTo(0,0)');
  await delay(200);
  await click('.nav__toggle');
  assert.equal(await evaluate('document.querySelector(".nav__toggle").getAttribute("aria-expanded")'), 'true');
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await delay(100);
  assert.equal(await evaluate('document.querySelector(".nav__toggle").getAttribute("aria-expanded")'), 'false');
  console.log('PASS file URL: mobile menu opens and Escape closes it');
  await click('#language-switch');
  assert.equal(await evaluate('document.documentElement.lang'), 'en');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  console.log('PASS file URL: mobile language switch works with no horizontal overflow');
  console.log('ALL FILE BROWSER CHECKS PASSED');
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
  await delay(400);
  if (chrome.exitCode === null) chrome.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

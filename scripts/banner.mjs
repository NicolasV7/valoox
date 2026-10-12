// Render the README banner from local fonts and pinned Riot artwork.
// This optional documentation command adds no production dependency.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const browser = [
  process.env.BANNER_BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((path) => path && existsSync(path));
assert.ok(browser, 'Install Chrome or Edge, or set BANNER_BROWSER to its executable.');
for (const path of [
  'fonts/bricolage.woff2',
  'fonts/azeret.woff2',
  'art/spray-wingman.png',
  'art/spray-crab.png',
]) {
  assert.ok(existsSync('public/' + path), 'Run npm run fonts and npm run art first.');
}

const profile = await mkdtemp(join(tmpdir(), 'valoox-banner-'));
const child = spawn(
  browser,
  [
    '--headless=new',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    '--allow-file-access-from-files',
    '--remote-debugging-pipe',
    '--user-data-dir=' + profile,
  ],
  {
    windowsHide: true,
    stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'],
  },
);
let sequence = 0;
let buffer = '';
let onLoad;
const pending = new Map();
const closed = new Promise((done) => child.once('exit', done));
function request(method, params = {}, sessionId) {
  return new Promise((resolveReply, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('Browser timed out: ' + method));
    }, 20_000);
    pending.set(id, { resolveReply, reject, timer });
    child.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
}
child.stdio[4].on('data', (bytes) => {
  buffer += bytes.toString('utf8');
  while (buffer.includes('\0')) {
    const end = buffer.indexOf('\0');
    const message = JSON.parse(buffer.slice(0, end));
    buffer = buffer.slice(end + 1);
    if (message.method === 'Page.loadEventFired') onLoad?.();
    const held = pending.get(message.id);
    if (!held) continue;
    pending.delete(message.id);
    clearTimeout(held.timer);
    if (message.error) held.reject(new Error(message.error.message));
    else held.resolveReply(message.result);
  }
});
child.on('error', (error) => {
  for (const held of pending.values()) {
    clearTimeout(held.timer);
    held.reject(error);
  }
  pending.clear();
});

try {
  const { targetId } = await request('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await request('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => request(method, params, sessionId);
  await page('Page.enable');
  await page('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 340,
    deviceScaleFactor: 2,
    mobile: false,
  });
  const loaded = new Promise((done, reject) => {
    const timer = setTimeout(() => reject(new Error('Banner did not load.')), 20_000);
    onLoad = () => {
      clearTimeout(timer);
      done();
    };
  });
  await page('Page.navigate', { url: pathToFileURL(resolve('design/banner.html')).href });
  await loaded;
  const checked = await page('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      await document.fonts.ready;
      const images = [...document.images];
      const band = document.querySelector('.band').getBoundingClientRect();
      return { fonts: document.fonts.check('500 26px "Bricolage Grotesque"') &&
        document.fonts.check('500 15px "Azeret Mono"'),
        images: images.length === 2 && images.every(i => i.complete && i.naturalWidth > 0),
        width: band.width, height: band.height, language: document.documentElement.lang };
    })()`,
  });
  assert.deepEqual(
    checked.result.value,
    {
      fonts: true,
      images: true,
      width: 1280,
      height: 340,
      language: 'en',
    },
    'Banner resources or dimensions do not match.',
  );
  const { data } = await page('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1280, height: 340, scale: 1 },
  });
  const png = Buffer.from(data, 'base64');
  assert.equal(png.readUInt32BE(16), 2560);
  assert.equal(png.readUInt32BE(20), 680);
  await writeFile('design/banner.png', png);
  console.log('design/banner.png: 2560x680, local fonts and both sprays loaded.');
} finally {
  await request('Browser.close').catch(() => child.kill());
  await closed;
  // This exact directory was created by mkdtemp above and contains only this render.
  assert.ok(
    resolve(profile).startsWith(resolve(tmpdir()) + '\\') ||
      resolve(profile).startsWith(resolve(tmpdir()) + '/'),
  );
  assert.ok(profile.includes('valoox-banner-'));
  await rm(profile, { recursive: true, force: true });
}

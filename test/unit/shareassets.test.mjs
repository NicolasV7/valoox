import assert from 'node:assert/strict';
import { test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';

async function setup() {
  const actor = { requests: [], complete: true, width: 500, height: 200 };
  const timers = new Map();
  let next = 0;
  class Image {
    constructor() {
      this.naturalWidth = actor.width;
      this.naturalHeight = actor.height;
    }
    set src(url) {
      actor.requests.push({ url, image: this });
      if (actor.complete) Promise.resolve().then(() => this.onload?.());
    }
    removeAttribute() {
      this.removed = true;
    }
  }
  const ui = await fixture("export {image} from './web/share/assets.ts';", actor, {
    URL,
    Image,
    setTimeout: (fn) => {
      const id = ++next;
      timers.set(id, fn);
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  });
  return { ...ui, actor, timers };
}

test('export artwork rejects foreign, non-HTTPS and credential-bearing image URLs', async () => {
  const f = await setup();
  for (const url of [
    null,
    'not-a-url',
    'data:image/png;base64,AA',
    'http://media.valorant-api.com/a.png',
    'https://media.valorant-api.com.evil.test/a.png',
    'https://other.test/a.png',
    'https://user:password@media.valorant-api.com/a.png',
  ]) {
    assert.equal(await f.app.image(url, new AbortController().signal), null);
  }
  assert.equal(f.actor.requests.length, 0);
  f.dispose();
});

test('public artwork is loaded anonymously without a referring page', async () => {
  const f = await setup();
  const image = await f.app.image(
    'https://media.valorant-api.com/a.png',
    new AbortController().signal,
  );
  assert.ok(image);
  assert.equal(image.crossOrigin, 'anonymous');
  assert.equal(image.referrerPolicy, 'no-referrer');
  assert.equal(f.timers.size, 0);
  f.dispose();
});

test('cancelled, timed-out and oversized artwork falls back without hanging preparation', async () => {
  const f = await setup();
  f.actor.complete = false;
  const controller = new AbortController();
  const cancelled = f.app.image('https://media.valorant-api.com/a.png', controller.signal);
  controller.abort();
  assert.equal(await cancelled, null);
  assert.equal(f.actor.requests[0].image.removed, true);
  const timeout = f.app.image('https://media.valorant-api.com/b.png', new AbortController().signal);
  [...f.timers.values()][0]();
  assert.equal(await timeout, null);
  f.actor.complete = true;
  f.actor.width = f.actor.height = 9000;
  assert.equal(
    await f.app.image('https://media.valorant-api.com/large.png', new AbortController().signal),
    null,
  );
  assert.equal(f.timers.size, 0);
  f.dispose();
});

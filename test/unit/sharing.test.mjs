import assert from 'node:assert/strict';
import { test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';

async function setup() {
  const actor = {
    requests: [],
    reply(path, init) {
      return new Promise((resolve, reject) => this.requests.push({ path, init, resolve, reject }));
    },
  };
  const ui = await fixture(
    `
    export {useSharing,refreshSharing,saveTag,retrySharing} from './web/data/sharing.ts';
    export {reset} from './web/data/private.ts';
  `,
    actor,
  );
  const render = () => ({ ...ui.render(() => ui.app.useSharing()) });
  const complete = async (tag, index = actor.requests.length - 1) => {
    actor.requests[index].resolve({ ok: true, json: async () => ({ tag }) });
    await ui.settle();
    await ui.settle();
  };
  const fail = async (index = actor.requests.length - 1) => {
    actor.requests[index].reject(new Error('offline'));
    await ui.settle();
    await ui.settle();
  };
  return { ui, actor, render, complete, fail };
}

test('opening waits for the account choice and never assumes a visible tag', async () => {
  const f = await setup();
  assert.deepEqual(f.render(), { tag: null, at: 'loading', error: null });
  assert.equal(f.actor.requests.length, 1);
  await f.complete(false);
  assert.deepEqual(f.render(), { tag: false, at: 'ready', error: null });
  f.ui.dispose();
});

test('saving waits for confirmation and a reopen joins that write without a stale read', async () => {
  const f = await setup();
  f.render();
  await f.complete(true);
  const saving = f.ui.app.saveTag(false);
  assert.deepEqual(f.render(), { tag: false, at: 'saving', error: null });
  assert.equal(f.ui.app.refreshSharing(), saving);
  assert.equal(f.ui.app.saveTag(true), saving);
  assert.equal(f.actor.requests.length, 2);
  assert.equal(f.actor.requests[1].path, '/api/sharing');
  assert.equal(f.actor.requests[1].init.body, '{"tag":false}');
  await f.complete(false);
  await saving;
  assert.equal(f.render().at, 'ready');
  assert.equal(f.render().tag, false);
  f.ui.dispose();
});

test('a later opening refreshes another device’s choice rather than using its old cached value', async () => {
  const f = await setup();
  f.render();
  await f.complete(true);
  const load = f.ui.app.refreshSharing();
  assert.equal(f.render().tag, null);
  await f.complete(false);
  await load;
  assert.equal(f.render().tag, false);
  f.ui.dispose();
});

test('load failures keep sharing blocked until an explicit successful retry', async () => {
  const f = await setup();
  f.render();
  await f.fail();
  assert.deepEqual(f.render(), { tag: null, at: 'failed', error: 'read' });
  const retry = f.ui.app.retrySharing();
  await f.complete(false);
  await retry;
  assert.equal(f.render().at, 'ready');
  assert.equal(f.render().tag, false);
  f.ui.dispose();
});

test('a failed save preserves the intended hidden choice and retries it instead of trusting a reread', async () => {
  const f = await setup();
  f.render();
  await f.complete(true);
  const saving = f.ui.app.saveTag(false);
  await f.fail();
  await saving;
  assert.deepEqual(f.render(), { tag: false, at: 'failed', error: 'write' });
  await f.ui.app.refreshSharing();
  assert.equal(f.actor.requests.length, 2);
  const retry = f.ui.app.retrySharing();
  assert.equal(f.actor.requests[2].init.body, '{"tag":false}');
  await f.complete(false);
  await retry;
  assert.equal(f.render().at, 'ready');
  f.ui.dispose();
});

test('a superseded read cannot undo a newer choice being saved', async () => {
  const f = await setup();
  f.render();
  const saving = f.ui.app.saveTag(false);
  await f.complete(false, 1);
  await saving;
  await f.complete(true, 0);
  assert.deepEqual(f.render(), { tag: false, at: 'ready', error: null });
  f.ui.dispose();
});

test.each(['read', 'write'])(
  'account reset discards late %s results and a new account starts unknown',
  async (kind) => {
    const f = await setup();
    f.render();
    if (kind === 'write') {
      await f.complete(true);
      void f.ui.app.saveTag(false);
    }
    const old = f.actor.requests.length - 1;
    f.ui.app.reset('logout');
    const next = f.ui.app.refreshSharing();
    assert.equal(f.render().tag, null);
    await f.complete(true);
    await next;
    await f.complete(false, old);
    assert.deepEqual(f.render(), { tag: true, at: 'ready', error: null });
    f.ui.dispose();
  },
);

test('closing the UI does not discard an intentional in-flight preference save', async () => {
  const f = await setup();
  f.render();
  await f.complete(true);
  const saving = f.ui.app.saveTag(false);
  f.ui.dispose();
  assert.equal(f.ui.app.refreshSharing(), saving);
  await f.complete(false);
  await saving;
  assert.equal(f.actor.requests.length, 2);
});

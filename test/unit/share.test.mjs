import assert from 'node:assert/strict';
import { afterEach, test, vi } from 'vitest';
import { native, save, share } from '../../web/share/transport.ts';
import { wait } from '../../web/share/wait.ts';

const png = () => new File([new Uint8Array([137, 80, 78, 71])], 'store.png', { type: 'image/png' });
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test('native sharing receives only the prepared PNG, without a caption, title or URL', async () => {
  const file = png();
  let call = null;
  vi.stubGlobal('navigator', {
    canShare: ({ files }) => files[0] === file,
    share: (data) => {
      call = data;
      return Promise.resolve();
    },
  });
  assert.equal(native(file), true);
  const pending = share(file);
  assert.equal(call.files[0], file);
  assert.deepEqual(Object.keys(call), ['files']);
  assert.equal(await pending, 'opened');
});

test('missing, refused or throwing file support uses the explicit save action', () => {
  for (const navigator of [
    {},
    { share() {}, canShare: () => false },
    {
      share() {},
      canShare() {
        throw new Error('policy');
      },
    },
  ]) {
    vi.stubGlobal('navigator', navigator);
    assert.equal(native(png()), false);
  }
});

test('cancelling native sharing does not start a download or report delivery', async () => {
  vi.stubGlobal('navigator', { share: () => Promise.reject({ name: 'AbortError' }) });
  vi.stubGlobal('document', {
    createElement() {
      assert.fail('unexpected download');
    },
  });
  assert.equal(await share(png()), 'cancelled');
});

test('both synchronous and asynchronous native failures reach the recovery UI', async () => {
  for (const fn of [
    () => {
      throw new Error('policy');
    },
    () => Promise.reject(new Error('policy')),
  ]) {
    vi.stubGlobal('navigator', { share: fn });
    await assert.rejects(share(png()));
  }
});

test('saving uses a temporary image URL that close or logout can release', () => {
  const calls = [];
  const a = {
    click() {
      calls.push(['click', this.href, this.download]);
    },
    remove() {},
  };
  vi.stubGlobal('URL', {
    createObjectURL: () => 'blob:fixture',
    revokeObjectURL: (u) => calls.push(['release', u]),
  });
  vi.stubGlobal('document', { createElement: () => a, body: { append() {} } });
  const release = save(png());
  assert.deepEqual(calls, [['click', 'blob:fixture', 'store.png']]);
  release();
  assert.deepEqual(calls[1], ['release', 'blob:fixture']);
});

test('aborted and timed-out preparation settles even if its upstream never answers', async () => {
  vi.useFakeTimers();
  const pending = new Promise(() => {});
  const controller = new AbortController();
  const aborted = wait(pending, controller.signal);
  const rejection = assert.rejects(aborted, { name: 'AbortError' });
  controller.abort();
  await rejection;
  const timeout = assert.rejects(wait(pending, new AbortController().signal, 20), /timeout/);
  await vi.advanceTimersByTimeAsync(20);
  await timeout;
});

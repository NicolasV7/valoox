import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';
import { leave } from '../../web/share/dismiss.ts';

class Motion {
  playbackRate = 1;
  reversed = 0;
  constructor(animationName = 'share-open', currentTime = 220) {
    this.animationName = animationName;
    this.currentTime = currentTime;
    this.finished = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
  reverse() {
    this.reversed++;
  }
}
let doc;
beforeEach(() => {
  vi.useFakeTimers();
  doc = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal('document', doc);
  vi.stubGlobal('CSSAnimation', Motion);
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const node = (...motions) => ({ getAnimations: () => motions });
const settle = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

test('only panel and backdrop reverse, and both settle before closing', async () => {
  const panel = new Motion(),
    backdrop = new Motion('share-dim', 180),
    art = new Motion('share-reveal');
  const done = vi.fn();
  leave(node(panel, backdrop, art), done);
  assert.equal(panel.playbackRate, -1.25);
  assert.equal(backdrop.playbackRate, -1.25);
  assert.equal(art.reversed, 0);
  panel.resolve();
  await settle();
  assert.equal(done.mock.calls.length, 0);
  backdrop.resolve();
  await settle();
  assert.equal(done.mock.calls.length, 1);
  assert.equal(vi.getTimerCount(), 0);
});

test('an interrupted opening reverses from its existing time instead of restarting', () => {
  const panel = new Motion('share-open', 63);
  const cancel = leave(node(panel), vi.fn());
  assert.equal(panel.currentTime, 63);
  assert.equal(panel.reversed, 1);
  cancel();
});

test('zero progress, reduced motion, missing support and missing nodes close immediately', () => {
  const zero = new Motion('share-open', 0);
  for (const element of [node(zero), node(), {}, null]) {
    const done = vi.fn();
    leave(element, done);
    assert.equal(done.mock.calls.length, 1);
  }
  assert.equal(zero.reversed, 0);
  vi.stubGlobal('CSSAnimation', undefined);
  const done = vi.fn();
  leave(node(new Motion()), done);
  assert.equal(done.mock.calls.length, 1);
  assert.equal(vi.getTimerCount(), 0);
});

test('cancelled animation promises still finish without an unhandled rejection', async () => {
  const panel = new Motion(),
    done = vi.fn();
  leave(node(panel), done);
  panel.reject(new Error('cancelled'));
  await settle();
  assert.equal(done.mock.calls.length, 1);
  assert.equal(vi.getTimerCount(), 0);
});

test('a missing completion is bounded, and a late result cannot close twice', async () => {
  const panel = new Motion(),
    done = vi.fn();
  leave(node(panel), done);
  await vi.advanceTimersByTimeAsync(260);
  assert.equal(done.mock.calls.length, 1);
  panel.resolve();
  await settle();
  assert.equal(done.mock.calls.length, 1);
});

test('forced unmount cancels timers and prevents a late parent callback', async () => {
  const panel = new Motion(),
    done = vi.fn();
  const cancel = leave(node(panel), done);
  cancel();
  panel.resolve();
  await settle();
  await vi.advanceTimersByTimeAsync(1000);
  assert.equal(done.mock.calls.length, 0);
  assert.equal(vi.getTimerCount(), 0);
});

test('backgrounding finishes once and detaches visibility and timer work', async () => {
  const done = vi.fn();
  leave(node(new Motion()), done);
  doc.hidden = true;
  doc.dispatchEvent(new Event('visibilitychange'));
  doc.dispatchEvent(new Event('visibilitychange'));
  await vi.advanceTimersByTimeAsync(1000);
  assert.equal(done.mock.calls.length, 1);
  assert.equal(vi.getTimerCount(), 0);
  const hidden = vi.fn();
  leave(node(new Motion()), hidden);
  assert.equal(hidden.mock.calls.length, 1);
});

test('an animation engine failure never traps the modal', () => {
  const panel = new Motion(),
    done = vi.fn();
  panel.reverse = () => {
    throw new Error('unsupported');
  };
  leave(node(panel), done);
  assert.equal(done.mock.calls.length, 1);
  assert.equal(vi.getTimerCount(), 0);
});

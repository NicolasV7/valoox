import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { poll } from '../../web/data/poll.ts';

let doc: EventTarget & { hidden: boolean };
let win: EventTarget;
let net: { onLine: boolean };
let stop: () => void;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  doc = Object.assign(new EventTarget(), { hidden: false });
  win = Object.assign(new EventTarget(), { setTimeout });
  net = { onLine: true };
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', win);
  vi.stubGlobal('navigator', net);
  stop = () => {};
});

afterEach(() => {
  stop();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test.each(['ok', 'failure'])(
  'provider reads stop at code expiry after %s responses',
  async (mode) => {
    const work = vi.fn(async () => {
      if (mode === 'failure') throw new Error('fixture');
    });
    stop = poll(work, 10000);
    await vi.advanceTimersByTimeAsync(86400000);
    expect(work).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
    win.dispatchEvent(new Event('focus'));
    expect(work).toHaveBeenCalledTimes(2);
  },
);

test.each(['hidden', 'offline'])(
  'a %s tab waits for resume without overlapping reads',
  async (state) => {
    let finish: () => void = () => {};
    const work = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    stop = poll(work, 60000);
    doc.hidden = state === 'hidden';
    net.onLine = state !== 'offline';
    await vi.advanceTimersByTimeAsync(20000);
    expect(work).not.toHaveBeenCalled();
    doc.hidden = false;
    net.onLine = true;
    win.dispatchEvent(new Event('online'));
    doc.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(20000);
    expect(work).toHaveBeenCalledTimes(1);
    finish();
    await vi.advanceTimersByTimeAsync(3999);
    expect(work).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(work).toHaveBeenCalledTimes(2);
    stop();
    finish();
    await vi.advanceTimersByTimeAsync(100000);
  },
);

test('cleanup while a read is pending cannot restart polling', async () => {
  let finish: () => void = () => {};
  const work = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  stop = poll(work, 600000);
  await vi.advanceTimersByTimeAsync(4000);
  stop();
  finish();
  await vi.advanceTimersByTimeAsync(600000);
  win.dispatchEvent(new Event('online'));
  expect(work).toHaveBeenCalledTimes(1);
});

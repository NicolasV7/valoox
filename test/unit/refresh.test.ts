import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { rotate } from '../../web/data/rotation.ts';
import type { StoreView } from '../../web/data/types.ts';
import { storeView } from '../workers/fixtures.ts';

let doc: EventTarget & { hidden: boolean };
let win: EventTarget;
let net: { onLine: boolean };
let stop: () => void;
const view = (remaining: number): StoreView => ({ ...storeView(), remaining });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-13T00:00:00Z'));
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

test('a bundle expires exactly at its deadline, independently of the daily clock', async () => {
  let current = { ...view(3600), bundles: [{ remaining: 1 }] } as StoreView;
  const refresh = vi.fn(async () => {
    current = view(3600);
  });
  stop = rotate(() => current, refresh).stop;
  await vi.advanceTimersByTimeAsync(999);
  expect(refresh).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(refresh).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(3599999);
  expect(refresh).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(refresh).toHaveBeenCalledTimes(2);
});

test('simultaneous clocks and resume events share one in-flight refresh', async () => {
  let current = view(0);
  let finish: () => void = () => {};
  const refresh = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  stop = rotate(() => current, refresh).stop;
  await vi.advanceTimersByTimeAsync(0);
  for (const event of ['focus', 'online', 'pageshow']) win.dispatchEvent(new Event(event));
  doc.dispatchEvent(new Event('visibilitychange'));
  expect(refresh).toHaveBeenCalledTimes(1);
  current = view(10);
  finish();
  await vi.advanceTimersByTimeAsync(9999);
  expect(refresh).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(refresh).toHaveBeenCalledTimes(2);
  finish();
});

test.each(['hidden', 'offline'])(
  'an expired %s tab waits and refreshes on resume',
  async (state) => {
    let current = view(1);
    const refresh = vi.fn(async () => {
      current = view(3600);
    });
    stop = rotate(() => current, refresh).stop;
    doc.hidden = state === 'hidden';
    net.onLine = state !== 'offline';
    await vi.advanceTimersByTimeAsync(60000);
    expect(refresh).not.toHaveBeenCalled();
    doc.hidden = false;
    net.onLine = true;
    if (state === 'hidden') doc.dispatchEvent(new Event('visibilitychange'));
    else win.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);
    expect(refresh).toHaveBeenCalledTimes(1);
  },
);

test.each(['zero', 'failure'])(
  'a %s response uses bounded retries without a fetch loop',
  async (mode) => {
    let current = view(0);
    const refresh = vi.fn(async () => {
      if (mode === 'failure') throw new Error('fixture');
      current = view(0);
    });
    stop = rotate(() => current, refresh).stop;
    await vi.advanceTimersByTimeAsync(0);
    expect(refresh).toHaveBeenCalledTimes(1);
    for (const [i, delay] of [2000, 5000, 15000, 60000, 60000].entries()) {
      win.dispatchEvent(new Event('focus'));
      await vi.advanceTimersByTimeAsync(delay - 1);
      expect(refresh).toHaveBeenCalledTimes(i + 1);
      await vi.advanceTimersByTimeAsync(1);
      expect(refresh).toHaveBeenCalledTimes(i + 2);
    }
  },
);

test('clock changes and bfcache restoration catch up without overflowing long timers', async () => {
  let current = view(86400 * 365);
  const refresh = vi.fn(async () => {
    current = view(3600);
  });
  stop = rotate(() => current, refresh).stop;
  await vi.advanceTimersByTimeAsync(60000);
  expect(refresh).not.toHaveBeenCalled();
  vi.setSystemTime(Date.now() + 86400 * 366 * 1000);
  win.dispatchEvent(new Event('pageshow'));
  await vi.advanceTimersByTimeAsync(0);
  expect(refresh).toHaveBeenCalledTimes(1);
});

test('cleanup during a request removes listeners and prevents later timers or requests', async () => {
  let finish: () => void = () => {};
  const refresh = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  stop = rotate(() => view(0), refresh).stop;
  await vi.advanceTimersByTimeAsync(0);
  stop();
  finish();
  await vi.advanceTimersByTimeAsync(600000);
  doc.dispatchEvent(new Event('visibilitychange'));
  win.dispatchEvent(new Event('online'));
  expect(refresh).toHaveBeenCalledTimes(1);
});

test('eight failed refreshes stop automatic requests until fresh data arrives', async () => {
  let current = view(0);
  const refresh = vi.fn(async () => {
    current = view(0);
  });
  const clock = rotate(() => current, refresh);
  stop = clock.stop;
  await vi.advanceTimersByTimeAsync(86400000);
  expect(refresh).toHaveBeenCalledTimes(8);
  expect(vi.getTimerCount()).toBe(0);
  for (const event of ['focus', 'online', 'pageshow']) win.dispatchEvent(new Event(event));
  await vi.advanceTimersByTimeAsync(600000);
  expect(refresh).toHaveBeenCalledTimes(8);
  current = view(3600);
  clock.changed();
  await vi.advanceTimersByTimeAsync(3600000);
  expect(refresh).toHaveBeenCalledTimes(9);
});

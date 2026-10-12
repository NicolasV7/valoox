import { afterEach, expect, test, vi } from 'vitest';
import { held, reload, tell } from '../../web/data/channel.ts';
import { reset } from '../../web/data/private.ts';
import type { Prefs } from '../../web/data/types.ts';
import { saveWishlist } from '../../web/data/watchlist.ts';

const item = (name: string) => ({ id: name, name });
const prefs = (names: string[]): Prefs => ({ wishlist: names.map(item), mail: null, code: null });
const tick = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
afterEach(() => {
  reset('out');
  vi.unstubAllGlobals();
});

test('rapid taps save in order and an early response cannot undo the later optimistic list', async () => {
  const finish: Array<(value: Response) => void> = [];
  const fetcher = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finish.push(resolve);
      }),
  );
  vi.stubGlobal('fetch', fetcher);
  tell(prefs([]));
  const one = saveWishlist([item('A')]);
  const two = saveWishlist([item('A'), item('B')]);
  await tick();
  expect(fetcher).toHaveBeenCalledTimes(1);
  finish[0]?.(Response.json(prefs(['A'])));
  await one;
  await tick();
  expect(held()?.wishlist.map((x) => x.id)).toEqual(['A', 'B']);
  expect(fetcher).toHaveBeenCalledTimes(2);
  finish[1]?.(Response.json(prefs(['A', 'B'])));
  await two;
  expect(held()?.wishlist.map((x) => x.id)).toEqual(['A', 'B']);
});

test('a background preference read cannot replace a pending edit with its older snapshot', async () => {
  let read: (value: Response) => void = () => {};
  let post: (value: Response) => void = () => {};
  vi.stubGlobal(
    'fetch',
    (_path: string, init: RequestInit) =>
      new Promise<Response>((resolve) => {
        if (init.method === 'POST') post = resolve;
        else read = resolve;
      }),
  );
  tell(prefs([]));
  const pending = reload();
  const write = saveWishlist([item('A')]);
  await tick();
  read(Response.json(prefs([])));
  await pending;
  expect(held()?.wishlist.map((x) => x.id)).toEqual(['A']);
  post(Response.json(prefs(['A'])));
  await write;
});

test('a failed last write restores the server answer rather than another unconfirmed snapshot', async () => {
  vi.stubGlobal('fetch', async (_path: string, init: RequestInit) =>
    init.method === 'POST' ? new Response(null, { status: 503 }) : Response.json(prefs(['server'])),
  );
  tell(prefs(['before']));
  await saveWishlist([item('new')]);
  expect(held()?.wishlist.map((x) => x.id)).toEqual(['server']);
});

test('changing account prevents queued writes and old responses from touching the new account', async () => {
  let finish: (value: Response) => void = () => {};
  const fetcher = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal('fetch', fetcher);
  tell(prefs([]));
  const one = saveWishlist([item('A')]);
  const two = saveWishlist([item('A'), item('B')]);
  await tick();
  reset('logout');
  tell(prefs(['other-account']));
  finish(Response.json(prefs(['A'])));
  await Promise.all([one, two]);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(held()?.wishlist.map((x) => x.id)).toEqual(['other-account']);
});

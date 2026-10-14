import { afterEach, expect, test, vi } from 'vitest';
import * as api from '../../web/data/api.ts';
import { held, reload, tell } from '../../web/data/channel.ts';
import { current, epoch, reset } from '../../web/data/private.ts';

vi.mock('../../web/i18n/index.ts', () => ({ locale: () => 'es' }));

const prefs = {
  wishlist: [{ id: 'a', name: 'A' }],
  mail: { to: 'a@example.invalid', ok: true, said: '' },
  code: null,
};
afterEach(() => {
  reset('out');
  vi.unstubAllGlobals();
});
test('changing account clears preferences and rejects a late response', async () => {
  let finish: (res: Response) => void = () => undefined;
  vi.stubGlobal(
    'fetch',
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  tell(prefs);
  const old = epoch();
  const request = reload();
  reset('logout');
  expect(held()).toBeNull();
  finish(Response.json(prefs));
  await request;
  expect(current(old)).toBe(false);
  expect(held()).toBeNull();
});
test('a failed logout preserves the visible session and private generation', async () => {
  tell(prefs);
  const generation = epoch();
  vi.stubGlobal('fetch', async () => new Response(null, { status: 503 }));
  await expect(api.logout()).rejects.toThrow();
  expect(epoch()).toBe(generation);
  expect(held()).toEqual(prefs);
});
test('confirmed logout aborts old requests and clears all shared preferences', async () => {
  let captured: AbortSignal | undefined;
  vi.stubGlobal('fetch', async (_path: string, init: RequestInit) => {
    captured = init.signal as AbortSignal;
    return Response.json({ ok: true });
  });
  tell(prefs);
  expect(await api.logout()).toEqual({ ok: true });
  expect(captured?.aborted).toBe(true);
  expect(held()).toBeNull();
});
test('QR approval rotates private state before the next store load', async () => {
  tell(prefs);
  vi.stubGlobal('fetch', async () => Response.json({ status: 'ok', shard: 'na' }));
  expect(await api.pollScan()).toEqual({ status: 'ok', shard: 'na' });
  expect(held()).toBeNull();
});

test('an older preference read cannot replace the result of a newer read', async () => {
  const pending: Array<(response: Response) => void> = [];
  vi.stubGlobal('fetch', () => new Promise<Response>((resolve) => pending.push(resolve)));
  const first = reload();
  const second = reload();
  const latest = { ...prefs, mail: { ...prefs.mail, to: 'new@example.invalid' } };
  pending[1]?.(Response.json(latest));
  expect(await second).toBe(true);
  pending[0]?.(Response.json(prefs));
  expect(await first).toBe(true);
  expect(held()).toEqual(latest);
});

test('a superseded caller waits for the newest pending preference read', async () => {
  const pending: Array<(response: Response) => void> = [];
  vi.stubGlobal('fetch', () => new Promise<Response>((resolve) => pending.push(resolve)));
  const first = reload();
  const second = reload();
  let finished = false;
  void first.then(() => {
    finished = true;
  });
  pending[0]?.(Response.json(prefs));
  for (let i = 0; i < 8; i++) await Promise.resolve();
  expect(finished).toBe(false);
  pending[1]?.(Response.json(prefs));
  expect(await second).toBe(true);
  expect(await first).toBe(true);
});

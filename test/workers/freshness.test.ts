import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { Env } from '../../src/types.ts';
import { clearCache, readCache, writeCache } from '../../src/vault/cache.ts';
import { CURRENT_KID, seal } from '../../src/vault/seal.ts';
import { createSession } from '../../src/vault/session.ts';
import { session, storeView, UID } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

let env: Env;
beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY };
  await createSession(env, UID, session());
  await clearCache(env, UID);
});
afterEach(() => vi.restoreAllMocks());

test.each(['daily', 'bundle', 'night', 'accessory'])(
  'a propagated KV entry is rejected when its %s rotation is past',
  async (section) => {
    const view = storeView();
    await writeCache(env, 'store', UID, view, 3600);
    const key = (await env.VAL.list({ prefix: 'store4:' })).keys[0]?.name as string;
    const aged = { ...view, fetchedAt: view.fetchedAt - 61 };
    if (section === 'daily') aged.remaining = 60;
    if (section === 'bundle') {
      aged.bundles = [{ id: 'bundle', base: 1, price: 1, remaining: 60, items: [] }];
    }
    if (section === 'night') aged.night = { remaining: 60, items: [] };
    if (section === 'accessory') aged.accessory = { remaining: 60, items: [] };
    // Simulate the old TTL or an older view propagating from another location.
    await env.VAL.put(key, await seal(env, UID, CURRENT_KID, aged, 'store:4'), {
      expirationTtl: 60,
    });
    expect(await readCache(env, 'store', UID)).toBeNull();
  },
);

test('KV minimum TTL does not extend a short-lived store view', async () => {
  const now = Math.floor(Date.now() / 1000) * 1000;
  const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
  const view = { ...storeView(), remaining: 1 };
  await writeCache(env, 'store', UID, view, 1);
  const key = (await env.VAL.list({ prefix: 'store4:' })).keys[0]?.name as string;
  expect(await readCache(env, 'store', UID)).toEqual(view);
  clock.mockReturnValue(now + 1000);
  expect(await env.VAL.get(key)).not.toBeNull();
  expect(await readCache(env, 'store', UID)).toBeNull();
});

test('a zero-duration response is served without writing another stale cache entry', async () => {
  expect(await writeCache(env, 'store', UID, { ...storeView(), remaining: 0 }, 0)).toBe(true);
  expect((await env.VAL.list({ prefix: 'store4:' })).keys).toHaveLength(0);
});

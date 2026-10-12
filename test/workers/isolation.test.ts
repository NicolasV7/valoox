import { beforeEach, expect, test, vi } from 'vitest';
import { mint } from '../../src/app/cookie.ts';
import { route } from '../../src/router.ts';
import type { Env } from '../../src/types.ts';
import { browserId } from '../../src/vault/keys.ts';
import * as repo from '../../src/vault/repo.ts';
import { CURRENT_KID, open, seal } from '../../src/vault/seal.ts';
import {
  createSession,
  forget,
  readCache,
  saveSession,
  writeCache,
} from '../../src/vault/session.ts';
import { session, storeView, UID } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

let env: Env;
beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY };
});
test('a database/KV identifier cannot replay the browser cookie', async () => {
  const secret = mint();
  const uid = await browserId(env, secret);
  await createSession(env, uid, { ...session(), wishlist: [{ id: 'private', name: 'Private' }] });
  const prefs = (cookie: string) =>
    route(new Request('https://drop.valoox.store/api/prefs', { headers: { cookie } }), env);
  expect(await (await prefs('__Host-val=' + secret)).json()).toMatchObject({
    wishlist: [{ id: 'private' }],
  });
  expect(await (await prefs('__Host-val=' + uid)).json()).toEqual({ needsReseed: true });
  expect(await (await prefs('uid=' + uid.slice(0, 32))).json()).toEqual({ needsReseed: true });
});
test('session ciphertext cannot be transplanted into either view cache', async () => {
  await createSession(env, UID, session());
  await writeCache(env, 'store', UID, storeView(), 3600);
  const row = await repo.get(env, UID);
  const keys = await env.VAL.list({ prefix: 'store4:' });
  const key = keys.keys[0]?.name as string;
  await env.VAL.put(key, row?.blob as string);
  expect(await readCache(env, 'store', UID)).toBeNull();
  await expect(open(env, UID, CURRENT_KID, row?.blob as string, 'inv:3')).rejects.toThrow();
});
test('a delayed KV deletion cannot undo logout', async () => {
  await createSession(env, UID, session());
  await writeCache(env, 'store', UID, storeView(), 3600);
  const key = (await env.VAL.list({ prefix: 'store4:' })).keys[0]?.name as string;
  const stale = (await env.VAL.get(key)) as string;
  await forget(env, UID);
  await env.VAL.put(key, stale); // What another colo may still see.
  expect(await readCache(env, 'store', UID)).toBeNull();
});
test('a re-created row cannot accept a writer from the old generation', async () => {
  await createSession(env, UID, session());
  await createSession(env, UID, { ...session(), name: 'Other#TAG', wishlist: [] });
  expect(await saveSession(env, UID, session(), 0)).toBe(false);
});
test('even a purpose-correct cache rejects credential fields', async () => {
  await createSession(env, UID, session());
  await writeCache(env, 'store', UID, storeView(), 3600);
  const key = (await env.VAL.list({ prefix: 'store4:' })).keys[0]?.name as string;
  await env.VAL.put(
    key,
    await seal(env, UID, CURRENT_KID, { ...storeView(), jar: { ssid: 'secret' } }, 'store:4'),
  );
  expect(await readCache(env, 'store', UID)).toBeNull();
});

test('a failed cache deletion does not turn confirmed D1 logout into a false failure', async () => {
  await createSession(env, UID, session());
  const fault = vi.spyOn(env.VAL, 'delete').mockRejectedValue(new Error('fixture'));
  await expect(forget(env, UID)).resolves.toBeUndefined();
  expect(await repo.get(env, UID)).toBeNull();
  fault.mockRestore();
});

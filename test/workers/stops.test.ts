import { beforeEach, expect, test } from 'vitest';
import { stopMail } from '../../src/routes/stop.ts';
import type { Env } from '../../src/types.ts';
import { CURRENT_KID, seal } from '../../src/vault/seal.ts';
import { createSession, readSession, saveSession } from '../../src/vault/session.ts';
import { mintStop, readStop } from '../../src/vault/stop.ts';
import { OTHER, session, UID } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

let env: Env;
beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY };
  for (const uid of [UID, OTHER])
    await createSession(env, uid, {
      ...session(),
      puuid: uid === UID ? session().puuid : 'another-account',
      mail: { to: 'person@example.invalid', ok: true, gen: crypto.randomUUID() },
      wishlist: [{ id: 'level', name: 'Wanted' }],
    });
});
const answer = (t: string, value?: string) =>
  stopMail({
    env,
    uid: OTHER,
    headers: new Headers(),
    req: new Request('https://app/api/stop', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ t, answer: value }),
    }),
  });
test('tokens conceal storage identifiers and differ for every message', async () => {
  const a = await mintStop(env, UID);
  const b = await mintStop(env, UID);
  expect(a).not.toContain(UID);
  expect(a.slice(0, 16)).not.toBe(b.slice(0, 16));
  expect((await readStop(env, a))?.uid).toBe(UID);
  expect((await readStop(env, a))?.id).not.toBe((await readStop(env, b))?.id);
});
test('tampering, key rotation and session ciphertext never form a stop token', async () => {
  const token = await mintStop(env, UID);
  const bytes = Uint8Array.from(atob(token.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
    c.charCodeAt(0),
  );
  for (const at of [0, 20, bytes.length - 1]) {
    const copy = bytes.slice();
    copy[at] = (copy[at] ?? 0) ^ 64;
    const raw = btoa(String.fromCharCode(...copy))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(await readStop(env, raw)).toBeNull();
  }
  expect(await readStop({ ...env, JAR_KEY: btoa('x'.repeat(32)) }, token)).toBeNull();
  const blob = await seal(env, UID, CURRENT_KID, session());
  expect(await readStop(env, blob.replace(/\+/g, '-').replace(/\//g, '_'))).toBeNull();
});
test('answering no atomically closes the link to a later yes', async () => {
  const token = await mintStop(env, UID);
  expect(await answer(token)).toEqual({ ok: true, live: true });
  expect(await answer(token, 'no')).toEqual({ ok: true, kept: true });
  expect(await answer(token, 'yes')).toEqual({ ok: false, error: 'used' });
  expect((await readSession(env, UID))?.session.mail?.ok).toBe(true);
});
test('a concurrent answer has exactly one winner and keeps the wishlist', async () => {
  const token = await mintStop(env, UID);
  const results = await Promise.all(Array.from({ length: 12 }, () => answer(token, 'yes')));
  expect(results.filter((v) => v.ok)).toHaveLength(1);
  const held = await readSession(env, UID);
  expect(held?.session.mail).toBeUndefined();
  expect(held?.session.wishlist).toHaveLength(1);
  expect((await readSession(env, OTHER))?.session.mail).toBeDefined();
});
test('an old link cannot affect a newly configured email generation', async () => {
  const token = await mintStop(env, UID);
  const held = await readSession(env, UID);
  if (!held) throw new Error('fixture');
  held.session.mail = { to: 'new@example.invalid', ok: true, gen: crypto.randomUUID() };
  await saveSession(env, UID, held.session, held.ver);
  expect(await answer(token, 'yes')).toEqual({ ok: false, error: 'used' });
  expect((await readSession(env, UID))?.session.mail?.to).toBe('new@example.invalid');
});

test('a footer stops the same account/address across browsers, leaving other accounts alone', async () => {
  const alias = 'c'.repeat(64);
  await createSession(env, alias, {
    ...session(),
    mail: {
      to: 'person@example.invalid',
      ok: true,
      gen: crypto.randomUUID(),
    },
  });
  expect((await answer(await mintStop(env, UID), 'yes')).ok).toBe(true);
  expect((await readSession(env, alias))?.session.mail).toBeUndefined();
  expect((await readSession(env, OTHER))?.session.mail).toBeDefined();
});
test('a token stays expired even after its spent record has been pruned', async () => {
  const token = { id: crypto.randomUUID(), uid: UID, gen: 'generation', expires: 1 };
  const blob = await seal(env, 'link', CURRENT_KID, token, 'stop:2');
  const raw = blob.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  expect(await readStop(env, raw)).toBeNull();
});

import { beforeEach, expect, test } from 'vitest';
import { route } from '../../src/router.ts';
import { readSharing, writeSharing } from '../../src/routes/sharing.ts';
import * as scans from '../../src/storage/scans.ts';
import type { Env } from '../../src/types.ts';
import { browserId } from '../../src/vault/keys.ts';
import { prune } from '../../src/vault/repo.ts';
import { CURRENT_KID, open } from '../../src/vault/seal.ts';
import {
  createSession,
  encoded,
  forget,
  readSession,
  saveSession,
} from '../../src/vault/session.ts';
import { save } from '../../src/vault/sharing.ts';
import { markOf } from '../../src/vault/who.ts';
import { OTHER, session, UID } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

let env: Env;
beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY };
});
const context = (uid: string, body?: unknown) => ({
  env,
  uid,
  headers: new Headers(),
  req: new Request('https://drop.valoox.store/api/sharing', {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }),
});
const read = (uid = UID) => readSharing(context(uid));
const write = (tag: boolean, uid = UID) => writeSharing(context(uid, { tag }));
const devices = async () => {
  await createSession(env, UID, session());
  await createSession(env, OTHER, session());
};

test('an authenticated account with no saved choice keeps the existing visible-tag default', async () => {
  await createSession(env, UID, session());
  expect(await read()).toEqual({ tag: true });
  expect(await env.DB.prepare('SELECT * FROM sharing').first()).toBeNull();
});

test('both hidden and visible choices follow the same account to another device', async () => {
  await devices();
  expect(await write(false)).toEqual({ tag: false });
  expect(await read(OTHER)).toEqual({ tag: false });
  expect(await write(true, OTHER)).toEqual({ tag: true });
  expect(await read()).toEqual({ tag: true });
});

test('sharing choices cannot cross accounts or be selected by client-supplied identifiers', async () => {
  await createSession(env, UID, session());
  await createSession(env, OTHER, { ...session(), puuid: crypto.randomUUID() });
  await write(false);
  expect(await read(OTHER)).toEqual({ tag: true });
  for (const body of [
    { tag: false, acct: await markOf(env, session().puuid) },
    { tag: false, uid: UID },
  ])
    await expect(writeSharing(context(OTHER, body))).rejects.toMatchObject({ status: 400 });
  expect(await read()).toEqual({ tag: false });
});

test('a forged account index is repaired from the authenticated encrypted Riot identity', async () => {
  await devices();
  await write(false);
  await env.DB.prepare('UPDATE s SET acct=? WHERE uid=?').bind('forged', OTHER).run();
  expect(await read(OTHER)).toEqual({ tag: false });
});

test('anonymous writes do not parse bodies and malformed or oversized authenticated writes fail', async () => {
  expect(await writeSharing(context(UID, { tag: 'false' }))).toEqual({ needsReseed: true });
  await createSession(env, UID, session());
  for (const tag of [null, 0, 1, 'false', {}, []])
    await expect(writeSharing(context(UID, { tag }))).rejects.toMatchObject({ status: 400 });
  await expect(writeSharing(context(UID, {}))).rejects.toMatchObject({ status: 400 });
  await expect(writeSharing(context(UID, { tag: 'x'.repeat(129) }))).rejects.toMatchObject({
    status: 413,
  });
});

test('a revoked or account-switched session cannot recreate the previous account preference', async () => {
  await createSession(env, UID, session());
  await write(false);
  await forget(env, UID);
  expect(await save(env, UID, session().puuid, true)).toBe(false);
  await createSession(env, UID, { ...session(), puuid: crypto.randomUUID() });
  expect(await save(env, UID, session().puuid, false)).toBe(false);
  expect(await read()).toEqual({ tag: true });
});

test('sharing choices are encrypted and bound to their account and encryption purpose', async () => {
  await devices();
  await write(false);
  const acct = await markOf(env, session().puuid);
  const row = await env.DB.prepare('SELECT * FROM sharing WHERE acct=?')
    .bind(acct)
    .first<{ kid: number; blob: string }>();
  expect(row?.blob).not.toContain('tag');
  await expect(
    open(env, acct as string, CURRENT_KID, row?.blob ?? '', 'wishlist:1'),
  ).rejects.toThrow();
  const other = crypto.randomUUID();
  await createSession(env, OTHER, { ...session(), puuid: other });
  await env.DB.prepare('INSERT INTO sharing(acct,kid,blob) VALUES(?,?,?)')
    .bind(await markOf(env, other), row?.kid, row?.blob)
    .run();
  await expect(read(OTHER)).rejects.toThrow();
  expect(await read()).toEqual({ tag: false });
});

test('an older session save cannot undo the account-wide choice', async () => {
  await devices();
  const held = await readSession(env, UID);
  if (!held) throw new Error('fixture');
  await write(false, OTHER);
  expect(await saveSession(env, UID, held.session, held.ver)).toBe(true);
  expect(await read()).toEqual({ tag: false });
});

test('one device leaving preserves the choice; the last session leaving deletes it', async () => {
  await devices();
  await write(false);
  await forget(env, UID);
  expect(await read(OTHER)).toEqual({ tag: false });
  await forget(env, OTHER);
  expect(await env.DB.prepare('SELECT * FROM sharing').first()).toBeNull();
});

test('inactive account cleanup also removes its sharing preference', async () => {
  await createSession(env, UID, session());
  await write(false);
  await env.DB.prepare('UPDATE s SET last_used=0').run();
  await prune(env);
  expect(await env.DB.prepare('SELECT * FROM sharing').first()).toBeNull();
});

test.each([false, true])(
  'QR rotation preserves only the confirmed account choice: switched=%s',
  async (switched) => {
    await createSession(env, UID, session());
    await write(false);
    await scans.begin(env, UID, crypto.randomUUID(), CURRENT_KID, 'scan');
    const scan = await scans.claim(env, UID);
    if (!scan || scan === 'busy') throw new Error('fixture');
    const next = switched ? { ...session(), puuid: crypto.randomUUID() } : session();
    const value = await encoded(env, OTHER, next);
    expect(await scans.finish(env, scan, { uid: OTHER, ...value })).toBe(true);
    expect(await read(OTHER)).toEqual({ tag: switched });
    if (switched) expect(await env.DB.prepare('SELECT * FROM sharing').first()).toBeNull();
  },
);

test('the sharing route retains CSRF, method and private response protections', async () => {
  const secret = 'e'.repeat(64);
  await createSession(env, await browserId(env, secret), session());
  const headers = { cookie: '__Host-val=' + secret, 'content-type': 'application/json' };
  const request = (method = 'GET', extra = {}) =>
    route(
      new Request('https://drop.valoox.store/api/sharing', {
        method,
        headers: { ...headers, ...extra },
        body: method === 'POST' ? '{"tag":false}' : undefined,
      }),
      env,
    );
  expect((await request('POST')).status).toBe(403);
  expect((await request('PUT')).status).toBe(405);
  const response = await request('POST', { 'sec-fetch-site': 'same-origin' });
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(await response.json()).toEqual({ tag: false });
  expect(await (await request()).json()).toEqual({ tag: false });
});

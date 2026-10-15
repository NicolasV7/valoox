import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { route } from '../../src/router.ts';
import * as scans from '../../src/storage/scans.ts';
import type { Env } from '../../src/types.ts';
import { adopt } from '../../src/vault/adopt.ts';
import { CURRENT_KID, seal } from '../../src/vault/seal.ts';
import { forget, readSession } from '../../src/vault/session.ts';
import { action, command, linked, setup } from './discord.ts';
import { OTHER, UID } from './fixtures.ts';

let env: Env;
beforeEach(async () => {
  env = await setup();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ id: '567890123456789012' })));
});
afterEach(() => vi.unstubAllGlobals());

test('/stop disables all linked browsers while preserving email and the saved list', async () => {
  await linked(env);
  await linked(env, OTHER);
  await command(env, 'stop');
  for (const uid of [UID, OTHER]) {
    const s = (await readSession(env, uid))?.session;
    expect(s?.discord?.ok).toBe(false);
    expect(s?.mail?.ok).toBe(true);
    expect(s?.wishlist).toHaveLength(1);
  }
  expect(JSON.stringify(await (await command(env, 'status')).json())).toContain(
    'Connect this chat',
  );
});

test('browser disconnect removes only its Discord state and pending code', async () => {
  await linked(env);
  await linked(env, OTHER);
  await action(env, 'start');
  expect(await action(env, 'remove')).toEqual({ ok: true });
  const s = (await readSession(env, UID))?.session;
  expect(s?.discord).toBeUndefined();
  expect(s?.mail?.ok).toBe(true);
  expect(s?.wishlist).toHaveLength(1);
  expect((await readSession(env, OTHER))?.session.discord?.ok).toBe(true);
  expect(await env.DB.prepare('SELECT * FROM links WHERE uid=?').bind(UID).first()).toBeNull();
});

test('browser actions retain origin and authentication checks', async () => {
  const crossSite = new Request('https://drop.valoox.store/api/discord', {
    method: 'POST',
    headers: { 'sec-fetch-site': 'cross-site' },
    body: '{}',
  });
  expect((await route(crossSite, env)).status).toBe(403);
  const anonymous = await route(
    new Request('https://drop.valoox.store/api/discord', {
      method: 'POST',
      headers: { 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    }),
    env,
  );
  expect(await anonymous.json()).toEqual({ needsReseed: true });
});

async function approval(stop = false) {
  const old = await linked(env);
  const previous = await adopt(env, UID, old.puuid as string);
  await scans.begin(env, UID, 'scan-generation', CURRENT_KID, 'fixture');
  const scan = await scans.claim(env, UID);
  if (!scan || scan === 'busy') throw new Error('fixture');
  if (stop) await command(env, 'stop');
  return scans.finish(env, scan, {
    uid: OTHER,
    kid: CURRENT_KID,
    blob: await seal(env, OTHER, CURRENT_KID, { ...old, ...previous.preferences }),
    acct: null,
    alerts: true,
    discordGen: old.discord?.gen,
  });
}

test('account-confirmed QR rotation preserves an active Discord connection atomically', async () => {
  expect(await approval()).toBe(true);
  expect(await readSession(env, UID)).toBeNull();
  expect((await readSession(env, OTHER))?.session.discord?.ok).toBe(true);
});

test('/stop during QR approval cannot be undone by copying an older encrypted preference', async () => {
  expect(await approval(true)).toBe(true);
  expect((await readSession(env, OTHER))?.session.discord?.ok).toBe(false);
});

test('logout cascades the Discord index and outstanding connection code', async () => {
  await linked(env);
  await action(env, 'start');
  await forget(env, UID);
  expect(await env.DB.prepare('SELECT * FROM discord').first()).toBeNull();
  expect(await env.DB.prepare('SELECT * FROM links').first()).toBeNull();
});

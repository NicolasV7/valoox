import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { readWishlist } from '../../src/routes/wishlist.ts';
import type { Env } from '../../src/types.ts';
import { createSession, readSession } from '../../src/vault/session.ts';
import { action, command, ROOM, setup, USER, watching } from './discord.ts';
import { UID } from './fixtures.ts';

let env: Env;
const fetcher = vi.fn();
beforeEach(async () => {
  env = await setup();
  fetcher.mockReset().mockResolvedValue(Response.json({ id: '567890123456789012' }));
  vi.stubGlobal('fetch', fetcher);
  await createSession(env, UID, watching());
});
afterEach(() => vi.unstubAllGlobals());

test('an unconfigured bot cannot start linking and email remains verified', async () => {
  env.DISCORD_TOKEN = '';
  expect(await action(env, 'start')).toEqual({ error: 'unavailable' });
  expect((await readSession(env, UID))?.session.mail?.ok).toBe(true);
  expect(fetcher).not.toHaveBeenCalled();
});

test('a signed private command proves a separate bot DM and preserves email and favourites', async () => {
  const link = await action(env, 'start');
  expect(link.code).toMatch(/^[0-9a-f]{32}$/);
  const row = await env.DB.prepare('SELECT * FROM links').first();
  expect(JSON.stringify(row)).not.toContain(link.code);
  const response = await command(env, 'connect', link.code as string);
  expect(response.status).toBe(200);
  const s = (await readSession(env, UID))?.session;
  expect(s?.discord).toMatchObject({ ok: true, user: USER, room: ROOM });
  expect(s?.mail?.ok).toBe(true);
  expect(s?.wishlist).toHaveLength(1);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]?.[0]).toBe(`https://discord.com/api/v10/channels/${ROOM}/messages`);
  expect(fetcher.mock.calls[0]?.[1].headers.Authorization).toBe('Bot fixture-bot-token');
  const prefs = await readWishlist({
    env,
    uid: UID,
    req: new Request('https://drop.valoox.store/api/prefs'),
    headers: new Headers(),
  });
  expect(prefs.discord).toMatchObject({ name: 'Discord player', ok: true });
  expect(prefs.discordLink).toBeNull();
  expect(JSON.stringify(prefs)).not.toContain(USER);
  expect(JSON.stringify(prefs)).not.toContain(ROOM);
  expect(JSON.stringify(await env.DB.prepare('SELECT * FROM discord').first())).not.toContain(USER);
});

test('a slash reply cannot activate Discord when the independent bot DM is blocked', async () => {
  fetcher.mockResolvedValue(new Response(null, { status: 403 }));
  const link = await action(env, 'start');
  expect((await command(env, 'connect', link.code as string)).status).toBe(200);
  expect((await readSession(env, UID))?.session.discord).toBeUndefined();
  expect((await readSession(env, UID))?.session.mail?.ok).toBe(true);
  expect(await env.DB.prepare('SELECT state FROM links').first()).toEqual({ state: 'blocked' });
});

test('expired and replaced connection codes cannot send messages', async () => {
  const old = await action(env, 'start');
  await env.DB.prepare('UPDATE links SET expires=0').run();
  await command(env, 'connect', old.code as string);
  await env.DB.prepare('DELETE FROM limits').run();
  const fresh = await action(env, 'start');
  await command(env, 'connect', old.code as string);
  expect(fetcher).not.toHaveBeenCalled();
  await command(env, 'connect', fresh.code as string);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test('one connection code can only be consumed by one concurrent command', async () => {
  const link = await action(env, 'start');
  await Promise.all([
    command(env, 'connect', link.code as string),
    command(env, 'connect', link.code as string),
  ]);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect((await readSession(env, UID))?.session.discord?.ok).toBe(true);
});

test('connection codes have a cooldown even when the existing email is valid', async () => {
  expect(await action(env, 'start')).toHaveProperty('code');
  expect(await action(env, 'start')).toMatchObject({ error: 'wait' });
  expect(fetcher).not.toHaveBeenCalled();
});

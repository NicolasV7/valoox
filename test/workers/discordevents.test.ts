import { beforeEach, expect, test } from 'vitest';
import { route } from '../../src/router.ts';
import * as links from '../../src/storage/links.ts';
import type { Env } from '../../src/types.ts';
import { CURRENT_KID } from '../../src/vault/seal.ts';
import { readSession } from '../../src/vault/session.ts';
import { APP, action, linked, setup, signed, USER } from './discord.ts';
import { OTHER, UID } from './fixtures.ts';

let env: Env;
beforeEach(async () => {
  env = await setup();
});
const payload = (timestamp = new Date().toISOString()) => ({
  version: 1,
  application_id: APP,
  type: 1,
  event: { type: 'APPLICATION_DEAUTHORIZED', timestamp, data: { user: { id: USER } } },
});
const deliver = async (body: unknown) =>
  route(new Request('https://drop.valoox.store/api/hook/discord/events', await signed(body)), env);

test('event endpoint acknowledges signed PING and rejects unsigned or wrong-app events', async () => {
  const ping = await deliver({ version: 1, application_id: APP, type: 0 });
  expect(ping.status).toBe(204);
  expect(ping.headers.get('content-type')).toBe('application/json');
  expect(await ping.text()).toBe('');
  expect((await deliver({ ...payload(), application_id: USER })).status).toBe(401);
  expect(
    (
      await route(
        new Request('https://drop.valoox.store/api/hook/discord/events', {
          method: 'POST',
          body: '{}',
        }),
        env,
      )
    ).status,
  ).toBe(401);
});

test('removing the Discord app stops every linked browser but retains email and favourites', async () => {
  await linked(env);
  await linked(env, OTHER);
  expect((await deliver(payload())).status).toBe(204);
  for (const uid of [UID, OTHER]) {
    const current = (await readSession(env, uid))?.session;
    expect(current?.discord?.ok).toBe(false);
    expect(current?.mail?.ok).toBe(true);
    expect(current?.wishlist).toHaveLength(1);
  }
});

test('an old deauthorization retry cannot stop a newer connection', async () => {
  await linked(env);
  const earlier = Date.now() - 60000;
  await env.DB.prepare('UPDATE discord SET since=? WHERE uid=?').bind(Date.now(), UID).run();
  expect((await deliver(payload(new Date(earlier).toISOString()))).status).toBe(204);
  expect((await readSession(env, UID))?.session.discord?.ok).toBe(true);
});

test('a connected browser receives no new code and no outstanding link', async () => {
  await linked(env);
  expect(await action(env, 'start')).toEqual({ connected: true });
  expect(await links.pending(env, UID, CURRENT_KID)).toBeNull();
});

test('checking blocks browser mutations until the code expires', async () => {
  await linked(env);
  await action(env, 'remove');
  const result = await action(env, 'start');
  expect(result.code).toEqual(expect.any(String));
  await env.DB.prepare("UPDATE links SET state='checking',claim='in-flight' WHERE uid=?")
    .bind(UID)
    .run();
  expect(await action(env, 'remove')).toEqual({ error: 'checking' });
  expect(await action(env, 'start')).toEqual({ error: 'checking' });
  await env.DB.prepare('UPDATE links SET expires=? WHERE uid=?')
    .bind(Math.floor(Date.now() / 1000) - 1, UID)
    .run();
  expect(await action(env, 'remove')).toEqual({ ok: true });
});

test('a waiting code in an already-linked browser is revoked by /stop', async () => {
  await linked(env);
  await env.DB.prepare('INSERT INTO links(uid,key,gen,kid,expires) VALUES (?,?,?,?,?)')
    .bind(UID, 'digest', 'generation', CURRENT_KID, Math.floor(Date.now() / 1000) + 600)
    .run();
  const { command } = await import('./discord.ts');
  await command(env, 'stop');
  expect(await links.pending(env, UID, CURRENT_KID)).toBeNull();
});

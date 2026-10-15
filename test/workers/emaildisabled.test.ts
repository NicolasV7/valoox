import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { retry } from '../../src/alerts/dispatch.ts';
import { post } from '../../src/alerts/post.ts';
import { route } from '../../src/router.ts';
import { readWishlist } from '../../src/routes/wishlist.ts';
import * as deliveries from '../../src/storage/deliveries.ts';
import type { Env } from '../../src/types.ts';
import { runAlerts } from '../../src/vault/alerts.ts';
import { Budget } from '../../src/vault/budget.ts';
import { send } from '../../src/vault/mail.ts';
import { createSession, readSession } from '../../src/vault/session.ts';
import { linked, setup, watching } from './discord.ts';
import { UID } from './fixtures.ts';

let env: Env;
const fetcher = vi.fn();
const found = [{ id: 'level', name: 'Wanted', cost: 1775 }];
beforeEach(async () => {
  env = { ...(await setup()), EMAIL_ALERTS: 'false' };
  fetcher.mockReset().mockResolvedValue(Response.json({ id: '567890123456789012' }));
  vi.stubGlobal('fetch', fetcher);
});
afterEach(() => vi.unstubAllGlobals());

test('disabled email endpoints fail before creating proofs or sending requests', async () => {
  for (const path of ['/api/channel', '/api/channel/again', '/api/channel/verify']) {
    const result = await route(
      new Request('https://drop.valoox.store' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' },
        body: JSON.stringify({ to: 'person@example.invalid', code: '123456' }),
      }),
      env,
    );
    expect(result.status).toBe(404);
  }
  expect((await send(env, 'person@example.invalid', 'Subject', 'HTML', 'Text')).ok).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
  expect(await env.DB.prepare('SELECT * FROM otp').first()).toBeNull();
});

test('old email-only sessions do not poll Riot and keep their stored preferences', async () => {
  env.EMAIL_ALERTS = 'true';
  await createSession(env, UID, watching());
  env.EMAIL_ALERTS = 'false';
  await runAlerts(env, Date.parse('2026-10-15T01:00:00Z'));
  expect(fetcher).not.toHaveBeenCalled();
  expect((await readSession(env, UID))?.session.mail?.ok).toBe(true);
  expect(await env.DB.prepare('SELECT alerts FROM s WHERE uid=?').bind(UID).first()).toEqual({
    alerts: 0,
  });
  const prefs = await readWishlist({
    env,
    uid: UID,
    headers: new Headers(),
    req: new Request('https://drop.valoox.store/api/prefs'),
  });
  expect(prefs).toMatchObject({ emailAvailable: false, mail: null, code: null });
});

test('paused email outboxes retain their bytes while Discord retries continue', async () => {
  env.EMAIL_ALERTS = 'true';
  const s = await linked(env);
  fetcher.mockResolvedValue(new Response(null, { status: 503 }));
  await post(env, UID, s, found, 3600, new Budget(), 'rotation', 'mail');
  await post(env, UID, s, found, 3600, new Budget(), 'rotation', 'discord');
  const before = await env.DB.prepare("SELECT blob FROM deliveries WHERE channel='mail'").first();
  env.EMAIL_ALERTS = 'false';
  await env.DB.prepare('UPDATE deliveries SET lease=0').run();
  fetcher.mockClear().mockResolvedValue(Response.json({ id: '567890123456789012' }));
  await retry(env, new Budget());
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]?.[0]).toContain('discord.com');
  expect(await env.DB.prepare("SELECT blob FROM deliveries WHERE channel='mail'").first()).toEqual(
    before,
  );
  expect(await deliveries.pending(env)).toEqual([]);
});

test('legacy unclassified outboxes are classified once without sending dormant mail', async () => {
  env.EMAIL_ALERTS = 'true';
  const s = await linked(env);
  fetcher.mockResolvedValue(new Response(null, { status: 503 }));
  await post(env, UID, s, found, 3600, new Budget(), 'rotation', 'mail');
  await env.DB.prepare('UPDATE deliveries SET channel=NULL,lease=0').run();
  env.EMAIL_ALERTS = 'false';
  fetcher.mockClear();
  await retry(env, new Budget());
  expect(fetcher).not.toHaveBeenCalled();
  expect(await env.DB.prepare('SELECT channel,state FROM deliveries').first()).toEqual({
    channel: 'mail',
    state: 0,
  });
  expect(await deliveries.pending(env)).toEqual([]);
});

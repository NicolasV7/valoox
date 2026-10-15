import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { dispatch } from '../../src/alerts/dispatch.ts';
import { post } from '../../src/alerts/post.ts';
import { route } from '../../src/router.ts';
import * as deliveries from '../../src/storage/deliveries.ts';
import type { Env } from '../../src/types.ts';
import { runAlerts } from '../../src/vault/alerts.ts';
import { browserId } from '../../src/vault/keys.ts';
import * as repo from '../../src/vault/repo.ts';
import { CURRENT_KID, open, seal } from '../../src/vault/seal.ts';
import { createSession, readSession, saveSession } from '../../src/vault/session.ts';
import { session, UID } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

let env: Env;
const fetcher = vi.fn();
const hook = '123456789012345678/' + 'a'.repeat(68);
const item = { id: 'e7c63390-eda7-46e0-bb7a-a6abdacd2433', name: 'Wanted' };
const verified = () => ({
  ...session(),
  wishlist: [item],
  mail: { to: 'person@example.invalid', ok: true, gen: crypto.randomUUID() },
});
beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY, RESEND_KEY: 'test-api-key' };
  fetcher.mockReset();
  vi.stubGlobal('fetch', fetcher);
});
afterEach(() => vi.unstubAllGlobals());

test('legacy push-only rows cannot trigger outbound requests and retain their list', async () => {
  const old = { ...session(), wishlist: [item], notify: { discord: hook } };
  await repo.upsert(env, UID, CURRENT_KID, await seal(env, UID, CURRENT_KID, old), null, true);
  await runAlerts(env, Date.parse('2026-10-12T01:00:00Z'));
  expect(fetcher).not.toHaveBeenCalled();
  expect(await env.DB.prepare('SELECT alerts FROM s WHERE uid=?').bind(UID).first()).toEqual({
    alerts: 0,
  });
  const held = await readSession(env, UID);
  expect(held?.session.wishlist).toEqual([item]);
  expect(held?.session).not.toHaveProperty('notify');
  if (!held) throw new Error('fixture');
  await saveSession(env, UID, held.session, held.ver);
  const row = await repo.get(env, UID);
  if (!row) throw new Error('fixture');
  expect(await open(env, UID, row.kid, row.blob)).not.toHaveProperty('notify');
});

test.each(['discord', 'mail-address-changed', 'mail-generation-changed'])(
  'an obsolete queued destination is discarded without sending: %s',
  async (kind) => {
    const s = verified();
    await createSession(env, UID, s);
    const id = crypto.randomUUID();
    const body = {
      uid: UID,
      channel: kind === 'discord' ? 'discord' : 'mail',
      to:
        kind === 'discord'
          ? hook
          : kind === 'mail-address-changed'
            ? 'old@example.invalid'
            : s.mail.to,
      gen: kind === 'mail-generation-changed' ? 'old-generation' : s.mail.gen,
      subject: 'Fixture',
      html: '',
      text: 'Fixture',
      until: Date.now() + 3600000,
    };
    const queued = await deliveries.claim(
      env,
      id,
      await seal(env, id, CURRENT_KID, body, 'outbox:2'),
    );
    if (queued.state !== 'claimed') throw new Error('fixture');
    expect(await dispatch(env, id, queued)).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
    expect(
      await env.DB.prepare('SELECT state FROM deliveries WHERE key=?').bind(id).first(),
    ).toEqual({ state: 2 });
  },
);

test('legacy preference input is ignored and cannot enable another transport', async () => {
  const secret = 'c'.repeat(64);
  const uid = await browserId(env, secret);
  await createSession(env, uid, session());
  const res = await route(
    new Request('https://drop.valoox.store/api/prefs', {
      method: 'POST',
      headers: {
        cookie: '__Host-val=' + secret,
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ wishlist: [item], notify: { discord: hook } }),
    }),
    env,
  );
  expect(res.status).toBe(200);
  expect(await res.json()).toHaveProperty('discord', null);
  expect((await readSession(env, uid))?.session).not.toHaveProperty('notify');
  expect(await env.DB.prepare('SELECT alerts FROM s WHERE uid=?').bind(uid).first()).toEqual({
    alerts: 0,
  });
});

test('the retired test-alert route is absent', async () => {
  const res = await route(
    new Request('https://drop.valoox.store/api/test-alert', { method: 'POST' }),
    env,
  );
  expect(res.status).toBe(404);
  expect(fetcher).not.toHaveBeenCalled();
});

test('an unverified email cannot reserve or send an alert', async () => {
  const s = verified();
  s.mail.ok = false;
  await createSession(env, UID, s);
  expect(await post(env, UID, s, [item], 3600)).toBe(false);
  expect(await env.DB.prepare('SELECT * FROM deliveries').first()).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
});

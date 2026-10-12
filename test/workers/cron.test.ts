import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { post } from '../../src/alerts/post.ts';
import type { Env } from '../../src/types.ts';
import { runAlerts } from '../../src/vault/alerts.ts';
import { Budget } from '../../src/vault/budget.ts';
import { recipients } from '../../src/vault/group.ts';
import * as repo from '../../src/vault/repo.ts';
import { createSession, readSession } from '../../src/vault/session.ts';
import { OTHER, session, UID } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

let env: Env;
let calls: string[];
let mails: string[];
let mailFails: boolean;
const AT = Date.parse('2026-10-12T01:00:00Z');
const HOOK = '123456789012345678/' + 'a'.repeat(68);
beforeEach(async () => {
  env = {
    ...(await freshDb()),
    JAR_KEY: KEY,
    RESEND_KEY: 'test-api-key',
  };
  calls = [];
  mails = [];
  mailFails = false;
  vi.stubGlobal('fetch', async (input: string, init: RequestInit) => {
    const url = new URL(input);
    calls.push(url.host);
    if (url.host === 'auth.riotgames.com')
      return new Response(null, {
        status: 303,
        headers: { location: 'http://localhost/redirect#access_token=fixture' },
      });
    if (url.host === 'entitlements.auth.riotgames.com')
      return Response.json({ entitlements_token: 'fixture' });
    if (url.host === 'valorant-api.com')
      return Response.json({ data: { riotClientVersion: 'fixture' } });
    if (url.pathname.includes('/storefront/'))
      return Response.json({
        SkinsPanelLayout: {
          SingleItemOffers: ['level'],
          SingleItemOffersRemainingDurationInSeconds: 3600,
        },
      });
    if (url.host === 'api.resend.com') {
      mails.push(String(init.body));
      return mailFails
        ? new Response(null, { status: 503 })
        : Response.json({ id: crypto.randomUUID() });
    }
    if (url.host === 'discord.com') return new Response(null, { status: 503 });
    throw new Error('unexpected fixture request');
  });
});
afterEach(() => vi.unstubAllGlobals());
async function watching(uid: string, account = uid, discord = false) {
  await createSession(env, uid, {
    ...session(),
    puuid: account === UID || account === OTHER ? session().puuid : account,
    wishlist: [{ id: 'level', name: 'Wanted' }],
    mail: { to: 'person@example.invalid', ok: true, gen: crypto.randomUUID() },
    notify: discord ? { discord: HOOK } : undefined,
  });
}
test('retries for both channels remain within the external request ceiling', async () => {
  for (let i = 0; i < 9; i++)
    await watching(String(i).padStart(64, '0'), crypto.randomUUID(), true);
  const result = await runAlerts(env, AT);
  expect(result.checked).toBe(6);
  expect(calls.length).toBeLessThanOrEqual(48);
  expect(calls.filter((v) => v === 'discord.com')).toHaveLength(18);
  expect(mails).toHaveLength(6);
});
test('invalid opt-in flags cannot starve valid rows in later batches', async () => {
  for (let i = 0; i < 9; i++) {
    await createSession(env, String(i).padStart(64, '0'), session());
  }
  await env.DB.prepare('UPDATE s SET alerts=1').run();
  await watching('f'.repeat(64), crypto.randomUUID());
  await runAlerts(env, AT);
  await runAlerts(env, AT);
  expect(mails).toHaveLength(1);
  expect(await repo.listAlerting(env, 20, '2026-10-12')).toEqual([]);
});
test('one account/destination receives a union of browser watchlists once per rotation', async () => {
  await watching(UID);
  const s = {
    ...session(),
    wishlist: [{ id: 'other', name: 'Other' }],
    mail: { to: 'person@example.invalid', ok: true, gen: crypto.randomUUID() },
  };
  await createSession(env, OTHER, s);
  const row = await repo.get(env, UID);
  if (!row) throw new Error('fixture');
  const group = await recipients(env, row);
  expect(group).toHaveLength(1);
  expect(group[0]?.session.wishlist?.map((w) => w.id).sort()).toEqual(['level', 'other']);
  await runAlerts(env, AT);
  const sent = calls.length;
  await runAlerts(env, AT);
  expect(mails).toHaveLength(1);
  expect(calls).toHaveLength(sent);
});
test('an uncertain email retry reuses an identical body and idempotency key', async () => {
  await watching(UID);
  const s = (await readSession(env, UID))?.session;
  if (!s) throw new Error('fixture');
  mailFails = true;
  expect(
    await post(env, UID, s, [{ id: 'level', name: 'Wanted' }], 3600, new Budget(), 'test'),
  ).toBe(false);
  mailFails = false;
  await env.DB.prepare('UPDATE deliveries SET lease=0').run(); // Next scheduled retry.
  expect(
    await post(env, UID, s, [{ id: 'level', name: 'Wanted' }], 3000, new Budget(), 'test'),
  ).toBe(true);
  expect(mails).toHaveLength(2);
  expect(mails[1]).toBe(mails[0]);
  const record = await env.DB.prepare('SELECT blob FROM deliveries').first<{ blob: string }>();
  expect(record?.blob).not.toContain('person@example.invalid');
});
test('a completed delivery cannot be repeated by concurrent cron calls', async () => {
  await watching(UID);
  const s = (await readSession(env, UID))?.session;
  if (!s) throw new Error('fixture');
  await Promise.all(
    Array.from({ length: 5 }, () =>
      post(env, UID, s, [{ id: 'level', name: 'Wanted' }], 3600, new Budget(), 'test'),
    ),
  );
  expect(mails).toHaveLength(1);
});

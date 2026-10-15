import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { Env } from '../../src/types.ts';
import { runAlerts } from '../../src/vault/alerts.ts';
import { command, linked, setup, watching } from './discord.ts';
import { OTHER, UID } from './fixtures.ts';

let env: Env;
let calls: string[];
let mailFails: boolean;
let discordFails: boolean;
let content: string[];
const AT = Date.parse('2026-10-15T01:00:00Z');
beforeEach(async () => {
  env = await setup();
  calls = [];
  content = [];
  mailFails = false;
  discordFails = false;
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
          SingleItemOffers: ['level', 'other'],
          SingleItemOffersRemainingDurationInSeconds: 3600,
        },
      });
    if (url.host === 'discord.com') {
      content.push(String(init.body));
      return discordFails
        ? new Response(null, { status: 503 })
        : Response.json({ id: '567890123456789012' });
    }
    if (url.host === 'api.resend.com')
      return mailFails
        ? new Response(null, { status: 503 })
        : Response.json({ id: crypto.randomUUID() });
    throw new Error('unexpected fixture request');
  });
});
afterEach(() => vi.unstubAllGlobals());

test('two browser lists share one Riot check and one alert per active destination', async () => {
  await linked(env);
  await linked(env, OTHER, { ...watching(), wishlist: [{ id: 'other', name: 'Other favourite' }] });
  await runAlerts(env, AT);
  expect(calls.filter((host) => host === 'auth.riotgames.com')).toHaveLength(1);
  expect(calls.filter((host) => host === 'api.resend.com')).toHaveLength(1);
  expect(calls.filter((host) => host === 'discord.com')).toHaveLength(1);
  expect(content[0]).toContain('Wanted');
  expect(content[0]).toContain('Other favourite');
  const count = calls.length;
  await runAlerts(env, AT);
  expect(calls).toHaveLength(count);
});

test('zero users and stopped Discord-only users make no external alert requests', async () => {
  await runAlerts(env, AT);
  expect(calls).toEqual([]);
  const s = watching();
  delete s.mail;
  await linked(env, UID, s);
  await command(env, 'stop');
  await runAlerts(env, AT);
  expect(calls).toEqual([]);
  expect(await env.DB.prepare('SELECT alerts FROM s WHERE uid=?').bind(UID).first()).toEqual({
    alerts: 0,
  });
});

test('failed email queues independently while Discord still receives the match', async () => {
  mailFails = true;
  await linked(env);
  await runAlerts(env, AT);
  expect(content).toHaveLength(1);
  const riot = calls.filter((host) => host === 'auth.riotgames.com').length;
  await env.DB.prepare('UPDATE deliveries SET lease=0').run();
  mailFails = false;
  await runAlerts(env, AT);
  expect(content).toHaveLength(1);
  expect(calls.filter((host) => host === 'auth.riotgames.com')).toHaveLength(riot);
});

test('adding Discord does not raise the per-invocation external request budget', async () => {
  mailFails = discordFails = true;
  for (let n = 0; n < 9; n++) {
    await linked(env, String(n).padStart(64, '0'), { ...watching(), puuid: crypto.randomUUID() });
  }
  await runAlerts(env, AT);
  expect(calls.length).toBeLessThanOrEqual(48);
  expect(content.length).toBeGreaterThan(0);
}, 15000);

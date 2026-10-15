import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { post } from '../../src/alerts/post.ts';
import type { Env, Session } from '../../src/types.ts';
import { Budget } from '../../src/vault/budget.ts';
import { readSession } from '../../src/vault/session.ts';
import { command, linked, setup } from './discord.ts';
import { UID } from './fixtures.ts';

let env: Env;
let session: Session;
const fetcher = vi.fn();
const found = [{ id: 'level', name: 'Wanted', cost: 1775 }];
beforeEach(async () => {
  env = await setup();
  session = await linked(env);
  fetcher.mockReset().mockImplementation((url: string) =>
    Response.json({
      id: url.includes('discord.com') ? '567890123456789012' : crypto.randomUUID(),
    }),
  );
  vi.stubGlobal('fetch', fetcher);
});
afterEach(() => vi.unstubAllGlobals());
const send = (channel: 'mail' | 'discord' = 'discord', left = 3600) =>
  post(env, UID, session, found, left, new Budget(), 'fixture-rotation', channel);
const release = () => env.DB.prepare('UPDATE deliveries SET lease=0').run();

test('email and Discord reserve independent deliveries for the same wishlist match', async () => {
  expect(await send('mail')).toBe(true);
  expect(await send()).toBe(true);
  expect(await send('mail')).toBe(true);
  expect(await send()).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(2);
  const call = fetcher.mock.calls.find(([url]) => url.includes('discord.com'));
  const body = JSON.parse(call?.[1].body);
  expect(body.content).toContain('Wanted');
  expect(body.allowed_mentions).toEqual({ parse: [] });
  expect(body.enforce_nonce).toBe(true);
  expect(JSON.stringify(body)).not.toContain(session.jar.ssid);
  expect(JSON.stringify(body)).not.toContain(session.puuid);
});

test('Discord retries reuse an immutable payload and nonce', async () => {
  fetcher.mockResolvedValue(new Response(null, { status: 503 }));
  expect(await send()).toBe(false);
  await release();
  fetcher.mockResolvedValue(Response.json({ id: '567890123456789012' }));
  expect(await send('discord', 2000)).toBe(true);
  expect(fetcher.mock.calls[1]?.[1].body).toBe(fetcher.mock.calls[0]?.[1].body);
});

test('provider cooldowns prevent premature retries while email continues to work', async () => {
  fetcher.mockImplementation((url: string) =>
    url.includes('discord.com')
      ? Response.json({ retry_after: 1800, global: true }, { status: 429 })
      : Response.json({ id: crypto.randomUUID() }),
  );
  expect(await send()).toBe(false);
  await release();
  expect(await send()).toBe(false);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(await send('mail')).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

test('a blocked private destination pauses Discord without disabling email', async () => {
  fetcher.mockResolvedValue(new Response(null, { status: 403 }));
  await send();
  const s = (await readSession(env, UID))?.session;
  expect(s?.discord?.ok).toBe(false);
  expect(s?.discord?.said).toBe('blocked');
  expect(s?.mail?.ok).toBe(true);
});

test('a queued Discord retry cannot send after /stop', async () => {
  fetcher.mockResolvedValue(new Response(null, { status: 503 }));
  await send();
  await command(env, 'stop');
  await release();
  await send();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test('a failing Discord delivery stops after four external attempts', async () => {
  fetcher.mockResolvedValue(new Response(null, { status: 503 }));
  for (let n = 0; n < 6; n++) {
    await release();
    await send();
  }
  expect(fetcher).toHaveBeenCalledTimes(4);
  expect(await env.DB.prepare('SELECT state FROM deliveries').first()).toEqual({ state: 2 });
});

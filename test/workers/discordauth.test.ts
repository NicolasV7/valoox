import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { route } from '../../src/router.ts';
import type { Env } from '../../src/types.ts';
import { createSession, forget, readSession } from '../../src/vault/session.ts';
import { markOf } from '../../src/vault/who.ts';
import { save } from '../../src/vault/wishlist.ts';
import { action, command, event, setup, signed, watching } from './discord.ts';
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

test('Discord PING verifies signatures without any cookie or browser origin bypass', async () => {
  const ping = { ...event(), type: 1 };
  expect(await (await route(await signed(ping), env)).json()).toEqual({ type: 1 });
  const forged = await signed(ping);
  forged.headers.set('X-Signature-Ed25519', '0'.repeat(128));
  expect((await route(forged, env)).status).toBe(401);
  expect((await route(await signed(ping, Math.floor(Date.now() / 1000) - 301), env)).status).toBe(
    401,
  );
  expect((await route(await signed({ ...ping, application_id: 'another-app' }), env)).status).toBe(
    401,
  );
  expect(fetcher).not.toHaveBeenCalled();
});

test('public-channel commands cannot link an account', async () => {
  const link = await action(env, 'start');
  const guild = {
    ...event('connect', link.code as string),
    context: 0,
    guild_id: '678901234567890123',
  };
  await route(await signed(guild), env);
  expect(fetcher).not.toHaveBeenCalled();
  expect((await readSession(env, UID))?.session.discord).toBeUndefined();
});

test('a replayed stop event cannot disable a later connection', async () => {
  const stop = event('stop');
  await route(await signed(stop), env);
  const link = await action(env, 'start');
  await command(env, 'connect', link.code as string);
  await route(await signed(stop), env);
  expect((await readSession(env, UID))?.session.discord?.ok).toBe(true);
});

async function deferred() {
  let finish: (value: Response) => void = () => undefined;
  fetcher.mockImplementation(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  const link = await action(env, 'start');
  let task: Promise<unknown> = Promise.resolve();
  const reply = await route(await signed(event('connect', link.code as string)), env, {
    waitUntil(work) {
      task = work;
    },
  });
  expect(reply.status).toBe(200);
  for (let n = 0; n < 40 && !fetcher.mock.calls.length; n++)
    await new Promise((resolve) => setTimeout(resolve, 1));
  expect(fetcher).toHaveBeenCalledTimes(1);
  return {
    release: async () => {
      finish(Response.json({ id: '567890123456789012' }));
      await task;
    },
  };
}

test('logout during a slow DM test cannot resurrect a session or opt-in', async () => {
  const pending = await deferred();
  await forget(env, UID);
  await pending.release();
  expect(await readSession(env, UID)).toBeNull();
  expect(await env.DB.prepare('SELECT * FROM discord').first()).toBeNull();
});

test('/stop cancels a claimed connection before the DM test completes', async () => {
  const pending = await deferred();
  await command(env, 'stop');
  await pending.release();
  expect((await readSession(env, UID))?.session.discord).toBeUndefined();
  expect((await readSession(env, UID))?.session.mail?.ok).toBe(true);
});

test('concurrent wishlist edits survive a slow Discord connection', async () => {
  const pending = await deferred();
  const held = await readSession(env, UID);
  if (!held) throw new Error('fixture');
  held.session.wishlist = [{ id: 'new-level', name: 'New favourite' }];
  await save(
    env,
    UID,
    (await markOf(env, held.session.puuid)) as string,
    held.wishlistVer as number,
    held.session.wishlist,
  );
  await pending.release();
  expect((await readSession(env, UID))?.session.wishlist).toEqual(held.session.wishlist);
  expect((await readSession(env, UID))?.session.discord?.ok).toBe(true);
});

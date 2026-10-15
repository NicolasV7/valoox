import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { route } from '../../src/router.ts';
import { setDiscord } from '../../src/routes/discord.ts';
import type { Env } from '../../src/types.ts';
import { createSession, readSession } from '../../src/vault/session.ts';
import { discord as en } from '../../web/i18n/en/discord.ts';
import { discord as es } from '../../web/i18n/es/discord.ts';
import { event, linked, setup, signed, watching } from './discord.ts';
import { UID } from './fixtures.ts';

let env: Env;
const fetcher = vi.fn();
beforeEach(async () => {
  env = { ...(await setup()), EMAIL_ALERTS: 'false' };
  await createSession(env, UID, watching());
  fetcher.mockReset().mockResolvedValue(Response.json({ id: '567890123456789012' }));
  vi.stubGlobal('fetch', fetcher);
});
afterEach(() => vi.unstubAllGlobals());

async function start(lang: unknown) {
  return setDiscord({
    env,
    uid: UID,
    headers: new Headers(),
    req: new Request('https://drop.valoox.store/api/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', lang }),
    }),
  });
}

test.each(['en', 'es'] as const)(
  'a %s valoox connection ignores the opposite Discord language',
  async (lang) => {
    const copy = lang === 'es' ? es : en;
    const link = await start(lang);
    const connect = {
      ...event('connect', link.code as string),
      locale: lang === 'en' ? 'es-ES' : 'en-US',
    };
    const result = (await (await route(await signed(connect), env)).json()) as {
      data: { embeds: Array<{ title: string }> };
    };
    expect(result.data.embeds[0]?.title).toBe(copy.botReceivedTitle);
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body).embeds[0].title).toBe(copy.botTestTitle);
    expect((await readSession(env, UID))?.session.discord?.lang).toBe(lang);
    for (const name of ['status', 'stop']) {
      const response = (await (
        await route(await signed({ ...event(name), locale: connect.locale }), env)
      ).json()) as { data: { embeds: Array<{ title: string }> } };
      expect(response.data.embeds[0]?.title).toBe(
        name === 'stop' ? copy.botStoppedTitle : copy.botActiveTitle,
      );
    }
  },
);

test('an expired pending code still uses the language selected on valoox', async () => {
  const link = await start('es');
  await env.DB.prepare('UPDATE links SET expires=0 WHERE uid=?').bind(UID).run();
  const result = (await (
    await route(await signed(event('connect', link.code as string)), env)
  ).json()) as { data: { embeds: Array<{ title: string }> } };
  expect(result.data.embeds[0]?.title).toBe(es.botInvalidTitle);
  expect(fetcher).not.toHaveBeenCalled();
});

test('an unsupported app language falls back to English without trusting Discord locale', async () => {
  const link = await start({ language: 'es' });
  const result = (await (
    await route(await signed({ ...event('connect', link.code as string), locale: 'es-ES' }), env)
  ).json()) as { data: { embeds: Array<{ title: string }> } };
  expect(result.data.embeds[0]?.title).toBe(en.botReceivedTitle);
});

test('an existing link can adopt the valoox language without generating a code or new consent', async () => {
  const previous = await linked(env);
  const context = {
    env,
    uid: UID,
    headers: new Headers(),
    req: new Request('https://drop.valoox.store/api/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'language', lang: 'es' }),
    }),
  };
  expect(await setDiscord(context)).toEqual({ ok: true });
  const next = (await readSession(env, UID))?.session.discord;
  expect(next).toMatchObject({ lang: 'es', gen: previous.discord?.gen, ok: true });
  expect(await env.DB.prepare('SELECT * FROM links').first()).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
});

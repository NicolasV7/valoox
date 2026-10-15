import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { preferences } from '../../src/discord/prefs.ts';
import { avatar } from '../../src/routes/avatar.ts';
import * as consent from '../../src/storage/discord.ts';
import type { Env, Session } from '../../src/types.ts';
import { fingerprint } from '../../src/vault/keys.ts';
import { forget } from '../../src/vault/session.ts';
import { linked, setup, USER } from './discord.ts';
import { UID } from './fixtures.ts';

let env: Env;
let value: Session;
let url: string;
const fetcher = vi.fn();
const bytes = new Uint8Array([137, 80, 78, 71]);
beforeEach(async () => {
  env = await setup();
  value = await linked(env);
  const data = await preferences(env, UID, value);
  url = 'https://drop.valoox.store' + data.discord?.avatar;
  fetcher
    .mockReset()
    .mockImplementation(async (input: string) =>
      input.startsWith('https://discord.com/')
        ? Response.json({ id: USER, avatar: 'a'.repeat(32) })
        : new Response(bytes, { headers: { 'Content-Type': 'image/png' } }),
    );
  vi.stubGlobal('fetch', fetcher);
});
afterEach(() => vi.unstubAllGlobals());
const image = () => avatar({ env, uid: UID, headers: new Headers(), req: new Request(url) });

test('the profile picture is private and its URL exposes no Discord identity', async () => {
  expect(url).not.toContain(USER);
  const response = await image();
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600');
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  await image();
  expect(
    fetcher.mock.calls.filter(([input]) => String(input).startsWith('https://discord.com/')),
  ).toHaveLength(1);
});

test('a stale image handle or logged-out browser cannot fetch Discord art', async () => {
  const original = url;
  url += 'wrong';
  expect((await image()).status).toBe(404);
  url = original;
  await forget(env, UID);
  expect((await image()).status).toBe(404);
  expect(fetcher).not.toHaveBeenCalled();
});

test('a default profile uses only Discord’s pinned default image path', async () => {
  fetcher.mockImplementation(async (input: string) =>
    input.startsWith('https://discord.com/')
      ? Response.json({ id: USER, avatar: null })
      : new Response(bytes, { headers: { 'Content-Type': 'image/png' } }),
  );
  expect((await image()).status).toBe(200);
  expect(
    fetcher.mock.calls.some(([input]) =>
      /^https:\/\/cdn.discordapp.com\/embed\/avatars\/[0-5]\.png$/.test(String(input)),
    ),
  ).toBe(true);
});

test('an unexpected profile identity or oversized image fails without exposing a response', async () => {
  fetcher.mockResolvedValue(Response.json({ id: '999999999999999999', avatar: 'a'.repeat(32) }));
  expect((await image()).status).toBe(404);
  fetcher.mockImplementation(async (input: string) =>
    input.startsWith('https://discord.com/')
      ? Response.json({ id: USER, avatar: 'a'.repeat(32) })
      : new Response(new Uint8Array(131073), { headers: { 'Content-Type': 'image/png' } }),
  );
  expect((await image()).status).toBe(404);
});

test('a Discord stop during the image fetch prevents a late image response', async () => {
  let finish: (() => void) | undefined;
  fetcher.mockImplementation(async (input: string) => {
    if (input.startsWith('https://discord.com/'))
      return Response.json({ id: USER, avatar: 'a'.repeat(32) });
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    return new Response(bytes, { headers: { 'Content-Type': 'image/png' } });
  });
  const pending = image();
  for (let n = 0; n < 100 && !finish; n++) await new Promise((resolve) => setTimeout(resolve, 1));
  if (!finish) throw new Error('fixture did not reach the image');
  await consent.stop(env, await fingerprint(env, 'discord-user', USER));
  finish();
  expect((await pending).status).toBe(404);
});

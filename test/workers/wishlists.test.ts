import { beforeEach, expect, test } from 'vitest';
import { writeWishlist } from '../../src/routes/wishlist.ts';
import type { Env, Starred } from '../../src/types.ts';
import * as repo from '../../src/vault/repo.ts';
import { createSession, forget, readSession, saveSession } from '../../src/vault/session.ts';
import { OTHER, session, UID } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

let env: Env;
const item = (n: number): Starred => ({
  id: '00000000-0000-4000-8000-' + String(n).padStart(12, '0'),
  name: 'Wanted ' + n,
});
beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY };
});
async function devices() {
  await createSession(env, UID, session());
  await createSession(env, OTHER, session());
}
const edit = (uid: string, wishlist: Starred[], base?: Array<Starred | string>) =>
  writeWishlist({
    env,
    uid,
    headers: new Headers(),
    req: new Request('https://drop.valoox.store/api/prefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlist, base }),
    }),
  });

test('an existing list follows the same verified account to another browser', async () => {
  await createSession(env, UID, { ...session(), wishlist: [item(1)] });
  await createSession(env, OTHER, session());
  expect((await readSession(env, OTHER))?.session.wishlist).toEqual([item(1)]);
});

test('legacy lists merge once and keep the original metadata', async () => {
  const first = { ...item(1), at: 1234 };
  await createSession(env, UID, { ...session(), wishlist: [first] });
  await createSession(env, OTHER, { ...session(), wishlist: [item(2)] });
  const got = (await readSession(env, OTHER))?.session.wishlist ?? [];
  expect(got).toContainEqual(first);
  expect(got).toContainEqual(item(2));
  await edit(UID, []);
  expect((await readSession(env, OTHER))?.session.wishlist).toEqual([]);
});

test('two devices adding from the same old snapshot keep both edits', async () => {
  await devices();
  await Promise.all([edit(UID, [item(1)], []), edit(OTHER, [item(2)], [])]);
  expect((await readSession(env, UID))?.session.wishlist?.map((w) => w.id).sort()).toEqual(
    [item(1).id, item(2).id].sort(),
  );
});

test('a concurrent removal cannot erase a different device’s new favourite', async () => {
  await devices();
  const initial = [item(1), item(2)];
  await edit(UID, initial);
  await Promise.all([edit(UID, [item(2)], initial), edit(OTHER, [...initial, item(3)], initial)]);
  expect((await readSession(env, UID))?.session.wishlist?.map((w) => w.id).sort()).toEqual(
    [item(2).id, item(3).id].sort(),
  );
});

test('compact browser snapshots merge a removal with a different device’s addition', async () => {
  await devices();
  await edit(UID, [item(1)]);
  const base = [item(1).id];
  await Promise.all([edit(UID, [], base), edit(OTHER, [item(1), item(2)], base)]);
  expect((await readSession(env, UID))?.session.wishlist?.map((w) => w.id)).toEqual([item(2).id]);
});

test('shared edits activate only browsers with an opted-in notification destination', async () => {
  await createSession(env, UID, session());
  await createSession(env, OTHER, {
    ...session(),
    mail: { to: 'reader@example.invalid', ok: true },
  });
  await edit(UID, [item(1)], []);
  const rows = (
    await env.DB.prepare('SELECT uid,alerts FROM s ORDER BY uid').all<{
      uid: string;
      alerts: number;
    }>()
  ).results;
  expect(rows.find((row) => row.uid === UID)?.alerts).toBe(0);
  expect(rows.find((row) => row.uid === OTHER)?.alerts).toBe(1);
});

test('an older session writer cannot overwrite the shared list or its alert flag', async () => {
  await createSession(env, UID, { ...session(), mail: { to: 'reader@example.invalid', ok: true } });
  await createSession(env, OTHER, session());
  const held = await readSession(env, UID);
  if (!held) throw new Error('fixture');
  await edit(OTHER, [item(1)], []);
  expect(await saveSession(env, UID, held.session, held.ver)).toBe(true);
  expect((await readSession(env, UID))?.session.wishlist).toEqual(
    expect.arrayContaining([{ ...item(1), at: expect.any(Number) }]),
  );
  expect(
    (await env.DB.prepare('SELECT alerts FROM s WHERE uid=?').bind(UID).first<{ alerts: number }>())
      ?.alerts,
  ).toBe(1);
});

test('shared favourites never cross Riot accounts or trust an altered account index', async () => {
  await createSession(env, UID, { ...session(), wishlist: [item(1)] });
  await createSession(env, OTHER, {
    ...session(),
    puuid: crypto.randomUUID(),
    wishlist: [item(2)],
  });
  await readSession(env, OTHER);
  const other = await repo.get(env, OTHER);
  await env.DB.prepare('UPDATE s SET acct=? WHERE uid=?').bind(other?.acct, UID).run();
  expect((await readSession(env, UID))?.session.wishlist).toEqual([item(1)]);
  expect((await readSession(env, OTHER))?.session.wishlist).toEqual([item(2)]);
});

test('the list remains for another device and disappears when the last session ends', async () => {
  await devices();
  await edit(UID, [item(1)], []);
  await forget(env, UID);
  expect((await readSession(env, OTHER))?.session.wishlist).toHaveLength(1);
  await forget(env, OTHER);
  expect(await env.DB.prepare('SELECT * FROM wishlists').first()).toBeNull();
});

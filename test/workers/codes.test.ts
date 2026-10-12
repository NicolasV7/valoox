import { beforeEach, expect, test } from 'vitest';
import * as otp from '../../src/alerts/otp.ts';
import { hold } from '../../src/alerts/wait.ts';
import * as codes from '../../src/storage/codes.ts';
import type { Env } from '../../src/types.ts';
import * as repo from '../../src/vault/repo.ts';
import { createSession, encoded, readSession, saveSession } from '../../src/vault/session.ts';
import { OTHER, session, UID } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

let env: Env;
const TO = 'person@example.invalid';
beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY };
});
async function issue(uid = UID, to = TO) {
  await createSession(env, uid, { ...session(), wishlist: [{ id: 'level', name: 'Wanted' }] });
  const held = await readSession(env, uid);
  if (!held) throw new Error('fixture');
  const minted = await otp.mint(env, uid, to);
  held.session.mail = { to, ok: false, gen: minted.held.id };
  expect(
    await codes.reserve(env, uid, held.ver, await encoded(env, uid, held.session), minted.held),
  ).toBe(true);
  return minted.code;
}
test('a burst spends exactly five guesses, with no KV consistency window', async () => {
  const code = await issue();
  const wrong = code === '000000' ? '000001' : '000000';
  const answers = await Promise.all(
    Array.from({ length: 25 }, () => otp.check(env, UID, TO, wrong)),
  );
  expect(answers.filter((v) => v === 'wrong')).toHaveLength(4);
  expect((await codes.read(env, UID))?.attempts).toBe(5);
  expect(await otp.check(env, UID, TO, code)).toBe('spent');
  expect((await readSession(env, UID))?.session.mail?.ok).toBe(false);
});
test('one correct response consumes the code and enables the saved wishlist atomically', async () => {
  const code = await issue();
  const answers = await Promise.all(
    Array.from({ length: 10 }, () => otp.check(env, UID, TO, code)),
  );
  expect(answers.filter((v) => v === 'ok')).toHaveLength(1);
  expect((await codes.read(env, UID))?.used).toBe(1);
  expect((await readSession(env, UID))?.session.mail?.ok).toBe(true);
  expect((await repo.listAlerting(env)).map((r) => r.uid)).toEqual([UID]);
  expect(await otp.check(env, UID, TO, code)).toBe('gone');
});
test('the fifth guess may succeed, but the sixth cannot', async () => {
  const code = await issue();
  const wrong = code === '000000' ? '000001' : '000000';
  for (let i = 0; i < 4; i++) expect(await otp.check(env, UID, TO, wrong)).toBe('wrong');
  expect(await otp.check(env, UID, TO, code)).toBe('ok');
  expect(await otp.check(env, UID, TO, code)).toBe('gone');
});
test('a code for a replaced email generation cannot verify the current address', async () => {
  const code = await issue();
  const held = await readSession(env, UID);
  if (!held) throw new Error('fixture');
  held.session.mail = { to: 'other@example.invalid', ok: false, gen: crypto.randomUUID() };
  await saveSession(env, UID, held.session, held.ver);
  expect(await otp.check(env, UID, TO, code)).toBe('gone');
  expect((await readSession(env, UID))?.session.mail?.ok).toBe(false);
});
test('a lost reservation CAS creates neither a code nor a send mapping', async () => {
  await createSession(env, UID, session());
  const held = await readSession(env, UID);
  if (!held) throw new Error('fixture');
  const minted = await otp.mint(env, UID, TO);
  await saveSession(env, UID, held.session, held.ver);
  held.session.mail = { to: TO, ok: false, gen: minted.held.id };
  expect(
    await codes.reserve(env, UID, held.ver, await encoded(env, UID, held.session), minted.held),
  ).toBe(false);
  expect(await codes.read(env, UID)).toBeNull();
  expect(await env.DB.prepare('SELECT id FROM messages').first()).toBeNull();
});
test('cooldown reservations admit only one concurrent send to a recipient', async () => {
  const waits = await Promise.all([
    hold(env, UID, TO, 'account-a'),
    hold(env, OTHER, TO, 'account-b'),
  ]);
  expect(waits.filter((v) => v === 0)).toHaveLength(1);
  expect(
    (await env.DB.prepare('SELECT key FROM limits').all()).results.some((r) =>
      String(r.key).includes(TO),
    ),
  ).toBe(false);
});
test('expired codes have no pending state and never verify', async () => {
  const code = await issue();
  await env.DB.prepare('UPDATE otp SET expires=0 WHERE uid=?').bind(UID).run();
  expect(await otp.pending(env, UID)).toBeNull();
  expect(await otp.check(env, UID, TO, code)).toBe('gone');
});

test('an old code cannot undo a provider rejection for its current generation', async () => {
  const code = await issue();
  const held = await readSession(env, UID);
  if (!held?.session.mail) throw new Error('fixture');
  held.session.mail.said = 'email.bounced';
  await saveSession(env, UID, held.session, held.ver);
  expect(await otp.check(env, UID, TO, code)).toBe('gone');
  expect((await readSession(env, UID))?.session.mail?.ok).toBe(false);
  expect(await repo.listAlerting(env)).toEqual([]);
});

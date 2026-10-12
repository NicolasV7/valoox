import * as codes from '../storage/codes.ts';
import { now } from '../storage/rows.ts';
import type { Env } from '../types.ts';
import { fingerprint } from '../vault/keys.ts';
import { refused } from '../vault/mail.ts';
import { prepared, readSession } from '../vault/session.ts';

export const LIFE = { minutes: 10, tries: 5, cooldown: 60 };
export type Verdict = 'ok' | 'wrong' | 'gone' | 'spent' | 'conflict';
export const recipient = (env: Env, to: string) => fingerprint(env, 'recipient', to.toLowerCase());
const digest = (env: Env, uid: string, gen: string, to: string, code: string) =>
  fingerprint(env, 'otp', JSON.stringify([uid, gen, to.toLowerCase(), code]));

function six(): string {
  // Rejection sampling removes the bias introduced by a bare modulo.
  let n: number;
  do {
    n = crypto.getRandomValues(new Uint32Array(1))[0] as number;
  } while (n >= 4_294_000_000);
  return String(n % 1_000_000).padStart(6, '0');
}
export async function mint(env: Env, uid: string, to: string) {
  const code = six();
  const id = crypto.randomUUID();
  const expires = now() + LIFE.minutes * 60;
  return {
    code,
    until: expires * 1000,
    held: {
      id,
      expires,
      recipient: await recipient(env, to),
      hash: await digest(env, uid, id, to, code),
    },
  };
}

export async function check(env: Env, uid: string, to: string, code: string): Promise<Verdict> {
  for (let retry = 0; retry < 3; retry++) {
    const held = await readSession(env, uid);
    const mail = held?.session.mail;
    if (!held || !mail?.gen || mail.to !== to) return 'gone';
    if (refused(mail.said)) return 'gone';
    const claim = crypto.randomUUID();
    held.session.mail = { ...mail, ok: true };
    const verified = await prepared(env, uid, held.session, held.ver, {
      sql: 'EXISTS(SELECT 1 FROM otp WHERE uid=? AND id=? AND claim=?)',
      values: [uid, mail.gen, claim],
    });
    const verdict = await codes.attempt(
      env,
      uid,
      mail.gen,
      await recipient(env, to),
      await digest(env, uid, mail.gen, to, code),
      held.ver,
      verified,
      claim,
    );
    if (verdict !== 'conflict') return verdict;
  }
  return 'conflict';
}
export async function pending(
  env: Env,
  uid: string,
): Promise<{ until: number; tries: number } | null> {
  const code = await codes.read(env, uid);
  if (!code || code.expires <= now() || code.used || code.attempts >= LIFE.tries) return null;
  return { until: code.expires * 1000, tries: LIFE.tries - code.attempts };
}
export async function left(env: Env, uid: string): Promise<number | null> {
  return (await pending(env, uid))?.tries ?? null;
}

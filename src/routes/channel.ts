import { tzOf } from '../alerts/mail/clock.ts';
import { langOf } from '../alerts/mail/words.ts';
import { check, left } from '../alerts/otp.ts';
import { requireEmail } from '../app/features.ts';
import { readJson } from '../lib/body.ts';
import type { Body, Ctx } from '../lib/json.ts';
import { RESEED } from '../lib/json.ts';
import { gotThere, looksLikeAddress, refused } from '../vault/mail.ts';
import { readSession } from '../vault/session.ts';
import { mail } from './send.ts';

export async function setChannel({ env, uid, req }: Ctx): Promise<Body> {
  requireEmail(env);
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  const body = await readJson(req, 4096);
  const to = typeof body.to === 'string' ? body.to.trim() : '';
  if (!looksLikeAddress(to)) return { error: 'address' };
  const was = held.session.mail;
  if (was?.to === to && refused(was.said)) return { error: 'bounced', said: was.said };
  if (was?.to === to && gotThere(was.said) && (await left(env, uid)) !== null) {
    return { error: 'opened', said: was.said };
  }
  return mail(env, uid, held, to, langOf(body.lang), new URL(req.url).origin, tzOf(body.tz));
}
export async function resend({ env, uid, req }: Ctx): Promise<Body> {
  requireEmail(env);
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  const was = held.session.mail;
  if (!was?.to) return { error: 'address' };
  if (refused(was.said)) return { error: 'bounced', said: was.said };
  if (gotThere(was.said) && (await left(env, uid)) !== null)
    return { error: 'opened', said: was.said };
  const body = await readJson(req, 4096);
  return mail(
    env,
    uid,
    held,
    was.to,
    langOf(body.lang ?? was.lang),
    new URL(req.url).origin,
    tzOf(body.tz) ?? was.tz,
  );
}
export async function verify({ env, uid, req }: Ctx): Promise<Body> {
  requireEmail(env);
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  const to = held.session.mail?.to;
  if (!to) return { error: 'address' };
  const body = await readJson(req, 4096);
  const code = typeof body.code === 'string' && /^\d{6}$/.test(body.code) ? body.code : '';
  const verdict = await check(env, uid, to, code);
  return verdict === 'ok' ? { ok: true, to } : { error: verdict, left: await left(env, uid) };
}

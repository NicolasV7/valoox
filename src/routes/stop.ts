import { readJson } from '../lib/body.ts';
import type { Body, Ctx } from '../lib/json.ts';
import * as stops from '../storage/stops.ts';
import type { Env } from '../types.ts';
import { mailGroup } from '../vault/removal.ts';
import { prepared, readSession, saveSession } from '../vault/session.ts';
import { readStop } from '../vault/stop.ts';

export async function stopMail({ env, uid, req }: Ctx): Promise<Body> {
  const body = await readJson(req, 4096);
  if (body.t === undefined || body.t === '') return off(env, uid);
  const token = await readStop(env, body.t);
  if (!token) return { ok: false, error: 'bad link' };
  for (let retry = 0; retry < 3; retry++) {
    const held = await readSession(env, token.uid);
    if (!held || held.session.mail?.gen !== token.gen) return { ok: false, error: 'used' };
    if (!(await stops.available(env, token))) return { ok: false, error: 'used' };
    if (body.answer !== 'yes' && body.answer !== 'no') return { ok: true, live: true };
    const was = held.session.mail.to;
    const claim = crypto.randomUUID();
    const yes = body.answer === 'yes';
    const group = yes ? await mailGroup(env, token.uid, held) : [];
    const expected = group.map(([id, value]): [string, number] => [id, value.ver]);
    const updates = await Promise.all(
      group.map(async ([id, value]) => {
        value.session.mail = undefined;
        return prepared(env, id, value.session, value.ver, {
          sql: 'EXISTS(SELECT 1 FROM stops WHERE id=? AND claim=?)',
          values: [token.id, claim],
        });
      }),
    );
    if (await stops.consume(env, token, held.ver, claim, updates, expected)) {
      return yes
        ? { ok: true, was, kept: held.session.wishlist?.length ?? 0 }
        : { ok: true, kept: true };
    }
  }
  return { ok: false, error: 'conflict' };
}
async function off(env: Env, uid: string): Promise<Body> {
  for (let retry = 0; retry < 3; retry++) {
    const held = await readSession(env, uid);
    if (!held) return { ok: true, was: null };
    const was = held.session.mail?.to ?? null;
    held.session.mail = undefined;
    if (await saveSession(env, uid, held.session, held.ver)) {
      return { ok: true, was, kept: held.session.wishlist?.length ?? 0 };
    }
  }
  return { ok: false, error: 'conflict' };
}
export const stopLink = (origin: string, token: string): string =>
  origin + '/stop?t=' + encodeURIComponent(token);

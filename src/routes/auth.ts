import * as cookie from '../app/cookie.ts';
import type { Body, Ctx } from '../lib/json.ts';
import * as qr from '../vault/qr.ts';
import { forget } from '../vault/session.ts';

export const startScan = ({ env, uid, req }: Ctx): Promise<Body> =>
  qr.start(env, uid, cookie.legacy(req) ?? undefined) as Promise<Body>;

export async function pollScan({ env, uid, headers }: Ctx): Promise<Body> {
  const result = await qr.poll(env, uid);
  if (result.status !== 'ok') return result;
  headers.delete('Set-Cookie');
  cookie.set(headers, result.secret);
  headers.append('Set-Cookie', 'uid=; Max-Age=0; Path=/api; Secure; HttpOnly; SameSite=Strict');
  return { status: 'ok', shard: result.shard };
}

/** Deletes our access; it does not revoke the separate session at Riot. */
export async function logout({ env, uid, headers }: Ctx): Promise<Body> {
  await forget(env, uid);
  cookie.clear(headers);
  return { ok: true };
}

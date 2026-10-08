import * as cookie from '../app/cookie.ts';
import type { Body, Ctx } from '../lib/json.ts';
import * as qr from '../vault/qr.ts';
import { forget } from '../vault/session.ts';

/** Opens a scan and returns the url the QR encodes. */
export const startScan = ({ env, uid }: Ctx): Promise<Body> => qr.start(env, uid) as Promise<Body>;

/** Polls it: waiting until the phone approves, then ok. */
export const pollScan = ({ env, uid }: Ctx): Promise<Body> => qr.poll(env, uid) as Promise<Body>;

/**
 * Deletes our row and clears the cookie.
 *
 * What it does not do is revoke anything at Riot. The session you approved
 * keeps existing on their side until it expires on its own, and the shorter
 * word would be a claim about a system we do not control.
 */
export async function logout({ env, uid, headers }: Ctx): Promise<Body> {
  await forget(env, uid);
  cookie.clear(headers);
  return { ok: true };
}

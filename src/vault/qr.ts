import type { Env, Jar } from '../types.ts';
import { rf } from './http.ts';
import { identify, reauth } from './auth.ts';
import { clearCache, clearScan, createSession, readScan, saveSession, writeScan } from './session.ts';

// Riot Mobile QR sign-in: the only auth path this service has.
//
// No password is ever handled. Riot's own app authenticates the user — password,
// 2FA and any captcha all happen inside Riot's app, on Riot's infrastructure.
// The username/password endpoint is gated behind hCaptcha Enterprise with
// per-session rqdata and is not automatable at any price.
//
// Every call below carries the jar accumulated so far. Skipping that is the #1
// cause of phantom "blocked" errors: the poll returns invalid_request with no jar
// and a clean 200 with one.

export async function start(env: Env, uid: string): Promise<{ url: string }> {
  const jar: Jar = {};
  await rf('https://auth.riotgames.com/.well-known/openid-configuration', { jar });

  const res = await rf('https://authenticate.riotgames.com/api/v1/login', {
    jar,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: 'riot-client',
      language: 'en_GB',
      platform: 'windows',
      qrcode: {},
      remember: true,
      type: 'auth',
    }),
  });

  // The response carries an hCaptcha block. It is never solved on this path.
  const d = (await res.json()) as { suuid?: string; cluster?: string; timestamp?: string };
  if (!d.suuid) throw new Error('qr start failed');

  await writeScan(env, uid, jar);
  return {
    url:
      'https://qrlogin.riotgames.com/riotmobile/?cluster=' +
      d.cluster +
      '&suuid=' +
      d.suuid +
      '&timestamp=' +
      d.timestamp,
  };
}

export type PollResult =
  | { status: 'expired' }
  | { status: 'waiting' }
  | { status: 'ok'; shard: string };

export async function poll(env: Env, uid: string): Promise<PollResult> {
  const jar = await readScan(env, uid);
  if (!jar) return { status: 'expired' };

  const d = (await (
    await rf('https://authenticate.riotgames.com/api/v1/login', { jar })
  ).json()) as { success?: { login_token?: string } };

  const token = d?.success?.login_token;
  if (!token) {
    await writeScan(env, uid, jar); // the poll rotates cookies; keep them
    return { status: 'waiting' };
  }

  const sw = await rf('https://auth.riotgames.com/api/v1/login-token', {
    jar,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authentication_type: null,
      code_verifier: '',
      login_token: token,
      persist_login: true,
    }),
  });
  if (sw.status !== 204) throw new Error('login-token swap returned ' + sw.status);

  await rf('https://auth.riotgames.com/api/v1/authorization', {
    jar,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: 'riot-client',
      nonce: '1',
      redirect_uri: 'http://localhost/redirect',
      response_type: 'token id_token',
      scope: 'openid link ban lol_region account',
    }),
  });
  if (!jar.ssid) throw new Error('no ssid after authorization');

  // Persist the moment the jar is valid. The login_token is single-use, so a
  // failure below would otherwise throw away a sign-in that cannot be repeated.
  // The jar is stored whole. Pruning it would save ~55% of its bytes, which
  // mattered when the design put it in a 4 KB cookie — in D1 it buys nothing,
  // and it is an untested change on the one path that cannot be tested without
  // a real scan. The full jar is the configuration proven to reauth.
  await createSession(env, uid, { jar });

  const t = await reauth(jar);
  if (!t) throw new Error('fresh jar failed to reauth');
  const { puuid, shard } = await identify(t);

  // ver 0 because we just inserted it; nothing else can have touched this uid.
  await saveSession(env, uid, { jar, puuid, shard }, 0);
  await clearScan(env, uid);
  await clearCache(env, uid);
  return { status: 'ok', shard };
}

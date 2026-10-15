import { mint } from '../app/cookie.ts';
import * as scans from '../storage/scans.ts';
import type { Env, Jar, Session } from '../types.ts';
import { adopt } from './adopt.ts';
import { identify, reauth } from './auth.ts';
import { clearCache } from './evict.ts';
import { rf } from './http.ts';
import { browserId } from './keys.ts';
import { CURRENT_KID, open, seal } from './seal.ts';
import { alerting } from './session.ts';
import { markOf } from './who.ts';

interface Scan {
  jar: Jar;
  phase: 'start' | 'poll' | 'authorize' | 'identify';
  legacy?: string;
}
const persist = (env: Env, row: scans.ScanRow, scan: Scan, release = true) =>
  seal(env, row.uid, CURRENT_KID, scan, 'scan:2').then((blob) =>
    scans.save(env, row, blob, release),
  );

export async function start(env: Env, uid: string, legacy?: string): Promise<{ url: string }> {
  const scan: Scan = { jar: {}, phase: 'start', legacy };
  const id = crypto.randomUUID();
  await scans.begin(env, uid, id, CURRENT_KID, await seal(env, uid, CURRENT_KID, scan, 'scan:2'));
  const row = await scans.claim(env, uid);
  if (!row || row === 'busy' || row.id !== id) throw new Error('scan replaced');
  try {
    await rf('https://auth.riotgames.com/.well-known/openid-configuration', { jar: scan.jar });
    const res = await rf('https://authenticate.riotgames.com/api/v1/login', {
      jar: scan.jar,
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
    const d = (await res.json()) as { suuid?: string; cluster?: string; timestamp?: string };
    if (!d.suuid || typeof d.suuid !== 'string') throw new Error('qr start failed');
    scan.phase = 'poll';
    if (!(await persist(env, row, scan))) throw new Error('scan cancelled');
    const params = new URLSearchParams({
      cluster: String(d.cluster ?? ''),
      suuid: d.suuid,
      timestamp: String(d.timestamp ?? ''),
    });
    return { url: 'https://qrlogin.riotgames.com/riotmobile/?' + params };
  } catch (e) {
    await persist(env, row, scan);
    throw e;
  }
}
export type PollResult =
  | { status: 'expired' | 'waiting' }
  | { status: 'ok'; shard: string; secret: string };

export async function poll(env: Env, uid: string): Promise<PollResult> {
  const row = await scans.claim(env, uid);
  if (!row) return { status: 'expired' };
  if (row === 'busy') return { status: 'waiting' };
  let scan: Scan;
  try {
    scan = await open<Scan>(env, uid, row.kid, row.blob, 'scan:2');
  } catch {
    await scans.cancel(env, uid, row.id);
    return { status: 'expired' };
  }
  let completed = false;
  try {
    const jar = scan.jar;
    if (scan.phase === 'start') return { status: 'waiting' };
    if (scan.phase === 'poll') {
      const d = (await (
        await rf('https://authenticate.riotgames.com/api/v1/login', { jar })
      ).json()) as { success?: { login_token?: string } };
      const token = d?.success?.login_token;
      if (!token) return { status: 'waiting' };
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
      if (sw.status !== 204) throw new Error('login-token swap failed');
      scan.phase = 'authorize';
      if (!(await persist(env, row, scan, false))) return { status: 'expired' };
    }
    if (scan.phase === 'authorize') {
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
      if (!jar.ssid) throw new Error('authorization did not set a session');
      scan.phase = 'identify';
      if (!(await persist(env, row, scan, false))) return { status: 'expired' };
    }
    const t = await reauth(jar);
    if (!t) throw new Error('fresh jar failed to reauth');
    const who = await identify(t);
    const previous = await adopt(env, uid, who.puuid, scan.legacy);
    const session: Session = { ...previous.preferences, jar, ...who, name: who.name ?? '' };
    const secret = mint();
    const next = await browserId(env, secret);
    const ok = await scans.finish(
      env,
      row,
      {
        uid: next,
        kid: CURRENT_KID,
        blob: await seal(env, next, CURRENT_KID, session),
        acct: await markOf(env, who.puuid),
        alerts: alerting(session),
        discordGen: session.discord?.ok ? session.discord.gen : undefined,
      },
      previous.legacy,
    );
    if (!ok) return { status: 'expired' };
    completed = true;
    await clearCache(env, uid).catch(() => undefined);
    return { status: 'ok', shard: who.shard, secret };
  } finally {
    if (!completed) await persist(env, row, scan);
  }
}

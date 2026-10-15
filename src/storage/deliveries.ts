import type { Env } from '../types.ts';
import { now } from './rows.ts';

type Claim = { state: 'claimed'; owner: string; blob: string } | { state: 'done' | 'busy' };
export async function claim(env: Env, key: string, blob: string): Promise<Claim> {
  const t = now();
  const owner = crypto.randomUUID();
  const row = await env.DB.prepare(
    'INSERT INTO deliveries(key,state,lease,expires,owner,blob) VALUES (?,1,?,?,?,?) ' +
      'ON CONFLICT(key) DO UPDATE SET state=1,lease=excluded.lease,owner=excluded.owner ' +
      'WHERE deliveries.state IN (0,1) AND deliveries.lease<=? RETURNING owner,blob',
  )
    .bind(key, t + 900, t + 172800, owner, blob, t)
    .first<{ owner: string; blob: string }>();
  if (row) return { state: 'claimed', ...row };
  const current = await env.DB.prepare('SELECT state FROM deliveries WHERE key=?')
    .bind(key)
    .first<{ state: number }>();
  return { state: current?.state === 2 ? 'done' : 'busy' };
}
export async function finish(
  env: Env,
  key: string,
  owner: string,
  ok: boolean,
  wait = 840,
): Promise<void> {
  await env.DB.prepare('UPDATE deliveries SET state=?,lease=? WHERE key=? AND owner=? AND state=1')
    .bind(ok ? 2 : 0, ok ? 0 : now() + Math.max(840, Math.ceil(wait)), key, owner)
    .run();
}

export async function pending(env: Env): Promise<Array<{ key: string; blob: string }>> {
  return (
    await env.DB.prepare(
      'SELECT key,blob FROM deliveries WHERE state IN (0,1) AND lease<=? AND expires>? ORDER BY lease,key LIMIT 6',
    )
      .bind(now(), now())
      .all<{ key: string; blob: string }>()
  ).results;
}

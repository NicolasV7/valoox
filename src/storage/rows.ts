import type { Env } from '../types.ts';

export interface Row {
  uid: string;
  kid: number;
  blob: string;
  ver: number;
  last_used?: number;
  acct?: string | null;
}
export const now = () => Math.floor(Date.now() / 1000);

export function get(env: Env, uid: string): Promise<Row | null> {
  return env.DB.prepare('SELECT uid,kid,blob,ver,last_used,acct FROM s WHERE uid=?')
    .bind(uid)
    .first<Row>();
}

export async function upsert(
  env: Env,
  uid: string,
  kid: number,
  blob: string,
  acct: string | null,
  alerts = false,
): Promise<void> {
  const t = now();
  await env.DB.prepare(
    'INSERT INTO s (uid,kid,blob,created_at,last_used,acct,alerts) VALUES (?,?,?,?,?,?,?) ' +
      'ON CONFLICT(uid) DO UPDATE SET kid=excluded.kid,blob=excluded.blob,ver=s.ver+1,' +
      'last_used=excluded.last_used,acct=excluded.acct,alerts=excluded.alerts',
  )
    .bind(uid, kid, blob, t, t, acct, +alerts)
    .run();
}

export function change(
  env: Env,
  uid: string,
  kid: number,
  blob: string,
  ver: number,
  acct: string | null = null,
  alerts = false,
  guard?: { sql: string; values: (string | number)[] },
): D1PreparedStatement {
  return env.DB.prepare(
    'UPDATE s SET kid=?,blob=?,ver=ver+1,last_used=?,acct=COALESCE(?,acct),alerts=? ' +
      'WHERE uid=? AND ver=?' +
      (guard ? ' AND ' + guard.sql : ''),
  ).bind(kid, blob, now(), acct, +alerts, uid, ver, ...(guard?.values ?? []));
}

export async function update(
  env: Env,
  uid: string,
  kid: number,
  blob: string,
  ver: number,
  acct: string | null = null,
  alerts = false,
): Promise<boolean> {
  return (await change(env, uid, kid, blob, ver, acct, alerts).run()).meta.changes > 0;
}

export async function listAlerting(env: Env, limit = 6, rotation = ''): Promise<Row[]> {
  const r = await env.DB.prepare(
    'SELECT s.uid,s.kid,s.blob,s.ver,s.acct FROM s LEFT JOIN checks c ON s.uid=c.uid ' +
      "WHERE s.alerts=1 AND (?='' OR COALESCE(c.rotation,'')<>?) " +
      'ORDER BY COALESCE(c.checked,0),s.uid LIMIT ?',
  )
    .bind(rotation, rotation, limit)
    .all<Row>();
  return r.results;
}

export async function checked(
  env: Env,
  uid: string,
  rotation: string | null = null,
): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO checks(uid,checked,rotation) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM s WHERE uid=?) ' +
      'ON CONFLICT(uid) DO UPDATE SET checked=excluded.checked,rotation=excluded.rotation',
  )
    .bind(uid, now(), rotation, uid)
    .run();
}

export async function accountRows(env: Env, acct: string, alertsOnly = true): Promise<Row[]> {
  return (
    await env.DB.prepare(
      'SELECT uid,kid,blob,ver,acct FROM s WHERE acct=?' + (alertsOnly ? ' AND alerts=1' : ''),
    )
      .bind(acct)
      .all<Row>()
  ).results;
}

export async function setAlerts(env: Env, uid: string, on: boolean, ver?: number): Promise<void> {
  await env.DB.prepare(
    'UPDATE s SET alerts=? WHERE uid=?' + (ver === undefined ? '' : ' AND ver=?'),
  )
    .bind(...(ver === undefined ? [+on, uid] : [+on, uid, ver]))
    .run();
}

export async function remove(env: Env, uid: string): Promise<void> {
  // A request may still carry the preceding cookie while QR approval rotates
  // it. Follow short-lived revocation aliases, never authentication aliases.
  const targets =
    'WITH RECURSIVE targets(uid) AS (SELECT ? UNION SELECT f.next ' +
    'FROM families f JOIN targets t ON f.uid=t.uid WHERE f.expires>?) ';
  const t = now();
  await env.DB.batch([
    env.DB.prepare(targets + 'DELETE FROM scans WHERE uid IN (SELECT uid FROM targets)').bind(
      uid,
      t,
    ),
    env.DB.prepare(targets + 'DELETE FROM s WHERE uid IN (SELECT uid FROM targets)').bind(uid, t),
    env.DB.prepare(
      targets +
        'DELETE FROM families WHERE uid IN (SELECT uid FROM targets) OR next IN (SELECT uid FROM targets)',
    ).bind(uid, t),
  ]);
}

export async function prune(env: Env, olderThanDays = 10): Promise<number> {
  const t = now();
  const out = await env.DB.batch([
    env.DB.prepare('DELETE FROM s WHERE last_used<?').bind(t - olderThanDays * 86400),
    env.DB.prepare('DELETE FROM scans WHERE expires<=?').bind(t),
    env.DB.prepare('DELETE FROM limits WHERE until<=?').bind(t),
    env.DB.prepare('DELETE FROM stops WHERE expires<=?').bind(t),
    env.DB.prepare('DELETE FROM deliveries WHERE expires<=?').bind(t),
    env.DB.prepare('DELETE FROM messages WHERE expires<=?').bind(t),
    env.DB.prepare('DELETE FROM otp WHERE expires<=?').bind(t),
    env.DB.prepare('DELETE FROM families WHERE expires<=?').bind(t),
  ]);
  return out[0]?.meta.changes ?? 0;
}

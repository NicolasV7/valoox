import type { Env } from '../types.ts';
import { ACTIVE } from './flags.ts';
import { now } from './rows.ts';

export interface ScanRow {
  uid: string;
  id: string;
  kid: number;
  blob: string;
  ver: number;
  expires: number;
  lease: number;
}

export async function begin(
  env: Env,
  uid: string,
  id: string,
  kid: number,
  blob: string,
): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO scans(uid,id,kid,blob,expires) VALUES (?,?,?,?,?) ' +
      'ON CONFLICT(uid) DO UPDATE SET id=excluded.id,kid=excluded.kid,blob=excluded.blob,' +
      'expires=excluded.expires,ver=scans.ver+1,lease=0',
  )
    .bind(uid, id, kid, blob, now() + 600)
    .run();
}

export async function claim(env: Env, uid: string): Promise<ScanRow | 'busy' | null> {
  const row = await env.DB.prepare('SELECT * FROM scans WHERE uid=? AND expires>?')
    .bind(uid, now())
    .first<ScanRow>();
  if (!row) return null;
  if (row.lease > now()) return 'busy';
  const lease = now() + 90;
  const r = await env.DB.prepare(
    'UPDATE scans SET lease=? WHERE uid=? AND id=? AND ver=? AND lease<=?',
  )
    .bind(lease, uid, row.id, row.ver, now())
    .run();
  return r.meta.changes ? { ...row, lease } : 'busy';
}

export async function save(env: Env, row: ScanRow, blob: string, release = true): Promise<boolean> {
  const r = await env.DB.prepare(
    'UPDATE scans SET blob=?,ver=ver+1,lease=? WHERE uid=? AND id=? AND ver=? AND expires>? AND lease=?',
  )
    .bind(blob, release ? 0 : row.lease, row.uid, row.id, row.ver, now(), row.lease)
    .run();
  if (r.meta.changes) row.ver++;
  return r.meta.changes > 0;
}

export async function cancel(env: Env, uid: string, id?: string): Promise<void> {
  await env.DB.prepare('DELETE FROM scans WHERE uid=?' + (id ? ' AND id=?' : ''))
    .bind(...(id ? [uid, id] : [uid]))
    .run();
}

/** One transaction: a cancelled/replaced/expired QR cannot resurrect a session. */
export async function finish(
  env: Env,
  row: ScanRow,
  next: {
    uid: string;
    kid: number;
    blob: string;
    acct: string | null;
    alerts: boolean;
    receiving?: boolean;
    discordGen?: string;
  },
  legacy?: string,
): Promise<boolean> {
  const t = now();
  const r = await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO s(uid,kid,blob,created_at,last_used,acct,alerts,receiving) ' +
        'SELECT ?,?,?,?,?,?,' +
        ACTIVE +
        ',? FROM scans WHERE uid=? AND id=? AND ver=? AND expires>? AND lease=? AND lease>?',
    ).bind(
      next.uid,
      next.kid,
      next.blob,
      t,
      t,
      next.acct,
      next.acct,
      +(next.receiving ?? next.alerts),
      next.acct,
      +next.alerts,
      +(next.receiving ?? next.alerts),
      row.uid,
      row.id,
      row.ver,
      t,
      row.lease,
      t,
    ),
    env.DB.prepare(
      'INSERT INTO families(uid,next,expires) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM s WHERE uid=?)',
    ).bind(row.uid, next.uid, t + 600, next.uid),
    env.DB.prepare(
      'INSERT INTO discord(uid,recipient,gen,state,since) SELECT ?,recipient,gen,state,since FROM discord ' +
        "WHERE uid=? AND gen=? AND state='connected' AND EXISTS(SELECT 1 FROM s WHERE uid=?)",
    ).bind(next.uid, row.uid, next.discordGen ?? '', next.uid),
    env.DB.prepare('DELETE FROM s WHERE uid IN (?,?) AND EXISTS(SELECT 1 FROM s WHERE uid=?)').bind(
      row.uid,
      legacy ?? row.uid,
      next.uid,
    ),
    env.DB.prepare(
      'DELETE FROM scans WHERE uid=? AND id=? AND EXISTS(SELECT 1 FROM s WHERE uid=?)',
    ).bind(row.uid, row.id, next.uid),
    env.DB.prepare(
      'DELETE FROM wishlists WHERE NOT EXISTS(SELECT 1 FROM s WHERE s.acct=wishlists.acct)',
    ),
  ]);
  return (r[0]?.meta.changes ?? 0) > 0;
}

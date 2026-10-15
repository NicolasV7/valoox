import type { Env } from '../types.ts';
import { change, now } from './rows.ts';

export interface Link {
  uid: string;
  key: string;
  gen: string;
  kid: number;
  expires: number;
  claim: string | null;
  recipient: string | null;
  state: string;
}

export const pending = (env: Env, uid: string, kid: number) =>
  env.DB.prepare('SELECT expires,state FROM links WHERE uid=? AND kid=? AND expires>?')
    .bind(uid, kid, now())
    .first<{ expires: number; state: string }>();

export async function reserve(env: Env, link: Link, ver: number): Promise<boolean> {
  const result = await env.DB.prepare(
    'INSERT INTO links(uid,key,gen,kid,expires) SELECT ?,?,?,?,? ' +
      'WHERE EXISTS(SELECT 1 FROM s WHERE uid=? AND ver=?) ' +
      "AND NOT EXISTS(SELECT 1 FROM discord WHERE uid=? AND state='connected') " +
      'ON CONFLICT(uid) DO UPDATE SET key=excluded.key,gen=excluded.gen,kid=excluded.kid,' +
      "expires=excluded.expires,claim=NULL,recipient=NULL,state='waiting' " +
      "WHERE links.state<>'checking' OR links.expires<=?",
  )
    .bind(link.uid, link.key, link.gen, link.kid, link.expires, link.uid, ver, link.uid, now())
    .run();
  return result.meta.changes > 0;
}

export function claim(env: Env, key: string, kid: number, id: string, recipient: string) {
  return env.DB.prepare(
    "UPDATE links SET claim=?,recipient=?,state='checking' " +
      "WHERE key=? AND kid=? AND expires>? AND claim IS NULL AND state='waiting' " +
      "AND NOT EXISTS(SELECT 1 FROM discord WHERE discord.uid=links.uid AND state='connected') RETURNING *",
  )
    .bind(id, recipient, key, kid, now())
    .first<Link>();
}

export async function failed(env: Env, link: Link, state: string): Promise<void> {
  await env.DB.prepare('UPDATE links SET state=? WHERE key=? AND claim=?')
    .bind(state, link.key, link.claim)
    .run();
}

/** Claimed code, consent index and sealed session commit under the same CAS. */
export async function complete(
  env: Env,
  link: Link,
  ver: number,
  value: { kid: number; blob: string; acct: string | null; alerts: boolean; receiving?: boolean },
): Promise<boolean> {
  const live =
    "EXISTS(SELECT 1 FROM links WHERE key=? AND claim=? AND expires>? AND state='checking')";
  const changed = 'EXISTS(SELECT 1 FROM s WHERE uid=? AND ver=? AND blob=?)';
  const result = await env.DB.batch([
    change(
      env,
      link.uid,
      value.kid,
      value.blob,
      ver,
      value.acct,
      value.alerts,
      {
        sql: live,
        values: [link.key, link.claim as string, now()],
      },
      value.receiving,
    ),
    env.DB.prepare(
      "INSERT INTO discord(uid,recipient,gen,state,since) SELECT uid,recipient,gen,'connected',? " +
        'FROM links WHERE key=? AND claim=? AND ' +
        changed +
        ' ON CONFLICT(uid) DO UPDATE SET recipient=excluded.recipient,gen=excluded.gen,state=excluded.state,since=excluded.since',
    ).bind(Date.now(), link.key, link.claim, link.uid, ver + 1, value.blob),
    env.DB.prepare('DELETE FROM links WHERE key=? AND claim=? AND ' + changed).bind(
      link.key,
      link.claim,
      link.uid,
      ver + 1,
      value.blob,
    ),
    env.DB.prepare('DELETE FROM checks WHERE uid=? AND ' + changed).bind(
      link.uid,
      link.uid,
      ver + 1,
      value.blob,
    ),
  ]);
  return (result[0]?.meta.changes ?? 0) > 0;
}

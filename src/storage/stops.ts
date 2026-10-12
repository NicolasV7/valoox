import type { Env } from '../types.ts';
import { now } from './rows.ts';

export interface Stop {
  id: string;
  uid: string;
  gen: string;
  expires: number;
}
export async function add(env: Env, token: Stop, ver: number): Promise<boolean> {
  const r = await env.DB.prepare(
    'INSERT INTO stops(id,uid,gen,expires) SELECT ?,?,?,? ' +
      'WHERE EXISTS(SELECT 1 FROM s WHERE uid=? AND ver=?)',
  )
    .bind(token.id, token.uid, token.gen, token.expires, token.uid, ver)
    .run();
  return r.meta.changes > 0;
}
export async function available(env: Env, token: Stop): Promise<boolean> {
  return !!(await env.DB.prepare(
    'SELECT 1 FROM stops WHERE id=? AND uid=? AND gen=? AND expires>? AND spent=0',
  )
    .bind(token.id, token.uid, token.gen, now())
    .first());
}
export async function consume(
  env: Env,
  token: Stop,
  ver: number,
  claim: string,
  off: D1PreparedStatement[] = [],
  expected: Array<[string, number]> = [],
): Promise<boolean> {
  const statements = [
    env.DB.prepare(
      'UPDATE stops SET spent=1,claim=? WHERE id=? AND uid=? AND gen=? AND expires>? ' +
        'AND spent=0 AND EXISTS(SELECT 1 FROM s WHERE uid=? AND ver=?) ' +
        "AND NOT EXISTS(SELECT 1 FROM json_each(?) e LEFT JOIN s ON s.uid=json_extract(e.value,'$[0]') " +
        "WHERE s.ver IS NULL OR s.ver<>json_extract(e.value,'$[1]'))",
    ).bind(claim, token.id, token.uid, token.gen, now(), token.uid, ver, JSON.stringify(expected)),
  ];
  statements.push(...off);
  const results = await env.DB.batch(statements);
  return results.every((r) => r.meta.changes > 0);
}

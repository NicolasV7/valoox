import type { Env } from '../types.ts';
import { now } from './rows.ts';

/** A single SQLite statement reserves an attempt, across every colo. */
export async function take(env: Env, key: string, max: number, seconds: number): Promise<number> {
  const t = now();
  const accepted = await env.DB.prepare(
    'INSERT INTO limits(key,count,until) VALUES (?,1,?) ' +
      'ON CONFLICT(key) DO UPDATE SET ' +
      'count=CASE WHEN limits.until<=? THEN 1 ELSE limits.count+1 END,' +
      'until=CASE WHEN limits.until<=? THEN excluded.until ELSE limits.until END ' +
      'WHERE limits.until<=? OR limits.count<? RETURNING until',
  )
    .bind(key, t + seconds, t, t, t, max)
    .first<{ until: number }>();
  if (accepted) return 0;
  const row = await env.DB.prepare('SELECT until FROM limits WHERE key=?')
    .bind(key)
    .first<{ until: number }>();
  return Math.max(1, (row?.until ?? t + seconds) - t);
}

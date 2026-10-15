import type { Env } from '../types.ts';
import { now } from './rows.ts';

export async function remaining(env: Env, key: string): Promise<number> {
  const row = await env.DB.prepare('SELECT until FROM limits WHERE key=? AND until>?')
    .bind(key, now())
    .first<{ until: number }>();
  return Math.max(0, (row?.until ?? 0) - now());
}

export async function hold(env: Env, key: string, seconds: number): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO limits(key,count,until) VALUES (?,1,?) ' +
      'ON CONFLICT(key) DO UPDATE SET until=MAX(limits.until,excluded.until)',
  )
    .bind(key, now() + Math.max(1, Math.ceil(seconds)))
    .run();
}

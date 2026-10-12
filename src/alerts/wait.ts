import { take } from '../storage/limits.ts';
import type { Env } from '../types.ts';
import { fingerprint } from '../vault/keys.ts';
import { markOf } from '../vault/who.ts';

export const COOLDOWN = 60;

/** Quotas count send attempts, including failures, so retries cannot bypass them. */
export async function hold(env: Env, uid: string, to: string, puuid?: string): Promise<number> {
  const address = await fingerprint(env, 'recipient', to.toLowerCase());
  const account = await markOf(env, puuid);
  const gates: Array<[string, number, number]> = [
    ['mail-browser:' + uid, 1, COOLDOWN],
    ['mail-recipient:' + address, 1, COOLDOWN],
    ['mail-recipient-hour:' + address, 5, 3600],
    ['mail-account:' + (account ?? uid), 5, 3600],
  ];
  for (const [key, max, seconds] of gates) {
    const wait = await take(env, key, max, seconds);
    if (wait) return wait;
  }
  return 0;
}

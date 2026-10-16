import * as repo from '../storage/sharing.ts';
import type { Env } from '../types.ts';
import { CURRENT_KID, open, seal } from './seal.ts';
import { markOf } from './who.ts';

/** Call only with the identity decrypted from the requesting browser's Riot session. */
export async function load(env: Env, uid: string, puuid: string | undefined) {
  const acct = await markOf(env, puuid);
  if (!acct) return null;
  const row = await repo.read(env, uid, acct);
  if (!row) return null;
  if (row.blob === null) return { tag: true };
  const value = await open<{ tag?: unknown }>(env, acct, row.kid as number, row.blob, 'sharing:1');
  if (typeof value?.tag !== 'boolean') throw new Error('invalid sharing preference');
  return { tag: value.tag };
}

export async function save(env: Env, uid: string, puuid: string | undefined, tag: boolean) {
  const acct = await markOf(env, puuid);
  if (!acct) return false;
  const blob = await seal(env, acct, CURRENT_KID, { tag }, 'sharing:1');
  return repo.write(env, uid, acct, CURRENT_KID, blob);
}

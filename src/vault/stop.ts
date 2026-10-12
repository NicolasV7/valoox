import { now } from '../storage/rows.ts';
import * as stops from '../storage/stops.ts';
import type { Env } from '../types.ts';
import { CURRENT_KID, open, seal } from './seal.ts';
import { readSession } from './session.ts';

export const STOP_LIFE = 30 * 86400;
const asUrl = (raw: string) => raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function mintStop(env: Env, uid: string): Promise<string> {
  for (let retry = 0; retry < 3; retry++) {
    const held = await readSession(env, uid);
    const gen = held?.session.mail?.gen;
    if (!held || !gen) throw new Error('mail generation missing');
    const token: stops.Stop = { id: crypto.randomUUID(), uid, gen, expires: now() + STOP_LIFE };
    const blob = await seal(env, 'link', CURRENT_KID, token, 'stop:2');
    if (await stops.add(env, token, held.ver)) return asUrl(blob);
  }
  throw new Error('mail generation changed');
}
export async function readStop(env: Env, raw: unknown): Promise<stops.Stop | null> {
  if (typeof raw !== 'string' || raw.length > 600 || !/^[A-Za-z0-9_-]+$/.test(raw)) return null;
  try {
    const token = await open<stops.Stop>(
      env,
      'link',
      CURRENT_KID,
      raw.replace(/-/g, '+').replace(/_/g, '/'),
      'stop:2',
    );
    if (
      !token ||
      typeof token.id !== 'string' ||
      typeof token.uid !== 'string' ||
      typeof token.gen !== 'string' ||
      !Number.isSafeInteger(token.expires) ||
      token.expires <= now()
    )
      return null;
    return token;
  } catch {
    return null;
  }
}

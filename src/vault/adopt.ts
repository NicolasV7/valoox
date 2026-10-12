import type { Env, Session } from '../types.ts';
import * as repo from './repo.ts';
import { openLegacy } from './seal.ts';
import { readSession } from './session.ts';
import { sessionShape } from './shape.ts';

/** A legacy storage id is only a hint. Fresh Riot identity must agree first. */
export async function adopt(env: Env, uid: string, puuid: string, legacy?: string) {
  let old = (await readSession(env, uid))?.session;
  let adopted: string | undefined;
  if (!old && legacy) {
    const row = await repo.get(env, legacy);
    if (row?.kid === 1) {
      try {
        const candidate = await openLegacy<Session>(env, legacy, row.blob);
        if (sessionShape(candidate) && candidate.puuid === puuid) {
          old = candidate;
          adopted = legacy;
        }
      } catch {
        /* Old key or corrupt preference data: start without it. */
      }
    }
  }
  if (old?.puuid !== puuid) return { preferences: {}, legacy: undefined };
  // An unverified old code is not portable. Verified mail gets a new generation.
  return {
    preferences: {
      wishlist: old.wishlist,
      mail: old.mail?.ok ? { ...old.mail, gen: crypto.randomUUID(), send: undefined } : undefined,
    },
    legacy: adopted,
  };
}

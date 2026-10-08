import type { Env, Session, Tokens } from '../types.ts';
import { dataHeaders } from './auth.ts';
import { rf } from './http.ts';
import { shardBase } from './shard.ts';

export interface Rank {
  /** Competitive tier number. The browser turns it into a name and an icon from
   *  valorant-api.com, the same way every other id in this app is resolved. */
  tier: number;
  /** Ranked rating within the tier, 0-100. */
  rr: number;
}

/**
 * Your own rank, and only ever yours: the puuid comes from the sealed session,
 * never off a request. Reading someone else's is scouting, which Riot names as a
 * prohibited use — so there is no code path here that could take one.
 *
 * Returns null rather than throwing when the account has never played a ranked
 * game, which is a normal state and not an error.
 */
export async function fetchRank(env: Env, s: Session, t: Tokens): Promise<Rank | null> {
  const url = shardBase(s.shard as string) + 'mmr/v1/players/' + s.puuid;
  const res = await rf(url, { headers: await dataHeaders(env, t) });
  if (!res.ok) return null;

  const d = (await res.json()) as {
    LatestCompetitiveUpdate?: { TierAfterUpdate?: number; RankedRatingAfterUpdate?: number };
  };
  const u = d.LatestCompetitiveUpdate;
  if (typeof u?.TierAfterUpdate !== 'number' || u.TierAfterUpdate === 0) return null;
  return { tier: u.TierAfterUpdate, rr: u.RankedRatingAfterUpdate ?? 0 };
}

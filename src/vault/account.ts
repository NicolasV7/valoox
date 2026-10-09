import type { RiotHeaders, Session } from '../types.ts';
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
 *
 * Takes headers rather than tokens. Minting them costs a request to Riot for
 * the entitlements JWT, and three callers each minting their own put the
 * nightly job at three where one would do — against a 50-subrequest ceiling
 * that decides how many people get an email at all.
 */
export async function fetchRank(s: Session, h: RiotHeaders): Promise<Rank | null> {
  const url = shardBase(s.shard as string) + 'mmr/v1/players/' + s.puuid;
  const res = await rf(url, { headers: h });
  if (!res.ok) return null;

  const d = (await res.json()) as {
    LatestCompetitiveUpdate?: { TierAfterUpdate?: number; RankedRatingAfterUpdate?: number };
  };
  const u = d.LatestCompetitiveUpdate;
  if (typeof u?.TierAfterUpdate !== 'number' || u.TierAfterUpdate === 0) return null;
  return { tier: u.TierAfterUpdate, rr: u.RankedRatingAfterUpdate ?? 0 };
}

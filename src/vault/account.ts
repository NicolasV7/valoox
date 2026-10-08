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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * The player card you have equipped, as a bare uuid — the browser resolves it to
 * artwork the same way it resolves every other id in this app.
 *
 * Decoration, so every failure is null and nobody loses a store over it. The
 * shape is checked before it leaves: this id ends up inside a URL on the page,
 * and a field from an upstream response is not a thing to trust on sight.
 */
export async function fetchCard(env: Env, s: Session, t: Tokens): Promise<string | null> {
  // v3. v2 is the version every third-party map still lists and it answers 404
  // now — measured 2026-10-08 against a live session, on the same host and the
  // same headers that /mmr answers 200 for.
  const url =
    shardBase(s.shard as string) + 'personalization/v3/players/' + s.puuid + '/playerloadout';
  const res = await rf(url, { headers: await dataHeaders(env, t) });
  if (!res.ok) return null;

  const d = (await res.json()) as { Identity?: { PlayerCardID?: string } };
  const id = d.Identity?.PlayerCardID;
  return typeof id === 'string' && UUID.test(id) ? id : null;
}

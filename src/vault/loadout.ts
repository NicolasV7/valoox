import type { RiotHeaders, Session } from '../types.ts';
import { rf } from './http.ts';
import { shardBase } from './shard.ts';

/**
 * What you have equipped: one call, everything on it.
 *
 * The collection is laid out by weapon rather than by skin, and the thing in
 * each slot is a loadout fact rather than an inventory one — owning a skin and
 * having it on are different questions, and the screen answers the second.
 *
 * Decoration, so every failure is null and nobody loses a screen over it. The
 * ids are shape-checked before they leave: they end up inside URLs on the page
 * and a field from an upstream response is not a thing to trust on sight.
 *
 * v3. v2 is the version every third-party map still lists and it answers 404
 * now — measured 2026-10-08 against a live session.
 */
export interface Loadout {
  /** weapon uuid -> the skin level and chroma on it, and the charm hanging off. */
  guns: Record<string, { level: string; chroma: string | null; buddy: string | null }>;
  /** The sprays on the wheel, in Riot's order. The wheel holds four slots and
   *  not all of them are sprays, so this is between zero and four. */
  sprays: string[];
  card: string | null;
  title: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ok = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
const id = (v: unknown): string | null => (ok(v) ? v : null);

/** Riot's own uuid for the spray item type, as the wheel labels its slots. */
const SPRAY = 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475';

interface Raw {
  Guns?: Array<{
    ID?: string;
    SkinLevelID?: string;
    ChromaID?: string;
    CharmLevelID?: string;
  }>;
  /** v3's name for the spray wheel, and it is not a rename of v2's `Sprays`:
   *  the slots are typed now, each one a { TypeID, AssetID }, and not all of
   *  them hold a spray. Measured 2026-10-08 — three of four did. */
  ActiveExpressions?: Array<{ TypeID?: string; AssetID?: string }>;
  Identity?: { PlayerCardID?: string; PlayerTitleID?: string };
}

/** Headers in, not tokens — see fetchRank for why. */
export async function fetchLoadout(s: Session, h: RiotHeaders): Promise<Loadout | null> {
  const url =
    shardBase(s.shard as string) + 'personalization/v3/players/' + s.puuid + '/playerloadout';
  const res = await rf(url, { headers: h });
  if (!res.ok) return null;

  const d = (await res.json()) as Raw;
  const guns: Loadout['guns'] = {};
  for (const g of d.Guns ?? []) {
    if (!ok(g.ID) || !ok(g.SkinLevelID)) continue;
    guns[g.ID] = { level: g.SkinLevelID, chroma: id(g.ChromaID), buddy: id(g.CharmLevelID) };
  }

  return {
    guns,
    sprays: (d.ActiveExpressions ?? [])
      .filter((e) => e.TypeID === SPRAY)
      .map((e) => id(e.AssetID))
      .filter(ok),
    card: id(d.Identity?.PlayerCardID),
    title: id(d.Identity?.PlayerTitleID),
  };
}

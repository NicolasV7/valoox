import { SHARD_HOSTS } from './upstream.ts';

// riot-geo hands back an AFFINITY; the storefront host is keyed by SHARD, and the
// two are not the same namespace. Measured 2026-09-14: only na/eu/ap/kr resolve —
// pd.latam and pd.br have no DNS record at all, which surfaces as a Cloudflare
// 1016 behind a 530 and looks nothing like a region problem.
const SHARD_OF: Record<string, string> = { br: 'na', latam: 'na' };

export class UnknownAffinity extends Error {
  constructor(affinity: string) {
    super('no shard host for affinity ' + affinity);
    this.name = 'UnknownAffinity';
  }
}

/** affinity -> the pd host that serves it. Throws rather than building a
 *  hostname that cannot resolve — an unknown affinity is a fact worth learning
 *  loudly, not a 530 twenty seconds later. */
export function shardHost(affinity: string): string {
  const shard = SHARD_OF[affinity] ?? affinity;
  if (!(SHARD_HOSTS as readonly string[]).includes(shard)) throw new UnknownAffinity(affinity);
  return 'pd.' + shard + '.a.pvp.net';
}

/** Base URL for every store call, including the trailing slash. */
export function storeBase(affinity: string): string {
  return 'https://' + shardHost(affinity) + '/store/';
}

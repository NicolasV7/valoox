export const store = {
  daily: 'Daily offers',
  bundle: 'Bundle',
  accessories: 'Accessories',
  night: 'Night market',

  /** The one line that is the whole reason somebody opened this. */
  hit: (name: string) => `${name} is here today.`,
  hits: (n: number) => `${n} of the ones you starred are here today.`,

  rank: (tier: string, rr: number) => `${tier} · ${rr} RR`,
  unranked: 'Unranked',

  /** A countdown. The `d` is days; under a day it is dropped entirely, because
   *  `0d 07:12:44` reads as broken. */
  days: (n: number) => `${n}d`,

  discount: (percent: number) => `−${percent}%`,
  allOwned: 'You already own all of it',

  empty: 'Riot returned nothing for this account.',
  emptyWhy:
    'That is unusual and probably not true. If you own skins in game, this is ' +
    'our bug rather than an empty collection.',

  disconnect: 'Disconnect',
  notice:
    'valoox is not affiliated with Riot Games. VALORANT, its artwork and its ' +
    'marks belong to Riot; prices and rotations come from your own account.',
};

export const offer = {
  levels: 'Levels',
  levelsOf: (have: number, all: number) => `${have} of ${all}`,
  variants: 'Variants',
  starred: 'Starred',
  star: 'Star it',
  unstar: 'Stop watching',

  level: {
    base: 'Base',
    vfx: 'VFX',
    anim: 'Anim',
    finisher: 'Finisher',
  },

  /** Riot hosts one clip per level and they are large. We link theirs instead
   *  of keeping copies, which is also the honest thing to say about it. */
  clips:
    'Both blocks disappear for a skin that has neither: 857 of the catalogue ' +
    'have one level and 880 have no variants. Riot hosts a clip per level; we ' +
    'link theirs rather than keep copies, they are 13 MB each.',
};

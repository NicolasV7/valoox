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

// The bundle, opened. Riot sends between four and ten pieces and each carries
// its own price, so the screen says where every number came from.
export const bundle = {
  pieces: (n: number) => `${n} pieces`,
  tier: (name: string) => `${name} tier`,
  contents: 'What is in it',

  full: (n: number) => `${n} pieces at full price`,
  cut: 'Discount inside the bundle',
  total: 'Bundle price',

  perItem:
    'Every piece carries its own price: Riot gives each item in a bundle a ' +
    'BasePrice and a DiscountedPrice, accessories included, so the discount is ' +
    'applied per item rather than as one number on the whole.',
  read:
    'Read, not guessed: each row above is a BasePrice and a DiscountedPrice ' +
    'straight out of the storefront payload, and the totals are its ' +
    'TotalBaseCost and TotalDiscountedCost. The daily store is the one place a ' +
    'price is derived here, from the tier, because that offer carries only a cost.',

  gone: 'This bundle is no longer in your store.',
};

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
  emptyWhy: 'If you own skins in game, this is our bug — not an empty collection.',

  disconnect: 'Disconnect',
  notice:
    'valoox is not affiliated with Riot Games. VALORANT, its artwork and its ' +
    'marks belong to Riot; prices and rotations come from your own account.',
};

export const offer = {
  watch: 'Watch Riot’s clip',
  levelNo: (n: number) => `Level ${n}`,
  levels: 'Levels',
  levelsOf: (have: number, all: number) => `${have} of ${all}`,
  variants: 'Variants',
  starred: 'Starred',
  star: 'Star',
  unstar: 'Unstar',

  original: 'Original',

  /** Keyed by Riot's own levelItem, lower-cased: ::Finisher -> finisher.
   *  Six of the seventeen in the catalogue cover all but ninety skins;
   *  the rest fall back to their level number. */
  level: {
    base: 'Base',
    vfx: 'VFX',
    finisher: 'Finisher',
    animation: 'Anim',
    soundeffects: 'Sound',
    killbanner: 'Banner',
  },

  /** Riot hosts one clip per level and they are large. We link theirs instead
   *  of keeping copies, which is also the honest thing to say about it. Both
   *  blocks vanish for a skin that has neither: 857 of the catalogue have one
   *  level and 880 have no variants. */
  clips:
    'The clip is Riot’s and streams from their server: it is 13 MB, so we point ' +
    'at theirs rather than keep copies.',
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
    'Riot gives each item in a bundle a BasePrice and a DiscountedPrice, ' +
    'accessories included, so the discount is applied per item rather than on the whole.',
  /** The daily store is the one place a price is derived rather than read —
   *  from the tier, because that offer carries only a cost. */
  read:
    'Read, not guessed: each row is a BasePrice and a DiscountedPrice out of the ' +
    'storefront, and the totals are its TotalBaseCost and TotalDiscountedCost.',

  gone: 'This bundle is no longer in your store.',
};

// Riot's own sprays, used as the small drawing on a screen that is waiting,
// empty or apologising. Those are the three moments with space on them and a
// feeling to carry, and they are the only ones where a picture is not in the
// way of the thing you came to look at. The store and the collection stay bare.
//
// They are served from this origin. Twelve files that never change, fetched at
// build time by scripts/art.mjs — which is where Riot's uuid for each one is
// written down — so the screen a stranger reads before scanning does not open
// a second connection to draw a sticker on it.
//
// Each is picked for what it is *of*, not because a screen looked empty: swap
// one and the joke stops being about the screen it is on.

const art = (name: string) => '/art/spray-' + name + '.png';

export const SPRAY = {
  /** Killjoy, hands up. Waiting with you for the phone to approve it. */
  holdUp: art('holdup'),
  /** Gekko, palms open. The expired screen is one offer: have another code. */
  goAgain: art('goagain'),
  /** A peace sign and a HELLO shirt. The moment the scan is approved. */
  peace: art('peace'),
  /** A wallet with one coin in it. Nothing in this slot yet. */
  empty: art('empty'),
  /** A visibly disappointed crab. Nothing starred yet. */
  crab: art('crab'),
  /** A seal on support, sweating. Riot said no. */
  whoops: art('whoops'),
  /** Being teleported out, waving. Disconnecting. */
  seeYou: art('seeyou'),
  /** Cypher, one finger up. The block that says never hand this code over. */
  shh: art('shh'),
  /** Somebody delighted with the gun they are holding. A wishlist hit. */
  thisGun: art('thisgun'),
  /** Yoru asleep, with the Zzz. The list is kept and nothing is being sent. */
  asleep: art('asleep'),
  /** Jett, palm up, unimpressed. The one question before something is undone. */
  holdOn: art('holdon'),
  /** A gloved thumb up, with the Spike. Nothing was changed; carry on. */
  carryOn: art('carryon'),
} as const;

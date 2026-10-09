// Riot's own sprays, used as the small drawing on a screen that is waiting,
// empty or apologising. Those are the three moments with space on them and a
// feeling to carry, and they are the only ones where a picture is not in the
// way of the thing you came to look at. The store and the collection stay bare.
//
// They are served from this origin. Eighteen files that never change, fetched at
// build time by scripts/art.mjs — which is where Riot's uuid for each one is
// written down — so the screen a stranger reads before scanning does not open
// a second connection to draw a sticker on it.
//
// Each is picked for what it is *of*, not because a screen looked empty: swap
// one and the joke stops being about the screen it is on.
//
// And each appears exactly once. Two screens wearing one sticker is two
// screens that have stopped being about anything in particular — so this list
// is the whole inventory, every entry below has one caller, and adding a
// screen means finding a drawing rather than reaching for a nearby one.

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
  /** Being teleported out, waving. The screen that asks before it deletes. */
  seeYou: art('seeyou'),
  /** Cypher, one finger up. The block that says never hand this code over. */
  shh: art('shh'),
  /** Somebody delighted with the gun they are holding. A wishlist hit. */
  thisGun: art('thisgun'),
  /** A gloved thumb up, with the Spike. Nothing was changed; carry on. */
  carryOn: art('carryon'),
  /** Jett shrugging an Operator off a ledge. Something let go on purpose. */
  letGo: art('letgo'),
  /** Reyna, eyebrow up, hand out. The one question before something is undone. */
  huh: art('huh'),
  /** Omen behind a wall of smoke. A link with nothing left behind it. */
  nothing: art('nothing'),
  /** A radio smashed, with the error badge still lit. A link that is wrong. */
  lostConn: art('lostconn'),
  /** Brimstone in a hammock, cucumber on his eyes. Kept, and running nothing. */
  chill: art('chill'),
  /** Cypher at a laptop with a hand over Killjoy's eyes. What is kept, and
   *  who can read it. */
  secrets: art('secrets'),
  /** Posting something, carefully. Where an alert goes. */
  sending: art('sending'),
  /** A countdown already running. Ten minutes and five attempts. */
  countdown: art('countdown'),
  /** Sova, grinning and sweating. The send did not work and it is on us. */
  sorry: art('sorry'),
  /** Yoru asleep, with the Zzz. A session that is over at Riot. */
  asleep: art('asleep'),
} as const;

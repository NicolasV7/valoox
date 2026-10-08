// Riot's own sprays, used as the small drawing on a screen that is waiting,
// empty or apologising. Those are the three moments with space on them and a
// feeling to carry, and they are the only ones where a picture is not in the
// way of the thing you came to look at. The store and the collection stay bare.
//
// They are served from media.valorant-api.com, which the CSP already allows for
// every other render in the app — so nothing is committed here and nothing is
// proxied. Each one is picked for what it is *of*, not because a screen looked
// empty: swap one and the joke stops being about the screen it is on.

const CDN = 'https://media.valorant-api.com/sprays/';
const art = (id: string) => CDN + id + '/fulltransparenticon.png';

export const SPRAY = {
  /** Killjoy, hands up. Waiting with you for the phone to approve it. */
  holdUp: art('271896c9-496b-8c89-962f-59a9ed3f4ffa'),
  /** Gekko, palms open. The expired screen is one offer: have another code. */
  goAgain: art('0d5ac29c-482f-1a31-eba2-bba3acb2c2c4'),
  /** A peace sign and a HELLO shirt. The moment the scan is approved. */
  peace: art('13a7b621-44cf-73a3-04bb-0fad33b93179'),
  /** A wallet with one coin in it. Nothing in this slot yet. */
  empty: art('3085ca2f-4e7a-25a5-909d-33940b0148e2'),
  /** A visibly disappointed crab. Nothing starred yet. */
  crab: art('d52d5d56-46a7-957d-418d-e3b2b3bd6938'),
  /** A seal on support, sweating. Riot said no. */
  whoops: art('6cee7e0a-4d08-6213-3ec9-479f0667b4c0'),
  /** Being teleported out, waving. Disconnecting. */
  seeYou: art('081262e8-42db-ac4a-c94b-a89b623525c0'),
} as const;

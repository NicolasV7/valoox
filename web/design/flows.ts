// New artwork reserved for the approved Alerts and Account screens.
// The matching Riot UUIDs are pinned by scripts/artwork.mjs.
const art = (name: string) => '/art/spray-flow-' + name + '.png';

export const FLOW = {
  watching: art('watching'),
  first: art('first'),
  email: art('email'),
  proof: art('proof'),
  paused: art('paused'),
  bounced: art('bounced'),
  privacy: art('privacy'),
  custody: art('custody'),
  support: art('support'),
  disconnect: art('disconnect'),
  ended: art('ended'),
  stop: art('stop'),
  kept: art('kept'),
} as const;

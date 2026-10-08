// A skin opened out of the collection. The same three blocks as the store's
// offer screen — clip, levels, colourways — because it is the same question.
// What changes is the answer to "do you own it", which the store never has to
// give.

export const skin = {
  watch: "Watch Riot's clip",
  yours: 'Yours',

  // --- the two blocks of choices -------------------------------------------
  /** A melee tops out at three levels and a gun at five. Measured over the
   *  catalogue: 176 melee skins and 1,239 gun skins. */
  meleeLevels: (n: number) =>
    `${n} levels, not five. A melee skin tops out at three — measured over the ` +
    `176 in the catalogue, against five across the 1,239 gun skins — because ` +
    `there is no firing animation and no finisher to upgrade.`,

  twoReceipts:
    'Riot bills a level and a colourway as separate entitlements, under two ' +
    'different item types, so one skin arrives as several ids. A colourway you ' +
    'do not hold is the same skin on a different line of the receipt, which is ' +
    'why it is here rather than hidden.',

  // --- what it is to you ---------------------------------------------------
  equippedNow: 'Equipped now',
  yoursNotOn: 'Yours, not equipped',

  readOff: (level: string, colour: string) =>
    `${level}, ${colour} — read from your loadout. We never write to it: the ` +
    `egress allowlist carries the GET for a loadout and not the PUT that ` +
    `equips one, so equipping stays where it belongs, in the game.`,
  holds: (other: string) =>
    `${other} holds the slot. There is no Equip button here and there will not ` +
    `be one: equipping is a PUT to that same path, and the allowlist carries ` +
    `only its GET.`,

  listPrice:
    'The price above is the tier’s list price, not one Riot said about this ' +
    'skin: a skin that is not in your store today comes with no cost at all. ' +
    'It comes out of the same table the store reads the other way, where it ' +
    'deduces a tier from what was charged.',

  // --- before the catalogue lands ------------------------------------------
  waitingWhy:
    'Riot answers with ids. The names, the renders and the clip come from the ' +
    'community catalogue, which the browser fetches once and keeps — so this is ' +
    'the first visit to a weapon and rarely the second.',
};

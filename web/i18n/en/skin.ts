// A skin opened out of the collection. The same three blocks as the store's
// offer screen — clip, levels, variants — because it is the same question.
// What changes is the answer to "do you own it", which the store never has to
// give.

export const skin = {
  watch: 'Watch Riot’s clip',
  yours: 'Yours',

  // --- the two blocks of choices -------------------------------------------
  /** A melee tops out at three levels and a gun at five. Measured over the
   *  catalogue: 176 melee skins and 1,239 gun skins. The reason is that there
   *  is no firing animation and no finisher to upgrade. */
  meleeLevels: (n: number) => `${n} levels, not five: a melee skin tops out at three.`,

  twoReceipts:
    'Riot bills a level and a variant separately, so one skin arrives as several ' +
    'ids: a variant you do not hold is the same skin on another line of the receipt.',

  // --- what it is to you ---------------------------------------------------
  equippedNow: 'Equipped now',
  howItLooks: 'How it looks',
  notYoursPreview:
    'This is how the variant you picked above looks. You do not own it: the ' +
    'render is Riot’s, not a photo of your inventory.',
  alsoOn: (which: string) => `You have this skin’s ${which} equipped.`,
  yoursNotOn: 'Yours, not equipped',

  readOff: (level: string, colour: string) =>
    `${level}, ${colour} — read from your loadout. We never write to it: ` +
    `equipping stays where it belongs, in the game.`,
  holds: (other: string) =>
    `${other} holds the slot. There is no Equip button here: the allowlist ` +
    `carries the GET for that path, not the PUT that equips.`,

  /** It comes out of the same table the store reads the other way, where it
   *  deduces a tier from what was charged. */
  listPrice:
    'The price above is the tier’s list price, not one Riot said about this skin: ' +
    'a skin that is not in your store today comes with no cost at all.',

  // --- before the catalogue lands ------------------------------------------
  waitingWhy:
    'Riot answers with ids. The names, the renders and the clip come from the ' +
    'community catalogue, which the browser fetches once and keeps.',
};

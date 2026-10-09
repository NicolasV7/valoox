// What you have, and what you have on. Two different questions, and this tab
// answers both: the grid shows every weapon in the game, not only the ones you
// have dressed.

export const collection = {
  title: 'Collection',

  tab: {
    weapons: 'Weapons',
    sprays: 'Sprays',
    buddies: 'Buddies',
    cards: 'Cards',
    titles: 'Titles',
  },

  /** How much of the rack is dressed, which is the one number up here. */
  equipped: (on: number, all: number) => `${on} / ${all} equipped`,

  rack: {
    sidearm: 'Sidearms',
    smg: 'SMGs',
    shotgun: 'Shotguns',
    rifle: 'Rifles',
    sniper: 'Snipers',
    heavy: 'Heavies',
    melee: 'Melee',
  } as Record<string, string | undefined>,

  /** The skin every weapon ships with, and the only one with no tier. */
  standard: 'Standard',

  // The dimmed stock gun in an empty slot is the point: the gaps are visible.
  everyWeapon:
    'Every weapon in the game is here, not only the ones you have dressed. A ' +
    'slot with nothing equipped shows the stock gun, dimmed.',

  // --- nothing there -------------------------------------------------------
  nothing: 'Riot returned nothing for this account.',
  nothingWhy: 'If you own skins in game, this is our bug — not an empty collection.',
  alsoHere: 'Also here',
  unknown: (items: number, types: number) =>
    `${items} items of ${types} types we do not know how to show yet.`,
  // Left out because they crowd out the things you actually chose.
  agents: 'Agents are left out on purpose: you unlock them by playing, not collecting.',
};

// One slot, opened: every skin the game has for this weapon, the ones you own
// apart from the ones you do not. The gaps are half of what a collection tells
// you.

export const weapon = {
  /** How many of how many. Only the ones with a tier count: the standard skin
   *  comes with the weapon and is not something you can have or not have. */
  of: (have: number, all: number) => `${have} of ${all}`,

  search: (n: number, gun: string) => `Search ${n} ${gun} skins`,
  searchWhy: (n: number) =>
    `Name, theme or tier. All ${n} are already in the browser, so the list ` +
    `narrows as you type and nothing goes back to the Worker for it.`,
  nothing: 'Nothing matches that.',

  alsoYours: 'Also yours',
  notYours: 'Not yours',

  levels: (n: number) => (n === 1 ? '1 level' : `${n} levels`),
  variants: (n: number) => (n === 1 ? '1 variant' : `${n} variants`),

  weave:
    'Each row carries the weave the store puts behind a gun, washed in that ' +
    'skin’s own colour — measured off the render, not picked. No price on the ' +
    'ones you own: a skin you already have does not cost anything, so the row ' +
    'shows where it goes instead.',

  // --- before the catalogue lands ------------------------------------------
  waitingWhy:
    'Riot has already answered with ids; what is missing is the catalogue that ' +
    'gives them a name and a render. It is one fetch the browser keeps, so a ' +
    'second visit to a slot skips straight past this screen.',
};

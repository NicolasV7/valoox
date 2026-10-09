// One slot, opened: every skin the game has for this weapon, the ones you own
// apart from the ones you do not. The gaps are half of what a collection tells
// you.

export const weapon = {
  /** How many of how many. Only the ones with a tier count: the standard skin
   *  comes with the weapon and is not something you can have or not have. */
  of: (have: number, all: number) => `${have} of ${all}`,

  search: (n: number, gun: string) => `Search ${n} ${gun} skins`,
  // The filter runs over the list already in memory; the Worker never sees it.
  searchWhy: (n: number) =>
    `Name, theme or tier. All ${n} are already in the browser, so searching ` +
    `never goes back to the Worker.`,
  nothing: 'Nothing matches that.',

  alsoYours: 'Also yours',
  notYours: 'Not yours',

  levels: (n: number) => (n === 1 ? '1 level' : `${n} levels`),
  variants: (n: number) => (n === 1 ? '1 variant' : `${n} variants`),

  // No row here shows a price, owned or not — this screen is the collection,
  // not the store — so the copy says nothing about one.
  weave:
    'The weave behind each row carries that skin’s own colour, measured off the ' +
    'render, not picked.',

  // --- before the catalogue lands ------------------------------------------
  waitingWhy:
    'Riot answered with the ids. What is missing is the catalogue that gives them ' +
    'a name and a render.',
};

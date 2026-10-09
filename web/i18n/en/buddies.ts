// Buddies: the tab, and one opened. A buddy is square like a spray, so it uses
// the same grid; what changes is the line underneath.

export const buddies = {
  /** Instances, not distinct buddies: Riot hands them out by instance, so this
   *  number is larger than the number of cells. */
  of: (have: number, all: number) => `${have} of ${all} buddies`,

  /** Which gun it hangs off. */
  on: (gun: string) => `on your ${gun.toLowerCase()}`,
  onMany: (n: number) => `on ${n} weapons`,

  search: (n: number) => `Search ${n} buddies`,
  nothing: 'Nothing matches that.',

  yours: 'Yours',
  notYours: 'Not yours',

  // The spray grid, borrowed outright rather than earning a second one. The
  // line underneath is the only thing a buddy does not share, so that and the
  // closing line every tab carries are all this note says.
  grid:
    'A buddy is square too, so it borrows the spray grid. The line underneath ' +
    'says which weapon is carrying it. Every buddy in the game is here, not only yours.',
  instances: (have: number, kinds: number) =>
    `The count above is ${have} instances and there are ${kinds} distinct ` +
    `buddies below it. Riot bills buddies by instance.`,

  // --- before the catalogue lands ------------------------------------------
  waitingWhy:
    'Waiting on the buddies catalogue: one fetch the browser keeps, so this ' +
    'screen belongs to a first visit.',

  // --- one opened ----------------------------------------------------------
  colourFrom: 'Where the colour comes from',
  // The same reading as the spray's (design/hsv.ts). Without weighting the
  // vivid pixels, every buddy in the game averages to the same grey.
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), measured off this buddy. A buddy is small and mostly ` +
    `outline, so the reading weights vivid pixels over flat ones.`,

  many: 'One buddy, many instances',
  manyWhy: (n: number) =>
    `Riot hands out buddies by instance: you have ${n} of this one, and each is ` +
    `its own id that can hang off its own weapon.`,
};

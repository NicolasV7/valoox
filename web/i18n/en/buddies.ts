// Buddies: the tab, and one opened. A charm is square like a spray, so it uses
// the same grid; what changes is the line underneath.

export const buddies = {
  /** Instances, not distinct charms: Riot hands them out by instance, so this
   *  number is larger than the number of cells. */
  of: (have: number, all: number) => `${have} of ${all} buddies`,

  /** Which gun it hangs off. */
  on: (gun: string) => `on your ${gun.toLowerCase()}`,
  onMany: (n: number) => `on ${n} guns`,

  search: (n: number) => `Search ${n} buddies`,
  nothing: 'Nothing matches that.',

  yours: 'Yours',
  notYours: 'Not yours',

  grid:
    'A charm is square too, so it borrows the spray grid outright rather than ' +
    'earning a second one. What differs is the line underneath: a charm is ' +
    'attached to a weapon, not to a slot, so it says which gun is carrying it. ' +
    'Every charm in the game is here, not only yours.',
  instances: (have: number, kinds: number) =>
    `The count above is ${have} instances and there are ${kinds} distinct ` +
    `charms below it. Riot bills charms by instance: you can own four of the ` +
    `same one and hang them on four guns.`,

  // --- before the catalogue lands ------------------------------------------
  waitingWhy:
    'The tab bar is drawn for real because it needs no data. Everything under ' +
    'it is waiting on the buddies catalogue — one fetch from valorant-api that ' +
    'the browser keeps, so this state belongs to a first visit. The cells are ' +
    'already square, which is the whole job of a skeleton.',

  // --- one opened ----------------------------------------------------------
  colourFrom: 'Where the colour comes from',
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), measured off this charm the same way the spray was. A charm ` +
    `is small and mostly outline, so the reading weights vivid pixels over flat ` +
    `ones — the hue is a chroma-weighted mean over the pixels above 12% alpha ` +
    `and the saturation comes from the 88th percentile. Without that every ` +
    `charm in the game averages to the same grey and the page stops telling ` +
    `them apart.`,

  many: 'One charm, many instances',
  manyWhy: (n: number) =>
    `Riot hands out charms by instance: you have ${n} of this one, and each is ` +
    `its own id that can hang off its own weapon. The collection groups them by ` +
    `charm and names the guns, because a list with the same picture four times ` +
    `is not a list.`,
};

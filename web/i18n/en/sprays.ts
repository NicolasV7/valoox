// Sprays: the tab, and one opened. A spray is square, so this is a grid rather
// than the slot board the weapons get.

export const sprays = {
  of: (have: number, all: number) => `${have} of ${all} sprays`,

  /** Which slot on the wheel it sits in. All four read the same way: being on
   *  the wheel is what equipped means, and "equipped" beside "slot 3" is two
   *  words for one fact. */
  slot: (n: number) => `slot ${n}`,

  search: (n: number) => `Search ${n} sprays`,
  nothing: 'Nothing matches that.',

  yours: 'Yours',
  notYours: 'Not yours',

  // Each tile is washed in the measured colour of its own art, which is the
  // only way a wall of squares stays readable. That is visible on screen, so
  // it is not said here: colourWhy explains it once, below.
  grid:
    'A spray is square, so this is a grid rather than the slot board the ' +
    'weapons get. Every spray in the game is here, not only yours.',
  /** The wheel has four slots and one can be empty: Riot has a spray called
   *  "None" and that is what comes back when nothing is in it. */
  wheel: (on: number, rest: number) =>
    `${on} are on the wheel right now, one per slot and up to four. The other ` +
    `${rest} are yours, off the wheel.`,

  // --- before the catalogue lands ------------------------------------------
  waitingWhy:
    'Waiting on the sprays catalogue: one fetch the browser keeps, so this ' +
    'screen belongs to a first visit.',

  // --- one opened ----------------------------------------------------------
  colourFrom: 'Where the colour comes from',
  // The hue is a chroma-weighted mean over the pixels above 12% alpha and the
  // saturation comes from the 88th percentile — ALPHA_FLOOR and VIVID in
  // design/hsv.ts. The estimator is ours, not the reader's.
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), measured off the art rather than picked: the browser reads ` +
    `the pixels back from a 96px canvas.`,

  canSay: 'What we can say about it',
  canSayWhy:
    'That you own it, and which of the four wheel slots it is in. Not how often ' +
    'you have used it: Riot does not publish that.',

  moves: 'This one animates in game, and what you are seeing are the frames Riot publishes.',
};

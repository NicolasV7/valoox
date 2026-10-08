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

  grid:
    'A spray is square, so this is a grid rather than the slot board the ' +
    'weapons get. Each tile is washed in the colour of its own art — measured ' +
    'off the art, not picked — which is the only way a wall of squares stays ' +
    'readable. Every spray in the game is here, not only yours: the gaps are ' +
    'half of what a collection tells you.',
  /** The wheel has four slots and one can be empty: Riot has a spray called
   *  "None" and that is what comes back when nothing is in it. */
  wheel: (on: number, rest: number) =>
    `${on} are on the wheel right now, one per slot and up to four. The other ` +
    `${rest} here are just owned.`,

  // --- before the catalogue lands ------------------------------------------
  waitingWhy:
    'The tab bar is drawn for real because it needs no data. Everything under ' +
    'it is waiting on the sprays catalogue — one fetch from valorant-api that ' +
    'the browser keeps, so this state belongs to a first visit. The cells are ' +
    'already square, which is the whole job of a skeleton.',

  // --- one opened ----------------------------------------------------------
  colourFrom: 'Where the colour comes from',
  colourWhy: (rgb: string) =>
    `rgb(${rgb}). Not an average: a flat mean over a drawing always comes out ` +
    `muddy, because the outline, the glow and the transparent margin all pull ` +
    `toward grey. The hue is a chroma-weighted mean over the pixels above 12% ` +
    `alpha, and the saturation is taken from the 88th percentile — its vivid ` +
    `end — rather than the mean. The browser measures it by drawing the image ` +
    `into a 96px canvas and reading the pixels back, which valorant-api allows ` +
    `because it sends the CORS header.`,

  canSay: 'What we can say about it',
  canSayWhy:
    'That you own it, and which of the four wheel slots it is in. Not how often ' +
    'you have used it: Riot does not publish that, and a number nobody can ' +
    'check is worse than no number.',

  moves: 'This one animates in game, and what you are seeing are the frames Riot publishes.',
};

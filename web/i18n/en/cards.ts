// Player cards: the tab, and one opened. Two columns, not three.

export const cards = {
  of: (have: number, all: number) => `${have} of ${all} cards`,

  search: (n: number) => `Search ${n} cards`,
  nothing: 'Nothing matches that.',

  yours: 'Yours',
  notYours: 'Not yours',

  // The tile crops the tall art rather than shrinking it, and the wash behind
  // it is that painting's own measured colour. Both are on screen already;
  // what is not visible is why there are two columns, so that is all it adds.
  grid:
    'Two columns, not three: a card is a 2:5 portrait, and at a third of the ' +
    'width it stops being a picture. Every card in the game is here, not only yours.',

  waitingWhy:
    'Waiting on the cards catalogue: one fetch the browser keeps, so this ' +
    'screen belongs to a first visit.',

  crops: 'Three crops, one card',
  // Where each one turns up is the label under the crop itself, in
  // piece.wideWhere and piece.smallWhere. Saying it here too was saying it
  // twice in two different sets of words.
  cropsWhy:
    'Riot ships every card three times and they are crops, not scales: the ' +
    'tall one has detail the square never shows.',

  colourFrom: 'Where the colour comes from',
  // Chroma-weighted mean over the pixels above 12% alpha, saturation from the
  // 88th percentile — design/hsv.ts. The estimator is ours, not the reader's.
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), measured off the square crop — the same one the grid ` +
    `measures, so the wash is the same colour on both screens.`,
};

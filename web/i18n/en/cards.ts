// Player cards: the tab, and one opened. Two columns, not three.

export const cards = {
  of: (have: number, all: number) => `${have} of ${all} cards`,

  search: (n: number) => `Search ${n} cards`,
  nothing: 'Nothing matches that.',

  yours: 'Yours',
  notYours: 'Not yours',

  grid:
    'Two columns, not three: a card is a 2:5 portrait and at a third of the ' +
    'width it stops being a picture. The tile crops the tall art rather than ' +
    'shrinking it — a card you cannot read is not a card — and the wash behind ' +
    'each one is still that painting’s own measured colour, which is what you ' +
    'see at the edges. Every card in the game is here.',

  waitingWhy:
    'The tab bar is drawn for real because it needs no data. Everything under ' +
    'it is waiting on the cards catalogue — one fetch from valorant-api that ' +
    'the browser keeps, so this state belongs to a first visit.',

  crops: 'Three crops, one card',
  cropsWhy:
    'Riot ships every card three times and they are crops, not scales: the tall one has detail the square never shows. The grid crops the tall one, and here are the other two — each drawn where you actually meet it, because “wide crop” means nothing and “behind your name in the lobby” is the same fact in a form you can check.',

  colourFrom: 'Where the colour comes from',
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), measured off the square crop — the same one the grid ` +
    `measures, so the wash is the same colour on both screens. The hue is a ` +
    `chroma-weighted mean over the pixels above 12% alpha and the saturation ` +
    `comes from the 88th percentile rather than the mean. A card often reads a ` +
    `colour you would not have guessed, which is the argument for measuring it ` +
    `instead of picking it.`,
};

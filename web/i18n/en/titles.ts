// Player titles: the tab, and one opened. The one part of the app with no art.

export const titles = {
  of: (have: number, all: number) => `${have} of ${all} titles`,

  search: (n: number) => `Search ${n} titles`,
  nothing: 'Nothing matches that.',

  yours: 'Yours',
  notYours: 'Not yours',

  noArt:
    'The one tab with no art in it. A title is a string, so it gets type, the ' +
    'pennant the game draws it in, and the only grey gradient in the app — ' +
    'inventing a colour here would be inventing data. A list rather than a ' +
    'grid, because what is being compared is words.',

  waitingWhy:
    'The tab bar is drawn for real because it needs no data. Everything under ' +
    'it is waiting on the titles catalogue, which is the smallest of the four ' +
    'and still one fetch the browser keeps.',

  none: 'A title has no art',
  noneWhy: (n: number) =>
    `${n} of them and not one picture between them: a title is a string the ` +
    `game prints next to your name. So this screen gets the pennant the game ` +
    `draws it in, type at the size the game uses, and the one grey ramp in the ` +
    `app. Giving it a colour would mean inventing one.`,

  inMatch: 'What it looks like in a match',
  inMatchWhy:
    'Riot draws it in a bracket after your name on the scoreboard. We show the ' +
    'string and the frame and stop there — drawing a fake scoreboard around it ' +
    'would be dressing a fact up as a screenshot.',
};

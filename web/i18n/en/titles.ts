// Player titles: the tab, and one opened. The one part of the app with no art.

export const titles = {
  of: (have: number, all: number) => `${have} of ${all} titles`,

  search: (n: number) => `Search ${n} titles`,
  nothing: 'Nothing matches that.',

  yours: 'Yours',
  notYours: 'Not yours',

  // The pennant and the one grey ramp are on screen on the opened title, so
  // they are not named. This note says the shape — why it is a list rather than
  // a grid — and the closing line every tab carries.
  noArt:
    'A title is a string, so it is a list rather than a grid: what is being ' +
    'compared is words. Every title in the game is here, not only yours.',

  waitingWhy:
    'Waiting on the titles catalogue: one fetch the browser keeps, so this ' +
    'screen belongs to a first visit.',

  none: 'A title has no art',
  noneWhy: (n: number) =>
    `${n} of them and not one picture between them: a title is a string the ` +
    `game prints next to your name. Giving it a colour would mean inventing one.`,

  inMatch: 'What it looks like in a match',
  inMatchWhy:
    'Riot draws it in a bracket after your name on the scoreboard. We show the ' +
    'string and the frame and stop there.',
};

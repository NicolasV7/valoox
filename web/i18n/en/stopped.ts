// The screen the footer of an email leads to.

export const stopped = {
  sure: 'Stop the alerts?',
  sureWhy: 'The morning email stops. What you starred is untouched.',
  yesStop: 'Yes, stop',
  no: 'No',

  stopped: 'Done',
  noMoreTo: (to: string) => `Nothing else goes to ${to}.`,
  alreadyOff: 'There was no address stored, so nothing was going out.',
  keptCount: (n: number) =>
    n === 1 ? 'Your star stays where it was.' : `All ${n} of your stars stay where they were.`,
  keptNone: 'You had not starred anything.',

  nothingChanged: 'Nothing changed',
  stillOn: 'The alerts are still running. You can close this tab.',

  alreadyUsed: 'This link has been used',
  alreadyUsedWhy:
    'You already answered from here, and every email carries its own. To ' +
    'change your mind, do it in the app, or use the link in the next email.',
  couldNot: 'That link does not work',
  couldNotWhy: 'It opened no row. It may no longer be valid, or it may not be the whole link.',
};

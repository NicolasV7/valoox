// The screen the footer of a message leads to.

export const stopped = {
  sure: 'Stop the alerts?',
  sureWhy: 'The morning mail stops. What you starred is untouched.',
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

  couldNot: 'That link does not work',
  couldNotWhy: 'It opened no row. It may no longer be valid, or it may not be the whole link.',
};

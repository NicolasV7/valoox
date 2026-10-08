// The screen the footer of a message leads to.

export const stopped = {
  stopping: 'Stopping…',
  stopped: 'Done, nothing more goes out',
  couldNot: 'We could not stop it',
  couldNotWhy:
    'The link did not open a row. It may no longer be valid, or that account’s ' +
    'session may have expired — either way there is nowhere left to send ' +
    'anything, so the result is the same.',

  noMoreTo: (to: string) => `${to} is off. Nothing else goes to that address.`,
  alreadyOff: 'There was no address stored, so nothing was going out.',

  standby: 'Your list is on standby',
  keptCount: (n: number) =>
    n === 1
      ? 'The one thing you starred is still there, untouched. Nobody touches it.'
      : `All ${n} things you starred are still there, untouched. Nobody touches them.`,
  keptNone: 'You had not starred anything yet. Star something and it waits here.',
  putOneBack: 'Add another address',

  whatWeDid:
    'What happened exactly: the address was removed from your row and the hold ' +
    'on it was released, so it is free to use again, here or on another ' +
    'account. The daily job stops looking at this row until there is a new ' +
    'verified address.',
  riotIsSeparate:
    'This does not touch your Riot session or your account. It is only where ' +
    'the morning mail was going.',
};

// Alerts. The one tab whose whole subject is ours: what you starred and where
// it would go live in our own row, so nothing here waits on Riot.

export const alerts = {
  what:
    'Star the skins you are waiting for. When one turns up in your store we ' +
    'send it — once, just after your store rotates.',

  // --- first run -----------------------------------------------------------
  noneYet: 'Nothing starred yet',
  someYet: (n: number) => `${n} starred`,
  twoThings: 'Two things to do, in this order: pick where the alert goes, then star a skin.',

  stepOne: 'Step 1 · where it goes',
  stepTwo: 'Step 2 · what to watch',

  yourEmail: 'Your email',
  oneAddress: 'One address, verified once.',

  searchASkin: 'Search a skin…',
  opensOnce:
    'Opens once a channel is saved. Sending to nowhere is the one failure a ' +
    'notifier must not hide.',

  whatAStarIs:
    'A star here is a row in our database with a skin id and the name you saw — ' +
    'nothing else. The daily job intersects that list with your store and sends ' +
    'the names that match.',

  // --- waiting -------------------------------------------------------------
  whereItGoes: 'Where it goes',
  watching: 'Watching',
  waitingWhy:
    'What you are watching and where it goes are ours, in our own row: one call ' +
    'to this origin, nothing to Riot and nothing to the catalogue, which is why ' +
    'this wait is short. The names and the renders come after, from the ' +
    'community catalogue, and that is why the faces are the only grey.',
};

// The account, and leaving.
//
// Account and not Settings: there is nothing here to configure. Who is signed
// in, the things worth saying out loud, the coffee, and the way out. The
// order is the rule — the further down, the more permanent — and the only
// destructive thing is last and red.

export const account = {
  title: 'Account',

  // --- who is signed in ----------------------------------------------------
  live: 'Connected',
  region: 'Region',
  lastSeen: (said: string) => `Session used ${said}`,
  justNow: 'just now',
  daysAgo: (n: number) => (n === 1 ? 'a day ago' : `${n} days ago`),
  hoursAgo: (n: number) => (n === 1 ? 'an hour ago' : `${n} hours ago`),

  // --- the sections --------------------------------------------------------
  alerts: 'Alerts',
  whereAlertsGo: 'Where alerts go',
  noAddress: 'No address yet',
  verified: 'Verified',
  notVerified: 'Not verified',
  watching: 'What you are watching',
  starredCount: (n: number) =>
    n === 0 ? 'Nothing starred' : n === 1 ? 'One thing starred' : `${n} things starred`,
  outOf: (n: number, max: number) => `${n} / ${max}`,

  honest: 'The honest bits',
  whatWeKeep: 'What we keep',
  whatWeKeepUnder: 'One sealed row, your list, your address',
  whatItCalls: 'What it is allowed to call',
  whatItCallsUnder: (n: number) => `${n} lines, and nearly all of them read`,
  madeBy: 'Made by',
  madeByUnder: 'NicolasV7 · Termo#GOD in game',

  legal:
    'VALORANT and its art belong to Riot Games, Inc. valoox is not affiliated ' +
    'with Riot. Names and renders come from valorant-api.com; prices come from ' +
    'your own account.',

  leaving: 'Leaving',
  disconnect: 'Disconnect',
  disconnectUnder: 'Deletes the jar and your email.',

  // --- what we keep --------------------------------------------------------
  keepTitle: 'What we keep',
  keepLede:
    'Worth saying first: the session this app holds reads your account without ' +
    'a password and without a second factor. That is what scanning hands over.',
  kept: 'Kept',
  notKept: 'Not kept',

  keepJar: 'The sealed jar',
  keepJarWhy:
    'Riot’s cookies, encrypted before they are written. The key lives in the ' +
    'Worker’s secrets, not in the database, so a copy of the database alone ' +
    'opens nothing.',
  keepWho: 'Your account id and region',
  keepWhoWhy: 'Riot answers to the id, not to a name. The region is where your store comes from.',
  keepList: 'Your list',
  keepListWhy:
    'Ids and the names you saw when you starred them, plus the tier, the levels ' +
    'and the measured colour. It lives inside the same sealed row.',
  keepMail: 'Your email, once proved',
  keepMailWhy:
    'The address, a flag saying a code came back from it, and the language and ' +
    'time zone of the tab that set it. It goes with the jar when you disconnect.',

  noPassword: 'Your password',
  noPasswordWhy: 'Never typed here. There is no field for it anywhere in the app.',
  noLog: 'A log of what you looked at',
  noLogWhy:
    'Request logging is off. The storefront path carries your account id, so ' +
    'logging it would be logging you.',
  noReach: 'A way to reach you after you disconnect',
  noReachWhy:
    'The jar and the address go together, and the whole row with them. Nothing ' +
    'is left that can reach your account or write to you.',

  twoLocks:
    'Two locks, not one: the database holds ciphertext and the key is held ' +
    'elsewhere. Rotating that key retires every stored jar at once.',
  alsoKv:
    'Outside that row, what expires on its own: your store and inventory cached; ' +
    'the hash of a six-digit code, ten minutes; a message id for this browser, ' +
    'a week.',

  // --- leaving -------------------------------------------------------------
  leaveTitle: 'Disconnect this browser',
  leaveLede:
    'One row is deleted and this app can no longer reach your account. Scanning ' +
    'a new code starts over.',
  goes: 'What goes',
  goesJar: 'The sealed jar — the only thing here that can read your account',
  goesMail: 'Your email address and its verified flag',
  goesList: 'Your starred list, which lives inside the same row',
  staysTitle: 'What keeps existing',
  staysRiot:
    'The session you approved on your phone. It keeps existing on Riot’s side ' +
    'until it expires on its own: deleting the jar ends our access, not the ' +
    'credential.',
  staysWhy: 'To end that session at the source, Riot’s account page signs out every device.',
  listGoesWhy:
    'The list goes with the row because it lives inside it. There is no second ' +
    'table keyed to your Riot id.',
  cancel: 'Cancel',
  noDialog: 'No confirmation dialog on top of this: this screen is the confirmation.',

  // --- riot said no --------------------------------------------------------
  gone: 'Your session expired at Riot',
  scanAgain: 'Scan again',
  notNow: 'Not now',
  whichTwo: 'Which of the two happened',
  itEnded: 'The session ended',
  itEndedWhy: 'This one. Riot refused the stored cookies, which is ordinary and expected.',
  riotChanged: 'Riot changed something',
  riotChangedWhy: 'A different message, and scanning again would not help.',
  jobSkips: 'The daily job skips a session it cannot open rather than retrying it.',
};

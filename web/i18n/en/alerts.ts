// Alerts. The one tab whose whole subject is ours: what you starred and where
// it would go live in our own row, so nothing here waits on Riot.

export const alerts = {
  what:
    'Star the skins you are waiting for. When one turns up in your store we ' +
    'send it — once, right after your store rotates.',

  // --- first run -----------------------------------------------------------
  noneYet: 'Nothing starred yet',
  someYet: (n: number) => `${n} starred`,
  twoThings: 'Two things to do, in this order: pick where the alert goes, then star a skin.',

  stepOne: 'Step 1 · where it goes',
  stepTwo: 'Step 2 · what to watch',

  yourEmail: 'Your email',
  oneAddress: 'One address, verified once.',
  // The Riot name goes in the email header, under the wordmark: `who` in
  // `src/alerts/mail/layout.ts`.
  sameInbox:
    'The same inbox works for several accounts. Every email carries the Riot ' +
    'name it is about at the top.',

  searchASkin: 'Search a skin…',
  // The gate is `mail.ok`, not an address being typed: AlertsFirst opens the
  // search on `mail?.ok === true` and nothing else.
  opensOnce: 'Opens once an address is verified.',

  // The row is the one `cleanWishlist` builds in `src/routes/wishlist.ts`, and
  // the same list `account.keepListWhy` spells out. Nothing that was not
  // already on the screen the star was pressed on.
  whatAStarIs:
    'A star here is a row in our database with what was already on screen: the ' +
    'skin id, the name, the tier, the levels and the measured colour.',

  // --- waiting -------------------------------------------------------------
  whereItGoes: 'Where it goes',
  watching: 'Watching',
  // The wait is short because this screen touches neither Riot nor the
  // catalogue: one call to this origin. Names and renders come after.
  waitingWhy:
    'What you are watching and where it goes are ours: one call to this origin, ' +
    'nothing to Riot. The names and the renders come after, from the community ' +
    'catalogue.',

  // --- where it goes -------------------------------------------------------
  email: 'Email',
  verified: 'Verified',
  notVerified: 'Not verified',
  notVerifiedYet: 'Saved, not verified yet.',
  pickSomething: 'Pick what to watch.',
  comingNext: 'The skin search is what comes next.',
  anAddress: 'An address you can open right now.',
  sendATest: 'Send the code',
  badAddress: 'That is not the shape of an address. Check the @ and the dot.',
  waitSeconds: (n: number) => `Wait ${n} seconds before asking for another code.`,
  // A server cannot see an inbox: all we know is that it went out.
  oneIsOut: 'A code is already on its way to that inbox.',
  testIsProof:
    'That code is the verification: you type it back and the address is proved. ' +
    'Until then, nothing else is sent here.',
  // A second channel doubles the ways a morning email goes missing and
  // halves the attention paid to either.
  oneChannel:
    'One channel, not a menu of them: an inbox is the one place everybody already checks.',
  whyACode:
    'Why a code and not a link: a link in an email gets clicked by scanners ' +
    'before a person sees it, which would verify an address nobody read.',
  // The old one does not keep receiving: `setChannel` overwrites `mail.to` and
  // leaves `ok` false, and `post()` only sends on `mail.ok === true`. There is
  // nowhere left to hold the previous address.
  changeItLater:
    'Change it later and the new address starts unverified: a code goes to it, ' +
    'and no email goes out until you type it back.',

  watch: (name: string) => `Watch ${name}`,

  // Why the star refuses the tap. Not "not in the store today" — this one is
  // handed out by a contract, so no store ever carries it and the alert could
  // never fire. See data/sellable.ts.
  notSoldOne: (name: string) => `${name} is not sold in the store`,
  notSoldWhy: 'This is earned, not sold, so an alert would never fire.',

  standby: 'Your list is on hold',
  standbyKept: (n: number) =>
    n === 1
      ? 'The one thing you starred is still here. Nothing goes out until an address is verified.'
      : `All ${n} things you starred are still here. Nothing goes out until an address is verified.`,
  standbyNone: 'Starring something needs a verified address first.',
  addAnAddress: 'Add an address',

  // --- the working list ----------------------------------------------------
  change: 'Change',
  weapons: 'Weapons',
  // Inside Weapons, to tell them from melee. Not "Weapons" again: a tab named
  // after the one above it says nothing.
  firearms: 'Guns',
  accessories: 'Accessories',
  rotatesIn: 'rotates in',
  noGuns: 'No weapon skin starred yet.',
  noBits: 'No accessory starred yet.',
  addSomething: 'Add something…',
  addSomethingTitle: 'Add something',
  outOf: (n: number, max: number) => `${n} / ${max}`,
  // There is no way to know what Riot sells: the public catalogue does not
  // say, and the endpoint that did is gone.
  onlyWhatTurnsUp:
    'The daily job checks this list against your store and sends what matches. ' +
    'What a pass or a contract hands out cannot be starred; of the rest, nobody ' +
    'can tell you when it rotates.',
  // The ceiling is about keeping the row small, not about compute: the daily
  // job is a set intersection and barely uses any.
  hundredWhy:
    'Fifty weapons and a hundred accessories: two different rotations, and ' +
    'filling one should not stop you on the other.',
  outOfBoth: (g: number, gm: number, b: number, bm: number) => `${g}/${gm} · ${b}/${bm}`,
  /** A tab, with how much sits behind it. */
  withCount: (said: string, n: number) => `${said} ${n}`,

  // --- adding --------------------------------------------------------------
  kinds: { spray: 'Spray', buddy: 'Buddy', card: 'Card', title: 'Title' },
  sellsCount: (n: number) => (n === 1 ? '1 you do not own.' : `${n} you do not own.`),
  listFull: (max: number) => `This list is full at ${max}. Take one off to star another.`,
  notInThisList:
    'What you already own is not here, and anything earned cannot be starred: a ' +
    'pass, a contract, a rank or a VCT reward. The rest is shown, though being ' +
    'here does not mean it turns up this week.',
  searchIsLocal:
    'The search runs against the catalogue the browser already holds, so it ' +
    'narrows as you type without asking the Worker or Riot anything.',

  // --- the code ------------------------------------------------------------
  sentOut: 'Sent',
  typeTheCode: 'Type the code we emailed you',
  sixDigitsTo: (to: string) =>
    `Six digits, to ${to}. It lasts ten minutes and allows five attempts.`,
  verify: 'Verify',
  sendItAgain: 'Send it again',
  codeWrong: (left: number) =>
    left > 0 ? `Not that one. ${left} attempts left.` : 'Not that one.',
  codeGone: 'That code expired. Ask for another.',
  codeSpent: 'No attempts left. Ask for a new code.',
  tenAndFive:
    'Ten minutes and five attempts, then the code dies and you ask for another: ' +
    'six digits is a million guesses, and without a ceiling a patient script ' +
    'gets there.',
  whatHappensAfter: 'What happens after',
  // What keeps this from being a button that mails strangers.
  afterWhy:
    'The address is marked verified and the morning email starts going to it. ' +
    'Nothing is sent to an address that has not carried a code back, not even once.',

  // --- refused -------------------------------------------------------------
  refusedLede: 'A test went out and the provider refused it. Your stars are untouched.',
  bouncedLede: 'A test went out and the receiving server sent it back. Your stars are untouched.',
  refusedWhy:
    'The address was rejected before anything was sent: this inbox does not ' +
    'work. Check the spelling and send another code.',
  wasRefused: 'Rejected',
  wasBounced: 'Bounced',
  wasBlocked: 'Blocked',
  blockedLede:
    'It did not even go out: that address was already marked as not receiving. ' +
    'Your stars are untouched.',
  blockedWhy:
    'That address is on the channel’s block list from an earlier bounce or ' +
    'complaint. Insisting does not take it off that list: it needs a different one.',
  bouncedWhy:
    'The email went out and the receiving server sent it back. Sending the ' +
    'same thing again cannot work: it needs a different address.',
  // Unused since one inbox serves several accounts. Kept because the Worker
  // can still return 'taken' if that rule ever comes back.
  taken:
    'That address is already verified on another account. This needs a ' +
    'different one, or disconnect the other account first.',
  changeIt: 'That address bounced: the receiving server sent it back. It needs to change.',
  // This one shows on `gotThere(said)`, which is `email.delivered` or
  // `email.opened`. That is what the provider said, not that an inbox holds
  // it: "reached the inbox" would be a claim nobody can see.
  alreadyThere:
    'The provider says the receiving server took it, and the code is still ' +
    'live. When it expires, the button comes back.',
  sendAnother: 'Send another code',
  editAddress: 'Edit the address',
  oneChannelMeans:
    'One channel means a refusal is the whole story: nothing went anywhere. The ' +
    'daily job keeps running, but it has nowhere to put the result.',
  codeIsTheirs:
    'A rejection is the address being wrong before anything went out; a bounce ' +
    'is the far end sending it back after looking at it.',
  canAndCannot: 'What a send can and cannot tell you',
  canTell: 'That the channel accepted it, and then whatever that channel tells us',
  cannotTell: 'That it reached an inbox, survived a spam filter, or was read',
};

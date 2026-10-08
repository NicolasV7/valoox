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
  oneIsOut: 'A code is already on its way to that mailbox.',
  testIsProof:
    'That code is the verification: you type it back and only then is the ' +
    'address proved. Until that happens, nothing else is sent here.',
  oneChannel:
    'One channel, not a menu of them. A second one doubles the ways a morning ' +
    'message can go missing and halves the attention paid to either — and an ' +
    'inbox is the one place everybody already checks.',
  whyACode:
    'Why a code and not a link: a link in a mail gets clicked by scanners ' +
    'before a person sees it, which would verify an address nobody read. A code ' +
    'has to be carried back by hand.',
  changeItLater:
    'Change it later and the new address starts unverified — a code goes to the ' +
    'new one, and the old one keeps receiving until the new code is typed back. ' +
    'Nothing stops silently.',

  watch: (name: string) => `Watch ${name}`,

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
  accessories: 'Accessories',
  rotatesIn: 'rotates in',
  noGuns: 'No gun skin starred yet.',
  noBits: 'No accessory starred yet.',
  addSomething: 'Add something…',
  addSomethingTitle: 'Add something',
  outOf: (n: number, max: number) => `${n} / ${max}`,
  onlyWhatTurnsUp:
    'The daily job crosses this list with your store and sends the names that ' +
    'match. If you starred something Riot does not sell — most of the battle ' +
    'pass, every event reward — the row is there and will never match. There ' +
    'is no way to know which those are: the public catalogue does not say, and ' +
    'the Riot endpoint that did say is gone.',
  hundredWhy:
    'A hundred is the ceiling for both lists together. The daily job is a set ' +
    'intersection and the whole list rides in one row, so the limit is about ' +
    'keeping that row small — not about compute, which this job barely uses.',

  // --- adding --------------------------------------------------------------
  kinds: { spray: 'Spray', buddy: 'Buddy', card: 'Card', title: 'Title' },
  sellsCount: (n: number) => (n === 1 ? '1 you do not own.' : `${n} you do not own.`),
  listFull: (max: number) =>
    `The list is full at ${max} across both. Take one off to star another.`,
  notInThisList:
    'What is not here: anything you already own, and every knife — the daily ' +
    'panel is four guns and never a melee. The battle pass is here, and that ' +
    'is not an oversight: nothing published says which skins Riot sells, so ' +
    'showing them and telling you this beats filtering by guesswork.',
  searchIsLocal:
    'The search runs against the catalogue the browser already holds, so it ' +
    'narrows as you type without asking the Worker or Riot anything.',

  // --- the code ------------------------------------------------------------
  sentOut: 'Sent',
  typeTheCode: 'Type the code we mailed you',
  sixDigitsTo: (to: string) =>
    `Six digits, to ${to}. It is good for ten minutes and five attempts.`,
  verify: 'Verify',
  sendItAgain: 'Send it again',
  codeWrong: (left: number) =>
    left > 0 ? `Not that one. ${left} attempts left.` : 'Not that one.',
  codeGone: 'That code expired. Ask for another.',
  codeSpent: 'No attempts left. Ask for a new code.',
  tenAndFive:
    'Ten minutes and five attempts, then the code dies and you ask for another. ' +
    'Both numbers exist for the same reason: a six-digit code is a million ' +
    'guesses, and without a ceiling a patient script gets there.',
  whatHappensAfter: 'What happens after',
  afterWhy:
    'The address is marked verified and the morning message starts going to it. ' +
    'Nothing is sent to an address that has not carried a code back — not even ' +
    'once — which is what keeps this from being a button that mails strangers.',

  // --- refused -------------------------------------------------------------
  refusedLede:
    'A test went out and the provider refused it. Nothing here is lost — your ' +
    'stars are untouched.',
  bouncedLede:
    'A test went out and the receiving server sent it back. Nothing here is ' +
    'lost — your stars are untouched.',
  refusedWhy:
    'The address was rejected before anything was sent: this mailbox does not ' +
    'work. Not that it is full, and not that it bounced later. Check the ' +
    'spelling and send another code.',
  wasRefused: 'Rejected',
  wasBounced: 'Bounced',
  wasBlocked: 'Blocked',
  blockedLede:
    'It did not even go out: that address was already marked as not ' +
    'receiving. Nothing here is lost — your stars are untouched.',
  blockedWhy:
    'The channel declined to try. That address is on its block list from an ' +
    'earlier bounce or complaint, so nothing of ours will go there. Insisting ' +
    'does not take it off that list: it needs a different one.',
  bouncedWhy:
    'The message went out and the receiving server sent it back. That is the ' +
    'mailbox itself saying no, so sending the same thing again is the one piece ' +
    'of advice that cannot help: it needs a different address.',
  taken:
    'That address is already verified on another account. One mailbox receives ' +
    'for one account, so this needs a different one — or disconnect the other ' +
    'account first.',
  changeIt:
    'That address bounced: the receiving server sent it back. Sending it the ' +
    'same thing again is the one thing that cannot work, so it needs to ' +
    'change.',
  alreadyThere:
    'That message already reached the mailbox and the code it carries is still ' +
    'live. Look there. When it expires, the button comes back.',
  sendAnother: 'Send another code',
  editAddress: 'Edit the address',
  oneChannelMeans:
    'One channel means a refusal is the whole story: nothing went anywhere. ' +
    'Your stars are untouched and the daily job keeps running — it just has ' +
    'nowhere to put the result until this clears.',
  codeIsTheirs:
    'The two are different things. A rejection is the address being wrong ' +
    'before anything went out, and it will stay wrong; a bounce is the far end ' +
    'sending it back after looking at it.',
  canAndCannot: 'What a send can and cannot tell you',
  canTell: 'That the channel accepted it, and then whatever that channel tells us',
  cannotTell: 'That it reached an inbox, survived a spam filter, or was read',
};

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
  comingNext: 'The skin search is what comes next.',
  anAddress: 'An address you can open right now.',
  sendATest: 'Send the code',
  badAddress: 'That is not the shape of an address. Check the @ and the dot.',
  waitSeconds: (n: number) => `Wait ${n} seconds before asking for another code.`,
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

  // --- the code ------------------------------------------------------------
  sentAs: (said: string) => `Sent · ${said}`,
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
  refusedWhy: (said: string) =>
    `The address was rejected before anything was sent. ${said} is the provider ` +
    `saying this mailbox does not work — not that it is full, and not that it ` +
    `bounced later. Check the spelling and send another code.`,
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
    'Resend says that message was opened, so it reached the mailbox, and the ' +
    'code it carries is still live. Look there. When it expires, the button ' +
    'comes back.',
  sendAnother: 'Send another code',
  editAddress: 'Edit the address',
  oneChannelMeans:
    'One channel means a refusal is the whole story: nothing went anywhere. ' +
    'Your stars are untouched and the daily job keeps running — it just has ' +
    'nowhere to put the result until this clears.',
  codeIsTheirs:
    'The code comes from the provider, not from us, and is shown exactly as ' +
    'received. A 4xx is the address being wrong and will stay wrong; a bounce is ' +
    'the far end sending it back after looking at it.',
  canAndCannot: 'What a send can and cannot tell you',
  canTell: 'That the channel accepted it (a 2xx), and then whatever its webhook says',
  cannotTell: 'That it reached an inbox, survived a spam filter, or was read',
};

// The way in: four screens that are all one argument. A stranger is about to
// scan a code that signs into their game account, and the only thing that earns
// that is saying plainly what happens — before they do it, not after.

export const gate = {
  title: 'Your VALORANT store, without opening the game.',
  lede: 'Before you scan, here is what happens to your account.',

  // One line each wherever the sentence allows it. This screen has to be read
  // in one piece on a phone, and a fact below the fold is a fact nobody read —
  // the long version of all four is on valoox.store, where somebody who wants
  // it goes looking.
  facts: {
    password: 'Your password never comes here.',
    passwordWhy: 'It is typed in Riot’s own app, never on this page.',
    keep: 'We keep one thing.',
    keepWhy: 'The session Riot returns, encrypted, with the key held elsewhere.',
    read: 'It only knows how to read.',
    readWhy: 'Buying, equipping and queueing are not in the code, and a test proves it.',
    leave: 'You can leave.',
    leaveWhy: 'Disconnect and it is deleted at once. At Riot it expires on its own.',
  },

  show: 'Show me the code',
  // The one line on this screen that is also an instruction: a QR that points
  // anywhere else is the attack this flow has.
  destination: 'The code points at',
  destinationWhy: 'It has to.',

  scan: {
    title: 'Scan the code, or open the app.',
    lede: 'Either way Riot approves the sign-in on your phone. Nothing is typed here.',
    how: 'Open Riot Mobile on your phone: Profile → Settings → Scan QR code.',
    or: 'or',
    open: 'Open Riot Mobile',
    openWhy: 'If you are reading this on the phone itself.',
    waiting: 'Waiting for you to approve it…',
    alt: 'QR code for the Riot sign-in',
  },

  approved: {
    title: 'You’re in.',
    as: (name: string, tag: string) => `${name}#${tag}`,
    loading: 'Loading your store…',
    nothingTyped: 'Riot approved the scan. Nothing you typed came through this page.',
  },

  expired: {
    title: 'This code expired.',
    lede:
      'They last about two minutes, on purpose. One left lying around is a way ' +
      'into your account.',
    again: 'Make a new code',
    nothingHappened: 'Nothing happened to your account. An expired code is simply ignored by Riot.',
  },
};

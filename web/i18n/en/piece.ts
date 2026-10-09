// A card, a spray, a buddy or a title, opened. One screen, four bodies — so
// four sets of facts, because what Riot publishes for each kind is different
// and the screen says which.

export const piece = {
  kind: 'Kind',
  goesOn: 'Goes on',
  oneAtATime: 'One weapon at a time',
  yours: 'Already yours',
  yes: 'Yes',
  no: 'No',

  /** The one line inside a title's stage. */
  markSays: 'The mark says what it is. The word is the item.',

  crops: 'The other two crops',
  wideWhere: 'Wide · the lobby, behind your name',
  smallWhere: 'Small · the scoreboard, at 54px',
  size: '128×128',

  buddyNote:
    'Riot publishes one 128×128 image for a buddy. The light behind it comes ' +
    'from that image: an accessory has no rarity to borrow a colour from.',
  // The light comes off the art because an accessory has no rarity: buddyNote
  // already says that, and the four notes never appear together.
  cardNote:
    'Riot ships all three and they are crops, not scales: the tall one has ' +
    'detail the small one never shows.',
  titleNote:
    'The Riot catalogue gives a title a titleText and no image field at all. ' +
    'The mark above is the one the game uses, not artwork for this one.',
  sprayNote:
    'Some sprays animate in game. Riot publishes those frames as animationGif; ' +
    'this one has none.',
  sprayMoves:
    'This one animates in game: what you are watching are the frames Riot ' +
    'publishes. Most sprays have none.',
};

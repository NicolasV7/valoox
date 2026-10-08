// A card, a spray, a charm or a title, opened. One screen, four bodies — so
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
    'Riot publishes one 128×128 image for a buddy and nothing else. The light ' +
    'behind it is taken from that image: an accessory has no rarity, so there ' +
    'is no tier colour to borrow.',
  cardNote:
    'Riot ships all three and they are cropped differently, not scaled — the ' +
    'tall one has detail the small one never shows. The light on this screen is ' +
    'taken from the art itself; an accessory has no rarity to borrow a colour from.',
  titleNote:
    'Riot’s catalogue gives a title a titleText and no image field at all. The ' +
    'mark above is the game’s own, used wherever a title appears — it says ' +
    '“this is a title”. It is not artwork for this one, because none exists.',
  sprayNote:
    'Some sprays animate in game. Riot publishes the frames for those as ' +
    'animationGif; this one has none, so what you see is what it is.',
  sprayMoves:
    'This one animates in game, and what you are watching are the frames Riot ' +
    'publishes rather than a still of them: most sprays have none.',
};

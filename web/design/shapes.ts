// What shape a thing takes on a grid, and how a grid of them tiles.
//
// No imports and nothing async: two lookup tables keyed by Riot's item type
// uuids and one piece of arithmetic. That is also why it lives here rather
// than in data/ — nothing in this file resolves an id against anything, and a
// test can read it without pulling the DOM in behind it.

/** Which of the four shapes a piece takes. Shape follows the kind of thing,
 *  never the slot it came from — that is what lets a ten-piece bundle and a
 *  random accessory drop share one grid. */
export type Shape = 'row' | 'tile' | 'portrait' | 'text';

const SHAPE: Record<string, Shape> = {
  'e7c63390-eda7-46e0-bb7a-a6abdacd2433': 'row', // a gun
  'dd3bf334-87f3-40bd-b043-682a57a8dc3a': 'tile', // a charm
  'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475': 'tile', // a spray
  '3f296c07-64c3-494c-923b-fe692a4fa1bd': 'portrait', // a card
  'de7caa6b-adf7-4588-bbd1-143831e786c6': 'text', // a title
};

export const shapeOf = (type: string): Shape => SHAPE[type] ?? 'tile';

/** What a piece IS, as a key rather than a word — the word lives in i18n.
 *
 *  Shape and kind are not the same question: a spray and a charm are both
 *  squares and are not the same thing, and "Dragon" inside a bundle is a name
 *  that says nothing at all without one of these under it. */
export type Kind = 'skin' | 'buddy' | 'spray' | 'card' | 'title';

const KIND: Record<string, Kind> = {
  'e7c63390-eda7-46e0-bb7a-a6abdacd2433': 'skin',
  'dd3bf334-87f3-40bd-b043-682a57a8dc3a': 'buddy',
  'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475': 'spray',
  '3f296c07-64c3-494c-923b-fe692a4fa1bd': 'card',
  'de7caa6b-adf7-4588-bbd1-143831e786c6': 'title',
};

export const kindOf = (type: string): Kind | null => KIND[type] ?? null;

// --- how a two-column grid of them tiles ------------------------------------

/** What a tile is allowed to grow into when the grid would otherwise gap. */
export type Span = 'normal' | 'tall' | 'wide';

/**
 * The order the kinds are laid in: the tall things, then the squares, then the
 * lines of text.
 *
 * Grouping is the whole fix. The previous version kept Riot's order and tried
 * to close the holes by growing one piece, and for two cards and two sprays it
 * counted six cells into four rows and called it even — which is the photo:
 * a card, two stacked sprays, a card, and a hole beside the second card. Six
 * cells do not tile two columns unless the pieces that want two rows stand
 * next to each other.
 *
 * Cards before sprays before charms is also how a person reads the week: the
 * big picture first, the small ones under it. Nothing here is Riot's order,
 * and nothing about a weekly drop makes their order mean anything.
 */
const ORDER: Record<Kind, number> = { card: 0, skin: 1, spray: 2, buddy: 3, title: 4 };

export interface Laid {
  /** Indices into the caller's own array, in the order they should be drawn. */
  order: number[];
  /** What each piece grows into, by the caller's own index. */
  span: Span[];
}

/**
 * How a week's mix of pieces fills two columns with no hole in it.
 *
 * Count in cells. A portrait is one column by two rows, a line of text is two
 * by one, a square is one by one. Text is always whole. The two that can
 * leave a gap are a portrait with nothing to pair with and an odd square:
 *
 *   · portraits pair off cleanly, two side by side filling two rows
 *   · an odd portrait leaves a one-by-two slot beside it, which two squares
 *     fill exactly — so two of them go there and the rest carry on
 *   · an odd portrait with only one square: that square takes both rows
 *   · an odd portrait with no square at all: it takes both columns instead
 *   · whatever squares are left pair off; an odd one takes both columns
 *
 * Two columns, deliberately. Three is a different problem, not this one with
 * a bigger number.
 */
export function lay(kinds: Array<Kind | null>): Laid {
  const span: Span[] = kinds.map(() => 'normal');
  const order = kinds.map((_, i) => i).sort((a, b) => rank(kinds[a]) - rank(kinds[b]) || a - b);

  const isa = (want: Shape) => order.filter((i) => shapeFor(kinds[i]) === want);

  const portraits = isa('portrait');
  const squares = isa('tile');
  const spare = portraits.length % 2 === 1 ? (portraits.at(-1) as number) : null;

  // The odd portrait first, because what it needs decides what the squares
  // have left to do.
  let free = squares.length;
  if (spare !== null) {
    if (free === 0) span[spare] = 'wide';
    else if (free === 1) span[squares[0] as number] = 'tall';
    // Two or more: the first two slot in beside it and need no help.
    free = Math.max(0, free - 2);
  }

  // A square with nobody to stand beside takes the whole row rather than half
  // of one — growing it downwards instead would open a hole under it.
  if (free % 2 === 1) span[squares.at(-1) as number] = 'wide';

  return { order, span };
}

const rank = (k: Kind | null): number => (k ? ORDER[k] : ORDER.spray);

const shapeFor = (k: Kind | null): Shape =>
  k === 'card' ? 'portrait' : k === 'title' ? 'text' : k === 'skin' ? 'row' : 'tile';

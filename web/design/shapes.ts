// What shape a thing takes on a grid, and how a grid of them tiles.
//
// No imports and nothing async: it is two lookup tables keyed by Riot's item
// type uuids and one piece of arithmetic. That is also why it lives here
// rather than in data/ — nothing in this file resolves an id against
// anything, and a test can read it without pulling the DOM in behind it.

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
 * Which pieces have to grow so a two-column grid has no hole in it.
 *
 * The accessory store is four pieces and never the same four: Riot picks a
 * card, a charm, a spray, a title in whatever mix it likes, and the shapes
 * tile differently every week. So this is arithmetic rather than a layout
 * drawn for one of them.
 *
 * Count the cells. A title is two columns by one row, a portrait is one by
 * two, a square is one by one — so titles and portraits are always even and a
 * square is the only thing that can leave the count odd. An odd count cannot
 * fill whole rows, and the leftover cell is the hole.
 *
 * Three ways out, and which one applies is decided by what the odd square has
 * to stand next to:
 *
 *   · an unpaired portrait, so the column beside it wants two cells
 *     -> the square takes both rows, and the two of them close the block
 *   · no unpaired portrait, so the square is alone on its row
 *     -> the square takes both columns instead; stretching it downwards here
 *        would open a second hole under it rather than close the first
 *   · a portrait with no square at all to stand beside it
 *     -> the portrait takes both columns
 *
 * Two columns, deliberately: the bundle's grid is three across and the
 * arithmetic there is a different problem, not this one with a bigger number.
 */
export function spans(shapes: Shape[]): Span[] {
  const out: Span[] = shapes.map(() => 'normal');
  const at = (want: Shape) => {
    const found: number[] = [];
    for (const [i, s] of shapes.entries()) if (s === want) found.push(i);
    return found;
  };

  const portraits = at('portrait');
  const squares = at('tile');
  const oddPortrait = portraits.length % 2 === 1;

  if (squares.length % 2 === 1) {
    out[squares[0] as number] = oddPortrait ? 'tall' : 'wide';
  } else if (oddPortrait && squares.length === 0) {
    out[portraits[0] as number] = 'wide';
  }
  return out;
}

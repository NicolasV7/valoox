import assert from 'node:assert';
import { test } from 'vitest';
import { type Kind, lay } from '../../web/design/shapes.ts';

// Two columns, and never a hole.
//
// The check is arithmetic rather than a picture: lay out the pieces the way
// `grid-auto-flow: dense` would and assert that the cells it touches form a
// solid rectangle. That catches the case the old solver called even and the
// screen drew with a gap — two cards and two sprays.

const CELLS: Record<Kind, [cols: number, rows: number]> = {
  card: [1, 2],
  title: [2, 1],
  spray: [1, 1],
  buddy: [1, 1],
  skin: [1, 1],
};

/** Place each piece the way a two-column dense grid would, and return the set
 *  of filled cells plus how many rows were touched. */
function pack(kinds: Kind[]) {
  const { order, span } = lay(kinds);
  const filled = new Set<string>();
  const taken = (c: number, r: number) => filled.has(c + ':' + r);

  for (const i of order) {
    const cell = CELLS[kinds[i] as Kind];
    let w = cell[0];
    let h = cell[1];
    if (span[i] === 'wide') w = 2;
    if (span[i] === 'tall') h = 2;

    // Dense: first position, scanning rows then columns, where it fits.
    let put = false;
    for (let r = 0; r < 64 && !put; r++) {
      for (let c = 0; c + w <= 2 && !put; c++) {
        let ok = true;
        for (let dc = 0; dc < w; dc++)
          for (let dr = 0; dr < h; dr++) {
            if (taken(c + dc, r + dr)) ok = false;
          }
        if (!ok) continue;
        for (let dc = 0; dc < w; dc++)
          for (let dr = 0; dr < h; dr++) {
            filled.add(c + dc + ':' + (r + dr));
          }
        put = true;
      }
    }
    assert.ok(put, 'nowhere to put ' + kinds[i]);
  }

  const rows = Math.max(...[...filled].map((k) => Number(k.split(':')[1]))) + 1;
  return { filled, rows };
}

/** Every cell of every row the grid touches is filled. */
function solid(kinds: Kind[]) {
  const { filled, rows } = pack(kinds);
  const holes: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 2; c++) if (!filled.has(c + ':' + r)) holes.push(c + ':' + r);
  }
  assert.deepEqual(holes, [], kinds.join('+') + ' leaves ' + holes.join(', '));
}

test('the week in the photo: two cards and two sprays', () => {
  // The one the old solver got wrong. It counted six cells, called them even,
  // and drew a card, two stacked sprays, a card, and a hole.
  solid(['card', 'spray', 'spray', 'card']);
});

test('every mix of four Riot can actually send', () => {
  const kinds: Kind[] = ['card', 'spray', 'buddy', 'title'];
  for (const a of kinds)
    for (const b of kinds) for (const c of kinds) for (const d of kinds) solid([a, b, c, d]);
});

test('and every mix of one, two and three', () => {
  const kinds: Kind[] = ['card', 'spray', 'buddy', 'title'];
  for (const a of kinds) {
    solid([a]);
    for (const b of kinds) {
      solid([a, b]);
      for (const c of kinds) solid([a, b, c]);
    }
  }
});

test('a bundle is the same grid with more in it', () => {
  // Fourteen pieces, every shape, in the order Riot happened to send them.
  solid([
    'spray',
    'card',
    'buddy',
    'title',
    'spray',
    'card',
    'buddy',
    'spray',
    'title',
    'card',
    'buddy',
    'spray',
    'card',
    'title',
  ]);
  for (let n = 5; n <= 12; n++) {
    const mix: Kind[] = [];
    for (let i = 0; i < n; i++) mix.push((['card', 'spray', 'buddy', 'title'] as Kind[])[i % 4]);
    solid(mix);
  }
});

test('cards lead, then sprays, then charms, then titles', () => {
  const kinds: Kind[] = ['title', 'buddy', 'spray', 'card'];
  assert.deepEqual(lay(kinds).order, [3, 2, 1, 0]);
});

test('two of a kind keep the order they came in', () => {
  // Nothing about a weekly drop makes Riot's order mean anything, but two
  // pieces of one kind have no reason to swap.
  const kinds: Kind[] = ['spray', 'spray', 'card', 'card'];
  assert.deepEqual(lay(kinds).order, [2, 3, 0, 1]);
});

test('an odd card with nothing square beside it takes the row', () => {
  const { order, span } = lay(['card', 'title']);
  assert.equal(span[0], 'wide');
  assert.deepEqual(order, [0, 1]);
});

test('an odd card with one square: the square takes both rows', () => {
  const { span } = lay(['card', 'spray']);
  assert.equal(span[0], 'normal');
  assert.equal(span[1], 'tall');
});

test('an odd card with two squares needs nobody to grow', () => {
  const { span } = lay(['card', 'spray', 'buddy']);
  assert.deepEqual(span, ['normal', 'normal', 'normal']);
});

test('a square with nobody beside it takes the row, not the column', () => {
  // Growing it downwards would open a hole under it rather than close one.
  const { span } = lay(['spray']);
  assert.equal(span[0], 'wide');
});

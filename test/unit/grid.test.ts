import assert from 'node:assert';
import { test } from 'vitest';
import { type Shape, spans } from '../../web/design/shapes.ts';

// The accessory store is four pieces and never the same four. A title is two
// columns by one row, a portrait is one by two, a square is one by one — so a
// square is the only thing that can leave the cell count odd, and an odd count
// cannot fill whole rows. The leftover cell is the hole.
//
// This is here because that failure is silent: nothing throws, the grid just
// has a gap in it on the weeks the mix comes out odd.

const at = (...shapes: Shape[]) => spans(shapes);

/** Does this run of shapes fill every cell of a two-column grid? */
function whole(shapes: Shape[]): boolean {
  const cells = shapes.reduce((n, s, i) => {
    const grown = spans(shapes)[i];
    if (s === 'text' || grown === 'wide') return n + (s === 'portrait' ? 4 : 2);
    return n + (s === 'portrait' || grown === 'tall' ? 2 : 1);
  }, 0);
  return cells % 2 === 0;
}

test('an even mix needs no help', () => {
  // card, charm, spray, title — the common drop
  assert.deepEqual(at('portrait', 'tile', 'tile', 'text'), [
    'normal',
    'normal',
    'normal',
    'normal',
  ]);
});

test('a lone square beside an unpaired portrait takes both rows', () => {
  // title, card, charm, title — measured live on 2026-10-08, and the mix that
  // left a hole under the charm
  assert.deepEqual(at('text', 'portrait', 'tile', 'text'), ['normal', 'normal', 'tall', 'normal']);
  assert.deepEqual(at('portrait', 'tile'), ['normal', 'tall']);
  assert.deepEqual(at('portrait', 'tile', 'tile', 'tile'), ['normal', 'tall', 'normal', 'normal']);
});

test('a lone square with no portrait to pair with takes both columns', () => {
  // Growing it downwards here would open a second hole under it.
  assert.deepEqual(at('tile', 'text'), ['wide', 'normal']);
  assert.deepEqual(at('tile', 'tile', 'tile'), ['wide', 'normal', 'normal']);
  // Two portraits pair with each other, so the square is still on its own row.
  assert.deepEqual(at('portrait', 'portrait', 'tile'), ['normal', 'normal', 'wide']);
});

test('a portrait with nothing to stand beside it takes both columns', () => {
  assert.deepEqual(at('portrait', 'text'), ['wide', 'normal']);
  assert.deepEqual(at('portrait', 'portrait', 'portrait'), ['wide', 'normal', 'normal']);
});

test('nothing to solve', () => {
  assert.deepEqual(at('text', 'text'), ['normal', 'normal']);
  assert.deepEqual(at(), []);
});

test('every mix of four pieces comes out whole', () => {
  // The real constraint: whatever Riot sends, the grid fills its rows.
  const kinds: Shape[] = ['portrait', 'tile', 'text'];
  for (const a of kinds) {
    for (const b of kinds) {
      for (const c of kinds) {
        for (const d of kinds) {
          const mix = [a, b, c, d];
          assert.ok(whole(mix), 'leaves a hole: ' + mix.join(', '));
        }
      }
    }
  }
});

test('and every mix a bundle can hold', () => {
  // The same grid carries a bundle's contents now, and a bundle is between
  // four and ten pieces. Walk every length and every mix at that length —
  // 88,572 of them — rather than trusting that four generalises.
  const kinds: Shape[] = ['portrait', 'tile', 'text'];
  let checked = 0;
  for (let n = 1; n <= 10; n++) {
    for (let code = 0; code < 3 ** n; code++) {
      const mix: Shape[] = [];
      let left = code;
      for (let i = 0; i < n; i++) {
        mix.push(kinds[left % 3] as Shape);
        left = Math.floor(left / 3);
      }
      assert.ok(whole(mix), 'leaves a hole: ' + mix.join(', '));
      checked += 1;
    }
  }
  assert.ok(checked > 88_000, 'walked only ' + checked + ' mixes');
});

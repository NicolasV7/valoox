import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { test } from 'vitest';
import { fromPixels, NEUTRAL, toHsv, toRgb } from '../../web/design/hsv.ts';

// The one mechanic in the design that nothing else can check.
//
// Every wash in the app is this function's output, so a change here recolours
// the whole product at once — quietly, and only on screens somebody happens to
// open. design/palette.json holds 57 colours produced offline by the same rule;
// three of those images are kept here as the RGBA the offline pass saw, sampled
// at the same 96px longest side, so the two implementations can be compared
// exactly rather than by eye.
//
// If one of these moves, the port drifted. Fix the code, not the number.

const pixels = (name: string) =>
  new Uint8ClampedArray(gunzipSync(readFileSync('test/fixtures/' + name + '.rgba.gz')));

const CASES: Array<[string, string]> = [
  // Purple paint under a lot of near-black metal: the case a plain mean loses.
  ['v-reaver-vandal', '104, 92, 158'],
  // Red, and the reason melee needs this at all — every melee is Exclusive, so
  // the tier colour would make the whole slot one orange.
  ['v-oni-claw', '158, 53, 61'],
  // A spray, which is mostly transparent margin. The alpha floor earns its keep.
  ['cs-reaver-spray', '55, 27, 158'],
];

for (const [name, expect] of CASES) {
  test(name + ' measures ' + expect, () => {
    assert.equal(fromPixels(pixels(name)), expect);
  });
}

test('art with nothing opaque in it is grey, and visibly so', () => {
  assert.equal(fromPixels(new Uint8ClampedArray(64)), NEUTRAL);
});

test('the saturation comes from the vivid end, not the mean', () => {
  // Nine grey pixels and one saturated red. The mean is almost grey; the 88th
  // percentile is not. This is the whole reason the rule exists, so it gets a
  // case that fails loudly if somebody simplifies it back to an average.
  const px = new Uint8ClampedArray(10 * 4);
  for (let i = 0; i < 9; i++) px.set([128, 120, 124, 255], i * 4);
  px.set([255, 0, 0, 255], 9 * 4);
  const [, s] = toHsv(
    ...(fromPixels(px)
      .split(', ')
      .map((n) => Number(n) / 255) as [number, number, number]),
  );
  assert.ok(s > 0.42, 'saturation collapsed to the mean: ' + fromPixels(px));
});

test('hsv survives a round trip', () => {
  for (const rgb of [
    [0.4, 0.36, 0.62],
    [0.62, 0.21, 0.24],
    [0.21, 0.11, 0.62],
    [0.5, 0.5, 0.5],
  ] as Array<[number, number, number]>) {
    const back = toRgb(...toHsv(...rgb));
    for (const [i, c] of back.entries()) {
      assert.ok(Math.abs(c - (rgb[i] as number)) < 1e-9, rgb.join() + ' -> ' + back.join());
    }
  }
});

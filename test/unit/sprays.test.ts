import assert from 'node:assert';
import { globSync, readFileSync } from 'node:fs';
import { test } from 'vitest';

// One sticker, one screen.
//
// Each of these is picked for what it is OF — the gesture is the sentence the
// screen is making — so a drawing on two screens is two screens that have
// stopped being about anything in particular. It happened twice before this
// existed: the seal on both the failure screen and a broken link, and Gekko's
// open palms on both the expired scan and an empty collection tab.
//
// Unused is fine and not checked. One is drawn and waiting for the screen it
// belongs to.

const read = (p: string) => readFileSync(p, 'utf8');

/** Every call site, as "which sticker" -> "where". The mail names its own by
 *  path, because a message cannot import a module from the browser. */
function callers(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const add = (sticker: string, where: string) => {
    found.set(sticker, [...(found.get(sticker) ?? []), where]);
  };

  for (const file of globSync('web/**/*.tsx')) {
    for (const [, name] of read(file).matchAll(/SPRAY\.(\w+)/g)) add(name, file);
  }
  for (const file of globSync('src/**/*.ts')) {
    for (const [, name] of read(file).matchAll(/'\/art\/spray-([\w-]+)\.png'/g)) add(name, file);
  }
  return found;
}

test('no sticker is on two screens', () => {
  const twice = [...callers()]
    .filter(([, where]) => new Set(where).size > 1)
    .map(([name, where]) => name + ': ' + [...new Set(where)].join(', '));
  assert.deepEqual(twice, [], 'shared stickers — ' + twice.join(' | '));
});

test('every sticker a screen asks for is one the build fetches', () => {
  const art = read('scripts/art.mjs');
  const known = new Set([...art.matchAll(/'spray-([\w-]+)'/g)].map((m) => m[1]));
  const names = read('web/design/sprays.ts');

  const missing: string[] = [];
  for (const [sticker] of callers()) {
    // web/ names them through the map, src/ by the file's own stem.
    const stem = new RegExp(sticker + ":\\s*art\\('([\\w-]+)'\\)").exec(names)?.[1] ?? sticker;
    if (!known.has(stem)) missing.push(sticker);
  }
  assert.deepEqual(missing, [], 'asked for but never fetched: ' + missing.join(', '));
});

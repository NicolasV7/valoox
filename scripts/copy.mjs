// What the copy looks like, counted.
//
// Two questions a reviewer cannot answer by reading: do the two locales still
// carry the same keys, and is anything still a paragraph. Both are arithmetic,
// so they are here rather than in somebody's head.
//
//   npm run copy
//
// Key parity is the one that breaks the build if it slips — a key present in
// `es` and missing from `en` is a `tsc` error, but the reverse is only a dead
// string, and a locale quietly drifting is how a translation rots.

import { readdirSync, readFileSync } from 'node:fs';

const DIR = (loc) => `web/i18n/${loc}`;
const LIMIT = Number(process.argv[2] ?? 170);

/** Keys, in order, from one locale module. Structural: it reads the text, not
 *  the module, because importing a `.ts` here would mean a build step for a
 *  script whose whole job is to be runnable. */
function keysOf(text) {
  const out = [];
  const strip = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const m of strip.matchAll(/^\s{2,}(\w+):/gm)) out.push(m[1]);
  return out;
}

/** Every plain string value, joined across a `+` chain, with its key. */
function stringsOf(text) {
  const strip = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const out = [];
  const piece = /'(?:[^'\\]|\\.)*'/g;
  for (const m of strip.matchAll(/(\w+):\s*((?:'(?:[^'\\]|\\.)*'\s*\+?\s*)+),/g)) {
    out.push([m[1], (m[2].match(piece) ?? []).map((p) => p.slice(1, -1)).join('')]);
  }
  return out;
}

const files = readdirSync(DIR('es')).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
let bad = 0;
let total = 0;
let chars = 0;
const over = [];

for (const file of files) {
  const es = readFileSync(`${DIR('es')}/${file}`, 'utf8');
  const en = readFileSync(`${DIR('en')}/${file}`, 'utf8');
  const a = keysOf(es);
  const b = keysOf(en);
  const only = (x, y) => x.filter((k) => !y.includes(k));
  const missing = only(a, b);
  const extra = only(b, a);
  if (missing.length || extra.length) {
    bad++;
    console.log(`\n${file}`);
    if (missing.length) console.log(`  es only: ${missing.join(', ')}`);
    if (extra.length) console.log(`  en only: ${extra.join(', ')}`);
  }
  for (const loc of ['es', 'en']) {
    for (const [key, text] of stringsOf(loc === 'es' ? es : en)) {
      total++;
      chars += text.length;
      if (text.length > LIMIT) over.push([text.length, loc, file.replace('.ts', ''), key]);
    }
  }
}

over.sort((x, y) => y[0] - x[0]);
console.log(`\n${files.length} modules · ${total} strings · ${chars} chars`);
console.log(`${over.length} over ${LIMIT} chars${over.length ? ':' : ''}`);
for (const [n, loc, file, key] of over) console.log(`  ${n}  ${loc}/${file}.${key}`);

if (bad) {
  console.log(`\n${bad} module(s) with keys in one locale and not the other.`);
  process.exit(1);
}

// Every mix the accessory store can send, drawn.
//
// The solver has a test that proves no mix leaves a hole — see
// test/unit/grid.test.ts, which packs the cells and asserts the result is a
// solid rectangle. This is the other half: a page that draws them, because
// "no holes" and "looks right" are different questions and only one of them
// is arithmetic.
//
//   npm run grid > grid.html
//
// Not shipped and not linked from anywhere. It imports the real solver, so a
// change to lay() shows up here without being copied.

import { build } from 'esbuild';

const bundled = await build({
  entryPoints: ['web/design/shapes.ts'],
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
});
const { lay } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64')
);

const KINDS = ['card', 'spray', 'buddy', 'title'];

/** Every mix of n, as multisets — order inside a kind changes nothing. */
function mixes(n) {
  if (n === 0) return [[]];
  const out = [];
  const walk = (at, so) => {
    if (so.length === n) return out.push([...so]);
    for (let i = at; i < KINDS.length; i++) walk(i, [...so, KINDS[i]]);
  };
  walk(0, []);
  return out;
}

const ART = {
  card: 'linear-gradient(160deg,#6b5c9e,#2a2440)',
  spray: 'linear-gradient(160deg,#9e8049,#3a2f1c)',
  buddy: 'linear-gradient(160deg,#5c9e6a,#213a27)',
  title: 'linear-gradient(160deg,#2b2e36,#16171b)',
};

function draw(kinds) {
  const { order, span } = lay(kinds);
  const cells = order
    .map((i) => {
      const k = kinds[i];
      const cls = [
        'tile',
        k === 'card' ? 'tile--portrait' : '',
        k === 'title' ? 'tile--text' : '',
        span[i] === 'tall' ? 'tile--tall' : '',
        span[i] === 'wide' ? 'tile--wide' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return `<div class="${cls}" style="background:${ART[k]}"><span>${k}</span></div>`;
    })
    .join('');
  return `<figure><figcaption>${kinds.join(' · ')}</figcaption><div class="grid">${cells}</div></figure>`;
}

const all = [];
for (let n = 1; n <= 5; n++) for (const m of mixes(n)) all.push(draw(m));

process.stdout.write(`<!doctype html><meta charset="utf-8">
<title>Accessory grid, every mix</title>
<style>
  :root { color-scheme: dark }
  body { margin:0; padding:28px; background:#0e0e11; color:#f2f4f5;
         font:14px/1.5 system-ui, sans-serif }
  h1 { font-weight:300; letter-spacing:-.03em; margin:0 0 6px }
  p { color:#8b9399; margin:0 0 26px; max-width:60ch }
  .wall { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:26px }
  figcaption { color:#8b9399; font-size:11px; letter-spacing:.1em;
               text-transform:uppercase; margin-bottom:8px }
  figure { margin:0 }
  .grid { display:grid; grid-template-columns:1fr 1fr; grid-auto-rows:110px;
          grid-auto-flow:dense; gap:9px }
  .tile { display:flex; align-items:flex-end; padding:10px 12px; border-radius:12px;
          border:1px solid #24262c; font-size:11px; color:#f2f4f5 }
  .tile--portrait { grid-row:span 2 }
  .tile--text { grid-column:span 2 }
  .tile--tall { grid-row:span 2 }
  .tile--wide { grid-column:span 2 }
</style>
<h1>Accessory grid, every mix</h1>
<p>Every combination of one to five pieces the weekly store can send, through
the real solver. A hole would show as a gap in a row; the test beside this one
proves there are none, and this is where you check that the ones with no hole
also read well.</p>
<div class="wall">${all.join('')}</div>
`);

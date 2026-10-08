import assert from 'node:assert';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'vitest';

// No file over 200 lines.
//
// Not a style preference. A module that outgrows a screenful is doing two jobs,
// and the second one is always the one nobody can find later. The limit is low
// enough that splitting is the obvious move rather than a refactor you schedule.
//
// The fix is never to reformat until it fits. Find the seam and cut there.

const LIMIT = 200;
const ROOTS = ['src', 'web', 'test', 'public', 'design'];
const EXT = /\.(ts|tsx|js|jsx|css)$/;
// Built, not written. Measuring a bundle tells you about esbuild.
const SKIP = new Set(['public/app.js', 'public/app.css']);

// Empty, and it stays empty. It held five files from before the rewrite; the
// last of them went when the routes split out of src/index.ts. Adding to it is
// how a limit stops being one.
const LEGACY = new Set<string>();

function sources(dir: string, out: string[] = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name).replace(/\\/g, '/');
    if (e.isDirectory()) sources(p, out);
    else if (EXT.test(e.name)) out.push(p);
  }
  return out;
}

const files = ROOTS.flatMap((r) => sources(r)).filter((p) => !SKIP.has(p));

test('there are sources to measure at all', () => {
  assert.ok(files.length > 8, 'found only ' + files.length + ' files — the roots moved');
});

test('no file is over 200 lines', () => {
  const over = files
    .filter((p) => !LEGACY.has(p))
    .map((p) => ({ p, n: readFileSync(p, 'utf8').split('\n').length }))
    .filter((f) => f.n > LIMIT)
    .map((f) => f.p + ' (' + f.n + ')');
  assert.deepEqual(over, [], 'over ' + LIMIT + ' lines: ' + over.join(', '));
});

test('every exemption still exists and is still over the limit', () => {
  // An exemption for a file that was already fixed, or deleted, is a line that
  // quietly re-permits what it was holding open. Both directions are failures.
  const stale: string[] = [];
  for (const p of LEGACY) {
    if (!existsSync(p)) {
      stale.push(p + ' is gone — delete the exemption');
      continue;
    }
    if (readFileSync(p, 'utf8').split('\n').length <= LIMIT) {
      stale.push(p + ' is under the limit now — delete the exemption');
    }
  }
  assert.deepEqual(stale, [], stale.join('; '));
});

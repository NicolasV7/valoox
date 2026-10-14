import assert from 'node:assert';
import { test } from 'vitest';
import { sources } from '../sources.ts';

// Every authored source stays below 200 lines, including comments and blanks.
//
// Not a style preference. A module that outgrows a screenful is doing two jobs,
// and the second one is always the one nobody can find later. The limit is low
// enough that splitting is the obvious move rather than a refactor you schedule.
//
// The fix is never to reformat until it fits. Find the seam and cut there.

const LIMIT = 199;
const ROOTS = [
  'src',
  'web',
  'scripts',
  'test',
  'public',
  'design',
  'migrations',
  '.github',
  'docs',
  'vitest.config.ts',
  'wrangler.toml',
  'schema.sql',
  'package.json',
  'tsconfig.json',
  'biome.json',
];
const EXT = /\.(?:[cm]?[jt]sx?|css|html|sql|ya?ml|toml|json)$/;
// Build outputs, Archify's export/model and the measured palette are data artifacts.
// The application, scripts, tests, workflows and configuration have no exemptions.
const SKIP = new Set([
  'public/app.js',
  'public/app.css',
  'docs/architecture.html',
  'docs/architecture.json',
  'design/palette.json',
]);
const files = ROOTS.flatMap((root) => sources(root, EXT)).filter((f) => !SKIP.has(f.path));

test('there are sources to measure at all', () => {
  assert.ok(files.length > 300, 'found only ' + files.length + ' files — the roots moved');
  const paths = new Set(files.map((f) => f.path));
  for (const path of [
    'scripts/who.mjs',
    'test/ui/bundle.mjs',
    'wrangler.toml',
    '.github/workflows/ci.yml',
  ]) {
    assert.ok(paths.has(path), path + ' is outside the source inventory');
  }
});

test('every authored source has fewer than 200 lines', () => {
  const over = files
    .map((f) => ({ p: f.path, n: f.text.split('\n').length }))
    .filter((f) => f.n > LIMIT)
    .map((f) => f.p + ' (' + f.n + ')');
  assert.deepEqual(over, [], 'over ' + LIMIT + ' lines: ' + over.join(', '));
});

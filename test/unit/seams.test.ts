import assert from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'vitest';

// Two greps that hold the architecture in place. Neither is clever; both catch
// the specific mistakes that would quietly undo a security property, and a
// mechanical check is the only kind that survives a tired evening.

function sources(dir = 'src', out: Array<{ path: string; text: string }> = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) sources(p, out);
    else if (e.name.endsWith('.ts'))
      out.push({ path: p.replace(/\\/g, '/'), text: readFileSync(p, 'utf8') });
  }
  return out;
}

const files = sources();

/** Comments say things like "never reaches fetch()" on purpose. Strip them, or
 *  the checks below flag the documentation instead of the code. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('there are sources to check at all', () => {
  assert.ok(files.length > 8, 'found only ' + files.length + ' source files');
});

test('fetch() to the outside world happens in exactly one module', () => {
  // Everything Riot-facing must pass the egress allowlist. A bare fetch() added
  // somewhere else is how "read-only" stops being true without anyone noticing.
  // `async fetch(` is the Worker entry point, not a call — hence the lookbehind.
  const offenders = files
    .filter((f) => f.path !== 'src/vault/http.ts')
    .filter((f) => /(?<!async\s)(?<![.\w])fetch\s*\(/.test(code(f.text)))
    .map((f) => f.path);
  assert.deepEqual(offenders, [], 'fetch() outside http.ts: ' + offenders.join(', '));
});

test('Riot hostnames never appear outside the vault', () => {
  const offenders = files
    .filter((f) => !f.path.startsWith('src/vault/'))
    .filter((f) => /riotgames\.com|pvp\.net|valorant-api\.com/.test(f.text))
    .map((f) => f.path);
  assert.deepEqual(offenders, [], 'Riot host outside src/vault/: ' + offenders.join(', '));
});

test('nothing sensitive can reach a log line', () => {
  // Workers Logs persists what is logged. The storefront path contains the puuid,
  // and the jar is a 2FA-bypassing credential — neither may ever be an argument.
  const banned = /\b(jar|blob|ssid|token|puuid|JAR_KEY|access)\b/;
  const offenders: string[] = [];
  for (const f of files) {
    for (const [i, line] of f.text.split('\n').entries()) {
      if (!/console\.\w+\(/.test(line)) continue;
      const args = line.slice(line.indexOf('(') + 1);
      if (banned.test(args)) offenders.push(f.path + ':' + (i + 1));
    }
  }
  assert.deepEqual(offenders, [], 'sensitive value in a log call: ' + offenders.join(', '));
});

test('the URL is never logged either', () => {
  // `/store/v3/storefront/<puuid>` is an account identifier. Logging the host and
  // the status is enough to debug; logging the path is a privacy claim broken.
  const offenders: string[] = [];
  for (const f of files) {
    for (const [i, line] of f.text.split('\n').entries()) {
      if (!/console\.\w+\(/.test(line)) continue;
      // The hostname alone is safe, and it is what makes a failure debuggable.
      // pathname of OUR OWN routes is fine too; a Riot path is not.
      const args = line.slice(line.indexOf('(') + 1).replace(/new URL\(url\)\.host/g, '');
      if (/\burl\b|pathname/.test(args) && !/ERROR/.test(line)) {
        offenders.push(f.path + ':' + (i + 1));
      }
    }
  }
  assert.deepEqual(offenders, [], 'url in a log call: ' + offenders.join(', '));
});

test('the KV namespace holds caches only, never a session', () => {
  // Sessions live in D1, sealed. A KV write of anything session-shaped would be
  // an unsealed credential in a store with no per-row encryption boundary.
  const session = files.find((f) => f.path === 'src/vault/session.ts');
  assert.ok(session, 'session.ts moved — update this test, do not delete it');
  const text = session.text;
  const literals = [...text.matchAll(/VAL\.(?:put|get|delete)\('([^']+)/g)].map((m) => m[1]);
  const ALLOWED = ['scan:'];
  for (const k of literals) {
    assert.ok(ALLOWED.includes(k), 'unexpected KV key prefix: ' + k);
  }
  // The cache keys are built from a versioned helper; pin both the names and the
  // fact that a version exists, so a shape change cannot silently reuse a key.
  assert.match(text, /export type Cache = 'store' \| 'inv';/);
  assert.match(text, /const VERSION: Record<Cache, number>/, 'cache keys must carry a version');
  assert.ok(literals.length > 0, 'the KV key regex stopped matching — fix the test, not the code');
});

// --- the front end ----------------------------------------------------------
// Same idea, other side of the wire: the page can reach a session, so a
// third-party script or an HTML sink on it is a credential-theft path.

const web = [
  'public/app.js',
  'public/icons.js',
  'public/ui.js',
  'public/items.js',
  'public/catalogs.js',
  'public/inventory.js',
  'public/favs.js',
  'public/index.html',
].map((p) => ({
  path: p,
  text: readFileSync(p, 'utf8'),
}));

test('the page builds DOM, never HTML from strings', () => {
  // Item names come from valorant-api.com, a database this project does not
  // control. innerHTML with those is stored XSS with extra steps.
  const offenders = web
    .filter((f) => /\.innerHTML\s*=|insertAdjacentHTML|document\.write/.test(code(f.text)))
    .map((f) => f.path);
  assert.deepEqual(offenders, [], 'HTML sink in: ' + offenders.join(', '));
});

test('no script is loaded from anywhere but this origin', () => {
  // The vendored QR encoder replaced a cdnjs <script> that ran with no SRI on a
  // page that can reach a Riot session. polyfill.io is the precedent.
  for (const f of web) {
    const srcs = [...code(f.text).matchAll(/(?:src|href)\s*=\s*['"]([^'"]+)['"]/g)].map(
      (m) => m[1],
    );
    for (const s of srcs) {
      assert.ok(
        s.startsWith('/') || s.startsWith('#') || s.startsWith('https://valorant-api.com/'),
        f.path + ' loads from a third party: ' + s,
      );
    }
  }
});

test('the CSP names no third-party script origin', () => {
  const h = readFileSync('public/_headers', 'utf8');
  const scriptSrc = /script-src ([^;]+);/.exec(h)?.[1] ?? '';
  assert.equal(scriptSrc.trim(), "'self'", "script-src must stay exactly 'self'");
  assert.match(h, /worker-src 'none'/, 'worker-src does not inherit safely from script-src');
});

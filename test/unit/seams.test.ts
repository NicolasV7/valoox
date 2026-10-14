import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import { sources } from '../sources.ts';

// Two greps that hold the architecture in place. Neither is clever; both catch
// the specific mistakes that would quietly undo a security property, and a
// mechanical check is the only kind that survives a tired evening.

const files = sources('src');

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
      // No `!/ERROR/` exemption. It was written to let router.ts's catch log
      // `pathname`, which is one of ours — but it exempted the whole line, and
      // that line also logs `err.message`, which for a BlockedUpstream carried
      // `/store/v3/storefront/<puuid>`. The exemption is now the narrow thing
      // it was meant to be: our own pathname, named.
      const ours = args.replace(/'ERROR ' \+ pathname/g, '');
      if (/\burl\b|pathname/.test(ours)) {
        offenders.push(f.path + ':' + (i + 1));
      }
    }
  }
  assert.deepEqual(offenders, [], 'url in a log call: ' + offenders.join(', '));
});

test('KV mutations are limited to public version and encrypted view caches', () => {
  const writers = files
    .filter((f) => /VAL\.(put|delete)\(/.test(code(f.text)))
    .map((f) => f.path)
    .sort();
  assert.deepEqual(writers, ['src/vault/auth.ts', 'src/vault/cache.ts', 'src/vault/evict.ts']);
  const cache = files.find((f) => f.path === 'src/vault/cache.ts')?.text ?? '';
  const namespace = files.find((f) => f.path === 'src/vault/evict.ts')?.text ?? '';
  assert.match(namespace, /const VERSION: Record<Cache, number>/);
  assert.match(cache, /readSession/);
  assert.match(cache, /'store:4'/);
  assert.match(cache, /'inv:3'/);
});

// --- the front end ----------------------------------------------------------
// Same idea, other side of the wire: the page can reach a session, so a
// third-party script or an HTML sink on it is a credential-theft path.

// Found rather than listed. A hardcoded list is a guard that a new module opts
// out of by existing, which is the opposite of what this file is for: the whole
// value of these checks is that nobody has to remember them.
const FRONT = /\.(js|tsx?|html)$/;
const web = [...sources('public', FRONT), ...sources('web', FRONT)].filter(
  (f) => f.path !== 'public/app.js',
);

test('the front end has files to check at all', () => {
  assert.ok(web.length > 4, 'found only ' + web.length + ' front-end files — the roots moved');
});

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

test('the only hosts the CSP names belong to Riot', () => {
  // Three, each on one directive, each carrying Riot's own content. A fourth
  // is a decision, not a tweak — which is what this test is for.
  const h = readFileSync('public/_headers', 'utf8');
  const hosts = [...new Set([...h.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]))].sort();
  assert.deepEqual(hosts, [
    'media.valorant-api.com',
    'valorant-api.com',
    'valorant.dyn.riotcdn.net',
  ]);
  assert.match(h, /media-src https:\/\/valorant\.dyn\.riotcdn\.net;/, 'the clips, and only those');
});

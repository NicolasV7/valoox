import assert from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'vitest';

// Every binding the Worker reads is declared where CI can see it.
//
// This exists because of a failure that only happened on CI and could not
// happen here. `wrangler types` reads `.dev.vars` when it is present and emits
// the secrets in it as part of `Cloudflare.Env` — so on this machine
// `env.RESEND_KEY` typechecked, and two of the three secrets were deliberately
// left out of the hand-written `Env` on the reasoning that the generator
// already had them. It did, locally. `.dev.vars` is gitignored, so CI
// generated an Env without them and `tsc` failed in files nobody had touched.
//
// The lesson is not "add the two". It is that what a Worker needs is a
// contract, and a contract cannot live in a file that exists on one laptop.
// So: anything read off `env` must be declared in src/types.ts, or be a
// binding or a var in wrangler.toml. Both of those are committed.

function sources(dir = 'src', out: string[] = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) sources(p, out);
    else if (e.name.endsWith('.ts')) out.push(readFileSync(p, 'utf8'));
  }
  return out;
}

const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Everything `env.FOO` and `env['FOO']`, plus the destructured `const { FOO }
 *  = env` shape, across the Worker. */
function read(): Set<string> {
  const out = new Set<string>();
  for (const text of sources()) {
    const src = code(text);
    for (const m of src.matchAll(/\benv\s*\.\s*([A-Za-z_]\w*)/g)) out.add(m[1] as string);
    for (const m of src.matchAll(/\benv\s*\[\s*['"]([^'"]+)['"]\s*\]/g)) out.add(m[1] as string);
    for (const m of src.matchAll(/\bconst\s*\{([^}]+)\}\s*=\s*env\b/g)) {
      for (const bit of (m[1] as string).split(','))
        out.add(
          bit
            .split(':')[0]
            ?.trim()
            .replace(/^\.\.\./, '') ?? '',
        );
    }
  }
  out.delete('');
  return out;
}

/** What the hand-written Env promises. Textual on purpose: the generated
 *  `worker-configuration.d.ts` is the thing this test refuses to trust. */
function declared(): Set<string> {
  const types = readFileSync('src/types.ts', 'utf8');
  const body = types.slice(types.indexOf('interface Env extends Cloudflare.Env {'));
  const out = new Set<string>();
  for (const m of code(body.slice(0, body.indexOf('\n}'))).matchAll(/^\s*(\w+)\s*[?:]/gm)) {
    out.add(m[1] as string);
  }
  return out;
}

/** What wrangler.toml declares: every `binding = "X"` and every key under
 *  `[vars]`. Both are committed, which is the whole point. */
function configured(): Set<string> {
  const toml = readFileSync('wrangler.toml', 'utf8');
  const out = new Set<string>();
  for (const m of toml.matchAll(/^\s*binding\s*=\s*"([^"]+)"/gm)) out.add(m[1] as string);
  const vars = toml.slice(toml.indexOf('[vars]') + 1);
  const end = vars.search(/^\[/m);
  for (const m of (end > 0 ? vars.slice(0, end) : vars).matchAll(/^(\w+)\s*=/gm)) {
    out.add(m[1] as string);
  }
  return out;
}

test('the Worker reads bindings at all', () => {
  assert.ok(read().size >= 4, 'found only ' + read().size + ' bindings read');
});

test('every binding the Worker reads is declared somewhere committed', () => {
  const known = new Set([...declared(), ...configured()]);
  const missing = [...read()].filter((name) => !known.has(name));
  assert.deepEqual(
    missing,
    [],
    'read off env but declared in neither src/types.ts nor wrangler.toml: ' +
      missing.join(', ') +
      '. If it is a secret, add it to the Env interface — .dev.vars does not exist on CI.',
  );
});

test('every secret the Env promises is one the Worker actually reads', () => {
  const used = read();
  const dead = [...declared()].filter((name) => !used.has(name) && !configured().has(name));
  assert.deepEqual(dead, [], 'declared on Env and read nowhere: ' + dead.join(', '));
});

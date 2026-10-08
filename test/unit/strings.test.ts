import assert from 'node:assert';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'vitest';

// Every user-facing string lives in web/i18n/, and nowhere else.
//
// The reason is not tidiness. A sentence written at its point of use gets split
// around the value it contains — `'Quedan ' + n + ' ofertas'` — and a split
// sentence has a frozen word order, which is a translation that cannot be made.
// Keeping them together is what keeps them a function of their arguments.
//
// This runs over web/ only. src/ throws messages for the log, not for a person;
// the client maps a failure to its own string. If a server message ever reaches
// a screen, that is a finding for the `copy` agent, not for this grep.

const ROOT = 'web';
const I18N = 'web/i18n/';

function sources(dir: string, out: Array<{ path: string; text: string }> = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name).replace(/\\/g, '/');
    if (e.isDirectory()) sources(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push({ path: p, text: readFileSync(p, 'utf8') });
  }
  return out;
}

const files = sources(ROOT).filter((f) => !f.path.startsWith(I18N));

const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT = /^\s*\/\/.*$/gm;
// Attributes whose value is addressed to a machine. `class="screen store"`,
// `rel="noopener noreferrer"` and an svg `d` all read exactly like prose and
// none of them is — including the ones computed in a brace.
//
// The list is explicit rather than "everything except the four spoken ones",
// because a component prop genuinely can carry a sentence, and that is the case
// this check exists to find.
const MACHINE =
  /\b(?:class|className|rel|target|type|role|style|href|src|id|for|name|viewBox|transform|d|fill|stroke|points)\s*=\s*(?:(['"`])[^'"`\n]*\1|\{[^{}\n]*\})/g;

const strip = (t: string) =>
  t.replace(BLOCK_COMMENT, '').replace(LINE_COMMENT, '').replace(MACHINE, 'x=""');

// A quoted run of two or more words, at least one of which has a vowel and a
// lower-case letter. That is prose. It will not match 'flex-start', 'image/png',
// 'aria-hidden' or a key path, which is the point — those are machine words and
// they belong where they are used.
const PROSE = /(['"`])((?=[^'"`]*[aeiouáéíóú])[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][^'"`\n]*\s+[^'"`\n]*[a-z])\1/;

// Attributes a person reads, even when the value is a single word.
const SPOKEN = /\b(?:title|placeholder|alt|aria-label)\s*[=:]\s*(['"`])([^'"`\n]+)\1/;

function scan(pattern: RegExp): string[] {
  const found: string[] = [];
  for (const f of files) {
    for (const [i, line] of strip(f.text).split('\n').entries()) {
      if (/\bimport\b|\bfrom\b/.test(line)) continue;
      const m = pattern.exec(line);
      if (m) found.push(f.path + ':' + (i + 1) + '  ' + (m[2] as string).slice(0, 48));
    }
  }
  return found;
}

test('no prose outside web/i18n/', () => {
  const found = scan(PROSE);
  assert.deepEqual(found, [], 'string outside i18n:\n  ' + found.join('\n  '));
});

test('no spoken attribute is written inline', () => {
  const found = scan(SPOKEN);
  assert.deepEqual(found, [], 'spoken attribute outside i18n:\n  ' + found.join('\n  '));
});

test('es and en carry the same keys', () => {
  // A key in one locale and not the other renders as undefined the day somebody
  // switches. Compare the files by name, then by exported key.
  const list = (loc: string) =>
    existsSync(I18N + loc)
      ? readdirSync(I18N + loc)
          .filter((n) => n.endsWith('.ts'))
          .sort()
      : [];
  const [es, en] = [list('es'), list('en')];
  if (es.length === 0 && en.length === 0) return; // nothing written yet
  assert.deepEqual(es, en, 'locale files differ: es=' + es.join(',') + ' en=' + en.join(','));

  const keys = (loc: string, file: string) =>
    [...readFileSync(I18N + loc + '/' + file, 'utf8').matchAll(/^\s{2}(\w+)\s*:/gm)]
      .map((m) => m[1])
      .sort();
  for (const file of es) {
    assert.deepEqual(keys('es', file), keys('en', file), 'keys differ in ' + file);
  }
});

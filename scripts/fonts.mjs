// Fetches the two faces into public/fonts/.
//
// They are not committed. The repo is public and a binary blob in it is a thing
// nobody reviews; wrangler uploads public/ wholesale at deploy, so the files
// reach production without passing through git. Both faces are SIL OFL 1.1,
// which permits redistribution — this is a cleanliness decision, not a licence
// one, and OFL.txt goes next to them so the notice travels with the bytes.
//
// They cannot come from Google at runtime: the CSP names no third-party origin
// and seams.test.ts fails the build if one appears. Self-hosted is the only
// shape available, which is also the faster one.
//
//   node scripts/fonts.mjs

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'public/fonts';

// Only `latin`. Spanish lives entirely inside U+0000–00FF — ñ, the accented
// vowels, ¿ and ¡ included — so latin-ext would be a second download nobody
// renders. Add it the day the app speaks a language that needs it.
const SUBSET = 'latin';

const FACES = [
  { file: 'bricolage.woff2', family: 'Bricolage Grotesque:opsz,wght@12..96,200..700' },
  { file: 'azeret.woff2', family: 'Azeret Mono:wght@400..700' },
];

// Google serves woff2 only to a UA it believes can read it.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function css(family) {
  const url = 'https://fonts.googleapis.com/css2?family=' + family + '&display=swap';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(family + ': ' + res.status + ' from Google Fonts');
  return res.text();
}

/** The @font-face block whose comment names the subset we want, then its url(). */
function pick(sheet, subset) {
  const blocks = sheet.split('/*').slice(1);
  const want = blocks.find((b) => b.slice(0, b.indexOf('*/')).trim() === subset);
  if (!want) throw new Error('no ' + subset + ' subset in the sheet Google returned');
  const url = /src:\s*url\((https:\/\/[^)]+\.woff2)\)/.exec(want);
  if (!url) throw new Error('no woff2 url in the ' + subset + ' block');
  return url[1];
}

/**
 * Already there, unless --force.
 *
 * These were "run once" commands and now they also run inside `npm run
 * deploy`, so that a clean checkout — a fork, a CI runner, a Deploy to
 * Cloudflare build — cannot ship a site with no typeface and no artwork.
 * Re-downloading on every deploy would make a deploy depend on somebody
 * else's uptime, which is the one thing a deploy should not do.
 */
function have(dir, one) {
  return existsSync(dir + '/' + one) && !process.argv.includes('--force');
}

async function main() {
  if (have(OUT, FACES[0].file)) {
    console.log(OUT + ' is already there (--force to fetch it again)');
    return;
  }
  await mkdir(OUT, { recursive: true });
  for (const face of FACES) {
    const url = pick(await css(face.family), SUBSET);
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(face.file + ': ' + res.status);
    const bytes = Buffer.from(await res.arrayBuffer());
    await writeFile(OUT + '/' + face.file, bytes);
    console.log(OUT + '/' + face.file + '  ' + (bytes.length / 1024).toFixed(1) + ' KB');
  }
  await writeFile(
    OUT + '/OFL.txt',
    'Bricolage Grotesque — Copyright the Bricolage Grotesque Project Authors\n' +
      'Azeret Mono — Copyright the Azeret Project Authors\n\n' +
      'Both are licensed under the SIL Open Font License, Version 1.1.\n' +
      'https://openfontlicense.org\n',
  );
  console.log(OUT + '/OFL.txt');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

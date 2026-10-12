// Fetches the app's fixed artwork into public/art/.
//
// The images that never change and appear on nearly every screen: the three
// coins, the five content tiers, the fixed sprays the empty, waiting and mailed
// states are drawn with, and one stock render per weapon. They are chrome rather than
// content — a Kingdom Credits coin is a symbol this interface is built out of,
// the way a chevron is, and a stock Vandal is what an empty slot means. None
// of them rotates.
//
// Taking them off valorant-api.com costs the DNS lookup and the TLS handshake
// to a second origin on first paint, which is the slowest part of showing the
// gate on a phone. Everything that DOES rotate — skin renders, bundle banners,
// card art — stays remote, because pinning a moving thing is how a page starts
// lying about what Riot is selling today.
//
// The weapons are fetched from the live index rather than listed here, so the
// day Riot ships a gun this picks it up. Until someone re-runs it the app falls
// back to the url it came from, which is why the slot has an onError on it.
//
// Not committed, exactly as public/fonts/ is not: wrangler uploads public/
// wholesale at deploy, so the bytes reach production without passing through
// a public git history. The artwork is Riot's.
//
//   node scripts/art.mjs

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { ART } from './artwork.mjs';

const OUT = 'public/art';
const CDN = 'https://media.valorant-api.com/';

/** A uuid from the catalogue, and a filename this script is willing to write.
 *  Both halves of every entry come from somebody else's JSON and both are used
 *  literally — one as a path, one as a fetch target. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NAME = /^[a-z0-9-]+$/;

/** name -> the path under media.valorant-api.com. The uuids are Riot's and are
 *  the same ones pinned in web/components/Money.tsx, web/data/tiers.ts and
 *  web/design/sprays.ts — each of those names this file in a comment, so a
 *  change here is a change there. */
// The registry includes the original artwork and the approved screen additions.

/**
 * One stock render per weapon, keyed by the weapon's uuid.
 *
 * Not `displayIcon` on the weapon, which runs from 168 to 512 across — a
 * Classic at 188 drawn into a 148px slot is upscaled on any 2× screen. And not
 * the default skin's level icon either: Riot publishes a 512×512 × placeholder
 * for 18 of the 21.
 *
 * It is the default skin's chroma render. All 21 are real, all 21 are 512
 * across, and they are the pictures the artboard was drawn with — its own
 * comment names their sizes.
 */
async function weapons() {
  const res = await fetch('https://valorant-api.com/v1/weapons');
  if (!res.ok) throw new Error('weapons index: ' + res.status);
  const { data } = await res.json();

  const out = {};
  for (const w of data ?? []) {
    const stock = (w.skins ?? []).find((s) => s.uuid === w.defaultSkinUuid);
    const url = stock?.chromas?.[0]?.fullRender ?? w.displayIcon;
    // Both halves come from a catalogue this project does not control, and
    // both are used literally: the uuid becomes a FILENAME and the url becomes
    // a fetch. A uuid with a slash or a `..` in it wrote outside public/art/,
    // and whatever that deploy picked up is then served from this origin —
    // the one place `img-src 'self'` cannot tell it from our own bytes.
    if (url && UUID.test(w.uuid)) out['weapon-' + w.uuid] = url;
  }
  return out;
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
  if (have(OUT, 'NOTICE.txt') && Object.keys(ART).every((name) => have(OUT, name + '.png'))) {
    console.log(OUT + ' is already there (--force to fetch it again)');
    return;
  }
  await mkdir(OUT, { recursive: true });

  const all = { ...Object.fromEntries(Object.entries(ART).map(([k, v]) => [k, CDN + v])) };
  Object.assign(all, await weapons());

  let total = 0;
  for (const [name, url] of Object.entries(all)) {
    if (have(OUT, name + '.png')) continue;
    if (!NAME.test(name)) throw new Error('refusing to write ' + JSON.stringify(name));
    if (!url.startsWith(CDN)) throw new Error(name + ': off-catalogue url ' + url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(name + ': ' + res.status + ' for ' + url);
    // A 200 is not a picture. An error page saved as a .png is deployed as a
    // .png, and nothing downstream looks again.
    const type = res.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) throw new Error(name + ': ' + type + ' is not an image');
    const bytes = Buffer.from(await res.arrayBuffer());
    await writeFile(OUT + '/' + name + '.png', bytes);
    total += bytes.length;
    console.log(OUT + '/' + name + '.png  ' + (bytes.length / 1024).toFixed(1) + ' KB');
  }

  await writeFile(
    OUT + '/NOTICE.txt',
    'Artwork in this directory is Riot Games’.\n\n' +
      'VALORANT and its artwork, currencies and sprays belong to Riot Games, Inc.\n' +
      'valoox is not affiliated with Riot Games. These files are fetched from\n' +
      'media.valorant-api.com by scripts/art.mjs and are not redistributed here;\n' +
      'they are served alongside the app so a phone makes one connection rather\n' +
      'than two.\n',
  );
  console.log(OUT + '/NOTICE.txt');
  console.log(Object.keys(all).length + ' files, ' + (total / 1024).toFixed(0) + ' KB');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

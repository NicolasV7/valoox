// Fetches the app's fixed artwork into public/art/.
//
// The images that never change and appear on nearly every screen: the three
// coins, the five content tiers, the twelve sprays the empty, waiting and mailed
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

import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'public/art';
const CDN = 'https://media.valorant-api.com/';

/** name -> the path under media.valorant-api.com. The uuids are Riot's and are
 *  the same ones pinned in web/components/Money.tsx, web/data/tiers.ts and
 *  web/design/sprays.ts — each of those names this file in a comment, so a
 *  change here is a change there. */
const ART = {
  // The three currencies. Riot bills in all of them and shows all of them.
  'coin-vp': 'currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png',
  'coin-rad': 'currencies/e59aa87c-4cbf-517a-5983-6e81511be9b7/displayicon.png',
  'coin-kc': 'currencies/85ca954a-41f2-ce94-9b45-8ca3dd39a00d/displayicon.png',

  // The five content tiers, from /v1/contenttiers.
  'tier-select': 'contenttiers/12683d76-48d7-84a3-4e09-6985794f0445/displayicon.png',
  'tier-deluxe': 'contenttiers/0cebb8be-46d7-c12a-d306-e9907bfc5a25/displayicon.png',
  'tier-premium': 'contenttiers/60bca009-4182-7998-dee7-b8a2558dc369/displayicon.png',
  'tier-exclusive': 'contenttiers/e046854e-406c-37f4-6607-19a9ba8426fc/displayicon.png',
  'tier-ultra': 'contenttiers/411e4a55-4e59-7757-41f0-86a53f101bb5/displayicon.png',

  // The twelve sprays, each picked for what it is OF. See web/design/sprays.ts.
  'spray-holdup': 'sprays/271896c9-496b-8c89-962f-59a9ed3f4ffa/fulltransparenticon.png',
  'spray-goagain': 'sprays/0d5ac29c-482f-1a31-eba2-bba3acb2c2c4/fulltransparenticon.png',
  'spray-peace': 'sprays/13a7b621-44cf-73a3-04bb-0fad33b93179/fulltransparenticon.png',
  'spray-empty': 'sprays/3085ca2f-4e7a-25a5-909d-33940b0148e2/fulltransparenticon.png',
  'spray-crab': 'sprays/d52d5d56-46a7-957d-418d-e3b2b3bd6938/fulltransparenticon.png',
  'spray-whoops': 'sprays/6cee7e0a-4d08-6213-3ec9-479f0667b4c0/fulltransparenticon.png',
  'spray-seeyou': 'sprays/081262e8-42db-ac4a-c94b-a89b623525c0/fulltransparenticon.png',
  'spray-shh': 'sprays/140243d9-46a3-bd69-6bbe-9c918324f628/fulltransparenticon.png',
  'spray-thisgun': 'sprays/a0a399da-4322-83f0-e734-49a81ab6e820/fulltransparenticon.png',
  'spray-asleep': 'sprays/38b459ee-46f6-5f3b-147c-6a9492f667b2/fulltransparenticon.png',
  'spray-holdon': 'sprays/c97f9381-4784-e244-dffa-9bbe2b359012/fulltransparenticon.png',
  'spray-carryon': 'sprays/43341e92-451f-c194-b4f6-0b926bdc3643/fulltransparenticon.png',
};

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
    if (url) out['weapon-' + w.uuid] = url;
  }
  return out;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const all = { ...Object.fromEntries(Object.entries(ART).map(([k, v]) => [k, CDN + v])) };
  Object.assign(all, await weapons());

  let total = 0;
  for (const [name, url] of Object.entries(all)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(name + ': ' + res.status + ' for ' + url);
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

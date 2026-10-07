// Riot returns UUIDs; valorant-api.com turns them into names and pictures.
// It sends Access-Control-Allow-Origin:*, so the browser asks it directly and the
// Worker never parses the 3.5 MB catalogue — which is what keeps the Worker under
// its 10 ms CPU budget.

const meta = (kind, id) =>
  fetch('https://valorant-api.com/v1/' + kind + '/' + encodeURIComponent(id))
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => j?.data ?? null)
    .catch(() => null);

/** Each item type resolves at exactly ONE endpoint — probed against live bundle
 *  and accessory data on 2026-09-14. Buddies sit under buddies/levels, not
 *  buddies, and the UUID commonly labelled "buddy" is actually skin chromas. */
const ITEM_API = {
  'e7c63390-eda7-46e0-bb7a-a6abdacd2433': 'weapons/skinlevels',
  'dd3bf334-87f3-40bd-b043-682a57a8dc3a': 'buddies/levels',
  'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475': 'sprays',
  '3f296c07-64c3-494c-923b-fe692a4fa1bd': 'playercards',
  'de7caa6b-adf7-4588-bbd1-143831e786c6': 'playertitles',
};

/** Daily store and night market are always weapon skins. */
export const skin = (i) => meta('weapons/skinlevels', i.id);

export const bundleMeta = (b) => meta('bundles', b.id);

/** The wide art of an equipped player card, for the header. largeArt is the
 *  fallback because a handful of old cards never got a wide render. */
export const cardArt = (id) =>
  meta('playercards', id).then((d) => d?.wideArt ?? d?.largeArt ?? null);

/** Bundle contents and the accessory store are mixed types. Normalised to the
 *  same two fields the renderer wants, so callers never branch on type. */
export async function itemMeta(it) {
  const d = ITEM_API[it.type] ? await meta(ITEM_API[it.type], it.id) : null;
  if (!d) return null;
  return {
    displayName: d.displayName || d.titleText || null,
    // Titles carry no art at all; sprays prefer the transparent version.
    displayIcon: d.displayIcon || d.fullTransparentIcon || d.largeArt || null,
  };
}

// The valorant-api catalogues, and the maps that turn an entitlement id into
// something a person recognises.
//
// Sizes measured 2026-09-14: weapons 3.5 MB, sprays 924 KB, cards 669 KB,
// buddies 613 KB, agents 108 KB, titles 105 KB. Six megabytes if you fetch them
// all, which is why each one loads only when its section is opened — and why the
// Worker never touches any of them.

const V1 = 'https://valorant-api.com/v1/';

/** Cache Storage, so the second visit costs nothing. Falls back to a plain fetch
 *  where the API is unavailable (private mode, some embedded browsers). */
async function cached(path) {
  const url = V1 + path;
  const store = await caches.open('val-catalog-v2').catch(() => null);
  const hit = store && (await store.match(url));
  if (hit) return hit.json();
  const res = await fetch(url);
  if (!res.ok) throw new Error('catálogo ' + path + ': ' + res.status);
  if (store) await store.put(url, res.clone());
  return res.json();
}

/**
 * Riot names a chroma "Comet Odin

(Variant 2 Pink)". The only part worth
 * showing is the colour — the weapon is already the row it sits under, and the
 * level number means nothing on its own.
 */
function chromaName(raw, skin) {
  const inside = /\(([^)]*)\)/.exec(raw ?? '')?.[1];
  if (inside) return /variant\s+\d+\s+(.+)/i.exec(inside)?.[1] ?? inside;
  return (raw ?? '').split(skin).join(' ').replace(/\s+/g, ' ').trim() || 'Variante';
}

/** Riot never publishes these. Shop price per tier; melee costs double. */
const VP_BY_TIER = { Select: 875, Deluxe: 1275, Premium: 1775, Exclusive: 2175, Ultra: 2475 };

let tiersPromise = null;
const tiers = () =>
  (tiersPromise ??= cached('contenttiers').then(
    (t) =>
      new Map(
        t.data.map((x) => [
          x.uuid,
          { name: x.devName, colour: '#' + (x.highlightColor ?? '9b9a9633').slice(0, 6) },
        ]),
      ),
  ));

/**
 * Weapons: the only catalogue that needs real work. Every id that can appear in
 * an entitlement — the skin, each level, each chroma — points at the same entry,
 * because owning one gun lists all three and counting them separately would
 * triple your collection.
 */
async function weaponIndex() {
  const [weapons, tierOf] = await Promise.all([cached('weapons'), tiers()]);
  const map = new Map();
  for (const w of weapons.data) {
    const melee = w.displayName === 'Melee';
    for (const s of w.skins) {
      const t = tierOf.get(s.contentTierUuid);
      const entry = {
        key: s.uuid,
        name: s.displayName,
        sub: w.displayName,
        icon: s.chromas?.[0]?.fullRender ?? s.displayIcon ?? null,
        tier: t?.name ?? 'Standard',
        colour: t?.colour ?? '#9b9a96',
        value: (VP_BY_TIER[t?.name] ?? 0) * (melee ? 2 : 1),
        levels: (s.levels ?? []).map((l) => l.uuid),
        // Chromas keep their own identity here. Mapping them only to the parent
        // skin was enough to count a collection, but not to show one: a variant
        // belongs under its weapon, with its own name and render.
        chromas: (s.chromas ?? []).map((c) => ({
          uuid: c.uuid,
          name: chromaName(c.displayName, s.displayName),
          icon: c.fullRender || c.displayIcon || null,
        })),
      };
      map.set(s.uuid, entry);
      for (const l of s.levels ?? []) map.set(l.uuid, entry);
      for (const c of s.chromas ?? []) map.set(c.uuid, entry);
    }
  }
  return map;
}

/** Buddies and sprays: the entitlement holds a LEVEL id, not the item id. */
const levelIndex = (path) => async () => {
  const d = await cached(path);
  const map = new Map();
  for (const x of d.data) {
    const entry = { key: x.uuid, name: x.displayName, icon: x.displayIcon ?? null };
    map.set(x.uuid, entry);
    for (const l of x.levels ?? []) map.set(l.uuid, entry);
  }
  return map;
};

const flatIndex =
  (path, icon = 'displayIcon') =>
  async () => {
    const d = await cached(path);
    return new Map(
      d.data.map((x) => [x.uuid, { key: x.uuid, name: x.displayName, icon: x[icon] ?? null }]),
    );
  };

/** Titles have no art at all — the text IS the item. */
const titleIndex = async () => {
  const d = await cached('playertitles');
  return new Map(
    d.data.map((x) => [x.uuid, { key: x.uuid, name: x.titleText || x.displayName, icon: null }]),
  );
};

/** Item type ids, measured from a real account's entitlements rather than
 *  remembered — which is how the buddy type got mislabelled as chromas once. */
export const KINDS = [
  // Skins and variants are ONE section: a chroma is not a thing you own beside a
  // gun, it is a thing the gun has. Both id types feed the same index.
  {
    type: 'e7c63390-eda7-46e0-bb7a-a6abdacd2433',
    also: '3ad1b2b2-acdb-4524-852f-954a76ddae0a',
    label: 'Skins',
    index: weaponIndex,
    value: true,
  },
  { type: 'dd3bf334-87f3-40bd-b043-682a57a8dc3a', label: 'Buddies', index: levelIndex('buddies') },
  { type: 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475', label: 'Sprays', index: levelIndex('sprays') },
  {
    type: '3f296c07-64c3-494c-923b-fe692a4fa1bd',
    label: 'Tarjetas',
    index: flatIndex('playercards', 'largeArt'),
  },
  { type: 'de7caa6b-adf7-4588-bbd1-143831e786c6', label: 'Títulos', index: titleIndex },
];

/** Types Riot returns that this page deliberately does NOT show. Agents are
 *  unlocked by playing rather than collected, and they crowd out the things you
 *  actually chose. Listed so the footer does not report them as a gap. */
export const HIDDEN = new Set(['01bb38e1-da47-4e6a-9b3d-945fe4655707']);

/**
 * Competitive tiers. 78 KB, and the last episode is the live one — Riot keeps the
 * older episodes in the same payload because tier numbering has shifted over time.
 */
let rankPromise = null;
export const ranks = () =>
  (rankPromise ??= cached('competitivetiers').then((d) => {
    const current = d.data[d.data.length - 1];
    return new Map(
      (current?.tiers ?? []).map((t) => [
        t.tier,
        {
          name: t.tierName,
          icon: t.largeIcon ?? null,
          colour: '#' + (t.color ?? 'ffffffff').slice(0, 6),
        },
      ]),
    );
  }));

export { weaponIndex };

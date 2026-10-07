import { HIDDEN, KINDS } from './catalogs.js';
import { disclosure, el, empty, heading, row, rows, tile, tiles, vp } from './ui.js';

// Counts are not free, and pretending otherwise was a bug worth not repeating:
// entitlements list every level and chroma separately, so one Guardian with four
// levels and three chromas is seven ids and one gun. No number is shown until a
// category has been opened and its catalogue has made it a real one.

function dedupe(ids, map) {
  const items = new Map();
  const extra = new Set(); // ids that resolved to something other than themselves
  let unknown = 0;
  for (const id of ids) {
    const e = map.get(id);
    if (!e) {
      unknown++;
      continue;
    }
    items.set(e.key, e);
    if (id !== e.key) extra.add(id);
  }
  return { items: [...items.values()], owned: extra, unknown };
}

/** A weapon, with the variants you own of it folded inside. A chroma is not a
 *  thing you own beside a gun — it is a thing the gun has. */
function weapon(e, ownedIds) {
  const mine = (e.chromas ?? []).filter((c) => ownedIds.has(c.uuid));
  const base = { name: e.name, meta: e.sub, icon: e.icon, colour: e.colour, tier: e.tierIcon };

  if (!mine.length) return row(base);

  return disclosure(
    {
      name: e.name,
      badges: [el('span', { class: 'tag qty', text: '+' + mine.length })],
      right: el('span', { class: 'count', text: e.tier ?? '' }),
    },
    async () =>
      rows(
        ...mine.map((c) => row({ name: c.name, icon: c.icon, colour: e.colour, tier: e.tierIcon })),
      ),
  );
}

function section(kind, ids) {
  const count = el('span', { class: 'count' });

  return disclosure({ name: kind.label, right: count }, async () => {
    const { items, owned, unknown } = dedupe(ids, await kind.index());
    items.sort((a, b) => (b.value ?? 0) - (a.value ?? 0) || a.name.localeCompare(b.name));
    count.textContent = items.length + (items.length === 1 ? ' ítem' : ' ítems');

    if (!items.length) return empty('Nada acá todavía.');

    const out = [];
    if (kind.value) {
      const total = items.reduce((n, e) => n + (e.value ?? 0), 0);
      out.push(
        el('p', {
          class: 'note',
          text:
            vp(total) +
            ' VP a precio de tienda por tier. Es una estimación: Riot no publica estos precios, y esto no distingue lo que llegó por pase o regalo.',
        }),
      );
      out.push(rows(...items.map((e) => weapon(e, owned))));
    } else {
      out.push(tiles(...items.map((e) => tile({ name: e.name, icon: e.icon }))));
    }
    if (unknown) {
      out.push(
        el('p', {
          class: 'note',
          text: unknown + ' que el catálogo no reconoce. Suele ser contenido muy nuevo o retirado.',
        }),
      );
    }
    return out;
  });
}

export async function renderInventory(app, inv) {
  // An unexpected shape has to say so. Rendering an empty page and calling it an
  // empty collection is the worst failure available: it looks like an answer.
  if (!inv || typeof inv.byType !== 'object') {
    app.replaceChildren(
      el('p', {
        class: 'err',
        text: 'La respuesta no tiene la forma esperada. Recargá; si sigue igual, es un bug.',
      }),
    );
    return;
  }

  const byType = inv.byType;
  const idsFor = (k) => [...(byType[k.type] ?? []), ...(k.also ? (byType[k.also] ?? []) : [])];
  const known = KINDS.filter((k) => idsFor(k).length);

  app.replaceChildren(
    heading('Colección'),
    el('p', {
      class: 'note',
      text: 'Abrí una categoría para ver qué hay adentro y cuánto tenés. Cada una baja su catálogo la primera vez y después queda guardado.',
    }),
  );

  if (!known.length) {
    app.append(empty('Riot no devolvió nada para esta cuenta.'));
    return;
  }

  for (const k of known) app.append(section(k, idsFor(k)));

  // Types Riot returned that this page has no catalogue for. Saying so beats
  // dropping them from a page that claims to show your collection.
  const covered = new Set([...KINDS.flatMap((k) => [k.type, k.also].filter(Boolean)), ...HIDDEN]);
  const extra = Object.entries(byType).filter(([t, ids]) => ids.length && !covered.has(t));
  if (extra.length) {
    const n = extra.reduce((acc, [, ids]) => acc + ids.length, 0);
    app.append(
      el('p', {
        class: 'note',
        text: n + ' ítems de ' + extra.length + ' tipo(s) que todavía no sé mostrar.',
      }),
    );
  }
}

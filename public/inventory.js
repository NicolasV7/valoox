import { HIDDEN, KINDS } from './catalogs.js';
import { art, el, vp } from './ui.js';

// Counts are free — they come from the entitlement lists the Worker already
// returned. Names and pictures are not: each section's catalogue is hundreds of
// kilobytes, so a section fetches its own only when you open it.

/** Entitlements list every level and chroma separately, so the raw id count is
 *  not the number of things you own — which is why no count is shown until a
 *  section has been opened and the catalogue has made it a real one. */
function dedupe(ids, map) {
  const items = new Map();
  const extra = new Set(); // ids that resolved, beyond the item's own uuid
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

function plain(e) {
  const card = el(
    'div',
    { class: 'card tiered' },
    art(e.icon),
    el('div', { class: 'name', text: e.name }),
    e.sub || e.tier
      ? el(
          'div',
          { class: 'price' },
          document.createTextNode(e.sub ? e.sub + ' · ' : ''),
          el('span', { class: 'cur', text: e.tier ?? '' }),
        )
      : null,
  );
  if (e.colour) card.style.borderLeftColor = e.colour;
  return card;
}

/** A weapon you own, with the variants you own of it folded inside. A chroma is
 *  not a thing you own beside a gun — it is a thing the gun has. */
function weapon(e, ownedIds) {
  const mine = (e.chromas ?? []).filter((c) => ownedIds.has(c.uuid));
  if (!mine.length) return plain(e);

  const inner = el(
    'div',
    { class: 'items' },
    ...mine.map((c) =>
      el('div', { class: 'item' }, art(c.icon), el('div', { class: 'name', text: c.name })),
    ),
  );

  const box = el(
    'details',
    { class: 'bundle' },
    el(
      'summary',
      {},
      art(e.icon),
      el(
        'div',
        { class: 'head' },
        el(
          'div',
          { class: 'name', text: e.name },
          el('span', {
            class: 'qty',
            text: ' +' + mine.length + ' variante' + (mine.length > 1 ? 's' : ''),
          }),
        ),
        el('div', { class: 'price' }, el('span', { class: 'cur', text: e.tier ?? '' })),
      ),
    ),
    inner,
  );
  box.style.borderLeftColor = e.colour;
  box.classList.add('tiered');
  return box;
}

function section(kind, ids) {
  const body = el('div', { class: 'items' }, el('span', { class: 'note', text: 'Cargando…' }));
  // No count here until it is a real one. The raw id list counts every level and
  // every variant separately: one Guardian with four levels and three chromas is
  // seven ids and one gun, and printing "7" is worse than printing nothing —
  // it looks like an answer.
  const count = el('div', { class: 'price', text: '' });
  const box = el(
    'details',
    { class: 'bundle' },
    el(
      'summary',
      {},
      el('div', { class: 'head' }, el('div', { class: 'name', text: kind.label }), count),
    ),
    body,
  );

  box.addEventListener('toggle', async () => {
    if (!box.open || box.dataset.done) return;
    box.dataset.done = '1';
    try {
      const { items, owned, unknown } = dedupe(ids, await kind.index());
      items.sort((a, b) => (b.value ?? 0) - (a.value ?? 0) || a.name.localeCompare(b.name));

      count.textContent = items.length + (items.length === 1 ? ' ítem' : ' ítems');
      const g = el('div', { class: kind.value ? 'items' : 'grid' });
      for (const e of items) g.append(kind.value ? weapon(e, owned) : plain(e));
      body.replaceChildren(g);

      if (kind.value) {
        const total = items.reduce((n, e) => n + (e.value ?? 0), 0);
        body.prepend(
          el('p', {
            class: 'note',
            text:
              items.length +
              ' skins · ' +
              vp(total) +
              ' VP aprox. a precio de tienda por tier. Riot no publica estos precios, y esto no distingue lo que llegó por pase o regalo.',
          }),
        );
      }
      if (unknown) {
        body.append(
          el('p', {
            class: 'note',
            text:
              unknown + ' que el catálogo no reconoce. Suele ser contenido muy nuevo o retirado.',
          }),
        );
      }
    } catch (e) {
      body.replaceChildren(el('p', { class: 'err', text: 'No se pudo cargar: ' + e.message }));
    }
  });
  return box;
}

export async function renderInventory(app, inv) {
  // An unexpected shape must say so. Rendering an empty page and calling it an
  // empty collection is the worst possible failure: it looks like an answer.
  if (!inv || typeof inv.byType !== 'object') {
    app.replaceChildren(
      el('p', {
        class: 'err',
        text: 'La respuesta no tiene la forma esperada. Recargá la página; si sigue igual, es un bug.',
      }),
    );
    return;
  }
  const byType = inv.byType;
  const idsFor = (k) => [...(byType[k.type] ?? []), ...(k.also ? (byType[k.also] ?? []) : [])];

  const known = KINDS.filter((k) => idsFor(k).length);

  app.replaceChildren(
    el(
      'header',
      {},
      el(
        'div',
        { class: 'wallet' },
        el('div', {}, el('b', { text: String(known.length) }), el('span', { text: ' categorías' })),
      ),
    ),
    el('p', {
      class: 'note',
      text: 'Abrí una categoría para ver qué hay adentro y cuánto tenés. Cada una baja su propio catálogo la primera vez — después queda guardado.',
    }),
  );

  for (const k of known) app.append(section(k, idsFor(k)));

  // Types Riot returned that this app has no catalogue for. Better to say so than
  // to quietly drop them from a page that claims to show your collection.
  const covered = new Set([...KINDS.flatMap((k) => [k.type, k.also].filter(Boolean)), ...HIDDEN]);
  const extra = Object.entries(byType).filter(([t, ids]) => ids.length && !covered.has(t));
  if (extra.length) {
    app.append(
      el('p', {
        class: 'note',
        text:
          extra.reduce((n, [, ids]) => n + ids.length, 0) +
          ' ítems de ' +
          extra.length +
          ' tipo(s) que todavía no sé mostrar.',
      }),
    );
  }
}

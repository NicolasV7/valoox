import { weaponIndex } from './catalogs.js';
import { art, el } from './ui.js';

// Favourites.
//
// A favourite is stored as the skin's LEVEL-0 uuid plus its name: level 0 is what
// the storefront offers (measured across skins with 1 and with 4 levels), and the
// name travels with it so nothing downstream needs this 3.5 MB catalogue.
//
// Skins you already own are not offered here. Riot never puts an owned skin in
// your daily store, so favouriting one could only ever be a dead entry.

const api = (p, o) => fetch(p, o).then((r) => r.json());
const MAX = 60;

let timer = null;
function save(state, status) {
  clearTimeout(timer);
  status.textContent = 'Guardando…';
  timer = setTimeout(async () => {
    const r = await api('/api/prefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlist: state.wishlist }),
    });
    status.textContent = r.error
      ? 'No se pudo guardar: ' + r.error
      : state.wishlist.length
        ? 'Guardado. Te las marcamos en la tienda cuando aparezcan.'
        : 'Guardado.';
  }, 600);
}

function row(entry, state, status, redraw) {
  const id = entry.levels[0];
  const on = state.wishlist.some((w) => w.id === id);
  const star = el('button', {
    class: 'star' + (on ? ' on' : ''),
    text: on ? '★' : '☆',
    title: on ? 'Quitar de favoritos' : 'Marcar como favorita',
  });
  star.onclick = () => {
    if (on) state.wishlist = state.wishlist.filter((w) => w.id !== id);
    else if (state.wishlist.length >= MAX) {
      status.textContent = 'Máximo ' + MAX + ' favoritos.';
      return;
    } else state.wishlist = [...state.wishlist, { id, name: entry.name }];
    save(state, status);
    redraw();
  };
  const card = el(
    'div',
    { class: 'item tiered' },
    art(entry.icon),
    el(
      'div',
      { class: 'name', text: entry.name },
      el('span', { class: 'qty', text: ' ' + (entry.sub ?? '') }),
    ),
    star,
  );
  card.style.borderLeftColor = entry.colour ?? '#9b9a96';
  return card;
}

export async function renderFavs(app, data) {
  const state = { wishlist: data.prefs.wishlist ?? [] };
  const status = el('p', { class: 'note' });
  const count = el('span', { class: 'sub' });
  const listBox = el('div', { class: 'items' });
  const resultBox = el('div', { class: 'items' });
  const search = el('input', {
    type: 'search',
    placeholder: 'Buscar una skin…',
    spellcheck: 'false',
  });
  const hint = el('p', { class: 'note', text: 'Cargando el catálogo…' });

  app.replaceChildren(
    el('h2', { text: 'Avisarme' }),
    el('p', {
      class: 'note',
      text: 'Marcá las skins que estás esperando. Cuando alguna aparezca en tu tienda, te la señalamos ahí con una estrella.',
    }),
    status,
    el('h2', {}, document.createTextNode('Tus favoritas '), count),
    listBox,
    el('h2', { text: 'Agregar' }),
    el('label', { class: 'field' }, search),
    hint,
    resultBox,
  );

  const map = await weaponIndex();
  const owned = new Set();
  for (const ids of Object.values(data.inv.byType ?? {})) {
    for (const id of ids) {
      const e = map.get(id);
      if (e) owned.add(e.key);
    }
  }
  // One entry per skin, and only ones that could actually turn up in a store.
  const all = [...new Set(map.values())].filter((e) => e.levels.length && !owned.has(e.key));
  hint.textContent =
    all.length +
    ' skins que todavía no tenés. Las que ya son tuyas no aparecen: Riot nunca las pone en tu tienda.';

  const redraw = () => {
    count.textContent = state.wishlist.length + '/' + MAX;
    listBox.replaceChildren(
      ...(state.wishlist.length
        ? state.wishlist.map((w) =>
            row(
              all.find((x) => x.levels[0] === w.id) ?? {
                name: w.name,
                levels: [w.id],
                sub: '',
                icon: null,
              },
              state,
              status,
              redraw,
            ),
          )
        : [el('span', { class: 'note', text: 'Todavía no marcaste ninguna.' })]),
    );
    const q = search.value.trim().toLowerCase();
    resultBox.replaceChildren(
      ...(q.length < 2
        ? [el('span', { class: 'note', text: 'Escribí al menos dos letras.' })]
        : all
            .filter((e) => e.name.toLowerCase().includes(q))
            .slice(0, 40)
            .map((e) => row(e, state, status, redraw))),
    );
  };

  search.oninput = redraw;
  redraw();
}

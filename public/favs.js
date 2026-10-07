import { weaponIndex } from './catalogs.js';
import { icon } from './icons.js';
import { el, empty, heading, row, rows } from './ui.js';

// A favourite is the skin's LEVEL-0 uuid plus its name: level 0 is what the
// storefront offers (measured across skins with one level and with four), and
// the name travels with it so nothing downstream needs the 3.5 MB catalogue.
//
// Skins you already own are not offered here. Riot never puts an owned skin in
// your daily store, so starring one could only ever be a dead entry.

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

/**
 * The alert channel: a Discord webhook.
 *
 * ntfy was here first and read better — we minted the topic, the user only had
 * to subscribe. It had to go: ntfy limits publishing per source IP, a Worker has
 * no IP of its own, and a free account does not change that. Discord limits per
 * webhook, and a webhook is a thing each person has one of.
 *
 * The field takes the whole URL because that is what Discord's Copy button
 * gives you. The server keeps only the id and the token.
 */
function channel(state, status) {
  const said = el('p', { class: 'note' });
  const tell = (text, bad) => {
    said.textContent = text;
    said.className = bad ? 'err' : 'note';
  };

  const field = el('input', {
    type: 'url',
    value: state.discord,
    placeholder: 'https://discord.com/api/webhooks/…',
    spellcheck: 'false',
    autocapitalize: 'off',
    'aria-label': 'URL del webhook de Discord',
  });

  const test = el('button', { class: 'ghost', type: 'button', text: 'Enviar una prueba' });
  test.disabled = !state.discord;

  const save = el('button', { type: 'button', text: 'Guardar' });
  save.onclick = async () => {
    save.disabled = true;
    tell('Guardando…');
    const r = await api('/api/prefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlist: state.wishlist, notify: { discord: field.value } }),
    }).catch((err) => ({ error: err.message }));
    save.disabled = false;

    if (r.error) return tell('No se pudo guardar: ' + r.error, true);
    state.discord = r.discord ?? '';
    test.disabled = !state.discord;
    // The server hands back what it kept. An empty answer to a non-empty field
    // means it did not recognise the URL, and saying "guardado" would be a lie.
    if (field.value.trim() && !state.discord) {
      return tell('Eso no parece un webhook de Discord. Copiá la URL entera.', true);
    }
    tell(state.discord ? 'Guardado. Probalo acá abajo.' : 'Listo, sin avisos.');
  };

  test.onclick = async () => {
    test.disabled = true;
    tell('Enviando…');
    const r = await api('/api/test-alert', { method: 'POST' }).catch((e) => ({ error: e.message }));
    if (r.ok) tell('Enviada (' + (r.via ?? []).join(', ') + '). Mirá tu Discord.');
    else tell('No salió: ' + (r.error ?? 'el servidor no respondió.'), true);
    test.disabled = false;
  };

  return el(
    'div',
    { class: 'channel' },
    el('div', { class: 'chan-head' }, icon('bell', { size: 16 }), el('span', { text: 'Discord' })),
    el(
      'ol',
      { class: 'steps' },
      el('li', {
        text: 'En un servidor tuyo: Ajustes del canal → Integraciones → Webhooks → Nuevo webhook.',
      }),
      el('li', { text: 'Copiar URL del webhook, y pegala acá.' }),
      el('li', { text: 'Marcá abajo las skins que esperás. Miramos tu tienda una vez por día.' }),
    ),
    el('label', { class: 'field' }, field),
    el('div', { class: 'chan-actions' }, save, test),
    said,
    el('p', {
      class: 'note',
      text: 'Esa URL permite escribir en ese canal: no la publiques. Si se te escapa, borrá el webhook en Discord y creá otro.',
    }),
  );
}

function entry(e, state, status, redraw) {
  const id = e.levels[0];
  const on = state.wishlist.some((w) => w.id === id);

  const star = el('button', {
    class: 'star' + (on ? ' on' : ''),
    type: 'button',
    'aria-pressed': String(on),
    title: on ? 'Quitar de favoritas' : 'Avisarme cuando aparezca',
  });
  star.append(icon('star', { size: 18, fill: on, title: on ? 'Quitar' : 'Avisarme' }));

  star.onclick = () => {
    if (on) state.wishlist = state.wishlist.filter((w) => w.id !== id);
    else if (state.wishlist.length >= MAX) {
      status.textContent = 'Llegaste al máximo de ' + MAX + '.';
      return;
    } else state.wishlist = [...state.wishlist, { id, name: e.name }];
    save(state, status);
    redraw();
  };

  return row({
    name: e.name,
    meta: e.sub,
    icon: e.icon,
    colour: e.colour,
    tier: e.tierIcon,
    trailing: star,
  });
}

export async function renderFavs(app, data) {
  const state = { wishlist: data.prefs.wishlist ?? [], discord: data.prefs.discord ?? '' };
  const status = el('p', { class: 'note' });
  const count = el('span', { class: 'sub' });
  const mine = el('div');
  const results = el('div');
  const search = el('input', {
    type: 'search',
    placeholder: 'Buscar una skin…',
    spellcheck: 'false',
    autocapitalize: 'off',
    'aria-label': 'Buscar una skin',
  });
  const hint = el('p', { class: 'note', text: 'Cargando el catálogo…' });

  app.replaceChildren(
    heading('Avisarme'),
    el('p', {
      class: 'note',
      text: 'Marcá las skins que estás esperando. Cuando alguna aparezca en tu tienda te la señalamos acá, y te llega una notificación al celular.',
    }),
    status,
    heading('Cómo te llega el aviso'),
    channel(state, status),
    heading('Tus favoritas', count),
    mine,
    heading('Agregar'),
    el('label', { class: 'field' }, search),
    hint,
    results,
  );

  const map = await weaponIndex();
  const owned = new Set();
  for (const ids of Object.values(data.inv.byType ?? {})) {
    for (const id of ids) {
      const e = map.get(id);
      if (e) owned.add(e.key);
    }
  }
  const all = [...new Set(map.values())].filter((e) => e.levels.length && !owned.has(e.key));
  hint.textContent =
    all.length +
    ' skins que todavía no tenés. Las que ya son tuyas no aparecen: Riot nunca las pone en tu tienda.';

  const redraw = () => {
    count.textContent = state.wishlist.length + ' / ' + MAX;

    mine.replaceChildren(
      state.wishlist.length
        ? rows(
            ...state.wishlist.map((w) =>
              entry(
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
            ),
          )
        : empty('Todavía no marcaste ninguna.'),
    );

    const q = search.value.trim().toLowerCase();
    results.replaceChildren(
      q.length < 2
        ? empty('Escribí al menos dos letras.')
        : (() => {
            const found = all.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 40);
            return found.length
              ? rows(...found.map((e) => entry(e, state, status, redraw)))
              : empty('Ninguna skin coincide con «' + search.value.trim() + '».');
          })(),
    );
  };

  search.oninput = redraw;
  redraw();
}

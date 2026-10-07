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
 * The alert channel.
 *
 * The topic is minted by the server and shown here, never typed by the user: on
 * ntfy the name of a topic IS its password, so one a person would invent is one a
 * stranger can guess. The one step we cannot do for them is the subscribe, which
 * happens inside another app — hence the test button, which is the only way to
 * find out it worked without waiting for a skin to show up.
 */
function channel(topic) {
  if (!topic) {
    return el('p', {
      class: 'err',
      text: 'No pudimos crear tu canal de avisos. Recargá la página.',
    });
  }

  const name = el('code', { class: 'topic', text: topic });
  const said = el('p', { class: 'note' });
  const tell = (text, bad) => {
    said.textContent = text;
    said.className = bad ? 'err' : 'note';
  };

  const copy = el('button', { class: 'ghost tap', type: 'button' });
  copy.append(icon('copy', { size: 16, title: 'Copiar el nombre del canal' }));
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(topic);
      tell('Copiado.');
    } catch {
      // Clipboard access is refused in plenty of ordinary situations. Selecting
      // the text leaves them one keystroke away instead of stuck.
      getSelection()?.selectAllChildren(name);
      tell('El navegador no nos deja copiar. Te lo dejamos seleccionado.');
    }
  };

  const test = el('button', { class: 'ghost', type: 'button', text: 'Enviar una prueba' });
  test.onclick = async () => {
    test.disabled = true;
    tell('Enviando…');
    const r = await api('/api/test-alert', { method: 'POST' }).catch((e) => ({ error: e.message }));
    // Name the channel and its status either way. "No salió" alone sent us
    // measuring the wrong thing for an afternoon; "ntfy 429" is a diagnosis.
    if (r.ok) {
      tell('Enviada (' + (r.via ?? []).join(', ') + '). Si no llegó, todavía no estás suscripto.');
    } else {
      tell('No salió: ' + (r.error ?? 'el servidor no respondió.'), true);
    }
    test.disabled = false;
  };

  return el(
    'div',
    { class: 'channel' },
    el('div', { class: 'chan-head' }, icon('bell', { size: 16 }), el('span', { text: 'Tu canal' })),
    el('div', { class: 'topic-row' }, name, copy),
    el(
      'ol',
      { class: 'steps' },
      el('li', { text: 'Instalá ntfy en el celular, o abrí ntfy.sh en el navegador.' }),
      el('li', {
        text: 'Tocá + para suscribirte y pegá ese nombre. El servidor queda como viene, ntfy.sh.',
      }),
      el('li', { text: 'Marcá abajo las skins que esperás. Miramos tu tienda una vez por día.' }),
    ),
    el(
      'div',
      { class: 'chan-actions' },
      el('a', {
        class: 'btn ghost',
        href: 'https://ntfy.sh/' + topic,
        target: '_blank',
        rel: 'noreferrer',
        text: 'Abrir el canal',
      }),
      test,
    ),
    said,
    el('p', {
      class: 'note',
      text: 'El nombre es la única llave que tiene ese canal: quien lo sepa puede leer tus avisos. No lo publiques.',
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
  const state = { wishlist: data.prefs.wishlist ?? [] };
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
    channel(data.prefs.ntfy),
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

import { ranks, tierByPrice } from './catalogs.js';
import { renderFavs } from './favs.js';
import { icon } from './icons.js';
import { renderInventory } from './inventory.js';
import { bundleMeta, itemMeta, skin } from './items.js';
import { art, disclosure, el, empty, heading, money, row, rows, ticker, vp } from './ui.js';

const app = document.getElementById('app');
const nav = document.getElementById('nav');
const api = (p, o) => fetch(p, o).then((r) => r.json());
const show = (id) => document.getElementById(id).showModal();
const hide = (id) => document.getElementById(id).close();

// ── status line ────────────────────────────────────────────────────────────

async function statusLine(s) {
  const who = el('div', { class: 'who' });
  if (s.account?.name) who.append(el('span', { class: 'handle', text: s.account.name }));

  if (s.account?.rank) {
    const tier = (await ranks().catch(() => new Map())).get(s.account.rank.tier);
    if (tier) {
      const badge = el(
        'span',
        { class: 'rank' },
        art(tier.icon),
        el('b', { text: tier.name }),
        el('span', { text: s.account.rank.rr + ' RR' }),
      );
      who.append(badge);
    }
  }

  const clock = el('span');
  const readout = el(
    'div',
    { class: 'readout' },
    ...[
      ['vp', 'VP'],
      ['rad', 'RAD'],
      ['kc', 'KC'],
    ].map(([k, label]) =>
      el(
        'span',
        { class: 'bal' },
        document.createTextNode(vp(s.wallet[k])),
        el('span', { text: label }),
      ),
    ),
    el('span', { class: 'clock' }, el('span', { text: 'rota en' }), clock),
  );
  ticker(clock, s.fetchedAt + s.remaining);

  return el('div', { class: 'status' }, who.childNodes.length ? who : null, readout);
}

// ── store ──────────────────────────────────────────────────────────────────

async function offerRows(items, fav, currency) {
  const data = await Promise.all(items.map(skin));
  return rows(
    ...items.map((it, i) =>
      row({
        name: data[i]?.displayName,
        icon: data[i]?.displayIcon,
        colour: tierByPrice(it.cost),
        fav: fav.has(it.id),
        price: money({ ...it, currency }),
      }),
    ),
  );
}

async function render(app, s) {
  app.replaceChildren();

  const fav = await api('/api/prefs')
    .then((p) => new Set((p.wishlist ?? []).map((w) => w.id)))
    .catch(() => new Set());

  app.append(await statusLine(s));

  // The one thing worth looking at today, before anything else.
  const hit = s.offers.filter((o) => fav.has(o.id));
  if (hit.length) {
    app.append(
      el(
        'p',
        { class: 'notice' },
        icon('star', { size: 16, fill: true }),
        document.createTextNode(
          hit.length === 1
            ? 'Una de tus favoritas está hoy en la tienda.'
            : hit.length + ' de tus favoritas están hoy en la tienda.',
        ),
      ),
    );
  }

  app.append(heading('Tienda diaria'), await offerRows(s.offers, fav, 'VP'));

  if (s.night?.items?.length) {
    app.append(heading('Mercado nocturno'), await offerRows(s.night.items, fav, 'VP'));
  }

  if (s.accessory?.items?.length) {
    const sub = el('span', { class: 'sub' });
    app.append(heading('Accesorios', sub));
    ticker(sub, s.fetchedAt + s.accessory.remaining);
    const data = await Promise.all(s.accessory.items.map(itemMeta));
    app.append(
      rows(
        ...s.accessory.items.map((it, i) =>
          row({
            name: data[i]?.displayName,
            icon: data[i]?.displayIcon,
            qty: it.qty,
            owned: it.owned,
            price: money({ ...it, currency: 'KC' }),
          }),
        ),
      ),
    );
  }

  if (s.bundles?.length) {
    app.append(heading(s.bundles.length > 1 ? 'Bundles' : 'Bundle'));
    const meta = await Promise.all(s.bundles.map(bundleMeta));
    for (const [i, bn] of s.bundles.entries()) app.append(bundleBox(bn, meta[i]));
  }

  const out = el('button', { class: 'ghost', type: 'button', text: 'Desconectar' });
  out.onclick = () => show('bye');
  const sec = el('a', { href: '#', text: 'Qué guardamos' });
  sec.onclick = (e) => {
    e.preventDefault();
    show('sec');
  };
  app.append(el('footer', {}, out, sec));
}

function bundleBox(bn, meta) {
  const badges = bn.allOwned ? [el('span', { class: 'tag mine', text: 'completo' })] : [];
  return disclosure(
    { banner: meta?.displayIcon, name: meta?.displayName ?? 'Bundle', badges, right: money(bn) },
    async () => {
      if (!bn.items.length) return empty('Riot no detalló el contenido.');
      const data = await Promise.all(bn.items.map(itemMeta));
      return rows(
        ...bn.items.map((it, i) =>
          row({
            name: data[i]?.displayName,
            icon: data[i]?.displayIcon,
            colour: tierByPrice(it.base ?? it.price),
            owned: it.owned,
            price: money(it),
          }),
        ),
      );
    },
  );
}

// ── sign in ────────────────────────────────────────────────────────────────

/** Vendored, not a CDN: a third-party script on this origin could reach the
 *  session. Fetched only here, which runs once every few weeks. */
const loadQR = () =>
  window.QRCode
    ? Promise.resolve()
    : new Promise((ok, fail) => {
        const s = document.createElement('script');
        s.src = '/qr.js';
        s.onload = ok;
        s.onerror = fail;
        document.head.append(s);
      });

const fact = (name, text, bold) =>
  el(
    'div',
    { class: 'fact' },
    icon(name, { size: 16 }),
    el('p', {}, el('b', { text: bold }), document.createTextNode(' ' + text)),
  );

function signIn(msg) {
  setNav(null);
  const go = el('button', { id: 'go', type: 'button', text: 'Generar el código' });

  app.replaceChildren(
    el(
      'div',
      { class: 'gate' },
      el('h1', { text: 'Tu tienda de VALORANT, sin abrir el juego.' }),
      el('p', {
        class: 'lede',
        text:
          msg ??
          'Entrás escaneando un código con Riot Mobile. Antes de hacerlo, esto es exactamente qué pasa con tu cuenta.',
      }),
      el(
        'div',
        { class: 'facts' },
        fact(
          'key',
          'Riot te autentica dentro de su propia app. Acá no hay dónde escribirla.',
          'Tu contraseña no pasa por acá.',
        ),
        fact(
          'shield',
          'Guardamos la sesión que Riot devuelve, cifrada, con la clave fuera de la base de datos.',
          'Guardamos una sola cosa.',
        ),
        fact(
          'check',
          'Los endpoints de Riot que cambian algo —loadout, cola, compras— no existen en el código, y hay una prueba automática que lo verifica.',
          'Solo sabe leer.',
        ),
        fact(
          'close',
          'Desconectás cuando quieras y borramos tu sesión al instante. Del lado de Riot vence sola.',
          'Te podés ir.',
        ),
      ),
      go,
    ),
  );

  go.onclick = async () => {
    go.disabled = true;
    go.textContent = 'Generando…';
    const r = await api('/api/qr', { method: 'POST' });
    if (r.error) {
      go.disabled = false;
      go.textContent = 'Reintentar';
      return app.querySelector('.gate').append(el('p', { class: 'err', text: r.error }));
    }

    const box = el('div', { class: 'qrbox' });
    const st = el('p', { class: 'note', text: 'Esperando que lo apruebes…' });

    app.replaceChildren(
      el(
        'div',
        { class: 'gate' },
        el('h1', { text: 'Escaneá esto desde Riot Mobile.' }),
        el('p', {
          class: 'lede',
          text: 'En la app: Cuenta → Escanear código QR. Si ya estás en el celular, tocá el botón y se abre sola.',
        }),
        box,
        el('p', {}, el('a', { class: 'btn', href: r.url, text: 'Abrir Riot Mobile' })),
        // Say where it points. This gesture is mechanically QRLjacking minus the
        // intent, and someone who learns to check the destination is harder to
        // phish with a lookalike site later.
        el(
          'p',
          { class: 'dest' },
          document.createTextNode('Este código apunta a '),
          el('b', { text: 'riotgames.com' }),
          document.createTextNode(
            '. Tiene que hacerlo. Si algún sitio te muestra uno que no, cerrá la pestaña.',
          ),
        ),
        st,
      ),
    );

    loadQR()
      .then(
        () =>
          new QRCode(box, {
            text: r.url,
            width: 220,
            height: 220,
            colorDark: '#0a0c0d',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M,
          }),
      )
      .catch(() => box.remove());

    const timer = setInterval(async () => {
      const p = await api('/api/qr');
      if (p.status === 'ok') {
        clearInterval(timer);
        st.textContent = 'Listo. Cargando tu tienda…';
        load();
      } else if (p.status === 'expired' || p.error) {
        clearInterval(timer);
        st.replaceChildren(
          el('span', { class: 'err', text: p.error ?? 'El código venció. Generá uno nuevo.' }),
        );
      }
    }, 2000);
  };
}

// ── views ──────────────────────────────────────────────────────────────────

const VIEWS = {
  store: ['Tienda', '/api/store', render],
  inv: ['Colección', '/api/inventory', renderInventory],
  // Needs both: prefs for what is starred, inventory to hide what you already
  // own — Riot never offers an owned skin, so starring one is a dead entry.
  favs: ['Avisarme', null, renderFavs],
};

function setNav(active) {
  nav.replaceChildren();
  if (!active) return;
  for (const [key, [label]] of Object.entries(VIEWS)) {
    const b = el('button', { type: 'button', text: label, 'aria-current': String(key === active) });
    b.onclick = () => load(key);
    nav.append(b);
  }
}

async function load(which = 'store') {
  const [, path, draw] = VIEWS[which] ?? VIEWS.store;
  try {
    setNav(which);
    app.replaceChildren(
      el('div', { class: 'skel' }),
      el('div', { class: 'skel' }),
      el('div', { class: 'skel' }),
    );
    const s = path
      ? await api(path)
      : await Promise.all([api('/api/prefs'), api('/api/inventory')]).then(([prefs, inv]) => ({
          prefs,
          inv,
          ...(prefs.needsReseed || inv.needsReseed ? { needsReseed: true } : {}),
        }));
    if (s.needsReseed) return signIn();
    if (s.error) return signIn('No pudimos entrar: ' + s.error + '. Probá escanear de nuevo.');
    await draw(app, s);
  } catch (e) {
    app.replaceChildren(el('p', { class: 'err', text: 'No se pudo cargar: ' + e.message }));
  }
}

document.getElementById('bye-no').onclick = () => hide('bye');
document.getElementById('sec-ok').onclick = () => hide('sec');
document.getElementById('bye-yes').onclick = async () => {
  hide('bye');
  await api('/api/logout', { method: 'POST' });
  signIn('Listo, borramos tu sesión de nuestro servidor.');
};

load();

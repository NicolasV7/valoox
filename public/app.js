import { ranks } from './catalogs.js';
import { renderFavs } from './favs.js';
import { renderInventory } from './inventory.js';
import { bundleMeta, itemMeta, skin } from './items.js';
import { art, bundle, el, grid, ticker, vp } from './ui.js';

const app = document.getElementById('app');
const nav = document.getElementById('nav');
const api = (p, o) => fetch(p, o).then((r) => r.json());
const show = (id) => document.getElementById(id).showModal();
const hide = (id) => document.getElementById(id).close();

async function render(app, s) {
  app.replaceChildren();
  // One extra call, no Riot contact: it is what turns a favourite into something
  // you actually notice on the day it matters.
  const fav = new Set(
    (await api('/api/prefs').catch(() => ({})))?.wishlist?.map((w) => w.id) ?? [],
  );
  const hit = s.offers.filter((o) => fav.has(o.id));
  if (hit.length) {
    app.append(
      el(
        'p',
        { class: 'hit' },
        el('span', { class: 'tick', text: '★' }),
        document.createTextNode(' Hoy está ' + hit.length + ' de tus favoritas en la tienda.'),
      ),
    );
  }
  // Who you are, above the money. The name came free with sign-in; the rank is
  // one extra read of your OWN mmr — never anyone else's.
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
        el('span', { text: ' ' + s.account.rank.rr + ' RR' }),
      );
      badge.style.borderColor = tier.colour;
      who.append(badge);
    }
  }
  if (who.childNodes.length) app.append(who);

  const clock = el('div', { id: 'clock' });
  app.append(
    el(
      'header',
      {},
      el(
        'div',
        { class: 'wallet' },
        ...[
          ['vp', 'VP'],
          ['rad', 'RAD'],
          ['kc', 'KC'],
        ].map(([k, t]) =>
          el('div', {}, el('b', { text: vp(s.wallet[k]) }), el('span', { text: ' ' + t })),
        ),
      ),
      clock,
    ),
  );
  ticker(clock, s.fetchedAt + s.remaining);

  await grid(
    app,
    'Tienda diaria',
    s.offers.map((o) => ({ ...o, fav: fav.has(o.id) })),
    skin,
  );
  if (s.night?.items?.length) {
    await grid(
      app,
      'Mercado nocturno',
      s.night.items.map((o) => ({ ...o, fav: fav.has(o.id) })),
      skin,
    );
  }

  if (s.accessory?.items?.length) {
    // Its own rotation timer, independent of the daily one.
    const c = el('span', { class: 'sub' });
    await grid(app, 'Tienda de accesorios', s.accessory.items, itemMeta, {
      currency: 'KC',
      clock: c,
    });
    ticker(c, s.fetchedAt + s.accessory.remaining);
  }

  if (s.bundles?.length) {
    app.append(
      el('h2', { text: s.bundles.length > 1 ? 'Bundles destacados' : 'Bundle destacado' }),
    );
    const data = await Promise.all(s.bundles.map(bundleMeta));
    for (const [i, bn] of s.bundles.entries()) app.append(bundle(bn, data[i]));
  }

  const out = el('button', { class: 'ghost', text: 'Desconectar este dispositivo' });
  out.onclick = () => show('bye');
  const sec = el('a', { href: '#', text: 'Qué guardamos' });
  sec.onclick = (e) => {
    e.preventDefault();
    show('sec');
  };
  app.append(el('p', {}, out), el('footer', {}, sec));
}

/** The encoder is vendored, not loaded from a CDN: a third-party script on this
 *  origin could reach the session. Fetched only on the sign-in screen, which runs
 *  once every few weeks. */
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

function signIn(msg) {
  setNav(null);
  app.replaceChildren(
    el('h2', { text: 'Iniciar sesión' }),
    el('p', {
      class: 'note',
      text:
        msg ??
        'La sesión caducó. Se renueva desde el celular con Riot Mobile — la contraseña y el 2FA se manejan dentro de la app de Riot.',
    }),
    el('button', { id: 'go', text: 'Generar enlace de Riot Mobile' }),
  );

  document.getElementById('go').onclick = async (e) => {
    e.target.disabled = true;
    e.target.textContent = 'Generando…';
    const r = await api('/api/qr', { method: 'POST' });
    if (r.error) return app.append(el('p', { class: 'err', text: r.error }));

    const box = el('div', { class: 'qrbox' });
    const st = el('p', { class: 'note', text: 'Esperando aprobación…' });
    app.replaceChildren(
      el('h2', { text: 'Aprobar en Riot Mobile' }),
      el('p', {
        class: 'note',
        text: 'Escaneá el código desde Riot Mobile (Cuenta → Escanear código QR). Si ya estás en el celular, tocá el botón y se abre la app.',
      }),
      box,
      el('br'),
      el('a', { class: 'qr', href: r.url, text: 'Abrir Riot Mobile' }),
      st,
      // Say what the code points at. This gesture is mechanically QRLjacking
      // minus the intent, and a user who learns to check the destination is
      // harder to phish with a lookalike site later.
      el('p', {
        class: 'note',
        text: 'Este código apunta a riotgames.com. Tiene que hacerlo. Si algún sitio te muestra un QR que no, cerrá la pestaña.',
      }),
    );

    loadQR()
      .then(
        () =>
          new QRCode(box, {
            text: r.url,
            width: 232,
            height: 232,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M,
          }),
      )
      .catch(() => box.remove()); // the link still works without the picture

    const timer = setInterval(async () => {
      const p = await api('/api/qr');
      if (p.status === 'ok') {
        clearInterval(timer);
        st.textContent = 'Listo, cargando tienda…';
        load();
      } else if (p.status === 'expired' || p.error) {
        clearInterval(timer);
        st.replaceChildren(el('span', { class: 'err', text: p.error ?? 'El enlace caducó.' }));
      }
    }, 2000);
  };
}

const VIEWS = {
  store: ['Tienda', '/api/store', render],
  inv: ['Colección', '/api/inventory', renderInventory],
  // Needs both: the prefs to know what is starred, the inventory to hide what you
  // already own — Riot would never offer it, so favouriting it is a dead entry.
  favs: ['Avisarme', null, renderFavs],
};

/** Hidden while signed out: there is nothing to switch between. */
function setNav(active) {
  nav.replaceChildren();
  if (!active) return;
  for (const [key, [text]] of Object.entries(VIEWS)) {
    const b = el('button', { text, 'aria-current': String(key === active) });
    b.onclick = () => load(key);
    nav.append(b);
  }
}

async function load(which = 'store') {
  const [, path, draw] = VIEWS[which] ?? VIEWS.store;
  try {
    setNav(which);
    app.replaceChildren(el('p', { class: 'note', text: 'Cargando…' }));
    const s = path
      ? await api(path)
      : await Promise.all([api('/api/prefs'), api('/api/inventory')]).then(([prefs, inv]) => ({
          prefs,
          inv,
          ...(prefs.needsReseed || inv.needsReseed ? { needsReseed: true } : {}),
        }));
    if (s.needsReseed) {
      setNav(null);
      return signIn();
    }
    if (s.error) {
      setNav(null);
      return signIn('Error: ' + s.error);
    }
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
  signIn('Listo. Borramos tu sesión de nuestro servidor.');
};

load();

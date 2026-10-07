// Every node in this app is built here, and none of it from a string.
//
// Item names come from valorant-api.com — a community database this project does
// not control — and this page can reach a Riot session. Interpolating those names
// into markup would be a stored-XSS pipeline straight to a credential, so text
// always goes through textContent and only src and href are ever set, after the
// origin is checked.

import { icon } from './icons.js';

export const vp = (n) => (n == null ? '—' : n.toLocaleString('es'));

export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k === 'class') n.className = v;
    else n.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) n.append(c);
  return n;
}

/** An <img> only if the URL really is a valorant-api asset. */
export function art(url) {
  if (typeof url !== 'string' || !/^https:\/\/(media\.)?valorant-api\.com\//.test(url)) return null;
  return el('img', { src: url, alt: '', loading: 'lazy', decoding: 'async' });
}

/** Section heading. `sub` sits right-aligned on the same baseline. */
export const heading = (title, sub) => el('h2', {}, document.createTextNode(title), sub ?? null);

export const empty = (text) => el('p', { class: 'empty', text });

// ── money ──────────────────────────────────────────────────────────────────
// One renderer for all five shapes: daily offer, night-market discount,
// accessory priced in Kingdom Credits, bundle total, bundle item.

export function money({ cost, price, percent, base, currency }) {
  const n = el('div', { class: 'price' });
  const was = percent ? cost : base;
  const now = percent ? price : (price ?? cost ?? base);
  if (was != null && now != null && was !== now) n.append(el('s', { text: vp(was) }));
  n.append(document.createTextNode(vp(now)));
  if (currency) n.append(el('span', { class: 'cur', text: currency }));
  if (percent) n.append(el('span', { class: 'off', text: '−' + percent + '%' }));
  return n;
}

// ── the row ────────────────────────────────────────────────────────────────
// The store, bundle contents and the favourites list are all the same object.
// The 3px leading bar is the only place rarity appears on a row, which is what
// keeps it carrying information instead of decorating.

/**
 * @param {{ name?: string, meta?: string, icon?: string, colour?: string,
 *           owned?: boolean, fav?: boolean, qty?: number,
 *           price?: Node, trailing?: Node }} o
 */
export function row(o) {
  const name = el('div', { class: 'name' }, el('span', { text: o.name || 'Desconocido' }));
  if (o.fav) {
    const s = icon('star', { size: 13, fill: true, title: 'La marcaste' });
    s.classList.add('starred');
    name.append(s);
  }
  if (o.owned) {
    const c = icon('check', { size: 13, title: 'Ya lo tenés' });
    c.classList.add('tick');
    name.append(c);
  }
  if (o.qty > 1) name.append(el('span', { class: 'tag qty', text: '×' + o.qty }));

  const node = el(
    'div',
    { class: 'row' + (o.owned ? ' owned' : '') },
    el('div', { class: 'bar' }),
    el('figure', {}, art(o.icon)),
    el('div', {}, name, o.meta ? el('div', { class: 'meta', text: o.meta }) : null),
    o.trailing ?? o.price ?? null,
  );
  // CSSOM, never a style attribute: the CSP has no unsafe-inline.
  if (o.colour) node.firstElementChild.style.background = o.colour;
  return node;
}

export const rows = (...kids) => el('div', { class: 'rows' }, ...kids);

export const tile = (o) =>
  el('div', { class: 'tile' }, art(o.icon), el('div', { class: 'name', text: o.name || 'Ítem' }));

export const tiles = (...kids) => el('div', { class: 'tiles' }, ...kids);

// ── disclosure ─────────────────────────────────────────────────────────────

/**
 * A <details> whose contents load on first open — the browser owns the open and
 * close behaviour, so there is no state to track and no JS to write for it.
 * @param {{ banner?: string, name: string, badges?: Node[], right?: Node }} head
 * @param {() => Promise<Node | Node[]>} load
 */
export function disclosure(head, load) {
  const body = el('div', { class: 'body' }, el('p', { class: 'note', text: 'Cargando…' }));

  const title = el('div', { class: 'name' }, el('span', { text: head.name }));
  for (const b of head.badges ?? []) title.append(b);

  const chev = icon('chevron', { size: 16 });
  chev.classList.add('chev');

  const box = el(
    'details',
    {},
    el(
      'summary',
      {},
      head.banner ? art(head.banner) : null,
      el('div', { class: 'head' }, title, head.right ?? el('span'), chev),
    ),
    body,
  );

  box.addEventListener('toggle', async () => {
    if (!box.open || box.dataset.done) return;
    box.dataset.done = '1';
    try {
      const out = await load();
      body.replaceChildren(...[out].flat().filter(Boolean));
    } catch (e) {
      body.replaceChildren(el('p', { class: 'err', text: 'No se pudo cargar: ' + e.message }));
    }
  });
  return box;
}

// ── countdown ──────────────────────────────────────────────────────────────

export function hms(s) {
  if (s <= 0) return 'rotando…';
  const d = Math.floor(s / 86400);
  const p = (n) => String(n).padStart(2, '0');
  const t = `${p(Math.floor((s % 86400) / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
  return d ? `${d}d ${t}` : t;
}

export function ticker(node, deadline) {
  const tick = () => {
    node.textContent = hms(Math.round(deadline - Date.now() / 1000));
  };
  tick();
  const id = setInterval(tick, 1000);
  // Switching views removes the node; without this the timer outlives it, and
  // three view swaps leave three of them running.
  const watch = new MutationObserver(() => {
    if (!node.isConnected) {
      clearInterval(id);
      watch.disconnect();
    }
  });
  watch.observe(document.body, { childList: true, subtree: true });
}

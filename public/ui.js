// Every DOM node in this app is built here, and none of it from a string.
//
// Item names come from valorant-api.com — a community database this project does
// not control. Interpolating them into markup would be a stored-XSS pipeline into
// a page that can reach a 2FA-bypassing session. Text goes through textContent;
// only src and href are ever set, and only after checking the origin.

import { itemMeta } from './items.js';

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
  return el('img', { src: url, alt: '', loading: 'lazy' });
}

/** One price renderer for all five shapes: daily offer, night-market discount,
 *  accessory in Kingdom Credits, bundle total, and bundle item. */
export function money({ cost, price, percent, base, currency }) {
  const n = el('div', { class: 'price' });
  if (percent) {
    n.append(
      el('s', { text: vp(cost) }),
      el('span', { class: 'off', text: `${vp(price)} · -${percent}%` }),
    );
  } else {
    if (base != null && price != null && base !== price) n.append(el('s', { text: vp(base) }));
    n.append(document.createTextNode(vp(price ?? cost ?? base)));
  }
  if (currency) n.append(el('span', { class: 'cur', text: ' ' + currency }));
  return n;
}

export function label(text, { qty, owned, tag, fav } = {}) {
  const n = el('div', { class: 'name', text: text || 'Desconocido' });
  if (fav)
    n.append(el('span', { class: 'tick star-in', title: 'La marcaste como favorita', text: '★' }));
  if (qty > 1) n.append(el('span', { class: 'qty', text: ` ×${qty}` }));
  if (owned) n.append(el('span', { class: 'tick', title: 'Ya lo tenés', text: '✓' }));
  if (tag) n.append(el('span', { class: 'tag', text: tag }));
  return n;
}

// --- countdown --------------------------------------------------------------
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
  setInterval(tick, 1000);
}

// --- sections ---------------------------------------------------------------
export async function grid(parent, title, items, lookup, opts = {}) {
  parent.append(el('h2', {}, document.createTextNode(title), opts.clock ?? null));
  const g = el('div', { class: 'grid' });
  parent.append(g);
  const data = await Promise.all(items.map(lookup));
  items.forEach((it, i) =>
    g.append(
      el(
        'div',
        { class: 'card' + (it.owned ? ' owned' : '') + (it.fav ? ' fav' : '') },
        art(data[i]?.displayIcon),
        label(data[i]?.displayName, it),
        money({ ...it, currency: opts.currency }),
      ),
    ),
  );
}

/** <details> gives the open/close behaviour for free — no JS, no state to track. */
export function bundle(bn, b) {
  const items = el(
    'div',
    { class: 'items' },
    el('span', { class: 'note', text: 'Cargando contenido…' }),
  );
  const box = el(
    'details',
    { class: 'bundle' },
    el(
      'summary',
      {},
      art(b?.displayIcon),
      el(
        'div',
        { class: 'head' },
        label(b?.displayName ?? 'Bundle', { tag: bn.allOwned ? 'ya lo tenés completo' : null }),
        money(bn),
      ),
    ),
    items,
  );

  // Contents resolve on first open only: most loads never expand a bundle, and
  // that is six image requests nobody asked for.
  box.addEventListener('toggle', async () => {
    if (!box.open || box.dataset.done) return;
    box.dataset.done = '1';
    const metas = await Promise.all(bn.items.map(itemMeta));
    items.replaceChildren(
      ...(bn.items.length
        ? bn.items.map((it, i) =>
            el(
              'div',
              { class: 'item' + (it.owned ? ' owned' : '') },
              art(metas[i]?.displayIcon),
              label(metas[i]?.displayName ?? 'Ítem desconocido', { owned: it.owned }),
              money(it),
            ),
          )
        : [el('span', { class: 'note', text: 'Riot no detalló el contenido.' })]),
    );
  });
  return box;
}

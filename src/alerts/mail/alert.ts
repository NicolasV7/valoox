// The morning message: something you starred is in front of you.
//
// It opens on the thing, not on a sentence about the thing. A mail about a
// gun whose first line is "You have 1 new alert" is a mail nobody opens
// twice — so the render is the top of it, on the colour of the skin.
//
// The picture comes from this origin, built from the skin level's uuid: see
// routes/render.ts. The Worker still has no catalogue and needs none, because
// a uuid is the whole address.
//
// The one number that decides whether you act is how long is left, and it
// sits beside the button rather than in a footnote. That number is Riot's
// own, carried from the storefront payload, which is why it can be stated at
// all: a countdown we invented would be a countdown that drifts.
//
// Names come from the browser that starred them. What the mail can say about
// an item is exactly what was on screen when somebody pressed the star, which
// is also why an accessory gets a line and a gun gets a picture: only a gun's
// render has an address that can be derived.

import { renderAt } from '../../routes/render.ts';
import type { Hit } from '../../types.ts';
import { shell } from './layout.ts';
import { FONT, INK, note, solid, weave } from './paint.ts';
import type { Lang } from './words.ts';
import { words } from './words.ts';

/** The gold the store uses for a clock that is running out. */
const HUE = '217, 193, 78';
const CLOCK = '#F0CB74';

/** Somebody delighted with the gun they are holding. */
const STICKER = '/art/spray-thisgun.png';

/** Riot's item type for a skin level. Only these have a render this can
 *  build an address for; everything else is named and not drawn. */
const LEVELS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';

export const subject = (found: Hit[], lang: Lang, who?: string | null): string =>
  words[lang].hitSubject(found[0]?.name ?? '', found.length) + (who ? ' · ' + who : '');

export const text = (found: Hit[], lang: Lang, link: string): string =>
  words[lang].hitText(
    found.map((h) => h.name),
    link,
  );

export function html(
  found: Hit[],
  /** Seconds Riot says are left on the panel these came from. */
  left: number,
  lang: Lang,
  origin: string,
  stop: string,
  who?: string | null,
): string {
  const w = words[lang];

  const body =
    // Every match, each on its own band, each the same size. There is no
    // appendix: a message about four things that shows one of them and lists
    // the rest under a heading is a message that decided which three you
    // cared about less, and it has no way to know that.
    found.map((h) => band(h, origin, w.inYourStore)).join('') +
    // the one number that decides whether you act, next to the thing you do
    `<tr><td class="pad" style="padding:22px 28px 0">` +
    `<a href="${origin}/" style="display:block;padding:15px 20px;border-radius:10px;` +
    `${solid(INK.text)}color:#0e0e11;text-decoration:none;font-size:15px;` +
    `font-weight:600;text-align:center">${w.openYourStore}</a>` +
    `<div style="padding-top:14px;text-align:center">` +
    `<span style="font-family:${FONT.mono};font-size:11.5px;letter-spacing:0.14em;` +
    `text-transform:uppercase;color:${INK.faint}">${w.goneIn} </span>` +
    `<span style="font-family:${FONT.mono};font-size:17px;font-weight:700;color:${CLOCK}">` +
    `${hours(left)}</span></div></td></tr>` +
    `<tr><td class="pad" style="padding:22px 28px 0">` +
    `${note(origin + STICKER, 104, w.youStarred, HUE)}</td></tr>` +
    `<tr><td class="pad" style="padding:22px 28px 24px">` +
    `<p style="margin:0;font-size:12.5px;line-height:1.6;color:${INK.quiet}">` +
    `${w.oneADay}</p></td></tr>`;

  const foot =
    `<p style="margin:0;font-size:12px;line-height:1.6;color:${INK.quiet}">${w.hitFoot}</p>` +
    `<p style="margin:10px 0 0;font-size:12px;line-height:1.6">` +
    `<a href="${stop}" style="color:${INK.faint}">${w.stopThese}</a></p>`;

  return shell({ aside: w.goneInAside(hours(left)), body, foot, lang, origin, who });
}

/** Whether a row has a picture this can address. A spray, a charm, a card
 *  and a title all have renders somewhere; none of them has one whose url is
 *  derivable from the id alone, which is the whole constraint here. */
const drawable = (h: Hit | undefined): h is Hit => !!h && (h.type ?? LEVELS) === LEVELS;

/** One match: the thing, on the colour of a clock running out, with its name
 *  under it. A gun is drawn because a skin level's uuid is the whole address
 *  of its render; an accessory is named, because none of theirs is. */
function band(h: Hit, origin: string, said: string): string {
  const art = drawable(h)
    ? `<img src="${renderAt(origin, h.id)}" width="460" alt="${esc(h.name)}"` +
      ' style="display:block;border:0;width:100%;max-width:460px;height:auto;margin:0 auto">'
    : '';
  return (
    `<tr><td align="center" class="pad" style="padding:30px 28px 26px;${weave(HUE, INK.page)}">` +
    art +
    `<div style="font-size:26px;font-weight:500;letter-spacing:-0.02em;color:${INK.text};` +
    `line-height:1.2;padding-top:${art ? 14 : 0}px">${esc(h.name)}</div>` +
    `<div style="font-size:13px;color:${INK.faint};padding-top:7px">${said}</div>` +
    `</td></tr>`
  );
}

/** Names come from a catalogue this project does not control and go into
 *  markup, which is the same reason the page builds DOM and never strings. */
const esc = (said: string): string =>
  said.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** `13:52:06`, or `2d 04:11:09` past a day — the same spelling the app uses,
 *  because the two are read within a minute of each other. */
function hours(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  const days = Math.floor(s / 86400);
  const clock = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map(pad).join(':');
  return days > 0 ? days + 'd ' + clock : clock;
}

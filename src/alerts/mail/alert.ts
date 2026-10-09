// The morning message: something you starred is in front of you.
//
// It opens on the thing, not on a sentence about the thing. A mail about a
// gun whose first line is "You have 1 new alert" is a mail nobody opens
// twice — so the render is the top of it, on the skin's own colour, and the
// one number that decides whether you act sits beside the button rather than
// in a footnote. That number is Riot's own, carried from the storefront
// payload: a countdown we invented would be a countdown that drifts.
//
// Everything the message knows about a skin beyond its uuid was put there by
// the browser when somebody pressed the star — name, tier, how many levels
// and colourways, the colour measured off the render. The Worker has no
// catalogue and needs none; see types.ts Starred. The picture comes from this
// origin, built from the uuid: see routes/render.ts.
//
// One band per match, all the same size. A message about four things that
// shows one of them and lists the rest under a heading has decided which
// three you cared about less, and it has no way to know that.

import { renderAt } from '../../routes/render.ts';
import type { Hit } from '../../types.ts';
import { shell } from './layout.ts';
import { FONT, INK, note, solid, weave } from './paint.ts';
import type { Lang } from './words.ts';
import { words } from './words.ts';

/** The gold the store uses for a clock that is running out. It is the colour
 *  of the urgency, not of the skin — the skin brings its own. */
const HUE = '217, 193, 78';
const CLOCK = '#F0CB74';

/** What a band falls back to when the star was pressed before the colour was
 *  being kept: the app's own neutral, which is what an unmeasured weave uses
 *  everywhere else. */
const NEUTRAL = '157, 164, 172';

/** Somebody delighted with the gun they are holding. */
const STICKER = '/art/spray-thisgun.png';

/** VP, the coin every skin is priced in. From this origin, like the mark. */
const COIN = '/art/coin-vp.png';

/** Riot's item type for a skin level — the only kind of thing whose picture
 *  has an address this can build. */
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
  /** Minutes the reader's clock is behind UTC, so the header can say a time
   *  that means something where it is read. */
  tz?: number,
): string {
  const w = words[lang];

  const body =
    found.map((h) => band(h, origin, w, lang)).join('') +
    // the one number that decides whether you act, next to the thing you do
    `<tr><td class="pad" style="padding:20px 28px 0">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"` +
    ` style="border-top:1px solid ${INK.rule}"><tr>` +
    `<td style="padding-top:20px" valign="middle">` +
    `<a href="${origin}/" style="display:inline-block;padding:14px 26px;border-radius:10px;` +
    `${solid(INK.text)}color:#0e0e11;text-decoration:none;font-size:14.5px;` +
    `font-weight:600">${w.openYourStore}</a></td>` +
    `<td align="right" style="padding-top:20px" valign="middle">` +
    `<div style="font-family:${FONT.mono};font-size:11.5px;letter-spacing:0.14em;` +
    `text-transform:uppercase;color:${INK.faint}">${w.goneIn}</div>` +
    `<div style="font-family:${FONT.mono};font-size:19px;font-weight:700;color:${CLOCK};` +
    `padding-top:4px">${hours(left)}</div></td>` +
    `</tr></table></td></tr>` +
    // the line that says why this arrived, with the one sticker in the message
    `<tr><td class="pad" style="padding:22px 28px 0">` +
    `${note(origin + STICKER, 104, w.youStarred(waited(found)), HUE)}</td></tr>` +
    `<tr><td class="pad" style="padding:22px 28px 26px">` +
    `<p style="margin:0;font-size:12.5px;line-height:1.6;color:${INK.quiet}">` +
    `${w.oneADay}</p></td></tr>`;

  const foot =
    `<p style="margin:0;font-size:12px;line-height:1.6;color:${INK.quiet}">${w.hitFoot}</p>` +
    `<p style="margin:10px 0 0;font-size:12px;line-height:1.6">` +
    `<a href="${stop}" style="color:${INK.faint}">${w.stopThese}</a></p>`;

  return shell({ aside: w.sentAt(Date.now(), tz, lang), body, foot, lang, origin, who });
}

/**
 * One match: the picture on the skin's own colour, then its name, what it is,
 * and what it costs today.
 *
 * An accessory is named and not drawn. Only a skin level's render has an
 * address derivable from the id, and inventing a layout for the ones that do
 * not would be two designs for one message.
 */
function band(h: Hit, origin: string, w: (typeof words)['es'], lang: Lang): string {
  const gun = (h.type ?? LEVELS) === LEVELS;
  const hue = h.art ?? NEUTRAL;

  const art = gun
    ? `<tr><td align="center" style="padding:0;${weave(hue, INK.page)}">` +
      `<img src="${renderAt(origin, h.id)}" width="490" alt="${esc(h.name)}"` +
      ' style="display:block;border:0;width:100%;max-width:490px;height:auto;' +
      'margin:0 auto;padding:31px 0">' +
      `</td></tr>`
    : '';

  // Name on the left, price on the right, baselines aligned — the board's own
  // arrangement, as a table because a message has no flexbox.
  return (
    art +
    `<tr><td class="pad" style="padding:20px 28px 0">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td valign="bottom">` +
    `<div style="font-size:27px;font-weight:500;letter-spacing:-0.02em;color:${INK.text};` +
    `line-height:1.15">${esc(h.name)}</div>` +
    `<div style="font-size:13px;color:${INK.faint};padding-top:6px">${says(h, w, lang)}</div>` +
    `</td>` +
    (h.cost
      ? `<td align="right" valign="bottom" style="padding-left:14px;white-space:nowrap">` +
        `<img src="${origin}${COIN}" width="20" height="20" alt="VP"` +
        ' style="display:inline-block;width:20px;height:20px;vertical-align:-3px;opacity:0.85">' +
        `<span style="font-family:${FONT.mono};font-size:25px;color:${INK.text};` +
        `padding-left:8px">${count(h.cost, lang)}</span></td>`
      : '') +
    `</tr></table></td></tr>`
  );
}

/** "Premium · 4 levels · 4 chromas" — only the parts that are known, and only
 *  the ones worth saying. One level and one colourway is every default skin
 *  in the game, so a line reading "1 level · 1 chroma" says nothing. */
function says(h: Hit, w: (typeof words)['es'], lang: Lang): string {
  const parts = [
    h.tier ? w.tier[h.tier as keyof typeof w.tier] : null,
    h.levels && h.levels > 1 ? w.levels(h.levels) : null,
    h.chromas && h.chromas > 1 ? w.chromas(h.chromas) : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : w.inYourStore;
}

/** How long the oldest of these has been waiting, in whole days. */
const waited = (found: Hit[]): number => {
  const at = found.map((h) => h.at).filter((n): n is number => typeof n === 'number');
  if (!at.length) return 0;
  return Math.max(0, Math.floor((Date.now() - Math.min(...at)) / 86_400_000));
};

/** Names come from a catalogue this project does not control and go into
 *  markup, which is the same reason the page builds DOM and never strings. */
const esc = (said: string): string =>
  said.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 1775 -> "1,775", in the reader's own separator. */
const count = (n: number, lang: Lang): string =>
  n.toLocaleString(lang === 'es' ? 'es-CO' : 'en-GB');

/** `13:52:06`, or `2d 04:11:09` past a day — the same spelling the app uses,
 *  because the two are read within a minute of each other. */
function hours(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  const days = Math.floor(s / 86400);
  const clock = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map(pad).join(':');
  return days > 0 ? days + 'd ' + clock : clock;
}

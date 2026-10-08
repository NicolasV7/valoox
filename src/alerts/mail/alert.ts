// The morning message: something you starred is in front of you.
//
// It opens on the thing, not on a sentence about the thing. A mail about a
// gun whose first line is "You have 1 new alert" is a mail nobody opens
// twice — so the render is the top of it, at the size the store shows, on the
// colour of the skin.
//
// The one number that decides whether you act is how long is left, and it
// sits beside the button rather than in a footnote. That number is Riot's
// own, carried from the storefront payload, which is why it can be stated at
// all: a countdown we invented would be a countdown that drifts.
//
// Names come from the browser that starred them. The Worker has no catalogue
// and never will, so what the mail can say about an item is exactly what was
// on screen when somebody pressed the star — which is also why there is no
// render for an accessory here, only for the one skin it leads with.

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
  const lead = found[0]?.name ?? '';
  const rest = found.slice(1);

  const body =
    // the thing, on its own colour, at the size the store shows it
    `<tr><td align="center" style="padding:34px 28px 30px;${weave(HUE, INK.page)}">` +
    `<div style="font-size:27px;font-weight:500;letter-spacing:-0.02em;` +
    `color:${INK.text};line-height:1.2">${lead}</div>` +
    `<div style="font-size:13px;color:${INK.faint};padding-top:8px">${w.inYourStore}</div>` +
    `</td></tr>` +
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
    // everything else that matched, named rather than counted
    (rest.length
      ? `<tr><td class="pad" style="padding:22px 28px 0">` +
        `<div style="font-family:${FONT.mono};font-size:11px;letter-spacing:0.12em;` +
        `text-transform:uppercase;color:${INK.faint};padding-bottom:10px">${w.alsoToday}</div>` +
        rest
          .map(
            (h) =>
              `<div style="font-size:15px;color:${INK.text};padding:7px 0;` +
              `border-top:1px solid ${INK.rule}">${h.name}</div>`,
          )
          .join('') +
        `</td></tr>`
      : '') +
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

/** `13:52:06`, or `2d 04:11:09` past a day — the same spelling the app uses,
 *  because the two are read within a minute of each other. */
function hours(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  const days = Math.floor(s / 86400);
  const clock = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map(pad).join(':');
  return days > 0 ? days + 'd ' + clock : clock;
}

// The six digits, in a mailbox.
//
// What this is not: a bold line, a bordered box and a centred pill. That is
// the shape of every notification anybody has ever ignored. The code is the
// whole message, so the code is the size of the message — and the two numbers
// that bound it sit under it rather than in a footnote.
//
// Two sentences carry more weight than the design does. "If it was not you, do
// nothing" has to be true, and it is: an address that never answers is never
// written to again. And nobody will ever ask for this code — which is worth
// saying in the one place a stranger could later claim otherwise. That one
// gets the sticker, because it is the line a person has to remember.
//
// The words come from words.ts in the language of the tab that asked.

import { shell } from './layout.ts';
import { FONT, INK, note, weave } from './paint.ts';
import type { Lang } from './words.ts';
import { words } from './words.ts';

/** The purple the sign-in screens use for a thing being proved. */
const HUE = '152, 96, 192';

/** Cypher, one finger up, telling you to keep it. Picked for what it is OF,
 *  like the rest: this is the block that says do not hand the code over, and
 *  that is the gesture. Served from our own origin so there is no third party
 *  in a message, and absolute because a mail client has no page to be
 *  relative to.
 *
 *  Every client worth the name blocks images until asked, so the block has to
 *  read without it — which is why the sentence is the block and the sticker is
 *  alt="" above it. */
const STICKER = '/art/spray-shh.png';

export const subject = (code: string, lang: Lang): string => words[lang].subject(code);

export const text = (code: string, mins: number, lang: Lang): string =>
  words[lang].text(code, mins);

export function html(
  code: string,
  mins: number,
  lang: Lang,
  origin: string,
  stop: string,
  who?: string | null,
): string {
  const w = words[lang];
  const body =
    // the code, at the size of the message
    `<tr><td align="center" class="pad" style="padding:44px 28px 46px;${weave(HUE, INK.page)}">` +
    // Letter-spacing and not spaces between the digits: the spaces doubled
    // the width of the one line in the message that must never wrap, and at
    // 320px they pushed it off the edge.
    `<div class="big" style="font-family:${FONT.mono};font-size:46px;font-weight:700;` +
    `letter-spacing:0.18em;color:${INK.text};line-height:1">${code}</div>` +
    `<div style="font-family:${FONT.mono};font-size:11.5px;letter-spacing:0.16em;` +
    `text-transform:uppercase;color:${INK.body};padding-top:22px">` +
    `${w.bounds(mins)}</div></td></tr>` +
    // what it is for, and what to do if it was not you
    `<tr><td class="pad" style="padding:26px 28px 0">` +
    `<div style="font-size:23px;font-weight:500;letter-spacing:-0.02em;` +
    `color:${INK.text};line-height:1.25">${w.asked}</div>` +
    `<p style="margin:10px 0 0;font-size:14px;line-height:1.65;color:${INK.body}">` +
    `${w.askedWhy}</p></td></tr>` +
    // the line that matters if somebody later asks for the code, with the one
    // picture in the message over it
    `<tr><td class="pad" style="padding:22px 28px 0">` +
    `${note(origin + STICKER, 120, w.neverAsk, HUE)}</td></tr>` +
    `<tr><td class="pad" style="padding:22px 28px 24px">` +
    `<p style="margin:0;font-size:13.5px;line-height:1.65;color:${INK.faint}">` +
    `${w.neverPassword}</p></td></tr>`;

  // The link belongs here more than it does on the alert: this is the message
  // somebody gets when a stranger typed their address, and the one thing they
  // want is for it to stop. It takes the pending address off the row, so the
  // code it carries can never be the one that verifies it.
  const foot =
    `<p style="margin:0;font-size:12px;line-height:1.6;color:${INK.quiet}">${w.foot}</p>` +
    `<p style="margin:10px 0 0;font-size:12px;line-height:1.6">` +
    `<a href="${stop}" style="color:${INK.faint}">${w.stopThese}</a></p>`;

  // A duration, not a clock time. The board shows "Expires 10:14", which is a
  // time in the sender's timezone printed for a reader in another one.
  return shell({ aside: w.expiresIn(mins), body, foot, lang, origin, who });
}

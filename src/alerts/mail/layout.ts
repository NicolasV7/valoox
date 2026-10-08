// The shell every message is built in.
//
// Tables and inline CSS, not because it is pretty but because Outlook on
// Windows renders through Word: no flexbox, no grid, no `gap`, and a `<div>`
// with a background colour is a coin toss. 600px is the width every client
// agrees on.
//
// No web font. Nothing loads reliably in mail, so designing this in Bricolage
// would be designing something nobody receives — it is the system stack, and
// the one place the app's typography does not follow it.
//
// The art direction survives the move: the dark ground, the 107° weave behind
// the thing the message is about, and the rule that the number which decides
// whether you act is next to the thing you do, never in a footnote.

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

export const FONT = { sans: SANS, mono: MONO };

export const INK = {
  page: '#0E0E11',
  stage: '#16171B',
  rule: '#1D1F25',
  line: '#24262C',
  text: '#f2f4f5',
  body: '#A7AEB3',
  faint: '#8B9399',
  quiet: '#6E757B',
  legal: '#565C64',
};

/** The weave, at the one angle the whole product uses, in whatever colour the
 *  message is about. A mail client that drops gradients falls back to the flat
 *  colour underneath, which is why that is given too. */
export const weave = (rgb: string, under: string): string =>
  `background: ${under}; background-image:` +
  `linear-gradient(107deg, rgba(0,0,0,0) 0 31%, rgba(${rgb},0.085) 31% 45%,` +
  ` rgba(0,0,0,0) 45% 51%, rgba(${rgb},0.045) 51% 58%, rgba(0,0,0,0) 58% 72%,` +
  ` rgba(${rgb},0.064) 72% 77%, rgba(0,0,0,0) 77%),` +
  `repeating-linear-gradient(107deg, rgba(${rgb},0.05) 0 1px, rgba(0,0,0,0) 1px 23px),` +
  `radial-gradient(104% 150% at 50% 50%, rgba(${rgb},0.3) 0%, rgba(${rgb},0) 70%)`;

/** The mark, drawn rather than fetched: a mail client that blocks images would
 *  otherwise open on a broken icon, and this one is two circles. */
const MARK =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="display:block">' +
  '<circle cx="6.4" cy="12" r="4.65" fill="#f2f4f5"/>' +
  '<circle cx="17.6" cy="12" r="4.05" stroke="#f2f4f5" stroke-width="1.9"/></svg>';

export function shell({
  aside,
  body,
  foot,
}: {
  /** The small line opposite the mark — a countdown, a date. */
  aside: string;
  body: string;
  foot: string;
}): string {
  return (
    `<!doctype html><html><body style="margin:0;padding:0;background:${INK.page}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"` +
    ` style="background:${INK.page}"><tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"` +
    ` style="width:600px;max-width:100%;background:${INK.page};font-family:${SANS}">` +
    // the mark, and the one number worth knowing before you read anything
    `<tr><td style="padding:22px 28px 18px;border-bottom:1px solid ${INK.rule}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td style="width:22px">${MARK}</td>` +
    `<td style="padding-left:11px;font-size:17px;font-weight:500;letter-spacing:-0.02em;color:${INK.text}">valoox</td>` +
    `<td align="right" style="font-family:${MONO};font-size:11.5px;color:${INK.quiet}">${aside}</td>` +
    `</tr></table></td></tr>` +
    body +
    `<tr><td style="padding:20px 28px 26px;border-top:1px solid ${INK.rule}">${foot}` +
    `<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:${INK.legal}">` +
    'Sin relación con Riot Games. VALORANT y su arte son de Riot Games, Inc.</p>' +
    `</td></tr></table></td></tr></table></body></html>`
  );
}

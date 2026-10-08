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

/**
 * Telling the client this message is already dark.
 *
 * `color-scheme` is the modern declaration and the meta is what the older
 * iOS builds read. Apple Mail and Outlook honour them and leave the colours
 * alone, which is the whole ask: a design that is dark to begin with does
 * not want a second opinion.
 *
 * One scheme, not two. A message is read once and archived, so matching the
 * reader's current setting buys nothing and doubles what can go wrong — and
 * every colour in it is a colour from the app, which is dark.
 *
 * Gmail honours none of it. See solid() below, which is the half that works.
 */
const HEAD =
  '<meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<meta name="color-scheme" content="dark">' +
  '<meta name="supported-color-schemes" content="dark">' +
  '<style>:root{color-scheme:dark;supported-color-schemes:dark}' +
  // Gmail's dark pass marks what it has touched; these put it back.
  'u+#body a{color:inherit}' +
  '[data-ogsc] .ground{background-color:#0E0E11!important}' +
  '[data-ogsc] .said{color:#f2f4f5!important}' +
  // A phone is where this is read. The table is fluid to 600 rather than
  // pinned at it, so the only thing left to do here is take the gutters
  // down and stop the six digits running off the edge of a 320px screen.
  //
  // Nothing stacks. A two-column table told to become one at a breakpoint is
  // the classic mail layout and it is the one that broke here: `display:block`
  // on a `<td>` leaves the `<tr>` a table row, the client invents an anonymous
  // cell around it, and the paragraph came out centred, ragged and over the
  // edge on a phone. So the blocks that pair a picture with a sentence are
  // one column in the first place — picture on its own row, sentence under
  // it — which needs no breakpoint and cannot come apart.
  '@media (max-width:600px){' +
  '.pad{padding-left:18px!important;padding-right:18px!important}' +
  '.big{font-size:38px!important;letter-spacing:0.12em!important}' +
  '}' +
  '</style>';

/**
 * A background colour Gmail cannot take away.
 *
 * Gmail's dark mode runs its own pass over every message and ignores
 * `color-scheme` entirely. What that pass rewrites is `background-color`;
 * what it leaves alone is `background-image`. So a dark design comes out of
 * it half-inverted — this message kept its colour exactly where the weave
 * had painted a gradient and lost it everywhere a flat colour was declared,
 * which is why a phone in dark mode was reading a light email.
 *
 * A one-stop gradient is an image as far as that pass is concerned and a
 * flat colour as far as the eye is concerned. The colour stays too, for the
 * clients that drop gradients.
 */
export const solid = (c: string): string =>
  `background-color:${c};background-image:linear-gradient(${c},${c});`;

/** The weave, at the one angle the whole product uses, in whatever colour the
 *  message is about. A mail client that drops gradients falls back to the flat
 *  colour underneath, which is why that is given too.
 *
 *  The last layer is the opaque one, because the layer listed last is the one
 *  underneath — and every layer above it is translucent, so without it the
 *  colour showing through is a `background-color` and Gmail rewrites it. */
export const weave = (rgb: string, under: string): string =>
  `background-color: ${under}; background-image:` +
  `linear-gradient(107deg, rgba(0,0,0,0) 0 31%, rgba(${rgb},0.085) 31% 45%,` +
  ` rgba(0,0,0,0) 45% 51%, rgba(${rgb},0.045) 51% 58%, rgba(0,0,0,0) 58% 72%,` +
  ` rgba(${rgb},0.064) 72% 77%, rgba(0,0,0,0) 77%),` +
  `repeating-linear-gradient(107deg, rgba(${rgb},0.05) 0 1px, rgba(0,0,0,0) 1px 23px),` +
  `radial-gradient(104% 150% at 50% 50%, rgba(${rgb},0.3) 0%, rgba(${rgb},0) 70%),` +
  `linear-gradient(${under},${under})`;

/**
 * The mark.
 *
 * A PNG and not the inline SVG the app uses, because Gmail strips `<svg>`
 * outright and Outlook renders through Word, which never supported it. An
 * inline mark is a mark most people would not see. Rendered once into
 * public/brand/ and served from this origin, so there is still no third party
 * in a message.
 *
 * It sits beside the word, so a client with images off loses the glyph and
 * keeps the name — which is the right way round.
 */
const mark = (origin: string) =>
  `<img src="${origin}/brand/mark.png" width="22" height="22" alt=""` +
  ' style="display:block;border:0;width:22px;height:22px">';

/**
 * A picture over a sentence, on the weave.
 *
 * One column on purpose: see the note by the media query. The picture is
 * `alt=""` and the sentence carries the whole meaning, because every client
 * worth the name blocks images until asked.
 */
export const note = (art: string, size: number, said: string, rgb: string): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"` +
  ` style="border-radius:14px;${weave(rgb, INK.stage)}">` +
  `<tr><td align="center" style="padding:20px 22px 0">` +
  `<img src="${art}" width="${size}" height="${size}" alt=""` +
  ` style="display:block;border:0;width:${size}px;height:${size}px"></td></tr>` +
  `<tr><td style="padding:14px 22px 20px;font-size:14px;line-height:1.6;color:#D2D6D9">` +
  `${said}</td></tr></table>`;

export function shell({
  aside,
  body,
  foot,
  lang,
  origin,
}: {
  /** The small line opposite the mark — how long is left, a date. */
  aside: string;
  body: string;
  foot: string;
  /** On <html>, because a client's own translate prompt reads it and a screen
   *  reader picks its voice from it. */
  lang: string;
  /** Where the pictures in a message are served from. */
  origin: string;
}): string {
  return (
    `<!doctype html><html lang="${lang}"><head>${HEAD}</head>` +
    `<body id="body" class="ground" style="margin:0;padding:0;${solid(INK.page)}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"` +
    ` class="ground" style="${solid(INK.page)}"><tr><td align="center">` +
    // Fluid to 600 rather than pinned at it: a fixed 600 on a 390px phone is
    // either a scaled-down page or a sideways scroll, and both read as narrow.
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"` +
    ` style="width:100%;max-width:600px;${solid(INK.page)}font-family:${SANS}">` +
    // the mark, and the one number worth knowing before you read anything
    `<tr><td class="pad" style="padding:22px 28px 18px;border-bottom:1px solid ${INK.rule}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td style="width:22px">${mark(origin)}</td>` +
    `<td class="said" style="padding-left:11px;font-size:17px;font-weight:500;` +
    `letter-spacing:-0.02em;color:${INK.text}">valoox</td>` +
    `<td align="right" style="font-family:${MONO};font-size:11.5px;color:${INK.quiet}">${aside}</td>` +
    `</tr></table></td></tr>` +
    body +
    `<tr><td class="pad" style="padding:20px 28px 26px;border-top:1px solid ${INK.rule}">${foot}` +
    `<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:${INK.legal}">` +
    (lang === 'en'
      ? 'Not affiliated with Riot Games. VALORANT and its art belong to Riot Games, Inc.'
      : 'Sin relación con Riot Games. VALORANT y su arte son de Riot Games, Inc.') +
    '</p>' +
    `</td></tr></table></td></tr></table></body></html>`
  );
}

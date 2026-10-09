import { FONT, INK, solid } from './paint.ts';

// The shell every message is built in.
//
// How its surfaces are painted is paint.ts, which is the other half of this
// and a different subject: that one is about clients with opinions about
// colour, this one is about clients with opinions about layout.
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

/**
 * Telling the client not to have an opinion.
 *
 * `only` is the whole mechanism and the word after it is a separate
 * decision. `only` is the CSS escape hatch: this content supports exactly
 * the scheme named and the user agent must not run its own adaptation over
 * it. Plain `dark` on its own was not enough — a client in dark mode still
 * darkened an already-dark design further, which was the bug.
 *
 * `dark` is the scheme, because a scheme is not only about our own colours.
 * It also decides the surface the client paints AROUND the message, and
 * `only light` left a white border on a dark message: the page was pinned
 * and the frame around it was not. Every surface and every line of type in
 * here carries its own colour, so this choice reaches nothing inside the
 * message; what it governs is the user agent's own defaults, which are the
 * frame, the canvas, and whatever would otherwise be inherited.
 *
 * All but one, which is the trap and is why TEXT below exists. An element
 * that sets no colour of its own inherits the user agent's, and that one is
 * black under light and white under dark — so a single line of type written
 * without a colour would be the one thing in here that changed with the
 * reader's phone. Setting it on <body> means there is nothing to inherit but
 * ours.
 *
 * Apple Mail and Outlook honour all of this. Gmail honours none of it and
 * runs its pass regardless — see solid() below, which is the half that holds
 * there.
 */
const SCHEME = 'only dark';

const HEAD =
  '<meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  `<meta name="color-scheme" content="${SCHEME}">` +
  // The legacy Apple name takes no `only` keyword, so it names the scheme.
  '<meta name="supported-color-schemes" content="dark">' +
  `<style>:root{color-scheme:${SCHEME};supported-color-schemes:dark}` +
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
  '.big{font-size:46px!important;letter-spacing:0.18em!important}' +
  '}' +
  '</style>';

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

/** What anything that sets no colour of its own will inherit. Without it that
 *  is the user agent's default, which is the one value in this message that
 *  would change with the reader's phone. */
const TEXT = `color:${INK.body};`;

export function shell({
  aside,
  body,
  foot,
  lang,
  origin,
  who,
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
  /** The Riot name this message is about — `Termo#GOD`. One mailbox can
   *  receive for several accounts, so without it a morning message about a
   *  store is a message about somebody's store. */
  who?: string | null;
}): string {
  return (
    `<!doctype html><html lang="${lang}"><head>${HEAD}</head>` +
    `<body id="body" class="ground" style="margin:0;padding:0;${TEXT}${solid(INK.page)}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"` +
    ` class="ground" style="${TEXT}${solid(INK.page)}"><tr><td align="center">` +
    // Fluid to 600 rather than pinned at it: a fixed 600 on a 390px phone is
    // either a scaled-down page or a sideways scroll, and both read as narrow.
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"` +
    ` style="width:100%;max-width:600px;${TEXT}${solid(INK.page)}font-family:${FONT.sans}">` +
    // the mark, and the one number worth knowing before you read anything
    `<tr><td class="pad" style="padding:22px 28px 18px;border-bottom:1px solid ${INK.rule}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td style="width:22px">${mark(origin)}</td>` +
    `<td class="said" style="padding-left:11px;font-size:17px;font-weight:500;` +
    `letter-spacing:-0.02em;color:${INK.text}">valoox` +
    (who
      ? `<div style="font-family:${FONT.mono};font-size:11.5px;font-weight:400;` +
        `letter-spacing:0.02em;padding-top:3px">${who}</div>`
      : '') +
    '</td>' +
    `<td align="right" style="font-family:${FONT.mono};font-size:11.5px;color:${INK.quiet}">${aside}</td>` +
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

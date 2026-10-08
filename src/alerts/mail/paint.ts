// How a surface in a message is painted.
//
// Its own file because it is a different subject from the document: this is
// the set of rules that keep a colour the colour it was authored as, in
// clients that each have their own opinion about that, and layout.ts is the
// shape the message is poured into.
//
// No web font. Nothing loads reliably in mail, so designing this in Bricolage
// would be designing something nobody receives — it is the system stack, and
// the one place the app's typography does not follow it.

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

export const FONT = { sans: SANS, mono: MONO };

/**
 * The ink, brighter than the app's by one step at every level.
 *
 * The same greys that read correctly on a screen you are holding at arm's
 * length read washed out in a mailbox: a message is glanced at, often at a
 * tilt, often outdoors, and it gets one pass rather than the attention a
 * screen you navigated to gets. So the reading copy is the same white as
 * the headings — there is no hierarchy to protect between a heading and the
 * two sentences under it — and everything below that moves up a step rather
 * than staying where the artboard put it.
 *
 * The app's own palette is unchanged. These values are only ever used in a
 * message, and a message is read somewhere else.
 */
export const INK = {
  page: '#0E0E11',
  stage: '#16171B',
  rule: '#1D1F25',
  line: '#24262C',
  text: '#f2f4f5',
  /** Reading copy: the same white. */
  body: '#f2f4f5',
  /** A line that is true but secondary. */
  faint: '#C9CFD3',
  /** The footer, which is there to be found rather than read. */
  quiet: '#A7AEB3',
  /** Riot's attribution, which is a legal line and nothing else. */
  legal: '#8B9399',
};

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
  `<tr><td style="padding:14px 22px 20px;font-size:14px;line-height:1.6;color:${INK.text}">` +
  `${said}</td></tr></table>`;

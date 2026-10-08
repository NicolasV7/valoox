// The sign-in code, drawn as SVG paths.
//
// The matrix comes from uqr; the paths are built here rather than taking the
// library's own SVG string, because that string would have to be parsed into
// the page and this app does not put strings into the DOM. A `d` attribute is
// data, and the only thing that reads it is the renderer.
//
// Black on a white plate, always. A QR inverted to match a dark theme fails to
// scan on a good share of phones, and the one job of this screen is that it
// scans on the first try.
//
// No quiet zone inside the svg. A QR wants four modules of white around it and
// it has them: the plate is white and pads 14px, which at this size is about
// two modules on every side, and the page behind the plate is the rest. Drawing
// it in here as well would pay for the margin twice — the code shrinks, the
// white grows, and it stops looking like the thing on the artboard.

import { encode } from 'uqr';

/** A finder: the 7×7 ring with a 3×3 centre, in one module's units. The ring is
 *  the outer square minus the inner one, which is what `evenodd` is doing. */
const RING = 'M0,0h7v7h-7z M1,1v5h5v-5z';
const EYE = 'M2,2h3v3h-3z';
const FINDER = 7;

/**
 * What Riot's own login url currently comes out as: 47 modules, from about 120
 * characters. The placeholder below is drawn at the same count so its three
 * corners sit exactly where the real ones will land. A url of a different
 * length only shifts the two far corners slightly — cosmetic, and it costs
 * nothing to be right about today.
 */
export const RIOT_MODULES = 47;

function finders(modules: number) {
  const far = modules - FINDER;
  return [
    [0, 0],
    [far, 0],
    [0, far],
  ].map(([x, y]) => (
    <g transform={'translate(' + x + ' ' + y + ')'} key={String(x) + ':' + String(y)}>
      <path d={RING} fill-rule="evenodd" />
      <path d={EYE} />
    </g>
  ));
}

/**
 * The code itself, drawn in one pass over the matrix.
 *
 * Not split into corners and data. That version faded the data in over
 * geometrically-drawn corners so nothing ever moved, which was true and also
 * made the code look worse — a QR is one object and anything that renders part
 * of it differently shows. The placeholder below still puts its corners in the
 * same places, so the swap lands where the eye already is; it is a swap rather
 * than a fill, and that is the right trade.
 */
export function QrCode({ url, size = 190 }: { url: string; size?: number }) {
  const { data, size: modules } = encode(url, { ecc: 'M' });

  let d = '';
  for (const [y, row] of data.entries()) {
    for (const [x, on] of row.entries()) {
      if (on) d += 'M' + x + ',' + y + 'h1v1h-1z';
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={'0 0 ' + modules + ' ' + modules}
      shape-rendering="crispEdges"
      aria-hidden="true"
    >
      <path d={d} fill="#000000" />
    </svg>
  );
}

/**
 * The code, before it is here.
 *
 * The same three corners, in the same places, grey. Nothing appears and nothing
 * disappears when the code lands — the corners go black and the rest fills in
 * around them, which is the only version of this that does not read as either a
 * blank plate or a stale code blinking past.
 */
export function QrWaiting({ size = 190 }: { size?: number }) {
  return (
    <svg
      class="plate__wait"
      width={size}
      height={size}
      viewBox={'0 0 ' + RIOT_MODULES + ' ' + RIOT_MODULES}
      shape-rendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
    >
      {finders(RIOT_MODULES)}
    </svg>
  );
}

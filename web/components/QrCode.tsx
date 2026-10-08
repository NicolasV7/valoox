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

const inFinder = (x: number, y: number, n: number) =>
  (x < FINDER && y < FINDER) || (x >= n - FINDER && y < FINDER) || (x < FINDER && y >= n - FINDER);

export function QrCode({ url, size = 190 }: { url: string; size?: number }) {
  const { data, size: modules } = encode(url, { ecc: 'M' });

  // The corners are drawn geometrically rather than from the matrix, so they
  // are the same three shapes the placeholder already put on the plate. Only
  // the rest fades in, and the code reads as completing rather than replacing.
  let d = '';
  for (const [y, row] of data.entries()) {
    for (const [x, on] of row.entries()) {
      if (on && !inFinder(x, y, modules)) d += 'M' + x + ',' + y + 'h1v1h-1z';
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={'0 0 ' + modules + ' ' + modules}
      shape-rendering="crispEdges"
      fill="#000000"
      aria-hidden="true"
    >
      {finders(modules)}
      <path class="qr__fill" d={d} />
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

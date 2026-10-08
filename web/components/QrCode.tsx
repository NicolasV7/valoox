// The sign-in code, drawn as one SVG path.
//
// The matrix comes from uqr; the path is built here rather than taking the
// library's own SVG string, because that string would have to be parsed into
// the page and this app does not put strings into the DOM. A `d` attribute is
// data, and the only thing that reads it is the renderer.
//
// White on a white plate, always. A QR inverted to match a dark theme fails to
// scan on a good share of phones, and the one job of this screen is that it
// scans on the first try.

import { encode } from 'uqr';

/**
 * No quiet zone inside the svg.
 *
 * A QR wants four modules of white around it and it has them: the plate is
 * white and pads 14px, which at this size is about two modules on every side,
 * and the page behind the plate is the rest. Drawing it inside the box as well
 * would be paying for the margin twice — the code shrinks, the white grows, and
 * it stops looking like the thing on the artboard.
 */
const QUIET = 0;

/** Where the three corner squares sit, in modules. A real code's finders are
 *  7×7 at the corners; the placeholder below draws them in the same places. */
const FINDER = 7;

export function QrCode({ url, size = 190 }: { url: string; size?: number }) {
  const { data, size: modules } = encode(url, { ecc: 'M' });
  const span = modules + QUIET * 2;

  let d = '';
  for (const [y, row] of data.entries()) {
    for (const [x, on] of row.entries()) {
      if (on) d += 'M' + (x + QUIET) + ',' + (y + QUIET) + 'h1v1h-1z';
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={'0 0 ' + span + ' ' + span}
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
 * Three corner squares, in the corners the real ones will be in. It reads as a
 * QR arriving rather than as a grey box, and when the code lands it fills in
 * around markers that were already in the right place instead of replacing
 * something unrelated.
 *
 * This is the one animated wait in the app. Every other loading state is a
 * skeleton standing in for text, and a skeleton that moves is asking to be
 * looked at — but this is the single object the screen exists to hand over, and
 * "it is coming" is worth saying while it is not here.
 */
export function QrWaiting({ size = 190, modules = 29 }: { size?: number; modules?: number }) {
  const far = modules - FINDER;
  const corner = (x: number, y: number) => (
    <g transform={'translate(' + x + ' ' + y + ')'} key={x + ':' + y}>
      <rect width={FINDER} height={FINDER} rx="1" fill="none" stroke="currentColor" />
      <rect x="2" y="2" width="3" height="3" rx="0.4" fill="currentColor" />
    </g>
  );

  return (
    <svg
      class="plate__wait"
      width={size}
      height={size}
      viewBox={'0 0 ' + modules + ' ' + modules}
      stroke-width="1"
      aria-hidden="true"
    >
      {[corner(0, 0), corner(far, 0), corner(0, far)]}
    </svg>
  );
}

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

const QUIET = 2; // modules of margin. Below 4 some readers struggle; 2 plus the
// plate's own padding is what the board draws.

export function QrCode({ url, size = 214 }: { url: string; size?: number }) {
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

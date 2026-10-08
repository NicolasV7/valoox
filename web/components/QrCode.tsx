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

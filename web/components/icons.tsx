// Every glyph the app draws, in one file.
//
// Drawn rather than fetched: an icon font or a sprite sheet would be another
// request, and the CSP names no origin to fetch one from anyway. They inherit
// `currentColor`, so a glyph is never a colour decision — the thing around it
// already made that one.
//
// All on a 16-unit grid except the Riot fist, which is Riot's own mark and
// comes on 24 as they draw it.

type P = { size?: number };

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 1.6,
  'stroke-linecap': 'round' as const,
  'stroke-linejoin': 'round' as const,
};

function Glyph({ size = 16, children }: P & { children: preact.ComponentChildren }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ flex: 'none' }}
      {...stroke}
    >
      {children}
    </svg>
  );
}

export const Check = ({ size = 32 }: P) => (
  <Glyph size={size}>
    <path d="M3 8.6l3.2 3.2L13 4.8" stroke-width="1.8" />
  </Glyph>
);

export const Clock = ({ size = 26 }: P) => (
  <Glyph size={size}>
    <path d="M8 4.2v4.1l2.6 1.6" />
    <circle cx="8" cy="8" r="5.6" />
  </Glyph>
);

export const Chevron = ({ size = 15 }: P) => (
  <Glyph size={size}>
    <path d="M4.5 6.5L8 10l3.5-3.5" />
  </Glyph>
);

export const Search = ({ size = 16 }: P) => (
  <Glyph size={size}>
    <circle cx="7.3" cy="7.3" r="4.7" />
    <path d="M10.9 10.9L13.8 13.8" />
  </Glyph>
);

/** Filled when it is yours, hollow when it is not. The one state that is a
 *  shape rather than a colour. */
export const Star = ({ size = 18, on = false }: P & { on?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    aria-hidden="true"
    fill={on ? 'currentColor' : 'none'}
    stroke="currentColor"
    stroke-width={on ? 0 : 1.4}
    stroke-linejoin="round"
    style={{ flex: 'none' }}
  >
    <path d="M8 2.2l1.76 3.74 4.04.6-2.93 2.9.7 4.1L8 11.6 4.43 13.54l.7-4.1L2.2 6.54l4.04-.6z" />
  </svg>
);

/** Riot's fist, on the one button that opens their app. */
export const Riot = ({ size = 20 }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    style={{ flex: 'none' }}
  >
    <path d="M13.458.86 0 7.093l3.353 12.761 2.552-.313-.701-8.024.838-.373 1.447 8.202 4.361-.535-.775-8.857.83-.37 1.591 9.025 4.412-.542-.849-9.708.84-.374 1.74 9.87L24 17.318V3.5Zm.316 19.356.222 1.256L24 23.14v-4.18l-10.22 1.256Z" />
  </svg>
);

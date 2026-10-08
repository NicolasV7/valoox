// The mark. Two o's: one filled, one an open ring — owned, and not owned, which
// is the one idea running through every screen in the app.
//
// They sit tangent rather than overlapping, because overlap turns to mud below
// about 20px and this has to survive a favicon. The solid is drawn a hair
// smaller than the ring: a filled circle reads larger than an outlined one of
// the same diameter, and at equal radii the pair looks lopsided.

const R = 5;
const STROKE = 1.9;

export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ flex: 'none', display: 'block' }}
    >
      <circle cx="6.4" cy="12" r="4.65" fill="currentColor" />
      <circle cx="17.6" cy="12" r={R - STROKE / 2} stroke="currentColor" stroke-width={STROKE} />
    </svg>
  );
}

/** The lockup. The word is set at the weight a label uses, lowercase, so the
 *  mark is the only thing in it asking for attention. */
export function Wordmark({ size = 19 }: { size?: number }) {
  return (
    <span class="wordmark" style={{ fontSize: size + 'px' }}>
      <Mark size={Math.round(size * 1.3)} />
      valoox
    </span>
  );
}

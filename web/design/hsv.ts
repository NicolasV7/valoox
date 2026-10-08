// The measurement itself, with no browser in it.
//
// Split from measure.ts so a plain Node test can run it against the fixtures in
// test/fixtures/ — the canvas half needs a DOM, and a rule this load-bearing
// should not be the one piece of the design that nothing checks.
//
// It is not an average. A plain mean over a picture is always muddy: the
// outline, the glow and the transparent margin all pull toward grey. So the hue
// comes from a chroma-weighted mean, and the saturation comes from the art's
// vivid end instead. Those two choices are the measurement. The floors after
// them are a deliberate lift, and the only numbers here that are not the
// picture's own.

const ALPHA_FLOOR = 0.12; // below this a pixel is margin, not art
const VIVID = 0.88; // the percentile the saturation is taken from
const S_MIN = 0.42;
const S_MAX = 0.92;
const V_MIN = 0.62;

/** What a piece with no readable colour gets. Grey, and visibly so. */
export const NEUTRAL = '157, 164, 172';

/** `r, g, b` for `--art`, from a straight RGBA buffer. */
export function fromPixels(px: Uint8ClampedArray): string {
  let r = 0;
  let g = 0;
  let b = 0;
  let weight = 0;
  const sats: number[] = [];

  for (let i = 0; i < px.length; i += 4) {
    const a = (px[i + 3] as number) / 255;
    if (a < ALPHA_FLOOR) continue;
    const pr = px[i] as number;
    const pg = px[i + 1] as number;
    const pb = px[i + 2] as number;
    const mx = Math.max(pr, pg, pb);
    const mn = Math.min(pr, pg, pb);
    const chroma = (mx - mn) / 255;
    // A near-black or near-white pixel carries no hue. Weighting it down is
    // what stops the mean from following the outline instead of the paint.
    const k = a * (0.18 + chroma * 1.6);
    r += pr * k;
    g += pg * k;
    b += pb * k;
    weight += k;
    if (mx > 40) sats.push((mx - mn) / mx);
  }
  if (weight === 0) return NEUTRAL;

  const [hue, , value] = toHsv(r / weight / 255, g / weight / 255, b / weight / 255);
  sats.sort((x, y) => x - y);
  const vivid = sats.length ? (sats[Math.floor(sats.length * VIVID)] as number) : 0.5;
  const out = toRgb(hue, Math.min(Math.max(vivid, S_MIN), S_MAX), Math.max(value, V_MIN));
  return out.map((c) => Math.round(c * 255)).join(', ');
}

export function toHsv(r: number, g: number, b: number): [number, number, number] {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  return [h, mx === 0 ? 0 : d / mx, mx];
}

export function toRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const u = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      return [v, u, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, u];
    case 3:
      return [p, q, v];
    case 4:
      return [u, p, v];
    default:
      return [v, p, q];
  }
}

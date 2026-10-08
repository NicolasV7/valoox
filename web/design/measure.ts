// The colour of a piece of art, read off the art.
//
// This is the whole reason a wall of 105 Vandals stays readable instead of
// becoming a grey mosaic, and the melee grid is the proof: every melee Riot has
// ever sold is Exclusive, so without this the entire slot is one orange.
//
// The arithmetic lives in hsv.ts, where a test can reach it. This half is the
// part that needs a browser: get the pixels, and only ever once per URL.

import { fromPixels, NEUTRAL } from './hsv.ts';

export { NEUTRAL };

/** The longest side the image is sampled at, matching the offline pass that
 *  produced design/palette.json. Changing it changes every colour in the app. */
const BOX = 96;

const seen = new Map<string, Promise<string>>();

/** `r, g, b` for `--art`, measured once per URL and remembered.
 *
 *  Never rejects: a render that will not load is not a reason for a screen to
 *  fail, so the piece gets the neutral grey and is still openable. */
export function measure(url: string): Promise<string> {
  const held = seen.get(url);
  if (held) return held;
  const run = read(url).catch(() => NEUTRAL);
  seen.set(url, run);
  return run;
}

async function read(url: string): Promise<string> {
  const img = new Image();
  // valorant-api sends the CORS header that makes the readback legal. Without
  // this the canvas taints and getImageData throws.
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();

  const scale = BOX / Math.max(img.naturalWidth, img.naturalHeight, 1);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return NEUTRAL;
  ctx.drawImage(img, 0, 0, w, h);

  return fromPixels(ctx.getImageData(0, 0, w, h).data);
}

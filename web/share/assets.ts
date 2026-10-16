import { piece, skin } from '../data/catalogue.ts';
import { CARDS } from '../data/findable.ts';
import { fromPixels, NEUTRAL } from '../design/hsv.ts';
import { t } from '../i18n/index.ts';
import { clean, type Snapshot } from './model.ts';
import { wait } from './wait.ts';

export interface Artwork {
  name: string;
  cost: number | null;
  image: HTMLImageElement | null;
  colour: string;
}
export interface Assets {
  banner: HTMLImageElement | null;
  offers: Artwork[];
  partial: boolean;
}

/** Anonymous image requests use the existing img-src host, never connect-src. */
export function image(url: string | null, signal: AbortSignal): Promise<HTMLImageElement | null> {
  if (!url || signal.aborted) return Promise.resolve(null);
  try {
    const parsed = new URL(url);
    if (parsed.origin !== 'https://media.valorant-api.com' || parsed.username || parsed.password)
      return Promise.resolve(null);
    // The header may have cached this URL without CORS. Keep one stable,
    // anonymous export variant so that cached response cannot taint the canvas.
    parsed.searchParams.set('valoox', 'share');
    url = parsed.href;
  } catch {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const img = new Image();
    const finish = (ok: boolean) => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      img.onload = img.onerror = null;
      if (!ok) img.removeAttribute('src');
      resolve(ok ? img : null);
    };
    const abort = () => finish(false);
    const timer = setTimeout(abort, 10000);
    signal.addEventListener('abort', abort, { once: true });
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () =>
      finish(
        img.naturalWidth > 0 &&
          img.naturalHeight > 0 &&
          img.naturalWidth * img.naturalHeight <= 16777216,
      );
    img.onerror = abort;
    img.src = url;
  });
}

function colour(img: HTMLImageElement | null): string {
  if (!img) return NEUTRAL;
  const canvas = document.createElement('canvas');
  const scale = 96 / Math.max(img.naturalWidth, img.naturalHeight);
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return NEUTRAL;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return fromPixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
  } catch {
    return NEUTRAL;
  } finally {
    canvas.width = canvas.height = 1;
  }
}

export async function assets(source: Snapshot, signal: AbortSignal): Promise<Assets> {
  const bannerTask = source.card
    ? wait(piece(CARDS, source.card), signal).catch(() => null)
    : Promise.resolve(null);
  const [banner, offers] = await Promise.all([
    bannerTask.then((p) => image(p?.wide ?? p?.tall ?? null, signal)),
    Promise.all(
      source.offers.map(async (offer) => {
        const found = await wait(skin(offer.id), signal).catch(() => null);
        const art = await image(found?.icon ?? null, signal);
        return {
          name: clean(found?.name ?? t().share.unknown),
          cost: offer.cost,
          image: art,
          colour: colour(art),
        };
      }),
    ),
  ]);
  if (source.card && !banner) throw new Error('banner');
  return { banner, offers, partial: offers.some((o) => !o.image) };
}

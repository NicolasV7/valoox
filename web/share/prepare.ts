import { assets } from './assets.ts';
import { type Format, live, type Snapshot } from './model.ts';
import { poster } from './poster.ts';
import { theme } from './theme.ts';
import { wait } from './wait.ts';

export interface Picture {
  canvas: HTMLCanvasElement;
  file: File;
  partial: boolean;
}

export const clear = (canvas: HTMLCanvasElement) => {
  canvas.width = canvas.height = 1;
};

export async function prepare(
  source: Snapshot,
  format: Format,
  tag: boolean,
  signal: AbortSignal,
): Promise<Picture> {
  if (!live(source) || signal.aborted) throw new DOMException('', 'AbortError');
  const colors = theme();
  const [art] = await Promise.all([
    assets(source, signal),
    wait(
      Promise.all([
        document.fonts.load(`500 28px ${colors.ui}`),
        document.fonts.load(`400 14px ${colors.num}`),
      ]),
      signal,
    ),
  ]);
  if (!live(source) || signal.aborted) throw new DOMException('', 'AbortError');
  const canvas = poster(source, art, format, tag, colors);
  try {
    const blob = await wait(
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('png'))), 'image/png');
      }),
      signal,
    );
    if (!live(source) || signal.aborted) throw new DOMException('', 'AbortError');
    const date = new Date(source.fetchedAt * 1000).toISOString().slice(0, 10);
    return {
      canvas,
      partial: art.partial,
      file: new File([blob], `valoox-store-${date}-${format}.png`, { type: 'image/png' }),
    };
  } catch (error) {
    clear(canvas);
    throw error;
  }
}

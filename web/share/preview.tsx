import { useLayoutEffect, useRef } from 'preact/hooks';

/** Show the export canvas directly, without widening img-src to blob: or data:. */
export function Preview({ canvas }: { canvas: HTMLCanvasElement }) {
  const node = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const container = node.current;
    container?.replaceChildren(canvas);
    return () => {
      container?.replaceChildren();
    };
  }, [canvas]);
  return <div class="share__image share__image--ready" ref={node} />;
}

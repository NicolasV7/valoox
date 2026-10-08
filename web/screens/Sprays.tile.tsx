// One square on the wall, washed in the colour of its own art.
//
// Its own file for the same reason the skin row is: the colour is a hook, and
// a hook cannot run inside the map that draws the grid.

import { useState } from 'preact/hooks';
import { Star } from '../components/icons.tsx';
import type { Spray } from '../data/sprays.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

export function Tile({ spray, slot, mine }: { spray: Spray; slot: number; mine: boolean }) {
  // The colour waits for the picture, so measure() rides on loading="lazy"
  // rather than opening its own download for all 921 the moment the wall
  // mounts. crossOrigin makes the two requests one cache entry.
  const [shot, setShot] = useState(false);
  const lit = useArt(shot ? spray.art : null);
  const route = { name: 'spray', id: spray.id } as const;

  return (
    <a class="pad stage" style={artStyle(lit)} href={href(route)} onClick={intercept(route)}>
      <span class="pad__shot">
        {spray.art && (
          <img
            class={shot ? 'pad__art pad__art--on' : 'pad__art'}
            src={spray.art}
            alt=""
            loading="lazy"
            crossOrigin="anonymous"
            onLoad={() => setShot(true)}
          />
        )}
      </span>
      <span class="pad__name">{spray.name}</span>
      {/* Only the wheel has anything to say on this line, and it still takes
          its height on every tile: without that the name sits higher on an
          equipped one, and a wall of those is ragged. */}
      <span class="pad__slot num">{slot > 0 ? t().sprays.slot(slot) : ''}</span>
      {/* The mark that tells the two shelves apart at the end of a scroll. It
          is a mark and not a control until the wishlist exists to put it on —
          the same as the one on a skin you do not own. */}
      {!mine && (
        <span class="pad__star">
          <Star size={15} />
        </span>
      )}
    </a>
  );
}

// One square on the wall, washed in the colour of its own art.
//
// Its own file for the same reason the skin row is: the colour is a hook, and
// a hook cannot run inside the map that draws the grid.

import { useState } from 'preact/hooks';
import { StarMark } from '../components/StarMark.tsx';
import type { Spray } from '../data/sprays.ts';
import { colourOf } from '../design/measure.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

export function Tile({ spray, slot, mine }: { spray: Spray; slot: number; mine: boolean }) {
  // The colour waits for the picture, so measure() rides on loading="lazy"
  // rather than opening its own download for all 921 the moment the wall
  // mounts. crossOrigin makes the two requests one cache entry.
  // Already measured means already decoded, so a revisit skips the grey.
  const [shot, setShot] = useState(() => colourOf(spray.art) !== null);
  const lit = useArt(shot ? spray.art : null);
  const route = { name: 'spray', id: spray.id } as const;

  return (
    <div class="pad stage" style={artStyle(lit)}>
      <a class="hit" href={href(route)} onClick={intercept(route)}>
        <span class="sr">{spray.name}</span>
      </a>
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
      {/* Only the wheel has anything to say here, and only then is there a
          line. It used to hold its height empty so every name sat level; what
          that cost was a strip of dead space under most of the wall, and the
          artwork above shrank to pay for it. */}
      {slot > 0 && <span class="pad__slot num">{t().sprays.slot(slot)}</span>}
      {/* The mark that tells the two shelves apart at the end of a scroll. It
          is a mark and not a control until the wishlist exists to put it on —
          the same as the one on a skin you do not own. */}
      {/* A thing you do not own is a thing the store can still offer
          you, which is why this is a control and not a mark. */}
      {!mine && (
        <StarMark
          size={15}
          item={{
            id: spray.id,
            name: spray.name,
            art: lit ?? undefined,
            type: 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475',
          }}
        />
      )}
    </div>
  );
}

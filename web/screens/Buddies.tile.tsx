// One charm on the wall. The spray tile with a different line under it.

import { useState } from 'preact/hooks';
import { StarMark } from '../components/StarMark.tsx';
import type { Buddy } from '../data/buddies.ts';
import { colourOf } from '../design/measure.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

export function Tile({ buddy, on, mine }: { buddy: Buddy; on: string[]; mine: boolean }) {
  // Already measured means already decoded, so a revisit skips the grey.
  const [shot, setShot] = useState(() => colourOf(buddy.art) !== null);
  const lit = useArt(shot ? buddy.art : null);
  const route = { name: 'buddy', id: buddy.id } as const;
  const said = on.filter(Boolean);

  return (
    <div class="pad pad--tall stage" style={artStyle(lit)}>
      <a class="hit" href={href(route)} onClick={intercept(route)}>
        <span class="sr">{buddy.name}</span>
      </a>
      <span class="pad__shot">
        {buddy.art && (
          <img
            class={shot ? 'pad__art pad__art--on' : 'pad__art'}
            src={buddy.art}
            alt=""
            loading="lazy"
            crossOrigin="anonymous"
            onLoad={() => setShot(true)}
          />
        )}
      </span>
      <span class="pad__name">{buddy.name}</span>
      {/* A charm is attached to a weapon rather than to a slot, so the line
          names the gun. Empty on most of them, and it still takes its height:
          without that the name sits higher on a carried one. */}
      {/* One gun gets named. More than one gets counted: three names on a
          110px line is three names nobody reads, and the screen this opens
          lists them in full. */}
      <span class="pad__slot num">
        {said.length === 1 ? t().buddies.on(said[0] as string) : ''}
        {said.length > 1 ? t().buddies.onMany(said.length) : ''}
      </span>
      {/* A thing you do not own is a thing the store can still offer
          you, which is why this is a control and not a mark. */}
      {!mine && (
        <StarMark
          size={15}
          item={{
            id: buddy.levels[0] ?? buddy.id,
            name: buddy.name,
            type: 'dd3bf334-87f3-40bd-b043-682a57a8dc3a',
          }}
        />
      )}
    </div>
  );
}

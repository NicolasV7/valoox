// The Sprays tab. Square art, so a grid; each tile washed in its own colour.
//
// Only the ones you own, which is the opposite of the weapons tab and is not
// an inconsistency: every weapon has a slot whether or not you dressed it, and
// a spray has no slot to be missing from. The gap that matters here is the one
// in the heading — 18 of 921.
//
// The four on the wheel come first, in wheel order, and the rest alphabetically
// after them. Riot's own order for the rest is the order they were granted,
// which is no order at all once there are eighty of them.

import { useState } from 'preact/hooks';
import type { Spray } from '../data/sprays.ts';
import type { Inventory } from '../data/types.ts';
import { useSprays } from '../data/useIndex.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';
import { CollectionTabs } from './Collection.tabs.tsx';
import { SpraysLoading } from './Sprays.loading.tsx';

/** Riot's item type for a spray. */
export const SPRAY = 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475';

export function Sprays({ inv }: { inv: Inventory }) {
  const s = t().sprays;
  const all = useSprays();
  if (!all) return <SpraysLoading />;

  const own = new Set(inv.byType[SPRAY] ?? []);
  const wheel = inv.worn?.sprays ?? [];
  // Counted off the catalogue rather than off the entitlement list: an id we
  // cannot name is an id we cannot draw, and a heading that counts tiles that
  // are not there is the kind of number this app is supposed to not have.
  const mine = all.filter((spray) => own.has(spray.id));

  const at = (id: string) => {
    const on = wheel.indexOf(id);
    return on < 0 ? wheel.length : on;
  };
  const tiles = [...mine].sort((a, b) => at(a.id) - at(b.id) || a.name.localeCompare(b.name));
  // Not wheel.length: a slot can be empty, and Riot fills an empty one with a
  // spray it publishes under the name "None" — which is in the catalogue, is
  // not owned, and so is not a tile. Counting the tiles that landed on the
  // wheel is the only count that matches what is on the screen.
  const on = tiles.filter((spray) => wheel.includes(spray.id)).length;

  return (
    <main class="screen coll">
      <CollectionTabs on="sprays" said={s.of(mine.length, all.length)} />

      <div class="wall">
        {tiles.map((spray) => (
          <Tile key={spray.id} spray={spray} slot={wheel.indexOf(spray.id) + 1} />
        ))}
      </div>

      <p class="legal coll__note">{s.grid}</p>
      <p class="legal coll__note coll__note--next">{s.wheel(on, tiles.length - on)}</p>
    </main>
  );
}

function Tile({ spray, slot }: { spray: Spray; slot: number }) {
  // The colour waits for the picture, so measure() rides on loading="lazy"
  // instead of opening its own download for every tile the moment the wall
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
      <span class="pad__slot num">{said(slot)}</span>
    </a>
  );
}

/** The line under the name. Slot one is the one that comes up without choosing
 *  anything, which is why it is named rather than numbered. */
function said(slot: number): string {
  if (slot === 1) return t().common.equipped;
  return slot > 1 ? t().sprays.slot(slot) : '';
}

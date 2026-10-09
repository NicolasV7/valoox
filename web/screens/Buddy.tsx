// One charm, opened from the collection.
//
// The spray's screen with a smaller piece on the stage and a different second
// question: Riot hands charms out by instance, so the thing worth saying about
// yours is how many you have of it and which guns are carrying them.
//
// It reads the index rather than resolving its own uuid, which the spray screen
// deliberately does not. The reason is the question above: the loadout names a
// charm by one of its levels, and only the index says which levels belong to
// which charm. Arriving from the tab the index is already in hand; a cold link
// to one pays for it once.

import { Back, BUDDIES } from '../components/Back.tsx';
import { StarMark } from '../components/StarMark.tsx';
import type { Inventory } from '../data/types.ts';
import { useGuns } from '../data/useGuns.ts';
import { useBuddies } from '../data/useIndex.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { BUDDY } from './Buddies.tsx';

export function Buddy({ id, inv }: { id: string; inv: Inventory }) {
  const s = t().buddies;
  const all = useBuddies();
  // By either uuid. A charm is STARRED and ROUTED under its first level — see
  // findable.ts and Buddies.tile.tsx, which both store `levels[0] ?? id` — but
  // the index is keyed by the charm uuid, so opening one from the alerts list
  // or from the wall found nothing and the screen stayed blank forever.
  const found = all?.find((b) => b.id === id || b.levels.includes(id)) ?? null;
  const lit = useArt(found?.art);

  // How many you hold of this one: instances, so the list is counted rather
  // than a set of it — four copies are the same level uuid four times.
  const levels = new Set(found?.levels ?? []);
  const mine = (inv.byType[BUDDY] ?? []).filter((l) => levels.has(l)).length;
  const worn = Object.entries(inv.worn?.guns ?? {}).filter(
    ([, g]) => g.buddy && levels.has(g.buddy),
  );
  const guns = useGuns(worn.map(([w]) => w));
  const on = worn.map(([w]) => guns[w] ?? '').filter(Boolean);

  const style = artStyle(lit);
  const says = [t().common.kind.buddy, on.length > 0 ? s.on(on.join(', ')) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <main class={lit ? 'screen piece piece--lit' : 'screen piece'} style={style}>
      <Back to={BUDDIES} />

      <div class="wall__stage stage" style={style}>
        {found?.art && (
          <img
            class="wall__art wall__art--charm"
            src={found.art}
            alt={found.name}
            crossOrigin="anonymous"
          />
        )}
      </div>

      <div class="wall__title">
        <h1 class="wall__name">{found?.name ?? <span class="skel wall__name--waiting" />}</h1>
        {/* The tile that opened this carries one, and a mark that
            only exists in a grid reads as a property of the grid. */}
        {mine === 0 && found && (
          <StarMark
            size={19}
            item={{
              id: found.levels[0] ?? id,
              name: found.name,
              type: 'dd3bf334-87f3-40bd-b043-682a57a8dc3a',
            }}
          />
        )}
      </div>
      <p class="wall__is">
        <span class="wall__chip" style={style} />
        <span class="num">{says}</span>
      </p>

      {/* Both held until there is a number to put in the sentence. */}
      {lit && (
        <>
          <h2 class="label wall__head">{s.colourFrom}</h2>
          <p class="legal">{s.colourWhy(lit)}</p>
        </>
      )}

      <h2 class="label wall__head">{s.many}</h2>
      <p class="legal">{s.manyWhy(mine)}</p>
    </main>
  );
}

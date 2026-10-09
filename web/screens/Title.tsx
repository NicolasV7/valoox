// One title, opened from the collection.
//
// No stage of artwork, because there is none to put on it: the pennant the
// game draws a title in, the string at the size the game uses, and the one
// grey ramp in the app. The swatch beside the name is grey for the same
// reason — there is nothing here to measure.

import { Back, TITLES } from '../components/Back.tsx';
import { TitleMark } from '../components/icons.tsx';
import { StarMark } from '../components/StarMark.tsx';
import type { Inventory } from '../data/types.ts';
import { useTitles } from '../data/useIndex.ts';
import { t } from '../i18n/index.ts';
import { TITLE } from './Titles.tsx';

export function Title({ id, inv }: { id: string; inv: Inventory }) {
  const s = t().titles;
  const all = useTitles();
  const found = all?.find((x) => x.id === id) ?? null;

  const own = (inv.byType[TITLE] ?? []).includes(id);
  const worn = inv.worn?.title === id;
  const says = [
    t().common.kind.title,
    worn ? t().common.equipped : own ? t().common.owned : t().common.notOwned,
  ].join(' · ');

  return (
    <main class="screen piece">
      <Back to={TITLES} />

      <div class="said__stage">
        <TitleMark size={54} />
        <span class="said__word">{found?.name ?? ''}</span>
      </div>

      <div class="wall__title">
        <h1 class="wall__name">{found?.name ?? <span class="skel wall__name--waiting" />}</h1>
        {/* The tile that opened this carries one, and a mark that
            only exists in a grid reads as a property of the grid. */}
        {!own && found && (
          <StarMark
            size={19}
            item={{ id, name: found.name, type: 'de7caa6b-adf7-4588-bbd1-143831e786c6' }}
          />
        )}
      </div>
      <p class="wall__is">
        <span class="wall__chip wall__chip--grey" />
        <span class="num">{says}</span>
      </p>

      <h2 class="label wall__head">{s.none}</h2>
      <p class="legal">{s.noneWhy(all?.length ?? 0)}</p>

      <h2 class="label wall__head">{s.inMatch}</h2>
      <p class="legal">{s.inMatchWhy}</p>
    </main>
  );
}

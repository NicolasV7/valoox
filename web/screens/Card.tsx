// One card, opened from the collection.
//
// The tall painting at the size it is met at on a profile, and the one fact
// about a card worth a block of its own: Riot ships three crops of it and this
// screen and the grid use two different ones.

import { Back, CARDS } from '../components/Back.tsx';
import { StarMark } from '../components/StarMark.tsx';
import type { Inventory } from '../data/types.ts';
import { useCards } from '../data/useIndex.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { CARD } from './Cards.tsx';
import { Crops } from './Piece.card.tsx';

export function Card({ id, inv, who }: { id: string; inv: Inventory; who: string }) {
  const s = t().cards;
  const all = useCards();
  const found = all?.find((c) => c.id === id) ?? null;
  // Measured off the square, the same crop the grid measures, so the wash is
  // the same colour on both screens.
  const lit = useArt(found?.small);

  const own = (inv.byType[CARD] ?? []).includes(id);
  const worn = inv.worn?.card === id;
  const style = artStyle(lit);
  const says = [
    t().common.kind.card,
    worn ? t().common.equipped : own ? t().common.owned : t().common.notOwned,
  ].join(' · ');

  return (
    <main class={lit ? 'screen piece piece--lit' : 'screen piece'} style={style}>
      <Back to={CARDS} />

      <div class="wall__stage wall__stage--card stage" style={style}>
        {found?.tall && (
          <img
            class="wall__art wall__art--card"
            src={found.tall}
            alt={found.name}
            crossOrigin="anonymous"
          />
        )}
      </div>

      <div class="wall__title">
        <h1 class="wall__name">{found?.name ?? <span class="skel wall__name--waiting" />}</h1>
        {/* The tile that opened this carries one, and a mark that
            only exists in a grid reads as a property of the grid. */}
        {!own && found && (
          <StarMark
            size={19}
            item={{ id, name: found.name, type: '3f296c07-64c3-494c-923b-fe692a4fa1bd' }}
          />
        )}
      </div>
      <p class="wall__is">
        <span class="wall__chip" style={style} />
        <span class="num">{says}</span>
      </p>

      {/* Shown rather than described: the three are cropped differently and
          the point does not survive being asserted. */}
      <p class="legal wall__crops">{s.cropsWhy}</p>
      <Crops wide={found?.wide ?? null} small={found?.small ?? null} who={who} />

      {lit && (
        <>
          <h2 class="label wall__head">{s.colourFrom}</h2>
          <p class="legal">{s.colourWhy(lit)}</p>
        </>
      )}
    </main>
  );
}

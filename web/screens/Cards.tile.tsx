// One card on the wall. Two columns, and the tile crops rather than shrinks.

import { useState } from 'preact/hooks';
import { Star } from '../components/icons.tsx';
import type { Card } from '../data/cards.ts';
import { colourOf } from '../design/measure.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

export function Tile({ card, on, mine }: { card: Card; on: boolean; mine: boolean }) {
  // The colour is read off the square, which is the crop the measurement was
  // tuned on and a tenth of the bytes of the painting.
  const [shot, setShot] = useState(() => colourOf(card.small) !== null);
  const lit = useArt(shot ? card.small : null);
  const route = { name: 'card', id: card.id } as const;

  return (
    <a class="leaf stage" style={artStyle(lit)} href={href(route)} onClick={intercept(route)}>
      {card.tall && (
        <img
          class="leaf__art"
          src={card.tall}
          alt=""
          loading="lazy"
          crossOrigin="anonymous"
          onLoad={() => setShot(true)}
        />
      )}
      {on && <span class="leaf__on">{t().common.equipped}</span>}
      <span class="leaf__scrim" />
      <span class="leaf__name">{card.name}</span>
      {!mine && (
        <span class="pad__star">
          <Star size={15} />
        </span>
      )}
    </a>
  );
}

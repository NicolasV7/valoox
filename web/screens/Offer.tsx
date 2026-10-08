// One offer, opened.
//
// The question here is never "what is it called" — the row you tapped already
// said that. It is "what does it look like moving", which is the one thing the
// storefront cannot answer and Riot's own clip can. Every skin level carries a
// streamedVideo, so the clip costs no extra request and no index.
//
// What is not here yet: the other levels and the variants. A skin level carries
// no reference to its parent skin, and the only way up is the 3.5 MB weapons
// index, which the collection needs anyway and which lands with it. The blocks
// are absent rather than drawn empty, because a section that always reads
// "4 of 4" whatever you opened is a section that is lying.

import { Chevron, Play } from '../components/icons.tsx';
import { Money } from '../components/Money.tsx';
import { tierByPrice } from '../data/tiers.ts';
import type { StoreView } from '../data/types.ts';
import { useSkin } from '../data/usePiece.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { back } from '../route.ts';
import { OfferLoading } from './Offer.loading.tsx';

export function Offer({ id, view }: { id: string; view: StoreView }) {
  const s = t().offer;
  const found = useSkin(id);
  const art = useArt(found?.icon);

  // The whole screen waits as one. Half of it arriving before the other half
  // is two layout shifts where the design asks for none.
  if (!found) return <OfferLoading />;

  const { now, was } = priced(view, id);
  const tier = tierByPrice(was ?? now);
  const name = found.name ?? '';
  const at = name.lastIndexOf(' ');

  return (
    // Lit only once the colour is measured: --art defaults to white, so a glow
    // drawn before then is a white wash over the top of the screen.
    <main class={art ? 'screen offer offer--lit' : 'screen offer'} style={artStyle(art)}>
      <button type="button" class="back" onClick={back}>
        <span class="offer__chev">
          <Chevron />
        </span>
        {t().common.nav.store}
      </button>

      <div class="offer__stage stage" style={artStyle(art)}>
        {found.icon && <img class="offer__art" src={found.icon} alt="" />}

        {/* Riot's, on Riot's CDN, opened rather than embedded — they are about
            13 MB each and this page has no business holding a copy. */}
        {found.video && (
          <a
            class="offer__play"
            href={found.video}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.watch}
          >
            <Play />
          </a>
        )}
        {found.level && <span class="offer__level num">{s.levelNo(found.level)}</span>}
      </div>

      <div class="offer__id">
        <div class="offer__who">
          <h1 class="offer__name">
            {at > 0 ? <span>{name.slice(0, at)}</span> : name}
            {at > 0 && <span>{name.slice(at + 1)}</span>}
          </h1>
          {tier && (
            <p class="offer__tier">
              <img src={tier.icon} alt="" width="14" height="14" />
              {t().common.tier[tier.name]}
            </p>
          )}
        </div>

        <div class="offer__paid">
          <span class="offer__price">
            <Money amount={now} size={17} />
          </span>
          {was !== null && was !== now && <Money amount={was} struck size={11} />}
        </div>
      </div>

      <p class="legal offer__note">{s.clips}</p>
    </main>
  );
}

/** What this skin costs, and what it cost before, from whichever of the three
 *  places it was opened from. `was` is null in the daily store, which sells at
 *  one price and never shows a second number. */
function priced(view: StoreView, id: string): { now: number | null; was: number | null } {
  const daily = view.offers.find((o) => o.id === id);
  if (daily) return { now: daily.cost, was: null };

  const night = view.night?.items.find((o) => o.id === id);
  if (night) return { now: night.price ?? night.cost, was: night.cost };

  const packed = view.bundles.flatMap((b) => b.items).find((it) => it.id === id);
  if (packed) return { now: packed.price ?? packed.base, was: packed.base };

  return { now: null, was: null };
}

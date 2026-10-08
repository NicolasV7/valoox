// A bundle, opened.
//
// A bundle is not four guns. Champions 2026 is a Phantom, a fan, a spray, a
// charm and two cards — six pieces of four different shapes, and the 2022 one
// had ten. So the contents use the rule the accessory store uses: the shape
// follows the KIND, never the slot. Weapons lead because they are the only
// pieces big enough to carry a render; the rest packs underneath and any mix
// fits.
//
// Nothing here is fetched. The whole bundle, every piece and every price,
// arrived with the store — so this screen opens with its numbers already real
// and only the names and the artwork resolving against the catalogue.

import { Countdown } from '../components/Countdown.tsx';
import { Chevron } from '../components/icons.tsx';
import { OfferRow } from '../components/OfferRow.tsx';
import { Tile } from '../components/Tile.tsx';
import { tierByPrice } from '../data/tiers.ts';
import type { Bundle as BundleData, GroupItem } from '../data/types.ts';
import { useBundle, useSkin } from '../data/usePiece.ts';
import { shapeOf } from '../design/shapes.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { back } from '../route.ts';
import { Totals } from './Bundle.totals.tsx';

export function Bundle({ bundle }: { bundle: BundleData }) {
  const s = t().bundle;
  const found = useBundle(bundle.id);
  // The ground under the whole screen is sampled from the banner, so the page
  // itself takes the bundle's colour rather than only the artwork sitting on it.
  const art = useArt(found?.icon);

  const guns = bundle.items.filter((it) => shapeOf(it.type) === 'row');
  const rest = bundle.items.filter((it) => shapeOf(it.type) !== 'row');
  // The tier of the dearest weapon. Every piece in a bundle is sold at the same
  // tier, and a weapon is the only one whose price says which.
  const tier = tierByPrice(guns.map((g) => g.base ?? 0).sort((a, b) => b - a)[0] ?? null);

  return (
    <main
      // Lit only once the banner's colour is measured: --art defaults to
      // white, and a glow drawn before then is a white wash over the hero.
      class={art ? 'screen screen--flush bundle bundle--lit' : 'screen screen--flush bundle'}
      style={artStyle(art)}
    >
      <div class="bundle__hero">
        {found?.icon && <img class="bundle__art" src={found.icon} alt="" />}

        <button type="button" class="chip chip--back" onClick={back}>
          <span class="chip__chev">
            <Chevron />
          </span>
          {t().common.nav.store}
        </button>
        <Countdown from={bundle.remaining} className="chip chip--clock" />

        <div class="bundle__id">
          <h1 class="bundle__name">{found?.name ?? t().common.loading}</h1>
          <p class="bundle__what">
            {s.pieces(bundle.items.length)}
            {tier && ' · ' + s.tier(t().common.tier[tier.name])}
          </p>
        </div>
      </div>

      <div class="bundle__body">
        <h2 class="label">{s.contents}</h2>

        <div class="store__rows">
          {guns.map((it) => (
            <Gun key={it.id} item={it} />
          ))}
        </div>

        {rest.length > 0 && (
          <div class="grid grid--bundle">
            {rest.map((it) => (
              <Tile
                key={it.id}
                type={it.type}
                id={it.id}
                cost={it.price ?? it.base}
                was={it.base}
                bare
                // Always, here. A bundle piece is called "Dragon" and the name
                // on its own does not say whether that is a card or a spray.
                captioned
              />
            ))}
          </div>
        )}

        <p class="legal bundle__note">{s.perItem}</p>

        <Totals bundle={bundle} />

        <p class="legal bundle__note">{s.read}</p>
      </div>
    </main>
  );
}

/** One weapon out of the bundle, in the same letterbox the store uses. */
function Gun({ item }: { item: GroupItem }) {
  const found = useSkin(item.id);

  return (
    <OfferRow
      name={found?.name ?? null}
      render={found?.icon ?? null}
      tier={tierByPrice(item.base)}
      cost={item.price ?? item.base}
      was={item.base}
      scale={found?.scale}
      bare
      href={'/offer/' + item.id}
      onClick={undefined}
    />
  );
}

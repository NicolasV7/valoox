// The two blocks this screen exists for: which level, and which colourway.
//
// The same two questions the store's offer screen asks, with one answer added
// to each — whether the thing you are looking at is yours. Riot grants a level
// and a colourway under two different item types, so one skin arrives as
// several ids and a colourway you do not hold is a real state, not an error.

import { Check, Play } from '../components/icons.tsx';
import type { Skin } from '../data/skins.ts';
import { t } from '../i18n/index.ts';
import { label } from './Offer.levels.tsx';

export function Levels({
  skin,
  on,
  pick,
  melee,
}: {
  skin: Skin;
  on: string;
  pick: (id: string) => void;
  melee: boolean;
}) {
  const s = t().skin;
  if (skin.levels.length < 2) return null;

  return (
    <>
      <div class="vary__band">
        <h2 class="label">{t().offer.levels}</h2>
        <span class="faint num">{t().offer.levelsOf(skin.levels.length, skin.levels.length)}</span>
      </div>
      <div class="steps">
        {skin.levels.map((l, i) => (
          <button
            type="button"
            key={l.id}
            class={l.id === on ? 'step step--on' : 'step'}
            onClick={() => pick(l.id)}
          >
            {/* The glyph says this level has a clip to play, and most do not:
                it is on the payload, not on the level number. */}
            {l.video && <Play size={9} />}
            {label(l, i)}
          </button>
        ))}
      </div>
      {melee && <p class="legal vary__under">{s.meleeLevels(skin.levels.length)}</p>}
    </>
  );
}

export function Colours({
  skin,
  on,
  kept,
  pick,
}: {
  skin: Skin;
  on: string | null;
  kept: Set<string>;
  pick: (id: string | null) => void;
}) {
  const s = t().skin;
  if (skin.chromas.length < 2) return null;
  const mine = skin.chromas.filter((c) => kept.has(c.id)).length;
  // The first colourway is the skin as it ships: it comes with the level and
  // is not a separate entitlement, so it counts as held.
  const has = (id: string, i: number) => i === 0 || kept.has(id);

  return (
    <>
      <div class="vary__band">
        <h2 class="label">{t().offer.variants}</h2>
        <span class="faint num">{t().offer.levelsOf(mine + 1, skin.chromas.length)}</span>
      </div>
      <div class="swatches">
        {skin.chromas.map((c, i) => {
          const yours = has(c.id, i);
          const here = i === 0 ? on === null : on === c.id;
          return (
            <button
              type="button"
              key={c.id}
              class={cell(here, yours)}
              onClick={() => pick(i === 0 ? null : c.id)}
            >
              {c.swatch && <img src={c.swatch} alt="" width="30" height="30" />}
              <span class="swatch__of">
                {/* A play triangle when this colourway ships a clip of its
                    own, a tick when it is simply yours. 865 of the 2,931 in
                    the catalogue carry one — 186 melee and 679 gun — so which
                    is which is read, not guessed from the weapon. */}
                {c.video ? <Play size={9} /> : yours && <Check size={9} />}
                {i === 0 ? t().offer.original : (c.colour ?? t().offer.original)}
              </span>
            </button>
          );
        })}
      </div>
      <p class="legal vary__under">{s.twoReceipts}</p>
    </>
  );
}

const cell = (here: boolean, yours: boolean) =>
  'swatch' + (here ? ' swatch--on' : '') + (yours ? '' : ' swatch--not');

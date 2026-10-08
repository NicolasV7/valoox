// The two blocks the offer screen exists for: what each level adds, and the
// colour you would actually equip.
//
// Both are real or absent. 857 skins in the catalogue have a single level and
// 880 have no chroma at all, so a block that is always "4 of 4" whatever you
// opened would be a section that is lying — these disappear instead.

import type { Chroma, Family, Level } from '../data/skins.ts';
import { t } from '../i18n/index.ts';

export function Levels({
  family,
  on,
  pick,
}: {
  family: Family;
  on: string;
  pick: (id: string) => void;
}) {
  const s = t().offer;
  if (family.levels.length < 2) return null;

  return (
    <>
      <div class="offer__head">
        <h2 class="label">{s.levels}</h2>
        <span class="faint num">{s.levelsOf(family.levels.length, family.levels.length)}</span>
      </div>
      <div class="pills">
        {family.levels.map((l, i) => (
          <button
            type="button"
            key={l.id}
            class={l.id === on ? 'pill pill--on' : 'pill'}
            onClick={() => pick(l.id)}
          >
            {label(l, i)}
          </button>
        ))}
      </div>
    </>
  );
}

export function Variants({
  family,
  on,
  pick,
}: {
  family: Family;
  on: string;
  pick: (id: string) => void;
}) {
  const s = t().offer;
  if (family.chromas.length < 2) return null;

  return (
    <>
      <div class="offer__head">
        <h2 class="label">{s.variants}</h2>
        <span class="faint num">{family.chromas.length}</span>
      </div>
      <div class="swatches">
        {family.chromas.map((c) => (
          <button
            type="button"
            key={c.id}
            class={c.id === on ? 'swatch swatch--on' : 'swatch'}
            onClick={() => pick(c.id)}
          >
            {c.swatch && <img src={c.swatch} alt="" width="30" height="30" />}
            <span class="swatch__name">{c.colour ?? s.original}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/** What this level adds, named. The catalogue has seventeen of these and the
 *  six common ones cover all but ninety skins; the rest say which level they
 *  are, which is true and short. */
export function label(level: Level, i: number): string {
  const s = t().offer;
  const named = level.adds && (s.level as Record<string, string | undefined>)[level.adds];
  return named ?? (i === 0 ? s.level.base : s.levelNo(i + 1));
}

/** The chroma whose render is on screen, or the base one. */
export const chosen = (family: Family, id: string): Chroma | undefined =>
  family.chromas.find((c) => c.id === id) ?? family.chromas[0];

/** The chip over the clip: which level you are watching, and what it adds. */
export function chipFor(family: Family, on: string): string {
  const s = t().offer;
  const i = family.levels.findIndex((l) => l.id === on);
  if (i < 0) return '';
  const adds = label(family.levels[i] as Level, i);
  const no = s.levelNo(i + 1);
  return adds === s.level.base ? no : no + ' · ' + adds;
}

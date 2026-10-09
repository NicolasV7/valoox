// Which kind of thing you are looking for, in two rows.
//
// Two rows and not one row of six. Six peers made you read the whole row to
// find out there were only two kinds of thing here, and it put "Titles" next
// to "Melee" as though those were comparable choices. The first row is the
// question the store itself asks — a gun or an accessory, two different panels
// on two different rotations — and the second is which one, which is only a
// question once you have answered the first.
//
// Each row remembers its own place. Going to Accessories and back to Weapons
// returns you to Melee if that is where you were: they are two independent
// choices and losing one to make the other is friction nobody reports and
// everybody feels.
//
// It lives here rather than in the screen because the screen was over two
// hundred lines with it inside, and this is the seam: everything in this file
// is about which tab, and nothing in it knows what a tab contains.

import type { VNode } from 'preact';
import { Pick } from '../components/Pick.tsx';
import { BUDDIES, CARDS, SPRAYS, TITLES } from '../data/findable.ts';
import { useKept } from '../data/kept.ts';
import { t } from '../i18n/index.ts';

/** Which index each accessory tab reads. Also the test for "is this an
 *  accessory tab at all", which is why it is a map and not a list. */
export const TYPE: Record<string, string> = {
  spray: SPRAYS,
  buddy: BUDDIES,
  card: CARDS,
  title: TITLES,
};

/** A knife is a gun here: Riot sells it out of the same daily panel, so it
 *  falls under the same ceiling and the same rotation. */
export const isGun = (tab: string): boolean => tab === 'gun' || tab === 'melee';

export function usePicks(): { tab: string; picks: VNode } {
  const s = t().alerts;
  const c = t().collection;
  // Three kept keys and not one, because they are three independent choices:
  // which half you are in, and where you were in each half. `useKept` reads
  // its map once per mount, so a key that changed shape would not re-read.
  const [kind, setKind] = useKept('alerts-kind');
  const [gun, setGun] = useKept('alerts-gun');
  const [bit, setBit] = useKept('alerts-bit');
  const bits = kind === 'bits';

  // Guns, and the first accessory, are the defaults and the fallbacks: a key
  // kept from an older shape of this screen resolves to a real tab rather
  // than to an empty list.
  const tab = bits ? (TYPE[bit] ? bit : 'spray') : gun === 'melee' ? 'melee' : 'gun';

  const under: Array<[string, string]> = bits
    ? [
        ['spray', c.tab.sprays],
        ['buddy', c.tab.buddies],
        ['card', c.tab.cards],
        ['title', c.tab.titles],
      ]
    : [
        ['gun', s.firearms],
        ['melee', c.rack.melee ?? s.firearms],
      ];

  return {
    tab,
    picks: (
      <>
        {/* The same two shapes a skin's levels wear — see styles/pick.css. */}
        <div class="pills watch__picks">
          <Pick said={s.weapons} on={!bits} choose={() => setKind('guns')} />
          <Pick said={s.accessories} on={bits} choose={() => setKind('bits')} />
        </div>
        <div class="pills watch__picks watch__picks--under">
          {under.map(([key, said]) => (
            <Pick
              key={key}
              said={said}
              on={tab === key}
              choose={() => (bits ? setBit(key) : setGun(key))}
            />
          ))}
        </div>
      </>
    ),
  };
}

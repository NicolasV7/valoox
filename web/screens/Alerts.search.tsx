// Adding to the list.
//
// What is missing is missing on purpose and the screen says so: anything you
// own, and every knife, because the daily panel is four guns.
//
// What is NOT filtered out is the battle pass, and that is not an oversight —
// see data/findable.ts. Nothing published says which skins Riot actually
// sells, so the honest screen is one that holds them and says plainly that
// some of them will never match.
//
// The narrowing happens entirely against indexes the browser already holds,
// so the field answers without asking anything of anybody.

import { useMemo } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { Search } from '../components/icons.tsx';
import { More } from '../components/More.tsx';
import { Watch } from '../components/Watch.tsx';
import { usePrefs } from '../data/channel.ts';
import { bits, guns, narrow } from '../data/findable.ts';
import { useKept } from '../data/kept.ts';
import { useMore } from '../data/more.ts';
import { MAX, useStars } from '../data/stars.ts';
import type { Inventory } from '../data/types.ts';
import { useBuddies, useCards, useRacks, useSprays, useTitles } from '../data/useIndex.ts';
import { t } from '../i18n/index.ts';
import { ALERTS } from '../route.ts';
import { AlertsLoading } from './Alerts.loading.tsx';
import { AlertsStandby } from './Alerts.standby.tsx';

const STEP = 20;

export function AlertsSearch({ inv }: { inv: Inventory }) {
  const s = t().alerts;
  const [q, setQ] = useKept('alerts-add');
  const [kind, setKind] = useKept('alerts-kind');
  const bitsTab = kind === 'bits';

  const racks = useRacks();
  const sprays = useSprays();
  const buddies = useBuddies();
  const cards = useCards();
  const titles = useTitles();
  const { stars, on, full, toggle } = useStars();
  // Shut once, on the reasoning that finding things with nowhere to send
  // them is a dead end. It is the same action the star is, and the star is a
  // control everywhere now — see components/StarMark.tsx. The card below
  // carries the part that is actually worth saying.
  const held = usePrefs()?.mail?.ok !== true;

  // Everything owned, flattened once: the indexes are keyed by item type and
  // this only ever asks "is this id mine".
  const owned = useMemo(() => new Set(Object.values(inv.byType).flat()), [inv]);

  const all = useMemo(() => {
    if (bitsTab) {
      if (!sprays || !buddies || !cards || !titles) return null;
      return bits(sprays, buddies, cards, titles, owned, s.kinds);
    }
    return racks ? guns(racks, owned) : null;
  }, [bitsTab, racks, sprays, buddies, cards, titles, owned, s.kinds]);

  const found = useMemo(() => (all ? narrow(all, q) : []), [all, q]);
  const [shown, more] = useMore('alerts-add-' + kind + q, STEP);

  if (!all) return <AlertsLoading />;

  return (
    <main class="screen bell">
      <Back to={ALERTS} said={t().common.nav.alerts} />
      <h1 class="bell__title">{s.addSomethingTitle}</h1>

      <div class="find watch__field">
        <span class="find__glass">
          <Search />
        </span>
        <input
          type="search"
          value={q}
          placeholder={s.addSomething}
          aria-label={s.addSomething}
          onInput={(e) => setQ((e.currentTarget as HTMLInputElement).value)}
        />
      </div>

      {/* The same two shapes a skin's levels wear — see styles/pick.css. */}
      <div class="pills watch__picks">
        <Pick said={s.weapons} on={!bitsTab} choose={() => setKind('guns')} />
        <Pick said={s.accessories} on={bitsTab} choose={() => setKind('bits')} />
      </div>

      {held && <AlertsStandby starred={stars?.length ?? 0} />}

      <p class="legal bell__note">{s.sellsCount(found.length)}</p>

      {found.length > 0 && (
        <div class="watch__list">
          {found.slice(0, shown).map((f) => (
            <Watch
              key={f.id}
              item={f}
              note={f.of}
              on={on(f.id)}
              shut={full}
              toggle={() =>
                toggle({
                  id: f.id,
                  name: f.name,
                  type: f.type,
                  tier: f.tier,
                  levels: f.levels,
                  chromas: f.chromas,
                })
              }
            />
          ))}
        </div>
      )}
      {found.length > shown && <More when={more} at={shown} />}

      {full && <p class="legal bell__note">{s.listFull(MAX)}</p>}
      <p class="legal bell__note">{s.notInThisList}</p>
      <p class="legal bell__note">{s.searchIsLocal}</p>
    </main>
  );
}

function Pick({ said, on, choose }: { said: string; on: boolean; choose: () => void }) {
  return (
    <button type="button" class={on ? 'pill pill--on' : 'pill'} aria-pressed={on} onClick={choose}>
      {said}
    </button>
  );
}

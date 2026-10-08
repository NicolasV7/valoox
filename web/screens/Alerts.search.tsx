// Adding to the list.
//
// Every row here is a thing that can actually turn up. What is missing is
// missing on purpose and the screen says so: anything you own, every knife,
// and every skin Riot does not sell — which is most of the battle pass and
// every event reward. Starring one of those is a row that can never fire.
//
// The narrowing happens against a list the browser already holds, so the
// field answers without asking the Worker anything. What Riot sells is the
// one part that is not local, and it is one call shared by everybody.

import { useMemo } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { Search } from '../components/icons.tsx';
import { More } from '../components/More.tsx';
import { Watch } from '../components/Watch.tsx';
import { bits, guns, narrow } from '../data/findable.ts';
import { useKept } from '../data/kept.ts';
import { useMore } from '../data/more.ts';
import { useSells } from '../data/sells.ts';
import { MAX, useStars } from '../data/stars.ts';
import type { Inventory } from '../data/types.ts';
import { useBuddies, useCards, useRacks, useSprays, useTitles } from '../data/useIndex.ts';
import { t } from '../i18n/index.ts';
import { ALERTS } from '../route.ts';
import { AlertsLoading } from './Alerts.loading.tsx';

const STEP = 20;

export function AlertsSearch({ inv }: { inv: Inventory }) {
  const s = t().alerts;
  const [q, setQ] = useKept('alerts-add');
  const [kind, setKind] = useKept('alerts-kind');
  const bitsTab = kind === 'bits';

  const sold = useSells();
  const racks = useRacks();
  const sprays = useSprays();
  const buddies = useBuddies();
  const cards = useCards();
  const titles = useTitles();
  const { on, full, toggle } = useStars();

  // Everything owned, flattened once: the indexes are keyed by item type and
  // this only ever asks "is this id mine".
  const owned = useMemo(() => new Set(Object.values(inv.byType).flat()), [inv]);

  const all = useMemo(() => {
    if (!sold) return null;
    if (bitsTab) {
      if (!sprays || !buddies || !cards || !titles) return null;
      return bits(sprays, buddies, cards, titles, sold, owned, s.kinds);
    }
    return racks ? guns(racks, sold, owned) : null;
  }, [bitsTab, sold, racks, sprays, buddies, cards, titles, owned, s.kinds]);

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
              toggle={() => toggle({ id: f.id, name: f.name, type: f.type })}
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

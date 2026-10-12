// Adding to the list.
//
// What is missing is missing on purpose and the screen says so: anything you
// already own. Knives are not missing — the daily panel takes them too.
//
// Known rewards and owned items are excluded before searching and pagination.
//
// The narrowing happens entirely against indexes the browser already holds,
// so the field answers without asking anything of anybody.
//
// Two rows of tabs — which kind, then which one of those. They live in
// Alerts.picks.tsx; everything here is about what a tab contains.
//
// The wishlist itself has no tabs at all — that list is short and it is yours.

import { useMemo } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { FlowHeading, FlowRetry } from '../components/Flow.tsx';
import { Search } from '../components/icons.tsx';
import { More } from '../components/More.tsx';
import { Watch } from '../components/Watch.tsx';
import { reload, usePrefs, usePrefsError } from '../data/channel.ts';
import { bits, guns, LEVELS, narrow, SPRAYS } from '../data/findable.ts';
import { useKept } from '../data/kept.ts';
import { useMore } from '../data/more.ts';
import { BITS, GUNS, useStars } from '../data/stars.ts';
import type { Inventory } from '../data/types.ts';
import {
  useBuddies,
  useCards,
  useGiven,
  useRacks,
  useSprays,
  useTitles,
} from '../data/useIndex.ts';
import { t } from '../i18n/index.ts';
import { ALERTS, type Whence } from '../route.ts';
import { isGun, TYPE, usePicks } from './Alerts.picks.tsx';
import { AlertsStandby } from './Alerts.standby.tsx';

const STEP = 20;

export function AlertsSearch({ inv }: { inv: Inventory }) {
  const s = t().alerts;
  const f = t().flows;
  const [q, setQ] = useKept('alerts-add');
  const { tab, picks } = usePicks();

  const racks = useRacks();
  const sprays = useSprays();
  const buddies = useBuddies();
  const cards = useCards();
  const titles = useTitles();
  const { stars, on, shut, toggle } = useStars();
  // Everything a contract hands out, which is everything no store sells.
  const given = useGiven();
  // The ceiling that applies to the tab you are on. A knife counts against the
  // guns, because Riot sells it out of the same daily panel.
  const cap = isGun(tab) ? GUNS : BITS;
  const noRoom = shut(isGun(tab) ? LEVELS : SPRAYS);
  // Shut once, on the reasoning that finding things with nowhere to send
  // them is a dead end. It is the same action the star is, and the star is a
  // control everywhere now — see components/StarMark.tsx. The card below
  // carries the part that is actually worth saying.
  const held = usePrefs()?.mail?.ok !== true;
  const failed = usePrefsError();
  // A result opens the thing it names, and the way back is this search — with
  // the query still in it, because the field is kept rather than stateful.
  const from: Whence = { to: { name: 'alerts', step: 'add' }, said: s.addSomethingTitle };

  // Everything owned, flattened once: the indexes are keyed by item type and
  // this only ever asks "is this id mine".
  const owned = useMemo(() => new Set(Object.values(inv.byType).flat()), [inv]);

  const all = useMemo(() => {
    if (!given) return null;
    if (isGun(tab)) {
      // `of` is Riot's own category, lower-cased. Everything that is not melee
      // is a gun, so a weapon class added later lands in the right half with
      // nothing here to update.
      if (!racks) return null;
      const want = tab === 'melee';
      return guns(
        racks.filter((r) => (r.of === 'melee') === want),
        owned,
        given,
      );
    }
    if (!sprays || !buddies || !cards || !titles) return null;
    return bits(sprays, buddies, cards, titles, owned, s.kinds, given).filter(
      (f) => f.type === TYPE[tab],
    );
  }, [tab, racks, sprays, buddies, cards, titles, owned, s.kinds, given]);

  const found = useMemo(() => (all ? narrow(all, q) : []), [all, q]);
  const [shown, more] = useMore('alerts-add-' + tab + q, STEP);

  return (
    <main class="screen flow">
      <Back to={ALERTS} said={t().common.nav.alerts} />
      <FlowHeading eyebrow={f.onRadar} title={s.addSomethingTitle} lead={f.searchLead} />

      <div class="find watch__field">
        <span class="find__glass">
          <Search />
        </span>
        <input
          type="search"
          value={q}
          disabled={!all}
          placeholder={all ? s.addSomething : t().common.waitingCatalogue}
          aria-label={s.addSomething}
          onInput={(e) => setQ((e.currentTarget as HTMLInputElement).value)}
        />
      </div>

      {picks}
      {!all && (
        <p class="flow__note" role="status">
          {t().common.waitingCatalogue}
        </p>
      )}
      {!stars && (
        <FlowRetry
          failed={failed}
          retry={() => {
            void reload();
          }}
        />
      )}

      {held && <AlertsStandby starred={stars?.length ?? 0} />}

      {all && <p class="flow__note">{s.sellsCount(found.length)}</p>}

      {found.length > 0 && (
        <div class="watch__list">
          {found.slice(0, shown).map((f) => (
            <Watch
              key={f.id}
              item={f}
              note={f.of}
              on={on(f.id)}
              bare={tab === 'title'}
              shut={noRoom || !stars}
              why={!stars ? t().common.loading : noRoom ? s.listFull(cap) : undefined}
              from={from}
              toggle={(item) =>
                toggle({
                  id: f.id,
                  name: f.name,
                  type: f.type,
                  tier: f.tier,
                  levels: f.levels,
                  chromas: f.chromas,
                  art: item.art,
                })
              }
            />
          ))}
        </div>
      )}
      {found.length > shown && <More when={more} at={shown} />}

      {all && found.length === 0 && <p class="flow__note">{f.searchNone}</p>}
      {noRoom && <p class="flow__note">{s.listFull(cap)}</p>}
      <p class="flow__note">{f.searchScope}</p>
      <p class="flow__note">{s.searchIsLocal}</p>
    </main>
  );
}

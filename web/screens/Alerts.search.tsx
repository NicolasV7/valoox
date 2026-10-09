// Adding to the list.
//
// What is missing is missing on purpose and the screen says so: anything you
// already own. Knives are not missing — the daily panel takes them too.
//
// What a contract hands out is still listed, and still cannot be starred —
// see data/sellable.ts. Removing those rows would be the screen pretending
// they do not exist; a star that says why it will not take the tap is the
// thing you can check.
//
// The narrowing happens entirely against indexes the browser already holds,
// so the field answers without asking anything of anybody.
//
// One tab per kind of thing, six of them, because this is the screen where you
// are looking for ONE thing and every tab you are not on is noise you have to
// read past. Guns and knives are split for the same reason they are split in
// the collection: nobody opening this to find a knife wants nine hundred rifle
// skins ranked above it. The wishlist itself has no tabs — that list is short
// and it is yours.

import { useMemo } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { Search } from '../components/icons.tsx';
import { More } from '../components/More.tsx';
import { Pick } from '../components/Pick.tsx';
import { Watch } from '../components/Watch.tsx';
import { usePrefs } from '../data/channel.ts';
import { BUDDIES, bits, CARDS, guns, LEVELS, narrow, SPRAYS, TITLES } from '../data/findable.ts';
import { useKept } from '../data/kept.ts';
import { useMore } from '../data/more.ts';
import { sold } from '../data/sellable.ts';
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
import { AlertsLoading } from './Alerts.loading.tsx';
import { AlertsStandby } from './Alerts.standby.tsx';

const STEP = 20;

/** Which index a tab reads, for the four that are accessories. */
const TYPE: Record<string, string> = {
  spray: SPRAYS,
  buddy: BUDDIES,
  card: CARDS,
  title: TITLES,
};

const isGun = (tab: string) => tab === 'gun' || tab === 'melee';

export function AlertsSearch({ inv }: { inv: Inventory }) {
  const s = t().alerts;
  const [q, setQ] = useKept('alerts-add');
  const [kind, setKind] = useKept('alerts-kind');
  // Guns are the default and the fallback: a key kept from before this screen
  // had six tabs resolves to one of them rather than to an empty list.
  const tab = kind === 'melee' || TYPE[kind] ? kind : 'gun';
  const c = t().collection;
  const tabs: Array<[string, string]> = [
    ['gun', c.tab.weapons],
    ['melee', c.rack.melee ?? c.tab.weapons],
    ['spray', c.tab.sprays],
    ['buddy', c.tab.buddies],
    ['card', c.tab.cards],
    ['title', c.tab.titles],
  ];

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
  // A result opens the thing it names, and the way back is this search — with
  // the query still in it, because the field is kept rather than stateful.
  const from: Whence = { to: { name: 'alerts', step: 'add' }, said: s.addSomethingTitle };

  // Everything owned, flattened once: the indexes are keyed by item type and
  // this only ever asks "is this id mine".
  const owned = useMemo(() => new Set(Object.values(inv.byType).flat()), [inv]);

  const all = useMemo(() => {
    if (isGun(tab)) {
      // `of` is Riot's own category, lower-cased. Everything that is not melee
      // is a gun, so a weapon class added later lands in the right half with
      // nothing here to update.
      if (!racks) return null;
      const want = tab === 'melee';
      return guns(
        racks.filter((r) => (r.of === 'melee') === want),
        owned,
      );
    }
    if (!sprays || !buddies || !cards || !titles) return null;
    return bits(sprays, buddies, cards, titles, owned, s.kinds).filter((f) => f.type === TYPE[tab]);
  }, [tab, racks, sprays, buddies, cards, titles, owned, s.kinds]);

  const found = useMemo(() => (all ? narrow(all, q) : []), [all, q]);
  const [shown, more] = useMore('alerts-add-' + tab + q, STEP);

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

      {/* The same two shapes a skin's levels wear — see styles/pick.css. Six
          of them wrap to a second line at phone width, which is the right
          shape: they are six peers, not two with four hidden under one. */}
      <div class="pills watch__picks">
        {tabs.map(([key, said]) => (
          <Pick key={key} said={said} on={tab === key} choose={() => setKind(key)} />
        ))}
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
              shut={noRoom || !sold(given, f.id)}
              why={sold(given, f.id) ? undefined : s.notSoldWhy}
              from={from}
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

      {noRoom && <p class="legal bell__note">{s.listFull(cap)}</p>}
      <p class="legal bell__note">{s.notInThisList}</p>
      <p class="legal bell__note">{s.searchIsLocal}</p>
    </main>
  );
}

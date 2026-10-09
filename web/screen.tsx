// Which screen a route opens.
//
// A table, and its own file, because it is a different job from the shell:
// App.tsx answers one question — can the Worker open a session for this
// browser — and this answers the other, which is where in the app you are.
// Keeping them together made a single component that both fetched and routed,
// and the import list alone was a third of it.
//
// Every collection screen waits on the inventory, so each has its loading twin
// beside it here rather than inside itself. The route table that says which
// screens need it at all is web/belong.ts.

import type { Inventory, StoreView } from './data/types.ts';
import type { Route } from './route.ts';
import { AccountGone } from './screens/Account.gone.tsx';
import { AccountKeep } from './screens/Account.keep.tsx';
import { AccountLeave } from './screens/Account.leave.tsx';
import { Account } from './screens/Account.tsx';
import { AlertsChannel } from './screens/Alerts.channel.tsx';
import { AlertsCode } from './screens/Alerts.code.tsx';
import { AlertsLoading } from './screens/Alerts.loading.tsx';
import { AlertsSearch } from './screens/Alerts.search.tsx';
import { Alerts } from './screens/Alerts.tsx';
import { BuddiesLoading } from './screens/Buddies.loading.tsx';
import { Buddies } from './screens/Buddies.tsx';
import { Buddy } from './screens/Buddy.tsx';
import { Bundle } from './screens/Bundle.tsx';
import { Card } from './screens/Card.tsx';
import { CardsLoading } from './screens/Cards.loading.tsx';
import { Cards } from './screens/Cards.tsx';
import { CollectionLoading } from './screens/Collection.loading.tsx';
import { Collection } from './screens/Collection.tsx';
import { Offer } from './screens/Offer.tsx';
import { Piece } from './screens/Piece.tsx';
import { SkinLoading } from './screens/Skin.loading.tsx';
import { Skin } from './screens/Skin.tsx';
import { Spray } from './screens/Spray.tsx';
import { SpraysLoading } from './screens/Sprays.loading.tsx';
import { Sprays } from './screens/Sprays.tsx';
import { Store } from './screens/Store.tsx';
import { Title } from './screens/Title.tsx';
import { TitlesLoading } from './screens/Titles.loading.tsx';
import { Titles } from './screens/Titles.tsx';
import { WeaponLoading } from './screens/Weapon.loading.tsx';
import { Weapon } from './screens/Weapon.tsx';

export function Screen({
  route,
  view,
  inv,
  onGone,
}: {
  route: Route;
  view: StoreView;
  /** What you own, once it has arrived. Null is a loading screen, never an
   *  empty collection. */
  inv: Inventory | null;
  /** The row is gone and nothing on screen is about it any more. */
  onGone: () => void;
}) {
  if (route.name === 'collection') {
    if (route.tab === 'sprays') return inv ? <Sprays inv={inv} /> : <SpraysLoading />;
    if (route.tab === 'buddies') return inv ? <Buddies inv={inv} /> : <BuddiesLoading />;
    if (route.tab === 'cards') return inv ? <Cards inv={inv} /> : <CardsLoading />;
    if (route.tab === 'titles') return inv ? <Titles inv={inv} /> : <TitlesLoading />;
    return inv ? <Collection inv={inv} /> : <CollectionLoading />;
  }
  if (route.name === 'spray') {
    return inv ? <Spray id={route.id} inv={inv} /> : <SpraysLoading />;
  }
  if (route.name === 'buddy') {
    return inv ? <Buddy id={route.id} inv={inv} /> : <BuddiesLoading />;
  }
  if (route.name === 'alerts') {
    if (route.step === 'channel') return <AlertsChannel />;
    if (route.step === 'code') return <AlertsCode />;
    if (route.step === 'add') return inv ? <AlertsSearch inv={inv} /> : <AlertsLoading />;
    return <Alerts view={view} />;
  }
  if (route.name === 'skin') {
    return inv ? <Skin id={route.id} inv={inv} /> : <SkinLoading />;
  }
  if (route.name === 'card') {
    return inv ? <Card id={route.id} inv={inv} who={view.account.name} /> : <CardsLoading />;
  }
  if (route.name === 'title') {
    return inv ? <Title id={route.id} inv={inv} /> : <TitlesLoading />;
  }
  if (route.name === 'weapon') {
    return inv ? <Weapon id={route.id} inv={inv} /> : <WeaponLoading />;
  }
  if (route.name === 'account') {
    if (route.step === 'keep') return <AccountKeep />;
    if (route.step === 'leave') return <AccountLeave onGone={() => onGone()} />;
    return <Account who={view.account} />;
  }
  if (route.name === 'offer') return <Offer id={route.id} view={view} />;
  if (route.name === 'piece') return <Piece id={route.id} view={view} />;
  if (route.name === 'bundle') {
    // A bundle rotates out, so a link to last week's lands here with nothing
    // behind it. The store is the honest answer rather than an empty screen
    // about a thing that is gone.
    const it = view.bundles.find((b) => b.id === route.id);
    if (it) return <Bundle bundle={it} />;
  }
  return <Store view={view} />;
}

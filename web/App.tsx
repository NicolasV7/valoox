// What is on screen, and the one question that decides it: can the Worker open
// a session for this browser?
//
// There is no "logged in" flag anywhere. The store call either returns a store
// or says it needs a new scan, and that answer is the state — so a session that
// expires between two taps lands on the sign-in screen by itself rather than
// through a listener somebody has to remember to wire up.

import { useCallback, useEffect, useState } from 'preact/hooks';
import { Tabs } from './components/Tabs.tsx';
import type { ApiError } from './data/api.ts';
import * as api from './data/api.ts';
import { NEEDS_RESEED } from './data/api.ts';
import type { Fault, Inventory, StoreView } from './data/types.ts';
import { useRoute } from './route.ts';
import { Bundle } from './screens/Bundle.tsx';
import { CollectionLoading } from './screens/Collection.loading.tsx';
import { Collection } from './screens/Collection.tsx';
import { Fail } from './screens/Fail.tsx';
import { Gate } from './screens/Gate.tsx';
import { Offer } from './screens/Offer.tsx';
import { Piece } from './screens/Piece.tsx';
import { Scan } from './screens/Scan.tsx';
import { StoreLoading } from './screens/Store.loading.tsx';
import { Store } from './screens/Store.tsx';
import { useScan } from './sign-in.ts';

type State =
  | { at: 'loading' }
  | { at: 'out' }
  | { at: 'in'; view: StoreView }
  | { at: 'fail'; fault: Fault; status: number };

export function App() {
  const route = useRoute();
  const [state, setState] = useState<State>({ at: 'loading' });

  // What you own, fetched the first time a collection tab is opened and held
  // for the life of the page. The store does not wait on it and it does not
  // wait on the store.
  const [inv, setInv] = useState<Inventory | null>(null);

  const load = useCallback(async () => {
    setState({ at: 'loading' });
    try {
      const view = await api.store();
      setState(view === NEEDS_RESEED ? { at: 'out' } : { at: 'in', view });
    } catch (e) {
      const err = e as ApiError;
      setState({ at: 'fail', fault: err.fault ?? 'us', status: err.status ?? 0 });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const wants = route.name === 'collection' || route.name === 'weapon';
  useEffect(() => {
    if (!wants || inv) return;
    void api
      .inventory()
      .then((got) => {
        if (got !== NEEDS_RESEED) setInv(got);
      })
      .catch(() => undefined);
  }, [wants, inv]);

  const scan = useScan(load);

  // The four sign-in screens are locked to the viewport: they do not scroll and
  // they cannot. A person deciding whether to hand over a session should see
  // the whole argument at once, and a code half off the bottom of the screen is
  // a code nobody scans. Everything after sign-in scrolls normally.
  const locked = state.at === 'out' || !!scan.state;

  return <div class={locked ? 'shell shell--lock' : 'shell'}>{inside()}</div>;

  function inside() {
    if (state.at === 'loading' && !scan.state) return <StoreLoading />;

    if (state.at === 'fail') {
      return <Fail fault={state.fault} status={state.status} onRetry={load} />;
    }

    // The scan outranks everything while it is running, including the store
    // loading underneath it. Without that, approval sets the store fetching,
    // the fetch sets the state to loading, and the screen that says "you are
    // in" is replaced in the frame it appears — which is why nobody ever saw
    // it. The key remounts the screen on every phase, so each one arrives.
    if (scan.state) {
      const who = state.at === 'in' ? state.view.account.name : undefined;
      return <Scan key={scan.state.phase} state={scan.state} name={who} onRetry={scan.start} />;
    }

    if (state.at === 'out') return <Gate onScan={scan.start} onIntent={scan.prefetch} />;

    // Still loading, and the scan screen that was covering it has just gone.
    if (state.at !== 'in') return <StoreLoading />;

    return (
      <>
        {open(state.view)}
        <Tabs />
      </>
    );
  }

  function open(view: StoreView) {
    if (route.name === 'collection') {
      return inv ? <Collection inv={inv} /> : <CollectionLoading />;
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
}

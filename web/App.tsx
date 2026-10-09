// What is on screen, and the one question that decides it: can the Worker open
// a session for this browser?
//
// There is no "logged in" flag anywhere. The store call either returns a store
// or says it needs a new scan, and that answer is the state — so a session that
// expires between two taps lands on the sign-in screen by itself rather than
// through a listener somebody has to remember to wire up.

import { useCallback, useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { needsOwned } from './belong.ts';
import { Tabs } from './components/Tabs.tsx';
import type { ApiError } from './data/api.ts';
import * as api from './data/api.ts';
import { EXPIRED, reseeded } from './data/api.ts';
import type { Fault, Inventory, StoreView } from './data/types.ts';
import { useRoute, wasAt } from './route.ts';
import { Screen } from './screen.tsx';
import { AccountGone } from './screens/Account.gone.tsx';
import { Fail } from './screens/Fail.tsx';
import { Gate } from './screens/Gate.tsx';
import { Scan } from './screens/Scan.tsx';
import { Stopped } from './screens/Stopped.tsx';
import { StoreLoading } from './screens/Store.loading.tsx';
import { useScan } from './sign-in.ts';

type State =
  | { at: 'loading' }
  | { at: 'out'; gone?: boolean }
  | { at: 'in'; view: StoreView }
  | { at: 'fail'; fault: Fault; status: number };

export function App() {
  const route = useRoute();
  const [state, setState] = useState<State>({ at: 'loading' });

  // Put the scroll back where this entry left it — see route.ts. Layout rather
  // than effect, so it happens before the frame paints and nobody sees the top
  // of a list they were not at.
  useLayoutEffect(() => {
    scrollTo(0, wasAt());
  }, [route]);

  // What you own, fetched the first time a collection tab is opened and held
  // for the life of the page. The store does not wait on it and it does not
  // wait on the store.
  const [inv, setInv] = useState<Inventory | null>(null);

  const load = useCallback(async () => {
    setState({ at: 'loading' });
    try {
      const view = await api.store();
      // Two kinds of nothing: never scanned, and a session Riot has just
      // retired. The second is a screen of its own — see Account.gone.tsx.
      if (reseeded(view)) return setState({ at: 'out', gone: view === EXPIRED });
      setState({ at: 'in', view });
    } catch (e) {
      const err = e as ApiError;
      setState({ at: 'fail', fault: err.fault ?? 'us', status: err.status ?? 0 });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Which screens need it lives in one place rather than in a condition that
  // has to be remembered — see route.ts.
  const wants = needsOwned(route);
  useEffect(() => {
    if (!wants || inv) return;
    void api
      .inventory()
      .then((got) => {
        if (!reseeded(got)) setInv(got);
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
    // Before everything, including the session check. This screen arrives
    // from the footer of a message, which is read on whatever device reads
    // mail — usually not the one that is signed in. A sign-in wall in front
    // of an unsubscribe link is the oldest trick in the genre.
    if (route.name === 'stopped') return <Stopped token={route.token} />;

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

    // A session Riot has just retired is not the same screen as never having
    // scanned: one is a stranger's wall, the other is an explanation and a
    // button. The Worker is the only place that distinction exists.
    if (state.at === 'out' && state.gone) {
      return <AccountGone onScan={scan.start} onWait={() => setState({ at: 'out' })} />;
    }
    if (state.at === 'out') return <Gate onScan={scan.start} onIntent={scan.prefetch} />;

    // Still loading, and the scan screen that was covering it has just gone.
    if (state.at !== 'in') return <StoreLoading />;

    return (
      <>
        <Screen route={route} view={state.view} inv={inv} onGone={() => setState({ at: 'out' })} />
        <Tabs />
      </>
    );
  }
}

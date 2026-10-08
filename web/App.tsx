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
import type { Fault, StoreView } from './data/types.ts';
import { useRoute } from './route.ts';
import { Fail } from './screens/Fail.tsx';
import { Gate } from './screens/Gate.tsx';
import { Offer } from './screens/Offer.tsx';
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

  const scan = useScan(load);

  return <div class="shell">{inside()}</div>;

  function inside() {
    if (state.at === 'loading') return <StoreLoading />;

    if (state.at === 'fail') {
      return <Fail fault={state.fault} status={state.status} onRetry={load} />;
    }

    if (state.at === 'out') {
      return scan.state ? (
        <Scan state={scan.state} onRetry={scan.start} />
      ) : (
        <Gate onScan={scan.start} />
      );
    }

    return (
      <>
        {route.name === 'offer' ? (
          <Offer id={route.id} view={state.view} />
        ) : (
          <Store view={state.view} />
        )}
        <Tabs />
      </>
    );
  }
}

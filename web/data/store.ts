// Initial reads replace the gate/loading screen; rotations update the current
// view in place, keeping navigation, scroll and unfinished form state intact.
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { expiresAt } from '../../src/lib/expiry.ts';
import * as api from './api.ts';
import { EXPIRED, reseeded } from './api.ts';
import * as privateState from './private.ts';
import { rotate } from './rotation.ts';
import type { Fault, StoreView } from './types.ts';

export type StoreState =
  | { at: 'loading' }
  | { at: 'out'; gone?: boolean; ended?: boolean }
  | { at: 'in'; view: StoreView; refreshing?: boolean; refreshFailed?: boolean }
  | { at: 'fail'; fault: Fault; status: number };

export function useStore() {
  const [state, setState] = useState<StoreState>({ at: 'loading' });
  const current = useRef<StoreView | null>(null);
  const mounted = useRef(true);
  const pending = useRef<{ epoch: number; task: Promise<void> } | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      current.current = null;
    };
  }, []);
  useEffect(
    () =>
      privateState.listen((reason) => {
        current.current = null;
        setState({ at: 'out', gone: reason === 'expired', ended: reason === 'logout' });
      }),
    [],
  );

  const fetchView = useCallback((quiet: boolean): Promise<void> => {
    const generation = privateState.epoch();
    if (pending.current?.epoch === generation) return pending.current.task;
    if (quiet) setState((s) => (s.at === 'in' ? { ...s, refreshing: true } : s));
    else setState({ at: 'loading' });
    const task = (async () => {
      try {
        const view = await api.store();
        if (!mounted.current || !privateState.current(generation)) return;
        if (reseeded(view)) {
          current.current = null;
          return setState({ at: 'out', gone: view === EXPIRED });
        }
        current.current = view;
        setState({ at: 'in', view, refreshFailed: quiet && expiresAt(view) <= Date.now() });
      } catch (e) {
        if (!mounted.current || !privateState.current(generation)) return;
        if (quiet) {
          setState((s) => (s.at === 'in' ? { ...s, refreshing: false, refreshFailed: true } : s));
        } else {
          const err = e as api.ApiError;
          setState({ at: 'fail', fault: err.fault ?? 'us', status: err.status ?? 0 });
        }
      } finally {
        if (pending.current?.epoch === generation) pending.current = null;
      }
    })();
    pending.current = { epoch: generation, task };
    return task;
  }, []);
  const load = useCallback(() => fetchView(false), [fetchView]);
  const refresh = useCallback(() => fetchView(true), [fetchView]);
  useEffect(() => {
    void load();
  }, [load]);
  const inside = state.at === 'in';
  useEffect(() => {
    if (inside) return rotate(() => current.current, refresh);
  }, [inside, refresh]);

  return { state, setState, load, refresh };
}

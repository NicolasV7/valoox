// The scan, as a small machine of its own.
//
// Riot's QR login is a poll: open a session, show the code, ask every couple of
// seconds whether a phone has approved it. Two things make it worth its own
// file. The poll has to stop — on approval, on expiry, and when the screen goes
// away — and a code that outlives its two minutes is a way into somebody's
// account, so "stop" is a correctness property rather than tidiness.

import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import * as api from './data/api.ts';
import { NEEDS_RESEED } from './data/api.ts';
import { POLL_EVERY, type ScanState } from './screens/Scan.tsx';

/**
 * How long the approved screen stays after the store has landed.
 *
 * Measured from the store arriving, not from the approval, and that is the
 * whole point: the name comes back with the store, so a timer started at
 * approval dismisses the screen at whatever moment the name happens to appear.
 * This way the tick, the handle and the rank are all on screen together for
 * long enough to read, however long Riot took.
 *
 * It is the only deliberate pause in the app. The load runs underneath the
 * screen rather than after it, so everything before this is time that was being
 * spent anyway.
 */
const LINGER = 1400;

export function useScan(onApproved: () => Promise<void>) {
  const [state, setState] = useState<ScanState | null>(null);
  const timer = useRef(0);
  const held = useRef(0);
  const awake = useRef<(() => void) | null>(null);
  /** The handshake, started before it is needed. */
  const warm = useRef<Promise<string | null> | null>(null);
  /** The code that is on screen, so both endings can keep showing it. */
  const shown = useRef<string | undefined>(undefined);

  const stop = useCallback(() => {
    clearInterval(timer.current);
    timer.current = 0;
    if (awake.current) document.removeEventListener('visibilitychange', awake.current);
    awake.current = null;
  }, []);

  /**
   * Opens the scan ahead of the tap.
   *
   * Called on pointerdown rather than on mount: a handshake for every visitor
   * who lands on the gate and never scans is a Riot round trip nobody asked
   * for, and a finger landing is about 150ms of head start — which, with the
   * screen change covering another 240, is usually the whole wait.
   */
  const prefetch = useCallback(() => {
    warm.current ??= api
      .startScan()
      .then((open) => (open !== NEEDS_RESEED && open.url ? open.url : null))
      .catch(() => null);
  }, []);

  const start = useCallback(async () => {
    stop();
    clearTimeout(held.current);
    setState({ phase: 'starting' });

    prefetch();
    const url = await warm.current;
    warm.current = null;
    if (!url) {
      setState({ phase: 'expired', url: shown.current });
      return;
    }
    shown.current = url;
    setState({ phase: 'ready', url });

    const ask = async () => {
      const seen = await api.pollScan().catch(() => null);
      if (!seen || seen === NEEDS_RESEED) return;
      if (seen.status === 'expired') {
        stop();
        setState({ phase: 'expired', url: shown.current });
      } else if (seen.status === 'ok') {
        stop();
        setState({ phase: 'approved', url: shown.current });
        // The store loads underneath this screen rather than after it. Waiting
        // for it is what lets the name be shown at all; lingering afterwards is
        // what makes it readable. load() catches its own failures, so a Riot
        // that never answers still lets go of the screen.
        await onApproved();
        held.current = setTimeout(() => setState(null), LINGER) as unknown as number;
      }
    };

    timer.current = setInterval(ask, POLL_EVERY) as unknown as number;
    // Coming back from the Riot app is the moment the answer changed, and a
    // background tab's timers are throttled to about once a minute. Asking the
    // instant the page is looked at again is the difference between landing on
    // "you are in" and staring at the code you already approved.
    awake.current = () => {
      if (!document.hidden && timer.current) void ask();
    };
    document.addEventListener('visibilitychange', awake.current);
  }, [onApproved, prefetch, stop]);

  // A code left polling after the screen is gone is a request every two seconds
  // for as long as the tab lives.
  useEffect(
    () => () => {
      stop();
      clearTimeout(held.current);
    },
    [stop],
  );

  return { state, start, prefetch };
}

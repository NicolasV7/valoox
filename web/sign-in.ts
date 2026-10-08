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
import type { ScanState } from './screens/Scan.tsx';

/** Riot's codes last about two minutes. Polling faster than this buys nothing
 *  and is the shape that gets throttled. */
const EVERY = 2000;

/** How long the approved screen stays before the store takes over.
 *
 *  A deliberate pause, and the only one in the app. The store load runs through
 *  it rather than after it, so it costs nothing — but without it the screen
 *  that says "you are in" is replaced in the same frame it appears, and the
 *  only thing a person sees of a successful sign-in is a flicker. */
const HOLD = 1100;

export function useScan(onApproved: () => void) {
  const [state, setState] = useState<ScanState | null>(null);
  const timer = useRef(0);
  const held = useRef(0);
  const awake = useRef<(() => void) | null>(null);
  /** The handshake, started before it is needed. */
  const warm = useRef<Promise<string | null> | null>(null);

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
      setState({ phase: 'expired' });
      return;
    }
    setState({ phase: 'ready', url });

    const ask = async () => {
      const seen = await api.pollScan().catch(() => null);
      if (!seen || seen === NEEDS_RESEED) return;
      if (seen.status === 'expired') {
        stop();
        setState({ phase: 'expired' });
      } else if (seen.status === 'ok') {
        stop();
        setState({ phase: 'approved' });
        // The store starts loading now, through the hold rather than after it.
        onApproved();
        held.current = setTimeout(() => setState(null), HOLD) as unknown as number;
      }
    };

    timer.current = setInterval(ask, EVERY) as unknown as number;
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

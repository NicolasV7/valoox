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

export function useScan(onApproved: () => void) {
  const [state, setState] = useState<ScanState | null>(null);
  const timer = useRef(0);

  const stop = useCallback(() => {
    clearInterval(timer.current);
    timer.current = 0;
  }, []);

  const start = useCallback(async () => {
    stop();
    setState({ phase: 'starting' });
    const open = await api.startScan().catch(() => null);
    if (!open || open === NEEDS_RESEED || !open.url) {
      setState({ phase: 'expired' });
      return;
    }
    setState({ phase: 'ready', url: open.url });

    timer.current = setInterval(async () => {
      const seen = await api.pollScan().catch(() => null);
      if (!seen || seen === NEEDS_RESEED) return;
      if (seen.status === 'expired') {
        stop();
        setState({ phase: 'expired' });
      } else if (seen.status === 'ok') {
        stop();
        // The name comes back with the store, a moment later. Until then the
        // screen says it is loading rather than guessing at a handle.
        setState({ phase: 'approved', name: '', tag: '' });
        onApproved();
      }
    }, EVERY) as unknown as number;
  }, [onApproved, stop]);

  // A code left polling after the screen is gone is a request every two seconds
  // for as long as the tab lives.
  useEffect(() => stop, [stop]);

  return { state, start, stop };
}

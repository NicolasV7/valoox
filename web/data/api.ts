// Everything the page asks of its own Worker.
//
// The Worker answers `{ needsReseed: true }` when there is no session it can
// open — expired at Riot, or never scanned. That is not an error, it is the
// sign-in screen, so it gets its own branch rather than a thrown string.
//
// A real failure becomes a Fault and nothing else. The server's message is
// written for a log — `storefront 403`, `sealed blob did not open` — and
// rendering it would put a stack trace in front of somebody checking a shop.

import type { Fault, Inventory, Prefs, Scan, StoreView } from './types.ts';

export class ApiError extends Error {
  readonly fault: Fault;
  readonly status: number;
  constructor(fault: Fault, status: number) {
    super(fault + ' ' + status);
    this.name = 'ApiError';
    this.fault = fault;
    this.status = status;
  }
}

/** Riot was reached and refused, or did not answer: the Worker turns both into
 *  a 502. Anything else is ours. */
const faultFor = (status: number): Fault => (status === 502 ? 'riot' : 'us');

export const NEEDS_RESEED = Symbol('needsReseed');
export type Reseed = typeof NEEDS_RESEED;

async function call<T>(path: string, init?: RequestInit): Promise<T | Reseed> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, credentials: 'same-origin' });
  } catch {
    // Offline, or the request never left. Not Riot's doing and not ours.
    throw new ApiError('us', 0);
  }
  if (!res.ok) throw new ApiError(faultFor(res.status), res.status);

  const body = (await res.json()) as T & { needsReseed?: boolean };
  if (body?.needsReseed) return NEEDS_RESEED;
  return body;
}

export const store = () => call<StoreView>('/api/store');

/** What you own and what you have on. One call, cached for an hour by the
 *  Worker: an inventory only changes when you buy something. */
export const inventory = () => call<Inventory>('/api/inventory');

/** What you starred and where an alert would go. Ours, so it waits on nothing
 *  outside this origin. */
export const prefs = () => call<Prefs>('/api/prefs');

/** Opens a scan and returns the URL the QR encodes. */
export const startScan = () => call<Scan>('/api/qr', { method: 'POST' });

/** Polls it. `waiting` until the phone approves, then `ok`. */
export const pollScan = () => call<Scan>('/api/qr');

export const logout = () => call<{ ok: true }>('/api/logout', { method: 'POST' });

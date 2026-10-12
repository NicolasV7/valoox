// A generation belongs to one authenticated browser account. Aborting stops
// pending work; the generation check also rejects responses already in flight.
export type Reason = 'login' | 'logout' | 'expired' | 'out';
let generation = 0;
let controller = new AbortController();
const listeners = new Set<(reason: Reason) => void>();
export const epoch = () => generation;
export const current = (n: number) => n === generation;
export const signal = () => controller.signal;
export function listen(fn: (reason: Reason) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function reset(reason: Reason): void {
  generation++;
  controller.abort();
  controller = new AbortController();
  for (const fn of listeners) fn(reason);
}

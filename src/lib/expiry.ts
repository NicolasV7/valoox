// A storefront has several independent rotations. The earliest one makes the
// whole view stale, even when the daily offers still have hours left.
interface TimedStore {
  fetchedAt: number;
  remaining: number;
  bundles: Array<{ remaining: number }>;
  night: { remaining: number } | null;
  accessory: { remaining: number } | null;
}

/** Epoch milliseconds. Present sections at zero are already stale. */
export function expiresAt(view: TimedStore): number {
  const durations = [view.remaining, ...view.bundles.map((b) => b.remaining)];
  if (view.night) durations.push(view.night.remaining);
  if (view.accessory) durations.push(view.accessory.remaining);
  return (view.fetchedAt + Math.max(0, Math.min(...durations))) * 1000;
}

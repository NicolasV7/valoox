// How long is left, ticking.
//
// The seconds come from Riot, not from a clock we set: the storefront payload
// carries its own `remaining`, and the cache in front of it expires on the same
// number. So the page and the server agree about when the store rotates without
// either of them knowing what time it is.
//
// Tabular figures are the point. A countdown that shifts sideways every second
// reads as broken, which is why --num carries font-variant-numeric and why this
// never uses the UI face.

import { useEffect, useState } from 'preact/hooks';
import { t } from '../i18n/index.ts';

const pad = (n: number) => String(n).padStart(2, '0');

/** `9d 04:17:51`, or `07:12:44` under a day — `0d 07:12:44` reads as broken. */
export function spell(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const days = Math.floor(s / 86400);
  const clock = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map(pad).join(':');
  return days > 0 ? t().store.days(days) + ' ' + clock : clock;
}

/**
 * Seconds left until a moment, ticking.
 *
 * Takes a deadline rather than a duration, for two reasons. A tab that was
 * backgrounded comes back correct instead of however many seconds behind it
 * was asleep. And pressing a button twice inside the same cooldown gives the
 * same duration both times — a duration would not change, so the effect
 * would not restart, and the number would sit frozen at whatever it had
 * counted down to.
 */
export function useLeft(until: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until === null) return;
    setNow(Date.now());
    // Twice a second. On a one-second tick the displayed number spends most
    // of its life up to a second stale, which on a sixty-second wait is the
    // difference between the button lighting up when it says it will and a
    // second after.
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [until]);

  return until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000));
}

export function Countdown({ from, className }: { from: number; className?: string }) {
  const [left, setLeft] = useState(from);

  useEffect(() => {
    setLeft(from);
    // Anchored to a start time rather than decremented, so a tab that was
    // backgrounded for ten minutes comes back correct instead of ten minutes
    // behind.
    const began = Date.now();
    const id = setInterval(() => setLeft(from - Math.floor((Date.now() - began) / 1000)), 1000);
    return () => clearInterval(id);
  }, [from]);

  return (
    <span class={className ? className + ' num' : 'num'} role="timer">
      {spell(left)}
    </span>
  );
}

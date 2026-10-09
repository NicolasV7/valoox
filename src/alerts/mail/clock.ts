// A time, as the person reading it would read it.
//
// The boards print a clock: "Expires 10:14", "Tue 7 Oct · 08:04". A clock is
// the right thing to print — it is what somebody compares against the one on
// their phone — and it is also the one thing a server cannot know, because
// the Worker runs in UTC and the reader does not.
//
// So the browser sends its offset when it sets the address, the same way it
// already sends its language, and that offset rides on the session for every
// later message. Without one there is no honest clock, and the caller falls
// back to saying how long is left instead.
//
// Arithmetic rather than Intl: a timezone database is a large thing to depend
// on for four numbers, and `toLocaleString` with a timeZone is the part of
// Intl most likely to be trimmed out of a runtime. Minutes behind UTC is what
// getTimezoneOffset() returns and it is all this needs.

import type { Lang } from './words.ts';

/** Minutes behind UTC, as the browser reports it. Anything outside the range
 *  real zones occupy is not a zone — UTC-12 to UTC+14 — and is dropped. */
export const tzOf = (raw: unknown): number | undefined =>
  typeof raw === 'number' && Number.isInteger(raw) && raw >= -840 && raw <= 720 ? raw : undefined;

const DAY = {
  es: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const MONTH = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const pad = (n: number) => String(n).padStart(2, '0');

/** The reader's own wall clock, as a Date whose UTC parts are their local
 *  ones. Only ever read through the helpers below. */
const local = (ms: number, tz: number) => new Date(ms - tz * 60_000);

/** `10:14`. */
export const at = (ms: number, tz: number): string => {
  const d = local(ms, tz);
  return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
};

/** `Tue 7 Oct · 08:04`. */
export const on = (ms: number, tz: number, lang: Lang): string => {
  const d = local(ms, tz);
  return (
    `${DAY[lang][d.getUTCDay()]} ${d.getUTCDate()} ${MONTH[lang][d.getUTCMonth()]}` +
    ` · ${at(ms, tz)}`
  );
};

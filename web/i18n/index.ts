// Every user-facing string in the app passes through here.
//
// `t()` returns the active bundle, so a call site reads `t().gate.title` and
// never holds a reference across a locale change. Both locales are imported
// statically: the two of them together are a few kilobytes, and a dynamic
// import would buy a second request on a page whose whole job is to be quick.
//
// Strings that take a value are functions, not fragments to concatenate. That
// is the rule that makes the difference between a bundle that can be translated
// and one whose word order is frozen — see .claude/skills/valoox-copy.

import { en } from './en/index.ts';
import { es } from './es/index.ts';

export type Strings = typeof es;
export type Locale = keyof typeof BUNDLES;

const BUNDLES = { es, en };

/** Spanish is the source locale and the one served. */
const DEFAULT: Locale = 'es';

let active: Strings = BUNDLES[DEFAULT];
let code: Locale = DEFAULT;

export const t = (): Strings => active;
export const locale = (): Locale => code;

export function setLocale(next: Locale): void {
  code = next;
  active = BUNDLES[next];
  document.documentElement.lang = next;
}

/** What the browser asked for, if we speak it. Nothing is stored and nothing
 *  asks: the browser decides, every load. There is no language control yet. */
export function preferred(): Locale {
  for (const tag of navigator.languages ?? []) {
    const base = tag.slice(0, 2).toLowerCase();
    if (base in BUNDLES) return base as Locale;
  }
  return DEFAULT;
}

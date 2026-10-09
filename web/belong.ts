// Which part of the app a screen is in, and what that part needs.
//
// Its own file because it is a different question from what a URL is: route.ts
// answers "what does this path mean", this answers "where does that screen
// live and what has to be loaded for it". The table is here once, because two
// lists of the same thing drift and this pair already did.

import type { Route } from './route.ts';

/**
 * Which section of the app a screen belongs to.
 *
 * One table, because two lists of the same thing drift and this pair already
 * did: the tab bar marks where you are with it and the shell decides whether
 * to fetch your inventory with it, and every detail screen added to the
 * collection had to be remembered in both. Three of them were not, so a cold
 * link to a charm, a card or a title sat on its loader for ever.
 */
const UNDER: Array<[section: string, screens: Array<Route['name']>]> = [
  ['store', ['store', 'offer', 'bundle', 'piece']],
  ['collection', ['collection', 'weapon', 'skin', 'spray', 'buddy', 'card', 'title']],
  ['alerts', ['alerts', 'stopped']],
  ['account', ['account']],
];

export const section = (name: Route['name']): string | undefined =>
  UNDER.find(([, screens]) => screens.includes(name))?.[0];

/**
 * Whether this screen needs to know what the account already owns.
 *
 * Every collection screen does, and so does the one place outside it that
 * hides what you have: starring something you own is a row that can never
 * fire, because the daily store never offers it back to you. Here rather than
 * in the shell, beside the table it reads, so the two cannot drift.
 */
export const needsOwned = (route: Route): boolean =>
  section(route.name) === 'collection' || (route.name === 'alerts' && route.step === 'add');

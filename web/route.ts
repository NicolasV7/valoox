// Where you are, in the URL rather than in a variable.
//
// It would be shorter to keep the open offer in a useState, and it would also
// break the gesture people actually use on a phone: the back swipe. A route
// costs forty lines and buys back, forward, reload and a link you can send.

import { useEffect, useState } from 'preact/hooks';

export type Route =
  | { name: 'store' }
  | { name: 'offer'; id: string }
  | { name: 'bundle'; id: string }
  | { name: 'piece'; id: string }
  /** The collection's five tabs. The tab is in the URL because it is where you
   *  are, and because the back swipe out of a weapon has to land on the one you
   *  came from rather than on whichever was first. */
  | { name: 'collection'; tab: Tab }
  | { name: 'weapon'; id: string }
  | { name: 'spray'; id: string }
  | { name: 'buddy'; id: string }
  | { name: 'card'; id: string }
  | { name: 'title'; id: string }
  | { name: 'skin'; id: string }
  | { name: 'alerts'; step?: Step }
  /** Arrived from the footer of a message. The token is what names the row:
   *  the phone reading that mail may never have had this app's cookie. */
  | { name: 'stopped'; token: string };

export type Tab = 'weapons' | 'sprays' | 'buddies' | 'cards' | 'titles';

/** The three screens inside the alerts tab that are their own place: setting
 *  an address, carrying its code back, and finding something to watch. */
export type Step = 'channel' | 'code' | 'add';

const STEPS: Step[] = ['channel', 'code', 'add'];

const TABS: Tab[] = ['weapons', 'sprays', 'buddies', 'cards', 'titles'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function parse(path: string, query = location.search): Route {
  const [, head, id] = path.split('/');
  if (head === 'stop') return { name: 'stopped', token: new URLSearchParams(query).get('t') ?? '' };
  // Anything unrecognised is the store. A 404 screen for a typo in a one-column
  // app would be a screen nobody reaches on purpose — and this only holds
  // because the Worker hands every non-/api/ path back as the shell, so a
  // reload of /offer/<uuid> arrives here rather than at its 404.
  if (head === 'offer' && id && UUID.test(id)) return { name: 'offer', id };
  if (head === 'bundle' && id && UUID.test(id)) return { name: 'bundle', id };
  if (head === 'piece' && id && UUID.test(id)) return { name: 'piece', id };
  if (head === 'weapon' && id && UUID.test(id)) return { name: 'weapon', id };
  if (head === 'spray' && id && UUID.test(id)) return { name: 'spray', id };
  if (head === 'buddy' && id && UUID.test(id)) return { name: 'buddy', id };
  if (head === 'card' && id && UUID.test(id)) return { name: 'card', id };
  if (head === 'title' && id && UUID.test(id)) return { name: 'title', id };
  if (head === 'skin' && id && UUID.test(id)) return { name: 'skin', id };
  if (head === 'alerts') {
    const step = STEPS.find((x) => x === id);
    return step ? { name: 'alerts', step } : { name: 'alerts' };
  }
  if (head === 'collection') {
    const tab = TABS.find((t) => t === id) ?? 'weapons';
    return { name: 'collection', tab };
  }
  return { name: 'store' };
}

export const href = (route: Route): string => {
  if (route.name === 'store') return '/';
  if (route.name === 'stopped') return '/stop?t=' + encodeURIComponent(route.token);
  if (route.name === 'alerts') return route.step ? '/alerts/' + route.step : '/alerts';
  if (route.name === 'collection') {
    return route.tab === 'weapons' ? '/collection' : '/collection/' + route.tab;
  }
  return '/' + route.name + '/' + route.id;
};

/** Where the back control on the screen being opened should point, and what it
 *  is called there.
 *
 *  Carried in the history entry rather than in a module variable: a variable
 *  is wrong the moment the page reloads or the swipe brings an entry back, and
 *  this is exactly the state the browser already keeps per entry. A screen
 *  opened without one falls back to the section it belongs to. */
export interface Whence {
  to: Route;
  said: string;
}

export const whence = (): Whence | null => (history.state as Whence | null) ?? null;

// The browser restores the scroll position at popstate, which is before this
// app has rendered the screen being restored — measured: the document is one
// viewport tall at that moment, so a weapon you were two thousand pixels down
// comes back clamped to the top. So we keep the position ourselves, in the
// history entry, and put it back once the screen is on the page.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/** Where the entry being left was scrolled to. Written into it on the way out,
 *  because by the time it comes back the number is gone. */
function mark(): void {
  history.replaceState({ ...(history.state ?? {}), y: scrollY }, '');
}

/** Where the screen that is arriving belongs. Zero for one being opened for
 *  the first time, which has never been anywhere. */
export const wasAt = (): number => (history.state as { y?: number } | null)?.y ?? 0;

const listeners = new Set<(r: Route) => void>();

function announce() {
  const now = parse(location.pathname);
  for (const fn of listeners) fn(now);
}

// Once, here, rather than inside the hook. addEventListener dedupes by
// identity, so two components using the hook registered one handler between
// them — and the first of them to unmount took it away from the other. The
// swipe and the back control then changed the URL and nothing on the screen,
// which is the worst way for a router to fail: it looks like it worked.
addEventListener('popstate', announce);

export function go(route: Route, from?: Whence): void {
  mark();
  // Which screen is behind this one. Not the same question as `from`, which is
  // where a screen says its back control should point — a spray tile sends you
  // somewhere without naming a destination, and the entry behind it is still
  // the wall you tapped it on.
  const came = href(parse(location.pathname));
  history.pushState({ ...(from ?? {}), came }, '', href(route));
  announce();
}

/** The back control's click. Pops when the entry behind us really is the place
 *  being pointed at, so the list comes back at the scroll position you left it
 *  rather than at the top of a new copy of itself. Otherwise — a deep link, a
 *  reload — it is an ordinary navigation. */
export function retreat(to: Route) {
  return (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const back = (history.state as { came?: string } | null)?.came;
    if (back === href(to)) history.back();
    else go(to);
  };
}

/** The top of the alerts tab. Named here rather than in the back control's
 *  own list, because it is a route and the three screens that point at it are
 *  not all back controls. */
export const ALERTS: Route = { name: 'alerts' };

export function useRoute(): Route {
  const [route, set] = useState<Route>(() => parse(location.pathname));
  useEffect(() => {
    listeners.add(set);
    return () => {
      listeners.delete(set);
    };
  }, []);
  return route;
}

/** For an `<a>` that should route instead of reloading the page. Keeps the real
 *  href, so middle-click and "open in new tab" still work. */
export function intercept(route: Route, from?: Whence) {
  return (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(route, from);
  };
}

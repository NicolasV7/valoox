// Where you are, in the URL rather than in a variable.
//
// It would be shorter to keep the open offer in a useState, and it would also
// break the gesture people actually use on a phone: the back swipe. A route
// costs forty lines and buys back, forward, reload and a link you can send.

import { useEffect, useState } from 'preact/hooks';

export type Route =
  | { name: 'store' }
  | { name: 'offer'; id: string }
  | { name: 'bundle'; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function parse(path: string): Route {
  const [, head, id] = path.split('/');
  // Anything unrecognised is the store. A 404 screen for a typo in a one-column
  // app would be a screen nobody reaches on purpose — and this only holds
  // because the Worker hands every non-/api/ path back as the shell, so a
  // reload of /offer/<uuid> arrives here rather than at its 404.
  if (head === 'offer' && id && UUID.test(id)) return { name: 'offer', id };
  if (head === 'bundle' && id && UUID.test(id)) return { name: 'bundle', id };
  return { name: 'store' };
}

export const href = (route: Route): string =>
  route.name === 'store' ? '/' : '/' + route.name + '/' + route.id;

const listeners = new Set<(r: Route) => void>();

function announce() {
  const now = parse(location.pathname);
  for (const fn of listeners) fn(now);
}

export function go(route: Route): void {
  history.pushState(null, '', href(route));
  announce();
  scrollTo(0, 0);
}

export function back(): void {
  // Straight into the app rather than out of it: a deep link opened from a
  // message has nothing behind it, and leaving the site is not what the back
  // link on a screen means.
  if (history.length > 1) history.back();
  else go({ name: 'store' });
}

export function useRoute(): Route {
  const [route, set] = useState<Route>(() => parse(location.pathname));
  useEffect(() => {
    listeners.add(set);
    addEventListener('popstate', announce);
    return () => {
      listeners.delete(set);
      removeEventListener('popstate', announce);
    };
  }, []);
  return route;
}

/** For an `<a>` that should route instead of reloading the page. Keeps the real
 *  href, so middle-click and "open in new tab" still work. */
export function intercept(route: Route) {
  return (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(route);
  };
}

// Handing the sign-in link to Riot Mobile without losing this page.
//
// The code points at qrlogin.riotgames.com, and the app claims every path on
// that host on both platforms — its apple-app-site-association and its
// assetlinks.json both say so — which is why a tap normally never reaches the
// web at all. The page behind it is a 500ms bounce to the app store, and
// landing there costs the tab that was polling for the approval.
//
// Android is where that happens. Chrome asks whether to open the app, and
// Cancel there means "load the page", which is the store. An intent: URL
// carries the same address to the same package and adds the one thing a plain
// link cannot say: where to go when the answer is no.
//
// iOS needs none of it. A tapped universal link with the app installed opens
// the app and nothing navigates, so the https url is already the right answer.

/** Riot Mobile, named by the assetlinks.json on the host the code points at. */
const RIOT_MOBILE = 'com.riotgames.mobile.leagueconnect';

export function appLink(url: string): string {
  if (!/android/i.test(navigator.userAgent)) return url;

  const { host, pathname, search } = new URL(url);
  // Back to this exact page, plus a '#'. A fragment is a same-document
  // navigation, so Cancel leaves the code on screen and the poll running
  // instead of reloading the app and spending the code for nothing.
  const here = location.href.split('#')[0] + '#';

  return (
    'intent://' +
    host +
    pathname +
    search +
    '#Intent;scheme=https;package=' +
    RIOT_MOBILE +
    ';S.browser_fallback_url=' +
    encodeURIComponent(here) +
    ';end'
  );
}

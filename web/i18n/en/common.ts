export const common = {
  nav: {
    store: 'Store',
    collection: 'Collection',
    alerts: 'Alerts',
    account: 'Account',
  },

  back: 'Back',
  close: 'Close',
  retry: 'Try again',

  // Riot bills in three currencies and shows all three. KC is the accessory
  // store's, and it is the one people have never heard of.
  vp: 'VP',
  radianite: 'Radianite',
  kc: 'Kingdom Credits',

  // What a piece IS, when its name does not say so. "Dragon" inside a bundle is
  // a card, a spray or a title and the name gives you nothing.
  kind: {
    skin: 'Skin',
    buddy: 'Gun buddy',
    spray: 'Spray',
    card: 'Player card',
    title: 'Player title',
  },

  tier: {
    select: 'Select',
    deluxe: 'Deluxe',
    premium: 'Premium',
    exclusive: 'Exclusive',
    ultra: 'Ultra',
  },

  owned: 'Yours',
  notOwned: 'Not yours',
  equipped: 'Equipped',

  // What a failure is allowed to say. The server throws messages meant for a
  // log — `storefront 403`, `sealed blob did not open` — and none of them reach
  // a person. The client decides which of these three it was.
  error: {
    expired: 'Your session expired at Riot',
    expiredWhy:
      'Nothing went wrong here. Riot ends a session after a while, and after a ' +
      'password change or a sign-out-everywhere it ends immediately. Scan again ' +
      'and everything is back.',
    riot: 'Riot did not answer',
    riotWhy:
      'Maintenance, or a slow few minutes. What we hold is untouched and there ' +
      'is nothing to redo.',
    us: 'Something broke on our side',
    usWhy: 'Not your account and not your session. Try again in a minute.',
    status: (code: number) => `Status ${code}`,
    scanAgain: 'Scan again',
  },

  loading: 'Loading…',
  waitingCatalogue: 'Waiting for the catalogue…',

  riotNotice:
    'Not affiliated with Riot Games. VALORANT, its artwork and its marks belong to Riot Games, Inc.',
};

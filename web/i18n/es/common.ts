export const common = {
  nav: {
    store: 'Tienda',
    collection: 'Colección',
    alerts: 'Avisos',
    account: 'Cuenta',
  },

  back: 'Volver',
  close: 'Cerrar',
  retry: 'Reintentar',

  // Riot bills in three currencies and shows all three. KC is the accessory
  // store's, and it is the one people have never heard of.
  vp: 'VP',
  radianite: 'Radianite',
  kc: 'Kingdom Credits',

  // What a piece IS, when its name does not say so. "Dragon" inside a bundle is
  // a card, a spray or a title and the name gives you nothing.
  kind: {
    skin: 'Skin',
    buddy: 'Amuleto',
    spray: 'Grafiti',
    card: 'Tarjeta',
    title: 'Título',
  },

  tier: {
    select: 'Select',
    deluxe: 'Deluxe',
    premium: 'Premium',
    exclusive: 'Exclusive',
    ultra: 'Ultra',
  },

  // One pair for every kind of thing, so it carries no gender: this chip sits
  // on a grafiti and a título as often as on a tarjeta.
  owned: 'Ya lo tienes',
  notOwned: 'No lo tienes',
  equipped: 'En uso',

  // What a failure is allowed to say. The server throws messages meant for a
  // log — `storefront 403`, `sealed blob did not open` — and none of them reach
  // a person. The client decides which of these three it was.
  error: {
    expired: 'Tu sesión venció en Riot',
    expiredWhy:
      'Aquí no pasó nada malo. Riot termina una sesión pasado un tiempo, y al ' +
      'instante tras un cambio de contraseña o un cierre en todos lados. Escanea ' +
      'otra vez y vuelve todo.',
    riot: 'Riot no contestó',
    riotWhy: 'Puede ser mantenimiento, o unos minutos lentos. Lo que guardamos sigue intacto.',
    us: 'Algo se rompió de este lado',
    usWhy: 'No es tu cuenta ni tu sesión. Prueba otra vez en un minuto.',
    status: (code: number) => `Código ${code}`,
    scanAgain: 'Escanear otra vez',
  },

  loading: 'Cargando…',
  waitingCatalogue: 'Esperando el catálogo…',

  riotNotice: 'Sin relación con Riot Games. VALORANT, su arte y sus marcas son de Riot Games, Inc.',
};

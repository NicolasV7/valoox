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

  owned: 'Ya es tuya',
  notOwned: 'No es tuya',
  equipped: 'Equipada',

  // What a failure is allowed to say. The server throws messages meant for a
  // log — `storefront 403`, `sealed blob did not open` — and none of them reach
  // a person. The client decides which of these three it was.
  error: {
    expired: 'Tu sesión venció en Riot',
    expiredWhy:
      'No pasó nada acá. Riot termina una sesión cada tanto, y después de un ' +
      'cambio de contraseña o un cierre en todos los dispositivos la termina al ' +
      'instante. Escaneá de nuevo y vuelve todo.',
    riot: 'Riot no contestó',
    riotWhy:
      'Puede ser un mantenimiento o un rato de lentitud. Lo que guardamos sigue ' +
      'intacto; no hay nada que rehacer.',
    us: 'Algo se rompió de este lado',
    usWhy: 'No es tu cuenta ni tu sesión. Probá de nuevo en un minuto.',
    status: (code: number) => `Código ${code}`,
    scanAgain: 'Escanear de nuevo',
  },

  loading: 'Cargando…',
  waitingCatalogue: 'Esperando el catálogo…',

  riotNotice: 'Sin relación con Riot Games. VALORANT, su arte y sus marcas son de Riot Games, Inc.',
};

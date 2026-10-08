export const store = {
  daily: 'Ofertas del día',
  bundle: 'Bundle',
  accessories: 'Accesorios',
  night: 'Mercado nocturno',

  /** The one line that is the whole reason somebody opened this. */
  hit: (name: string) => `${name} está hoy.`,
  hits: (n: number) => `${n} de tus marcadas están hoy.`,

  rank: (tier: string, rr: number) => `${tier} · ${rr} RR`,
  unranked: 'Sin rango',

  /** A countdown. The `d` is days; under a day it is dropped entirely, because
   *  `0d 07:12:44` reads as broken. */
  days: (n: number) => `${n}d`,

  discount: (percent: number) => `−${percent}%`,
  allOwned: 'Ya lo tenés completo',

  empty: 'Riot no devolvió nada para esta cuenta.',
  emptyWhy:
    'Es raro y seguramente no sea cierto. Si tenés skins en el juego, el error ' +
    'es nuestro, no una colección vacía.',

  disconnect: 'Desconectar',
  notice:
    'valoox no tiene relación con Riot Games. VALORANT, su arte y sus marcas ' +
    'son de Riot; los precios y las rotaciones salen de tu propia cuenta.',
};

export const offer = {
  watch: 'Ver el clip de Riot',
  levelNo: (n: number) => `Nivel ${n}`,
  levels: 'Niveles',
  levelsOf: (have: number, all: number) => `${have} de ${all}`,
  variants: 'Variantes',
  starred: 'Marcada',
  star: 'Marcar',
  unstar: 'Dejar de marcar',

  level: {
    base: 'Base',
    vfx: 'VFX',
    anim: 'Anim',
    finisher: 'Finisher',
  },

  /** Riot hosts one clip per level and they are large. We link theirs instead
   *  of keeping copies, which is also the honest thing to say about it. */
  clips:
    'El clip es de Riot y está en su servidor: pesan 13 MB cada uno, así que ' +
    'enlazamos el suyo en vez de guardar copias. Los niveles y las variantes ' +
    'llegan con la colección — una skin de nivel no sabe de qué skin es, y el ' +
    'único camino hacia arriba es el índice que la colección trae igual.',
};

// The bundle, opened. Riot sends between four and ten pieces and each carries
// its own price, so the screen says where every number came from.
export const bundle = {
  pieces: (n: number) => `${n} piezas`,
  tier: (name: string) => `Tier ${name}`,
  contents: 'Qué trae',

  full: (n: number) => `${n} piezas a precio de lista`,
  cut: 'Descuento dentro del bundle',
  total: 'Precio del bundle',

  perItem:
    'Cada pieza trae su propio precio: Riot le pone a cada ítem del bundle un ' +
    'BasePrice y un DiscountedPrice, accesorios incluidos, así que el descuento ' +
    'se aplica por ítem y no como un número sobre el total.',
  read:
    'Leído, no estimado: cada fila de arriba es un BasePrice y un ' +
    'DiscountedPrice tal como vienen en el storefront, y los totales son su ' +
    'TotalBaseCost y su TotalDiscountedCost. La tienda diaria es el único lugar ' +
    'donde un precio se deduce acá, del tier, porque esa oferta trae solo un costo.',

  gone: 'Este bundle ya no está en tu tienda.',
};

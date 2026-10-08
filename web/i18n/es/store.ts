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
    'Los dos bloques desaparecen en una skin que no tiene ninguno: 857 del ' +
    'catálogo tienen un solo nivel y 880 no tienen variantes. Riot aloja un ' +
    'clip por nivel; enlazamos el suyo en vez de guardar copias, pesan 13 MB ' +
    'cada uno.',
};

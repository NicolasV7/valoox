// Los amuletos: la pestaña y uno abierto. Un amuleto es cuadrado igual que un
// grafiti, así que usa la misma grilla; lo que cambia es la línea de abajo.

export const buddies = {
  /** Instancias, no amuletos distintos: Riot los entrega por instancia, así
   *  que este número es más grande que la cantidad de celdas. */
  of: (have: number, all: number) => `${have} de ${all} amuletos`,

  /** De qué arma cuelga. */
  on: (gun: string) => `en tu ${gun.toLowerCase()}`,
  onMany: (n: number) => `en ${n} armas`,

  search: (n: number) => `Buscar entre ${n} amuletos`,
  nothing: 'Ninguno coincide con eso.',

  yours: 'Tuyos',
  notYours: 'No son tuyos',

  grid:
    'Un amuleto también es cuadrado, así que usa la grilla de los grafitis en ' +
    'lugar de ganarse una segunda. Lo que cambia es la línea de abajo: un ' +
    'amuleto va colgado de un arma y no de una ranura, así que dice qué arma lo ' +
    'está llevando. Están los del juego entero, no solo los tuyos.',
  instances: (have: number, kinds: number) =>
    `El número de arriba son ${have} instancias y acá abajo hay ${kinds} ` +
    `amuletos distintos. Riot los cobra por instancia: podés tener cuatro del ` +
    `mismo y colgarlos de cuatro armas.`,

  // --- mientras no llegó el catálogo ---------------------------------------
  waitingWhy:
    'Las pestañas están dibujadas de verdad porque no necesitan datos. Todo lo ' +
    'de abajo espera el catálogo de amuletos: un solo fetch a valorant-api que ' +
    'el navegador se queda, así que esta pantalla es de la primera visita. Las ' +
    'celdas ya son cuadradas, que es todo el trabajo de un esqueleto.',

  // --- uno abierto ---------------------------------------------------------
  colourFrom: 'De dónde sale el color',
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), medido de este amuleto igual que el del grafiti. Un amuleto ` +
    `es chico y casi todo contorno, así que la lectura pesa los píxeles vivos ` +
    `por encima de los planos — el tono es una media pesada por croma sobre los ` +
    `que pasan el 12% de alfa, y la saturación sale del percentil 88. Sin eso ` +
    `todos los amuletos del juego promedian al mismo gris y la página deja de ` +
    `distinguirlos.`,

  many: 'Uno solo, muchas instancias',
  manyWhy: (n: number) =>
    `Riot entrega los amuletos por instancia: tenés ${n} de este, y cada una es ` +
    `un id distinto que puede colgar de un arma distinta. La colección los ` +
    `agrupa por amuleto y nombra las armas, porque una lista con la misma foto ` +
    `cuatro veces no es una lista.`,
};

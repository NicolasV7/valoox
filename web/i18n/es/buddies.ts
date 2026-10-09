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

  // La grilla de los grafitis, reusada en lugar de ganarse una segunda. Lo
  // único que un amuleto no comparte es la línea de abajo, así que esta nota
  // dice eso y el cierre que llevan las cuatro pestañas, nada más.
  grid:
    'Un amuleto también es cuadrado, así que usa la grilla de los grafitis. La ' +
    'línea de abajo dice de qué arma cuelga. Están todos los del juego, no solo los tuyos.',
  instances: (have: number, kinds: number) =>
    `El número de arriba son ${have} instancias y aquí abajo hay ${kinds} ` +
    `amuletos distintos. Riot los cobra por instancia.`,

  // --- mientras no llegó el catálogo ---------------------------------------
  waitingWhy:
    'Esperando el catálogo de amuletos: un solo fetch que el navegador guarda, ' +
    'así que esta pantalla es solo de la primera visita.',

  // --- uno abierto ---------------------------------------------------------
  colourFrom: 'De dónde sale el color',
  // Misma lectura que la del grafiti (design/hsv.ts). Sin pesar los píxeles
  // vivos, todos los amuletos del juego promedian al mismo gris.
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), medido de este amuleto. Un amuleto es chico y casi todo ` +
    `contorno, así que la lectura pesa los píxeles vivos por encima de los planos.`,

  many: 'Uno solo, muchas instancias',
  manyWhy: (n: number) =>
    `Riot entrega los amuletos por instancia: tienes ${n} de este, y cada uno ` +
    `es un id distinto que puede colgar de un arma distinta.`,
};

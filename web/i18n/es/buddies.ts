// Buddies: the tab, and one opened. A buddy is square like a spray, so it uses
// the same grid; what changes is the line underneath.

export const buddies = {
  /** Instances, not distinct buddies: Riot hands them out by instance, so this
   *  number is larger than the number of cells. */
  of: (have: number, all: number) => `${have} de ${all} amuletos`,

  /** Which gun it hangs off. */
  on: (gun: string) => `en tu ${gun.toLowerCase()}`,
  onMany: (n: number) => `en ${n} armas`,

  search: (n: number) => `Buscar entre ${n} amuletos`,
  nothing: 'Ninguno coincide con eso.',

  yours: 'Tuyos',
  notYours: 'No son tuyos',

  // The spray grid, borrowed outright rather than earning a second one. The
  // line underneath is the only thing a buddy does not share, so that and the
  // closing line every tab carries are all this note says.
  grid:
    'Un amuleto también es cuadrado, así que usa la grilla de los grafitis. La ' +
    'línea de abajo dice de qué arma cuelga. Están todos los del juego, no solo los tuyos.',
  instances: (have: number, kinds: number) =>
    `El número de arriba son ${have} instancias y aquí abajo hay ${kinds} ` +
    `amuletos distintos. Riot los cobra por instancia.`,

  // --- before the catalogue lands ------------------------------------------
  waitingWhy:
    'Esperando el catálogo de amuletos: un solo fetch que el navegador guarda, ' +
    'así que esta pantalla es solo de la primera visita.',

  // --- one opened ----------------------------------------------------------
  colourFrom: 'De dónde sale el color',
  // The same reading as the spray's (design/hsv.ts). Without weighting the
  // vivid pixels, every buddy in the game averages to the same grey.
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), medido de este amuleto. Un amuleto es chico y casi todo ` +
    `contorno, así que la lectura pesa los píxeles vivos por encima de los planos.`,

  many: 'Uno solo, muchas instancias',
  manyWhy: (n: number) =>
    `Riot entrega los amuletos por instancia: tienes ${n} de este, y cada uno ` +
    `es un id distinto que puede colgar de un arma distinta.`,
};

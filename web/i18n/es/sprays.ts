// Sprays: the tab, and one opened. A spray is square, so this is a grid rather
// than the slot board the weapons get.

export const sprays = {
  of: (have: number, all: number) => `${have} de ${all} grafitis`,

  /** Which slot on the wheel it sits in. All four read the same way: being on
   *  the wheel is what equipped means, and "equipped" beside "slot 3" is two
   *  words for one fact. */
  slot: (n: number) => `ranura ${n}`,

  search: (n: number) => `Buscar entre ${n} grafitis`,
  nothing: 'Ninguno coincide con eso.',

  yours: 'Tuyos',
  notYours: 'No son tuyos',

  // Each tile is washed in the measured colour of its own art, which is the
  // only way a wall of squares stays readable. That is visible on screen, so
  // it is not said here: colourWhy explains it once, below.
  grid: 'Tus grafitis siguen visibles. Las recompensas conocidas que no tienes están ocultas.',
  /** The wheel has four slots and one can be empty: Riot has a spray called
   *  "None" and that is what comes back when nothing is in it. */
  wheel: (on: number, rest: number) =>
    `${on} equipados en la rueda, hasta cuatro. ${rest} tuyos fuera de la rueda.`,

  // --- before the catalogue lands ------------------------------------------
  waitingWhy:
    'Esperando el catálogo de grafitis: un solo fetch que el navegador guarda, ' +
    'así que esta pantalla es solo de la primera visita.',

  // --- one opened ----------------------------------------------------------
  colourFrom: 'De dónde sale el color',
  // The hue is a chroma-weighted mean over the pixels above 12% alpha and the
  // saturation comes from the 88th percentile — ALPHA_FLOOR and VIVID in
  // design/hsv.ts. The estimator is ours, not the reader's.
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), medido del dibujo y no elegido: el navegador lee los píxeles ` +
    `de la imagen en un canvas de 96px.`,

  canSay: 'Qué podemos decir de él',
  canSayWhy:
    'Que es tuyo, y en cuál de las cuatro ranuras de la rueda está. No cuántas ' +
    'veces lo usaste: Riot no lo publica.',

  moves: 'Este se anima en el juego y lo que ves son los cuadros que publica Riot.',
};

// Los grafitis: la pestaña y uno abierto. Un grafiti es cuadrado, así que es
// una grilla y no el tablero de ranuras que tienen las armas.

export const sprays = {
  of: (have: number, all: number) => `${have} de ${all} grafitis`,

  /** Qué ranura de la rueda ocupa. Las cuatro se dicen igual: estar en la
   *  rueda ya es estar equipado, y "equipado" al lado de "ranura 3" son dos
   *  palabras para lo mismo. */
  slot: (n: number) => `ranura ${n}`,

  search: (n: number) => `Buscar entre ${n} grafitis`,
  nothing: 'Ninguno coincide con eso.',

  yours: 'Tuyos',
  notYours: 'No son tuyos',

  // El lavado de cada celda es el color medido de su propio dibujo, que es lo
  // único que mantiene legible una pared de cuadrados. Se ve en pantalla, así
  // que no hace falta decirlo aquí: colourWhy lo explica una sola vez, abajo.
  grid:
    'Un grafiti es cuadrado, así que aquí hay una grilla y no el tablero de ' +
    'ranuras de las armas. Están todos los del juego, no solo los tuyos.',
  /** La rueda tiene cuatro ranuras y una puede estar vacía: Riot tiene un
   *  grafiti llamado "None" y eso es lo que envía cuando no hay nada puesto. */
  wheel: (on: number, rest: number) =>
    `${on} están en la rueda ahora mismo, uno por ranura y hasta cuatro. Los ` +
    `otros ${rest} son tuyos, fuera de la rueda.`,

  // --- mientras no llegó el catálogo ---------------------------------------
  waitingWhy:
    'Esperando el catálogo de grafitis: un solo fetch que el navegador guarda, ' +
    'así que esta pantalla es solo de la primera visita.',

  // --- uno abierto ---------------------------------------------------------
  colourFrom: 'De dónde sale el color',
  // El tono es una media pesada por croma sobre los píxeles con más de 12% de
  // alfa y la saturación sale del percentil 88 — ALPHA_FLOOR y VIVID en
  // design/hsv.ts. El estimador es nuestro, no del que mira un grafiti.
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), medido del dibujo y no elegido: el navegador lee los píxeles ` +
    `de la imagen en un canvas de 96px.`,

  canSay: 'Qué podemos decir de él',
  canSayWhy:
    'Que es tuyo, y en cuál de las cuatro ranuras de la rueda está. No cuántas ' +
    'veces lo usaste: Riot no lo publica.',

  moves: 'Este se anima en el juego y lo que ves son los cuadros que publica Riot.',
};

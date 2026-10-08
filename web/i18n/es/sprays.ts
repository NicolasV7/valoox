// Los grafitis: la pestaña y uno abierto. Un grafiti es cuadrado, así que es
// una grilla y no el tablero de ranuras que tienen las armas.

export const sprays = {
  of: (have: number, all: number) => `${have} de ${all} grafitis`,

  /** Qué ranura de la rueda ocupa. La primera se dice distinto porque es la
   *  que sale sin elegir nada. */
  slot: (n: number) => `ranura ${n}`,

  grid:
    'Un grafiti es cuadrado, así que acá hay una grilla y no el tablero de ' +
    'ranuras que tienen las armas. Cada celda va lavada en el color de su ' +
    'propio dibujo — el Reaver sale índigo, el Sovereign celeste hielo — que es ' +
    'lo único que mantiene legible una pared de cuadrados.',
  /** La rueda tiene cuatro ranuras y una puede estar vacía: Riot tiene un
   *  grafiti llamado «None» y eso es lo que manda cuando no hay nada puesto. */
  wheel: (on: number, rest: number) =>
    `${on} están en la rueda ahora mismo, uno por ranura y hasta cuatro. Los ` +
    `otros ${rest} de acá son solo tuyos.`,

  // --- mientras no llegó el catálogo ---------------------------------------
  waitingWhy:
    'Las pestañas están dibujadas de verdad porque no necesitan datos. Todo lo ' +
    'de abajo espera el catálogo de grafitis: un solo fetch a valorant-api que ' +
    'el navegador se queda, así que esta pantalla es de la primera visita. Las ' +
    'celdas ya son cuadradas, que es todo el trabajo de un esqueleto.',

  // --- uno abierto ---------------------------------------------------------
  colourFrom: 'De dónde sale el color',
  colourWhy: (rgb: string) =>
    `rgb(${rgb}). No es un promedio: un promedio plano sobre un dibujo sale ` +
    `siempre embarrado, porque el contorno, el brillo y el margen transparente ` +
    `tiran todos hacia el gris. El tono es una media pesada por croma sobre los ` +
    `píxeles con más de 12% de alfa, y la saturación sale del percentil 88 — su ` +
    `extremo vivo — en lugar de la media. El navegador lo mide dibujando la ` +
    `imagen en un canvas de 96px y leyendo los píxeles de vuelta, que ` +
    `valorant-api permite porque manda la cabecera CORS.`,

  canSay: 'Qué podemos decir de él',
  canSayWhy:
    'Que es tuyo, y en cuál de las cuatro ranuras de la rueda está. No cuántas ' +
    'veces lo usaste: Riot no lo publica, y un número que nadie puede verificar ' +
    'es peor que ningún número.',

  moves: 'Este se anima en el juego y lo que ves son los cuadros que publica Riot.',
};

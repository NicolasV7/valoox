// Los títulos: la pestaña y uno abierto. La única parte de la app sin arte.

export const titles = {
  of: (have: number, all: number) => `${have} de ${all} títulos`,

  search: (n: number) => `Buscar entre ${n} títulos`,
  nothing: 'Ninguno coincide con eso.',

  yours: 'Tuyos',
  notYours: 'No son tuyos',

  noArt:
    'La única pestaña sin una sola imagen. Un título es un texto, así que lleva ' +
    'tipografía, el banderín con el que el juego lo dibuja, y el único degradado ' +
    'gris de la app: inventarle un color acá sería inventar un dato. Es una ' +
    'lista y no una grilla porque lo que se compara son palabras.',

  waitingWhy:
    'Las pestañas están dibujadas de verdad porque no necesitan datos. Todo lo ' +
    'de abajo espera el catálogo de títulos, que es el más chico de los cuatro ' +
    'y sigue siendo un fetch que el navegador se queda.',

  none: 'Un título no tiene arte',
  noneWhy: (n: number) =>
    `${n} de ellos y ni una imagen entre todos: un título es un texto que el ` +
    `juego imprime al lado de tu nombre. Por eso esta pantalla lleva el ` +
    `banderín con el que lo dibuja, la tipografía al tamaño que usa, y el único ` +
    `degradado gris de la app. Darle un color sería inventárselo.`,

  inMatch: 'Cómo se ve en una partida',
  inMatchWhy:
    'Riot lo dibuja dentro de un corchete después de tu nombre en el marcador. ' +
    'Acá mostramos el texto y el marco y nos detenemos: dibujar un marcador ' +
    'falso alrededor sería disfrazar un dato de captura de pantalla.',
};

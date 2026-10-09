// Los títulos: la pestaña y uno abierto. La única parte de la app sin arte.

export const titles = {
  of: (have: number, all: number) => `${have} de ${all} títulos`,

  search: (n: number) => `Buscar entre ${n} títulos`,
  nothing: 'Ninguno coincide con eso.',

  yours: 'Tuyos',
  notYours: 'No son tuyos',

  // El banderín y el único degradado gris de la app están a la vista en el
  // título abierto, así que no se nombran. Esta nota dice la forma —por qué es
  // una lista y no una grilla— y el cierre que llevan las cuatro pestañas.
  noArt:
    'Un título es un texto, así que es una lista y no una grilla: lo que se ' +
    'compara son palabras. Están todos los del juego, no solo los tuyos.',

  waitingWhy:
    'Esperando el catálogo de títulos: un solo fetch que el navegador guarda, ' +
    'así que esta pantalla es solo de la primera visita.',

  none: 'Un título no tiene arte',
  noneWhy: (n: number) =>
    `${n} títulos y ni una imagen entre todos: un título es un texto que el ` +
    `juego imprime al lado de tu nombre. Darle un color sería inventárselo.`,

  inMatch: 'Cómo se ve en una partida',
  inMatchWhy:
    'Riot lo dibuja entre corchetes después de tu nombre en el marcador. Aquí ' +
    'mostramos el texto y el marco, nada más.',
};

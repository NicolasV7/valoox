// Las tarjetas: la pestaña y una abierta. Dos columnas, no tres.

export const cards = {
  of: (have: number, all: number) => `${have} de ${all} tarjetas`,

  search: (n: number) => `Buscar entre ${n} tarjetas`,
  nothing: 'Ninguna coincide con eso.',

  yours: 'Tuyas',
  notYours: 'No son tuyas',

  grid:
    'Dos columnas, no tres: una tarjeta es un retrato 2:5 y a un tercio del ' +
    'ancho deja de ser una imagen. La celda recorta el arte alto en vez de ' +
    'achicarlo — una tarjeta que no se puede mirar no es una tarjeta — y el ' +
    'lavado de atrás sigue siendo el color medido de esa misma pintura, que es ' +
    'lo que se ve en los bordes del recorte. Están las del juego entero.',

  waitingWhy:
    'Las pestañas están dibujadas de verdad porque no necesitan datos. Todo lo ' +
    'de abajo espera el catálogo de tarjetas: un solo fetch a valorant-api que ' +
    'el navegador se queda, así que esta pantalla es de la primera visita.',

  crops: 'Tres recortes, una tarjeta',
  cropsWhy:
    'Riot manda cada tarjeta tres veces: un cuadrado para una grilla, una ' +
    'banda para el marcador de la partida, y esta pintura alta para el perfil. ' +
    'Son recortes, no escalas — el alto tiene detalle que el cuadrado no ' +
    'muestra nunca. La grilla de atrás usa el cuadrado y esta pantalla usa el ' +
    'alto: la misma pertenencia, tres archivos.',

  colourFrom: 'De dónde sale el color',
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), medido del recorte cuadrado — el mismo que mide la grilla, ` +
    `así que el lavado es el mismo color en las dos pantallas. El tono es una ` +
    `media pesada por croma sobre los píxeles con más de 12% de alfa y la ` +
    `saturación sale del percentil 88, no de la media. Una tarjeta suele salir ` +
    `de un color que no es el que uno adivinaría, y ese es el argumento para ` +
    `medirlo en lugar de elegirlo.`,
};

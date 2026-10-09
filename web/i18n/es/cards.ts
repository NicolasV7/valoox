// Las tarjetas: la pestaña y una abierta. Dos columnas, no tres.

export const cards = {
  of: (have: number, all: number) => `${have} de ${all} tarjetas`,

  search: (n: number) => `Buscar entre ${n} tarjetas`,
  nothing: 'Ninguna coincide con eso.',

  yours: 'Tuyas',
  notYours: 'No son tuyas',

  // La celda recorta el arte alto en vez de reducirlo, y el lavado de atrás es
  // el color medido de esa misma pintura. Las dos cosas están a la vista: lo
  // que no se ve es por qué hay dos columnas, y eso es lo único que se agrega.
  grid:
    'Dos columnas, no tres: una tarjeta es un retrato 2:5 y a un tercio del ' +
    'ancho deja de ser una imagen. Están todas las del juego, no solo las tuyas.',

  waitingWhy:
    'Esperando el catálogo de tarjetas: un solo fetch que el navegador guarda, ' +
    'así que esta pantalla es solo de la primera visita.',

  crops: 'Tres recortes, una tarjeta',
  // Dónde se encuentra cada uno lo dice la etiqueta debajo del recorte, en
  // piece.wideWhere y piece.smallWhere. Decirlo otra vez aquí era decirlo dos
  // veces con palabras distintas.
  cropsWhy:
    'Riot envía cada tarjeta tres veces y son recortes, no escalas: el alto ' +
    'tiene detalle que el cuadrado no muestra nunca.',

  colourFrom: 'De dónde sale el color',
  // Media pesada por croma sobre los píxeles con más de 12% de alfa, y la
  // saturación del percentil 88 — design/hsv.ts. El estimador es nuestro.
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), medido del recorte cuadrado — el mismo que mide la grilla, ` +
    `así que el lavado es el mismo color en las dos pantallas.`,
};

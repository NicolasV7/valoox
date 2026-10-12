// Player cards: the tab, and one opened. Two columns, not three.

export const cards = {
  of: (have: number, all: number) => `${have} de ${all} tarjetas`,

  search: (n: number) => `Buscar entre ${n} tarjetas`,
  nothing: 'Ninguna coincide con eso.',

  yours: 'Tuyas',
  notYours: 'No son tuyas',

  // The tile crops the tall art rather than shrinking it, and the wash behind
  // it is that painting's own measured colour. Both are on screen already;
  // what is not visible is why there are two columns, so that is all it adds.
  grid: 'Tus tarjetas siguen visibles. Las recompensas conocidas que no tienes están ocultas.',

  waitingWhy:
    'Esperando el catálogo de tarjetas: un solo fetch que el navegador guarda, ' +
    'así que esta pantalla es solo de la primera visita.',

  crops: 'Tres recortes, una tarjeta',
  // Where each one turns up is the label under the crop itself, in
  // piece.wideWhere and piece.smallWhere. Saying it here too was saying it
  // twice in two different sets of words.
  cropsWhy:
    'Riot envía cada tarjeta tres veces y son recortes, no escalas: el alto ' +
    'tiene detalle que el cuadrado no muestra nunca.',

  colourFrom: 'De dónde sale el color',
  // Chroma-weighted mean over the pixels above 12% alpha, saturation from the
  // 88th percentile — design/hsv.ts. The estimator is ours, not the reader's.
  colourWhy: (rgb: string) =>
    `rgb(${rgb}), medido del recorte cuadrado — el mismo que mide la grilla, ` +
    `así que el lavado es el mismo color en las dos pantallas.`,
};

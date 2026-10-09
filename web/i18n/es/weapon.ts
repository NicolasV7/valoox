// Una ranura, abierta: todas las skins que el juego tiene para esa arma, las
// que son tuyas separadas de las que no. Los huecos son la mitad de lo que una
// colección cuenta.

export const weapon = {
  /** Cuántas tienes de cuántas hay. Solo cuentan las que tienen tier: la
   *  estándar viene con el arma y no es una skin que se pueda tener o no. */
  of: (have: number, all: number) => `${have} de ${all}`,

  search: (n: number, gun: string) => `Buscar entre ${n} skins de ${gun}`,
  // El filtro corre sobre la lista que ya está en memoria; el Worker no la ve.
  searchWhy: (n: number) =>
    `Nombre, tema o tier. Las ${n} ya están en el navegador, así que buscar no ` +
    `vuelve al Worker.`,
  nothing: 'Ninguna coincide con eso.',

  alsoYours: 'También tuyas',
  notYours: 'No son tuyas',

  levels: (n: number) => (n === 1 ? '1 nivel' : `${n} niveles`),
  variants: (n: number) => (n === 1 ? '1 variante' : `${n} variantes`),

  // Ninguna fila muestra precio, sea tuya o no: esta pantalla es la colección y
  // no la tienda, así que la copia no habla de ninguno.
  weave: 'La trama detrás de cada fila lleva el color de esa skin, medido del render y no elegido.',

  // --- mientras no llega el catálogo ---------------------------------------
  waitingWhy: 'Riot ya contestó con los ids; falta el catálogo que les pone nombre y render.',
};

// Una ranura, abierta: todas las skins que el juego tiene para esa arma, las
// que son tuyas separadas de las que no. Los huecos son la mitad de lo que una
// colección cuenta.

export const weapon = {
  /** Cuántas tenés de cuántas hay. Solo cuentan las que tienen tier: la
   *  estándar viene con el arma y no es una skin que se pueda tener o no. */
  of: (have: number, all: number) => `${have} de ${all}`,

  search: (n: number, gun: string) => `Buscar entre ${n} skins de ${gun}`,
  searchWhy: (n: number) =>
    `Nombre, tema o tier. Las ${n} ya están en el navegador, así que la lista se ` +
    `achica mientras escribís y nada vuelve al Worker por eso.`,
  nothing: 'Ninguna coincide con eso.',

  alsoYours: 'También tuyas',
  notYours: 'No son tuyas',

  levels: (n: number) => (n === 1 ? '1 nivel' : `${n} niveles`),
  variants: (n: number) => (n === 1 ? '1 variante' : `${n} variantes`),

  weave:
    'Cada fila lleva la trama que la tienda pone detrás de un arma, lavada en el ' +
    'color de esa skin — medido del render, no elegido. Las que ya son tuyas no ' +
    'muestran precio: una skin que ya tenés no cuesta nada, así que la fila ' +
    'muestra a dónde lleva.',

  // --- mientras no llegó el catálogo ---------------------------------------
  waitingWhy:
    'Los ids ya los contestó Riot; lo que falta es el catálogo que les pone ' +
    'nombre y render. Es un solo fetch que el navegador se queda, así que la ' +
    'segunda vez que abrís una ranura esta pantalla no aparece.',
};

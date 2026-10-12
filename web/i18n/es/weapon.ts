// One slot, opened: every skin the game has for this weapon, the ones you own
// apart from the ones you do not. The gaps are half of what a collection tells
// you.

export const weapon = {
  /** How many of how many. Only the ones with a tier count: the standard skin
   *  comes with the weapon and is not something you can have or not have. */
  of: (have: number, all: number) => `${have} de ${all}`,

  search: (n: number, gun: string) => `Buscar entre ${n} skins de ${gun}`,
  // The filter runs over the list already in memory; the Worker never sees it.
  searchWhy: (n: number) =>
    `Nombre, tema o tier. Las ${n} ya están en el navegador, así que buscar no ` +
    `vuelve al Worker.`,
  nothing: 'Ninguna coincide con eso.',

  alsoYours: 'También tuyas',
  notYours: 'No son tuyas',

  levels: (n: number) => (n === 1 ? '1 nivel' : `${n} niveles`),
  variants: (n: number) => (n === 1 ? '1 variante' : `${n} variantes`),

  // No row here shows a price, owned or not — this screen is the collection,
  // not the store — so the copy says nothing about one.
  weave: 'La trama detrás de cada fila lleva el color de esa skin, medido del render y no elegido.',

  // --- before the catalogue lands ------------------------------------------
  waitingWhy: 'Riot ya contestó con los ids; falta el catálogo que les pone nombre y render.',
};

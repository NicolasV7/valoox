// Lo que tenés, y lo que tenés puesto. Son dos preguntas distintas y esta
// pestaña contesta las dos: la grilla muestra todas las armas del juego, no
// solo las que vestiste.

export const collection = {
  title: 'Colección',

  tab: {
    weapons: 'Armas',
    sprays: 'Grafitis',
    buddies: 'Amuletos',
    cards: 'Tarjetas',
    titles: 'Títulos',
  },

  /** How much of the rack is dressed, which is the one number up here. */
  equipped: (on: number, all: number) => `${on} / ${all} equipadas`,

  rack: {
    sidearm: 'Secundarias',
    smg: 'Subfusiles',
    shotgun: 'Escopetas',
    rifle: 'Rifles',
    sniper: 'Francotiradoras',
    heavy: 'Pesadas',
    melee: 'Cuerpo a cuerpo',
  } as Record<string, string | undefined>,

  /** The skin every weapon ships with, and the only one with no tier. */
  standard: 'Estándar',

  everyWeapon:
    'Están todas las armas del juego, no solo las que vestiste. Una ranura sin ' +
    'nada equipado muestra el arma de fábrica, apagada — esa es la foto honesta ' +
    'de una colección, y es lo que hace visibles los huecos.',

  // --- nothing there -------------------------------------------------------
  nothing: 'Riot no devolvió nada para esta cuenta.',
  nothingWhy:
    'Es raro y seguramente no sea cierto. Si tenés skins en el juego, el error ' +
    'es nuestro, no una colección vacía.',
  alsoHere: 'También hay',
  unknown: (items: number, types: number) =>
    `${items} ítems de ${types} tipos que todavía no sabemos mostrar.`,
  agents:
    'Los agentes quedan afuera a propósito: se desbloquean jugando y no ' +
    'coleccionando, y tapan las cosas que sí elegiste.',
};

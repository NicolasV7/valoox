// Los avisos. La única pestaña cuyo tema entero es nuestro: qué marcaste y a
// dónde iría viven en nuestra propia fila, así que nada acá espera a Riot.

export const alerts = {
  what:
    'Marcá las skins que estás esperando. Cuando una aparece en tu tienda te la ' +
    'mandamos — una vez, apenas tu tienda rota.',

  // --- primera vez ---------------------------------------------------------
  noneYet: 'Todavía no marcaste nada',
  someYet: (n: number) => `${n} marcadas`,
  twoThings: 'Dos cosas por hacer, en este orden: elegir a dónde va el aviso, y marcar una skin.',

  stepOne: 'Paso 1 · a dónde va',
  stepTwo: 'Paso 2 · qué vigilar',

  yourEmail: 'Tu correo',
  oneAddress: 'Una dirección, verificada una vez.',

  searchASkin: 'Buscar una skin…',
  opensOnce:
    'Se abre cuando haya un canal guardado. Mandar a ningún lado es la única ' +
    'falla que un avisador no puede esconder.',

  whatAStarIs:
    'Una marca acá es una fila en nuestra base con el id de la skin y el nombre ' +
    'que viste — nada más. El trabajo diario cruza esa lista con tu tienda y ' +
    'manda los nombres que coinciden.',

  // --- esperando -----------------------------------------------------------
  whereItGoes: 'A dónde va',
  watching: 'Vigilando',
  waitingWhy:
    'Qué estás vigilando y a dónde va son nuestros, en nuestra propia fila: una ' +
    'sola llamada a este origen, nada a Riot y nada al catálogo, que es por qué ' +
    'esta espera es corta. Los nombres y los renders llegan después, del ' +
    'catálogo de la comunidad, y por eso las caras son lo único gris.',
};

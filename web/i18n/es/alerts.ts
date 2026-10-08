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

  // --- dónde va ------------------------------------------------------------
  email: 'Correo',
  verified: 'Verificado',
  notVerified: 'Sin verificar',
  notVerifiedYet: 'Guardado, sin verificar todavía.',
  pickSomething: 'Elegí qué vigilar.',
  comingNext: 'El buscador de skins es lo que sigue.',
  anAddress: 'Una dirección que puedas abrir ahora mismo.',
  sendATest: 'Mandar el código',
  badAddress: 'Eso no tiene forma de dirección. Revisá el arroba y el punto.',
  waitSeconds: (n: number) => `Esperá ${n} segundos antes de pedir otro código.`,
  oneIsOut: 'Ya te mandamos un código. Está en esa casilla.',
  testIsProof:
    'Ese código es la verificación: lo escribís de vuelta y recién ahí la ' +
    'dirección queda probada. Hasta que eso pase, acá no se manda nada más.',
  oneChannel:
    'Un solo canal, no un menú. Un segundo duplica las formas en que un mensaje ' +
    'de la mañana se pierde y parte al medio la atención que se le presta a ' +
    'cualquiera de los dos — y una casilla es el único lugar que todo el mundo ' +
    'ya mira.',
  whyACode:
    'Por qué un código y no un enlace: a un enlace dentro de un correo lo abren ' +
    'los escáneres antes que una persona, y eso verificaría una dirección que ' +
    'nadie leyó. Un código hay que traerlo a mano.',
  changeItLater:
    'Si la cambiás después, la nueva arranca sin verificar: el código va a la ' +
    'nueva y la vieja sigue recibiendo hasta que el código nuevo vuelva. Nada se ' +
    'corta en silencio.',

  watch: (name: string) => `Vigilar ${name}`,

  standby: 'Tu lista está en espera',
  standbyKept: (n: number) =>
    n === 1
      ? 'La cosa que marcaste sigue acá. No sale nada hasta que haya una dirección verificada.'
      : `Las ${n} cosas que marcaste siguen acá. No sale nada hasta que haya una dirección verificada.`,
  standbyNone: 'Para marcar algo hace falta primero una dirección verificada.',
  addAnAddress: 'Poner una dirección',

  // --- la lista andando ----------------------------------------------------
  change: 'Cambiar',
  weapons: 'Armas',
  accessories: 'Accesorios',
  rotatesIn: 'rota en',
  noGuns: 'Ninguna skin de arma marcada todavía.',
  noBits: 'Ningún accesorio marcado todavía.',
  addSomething: 'Agregar algo…',
  addSomethingTitle: 'Agregar algo',
  outOf: (n: number, max: number) => `${n} / ${max}`,
  onlyWhatTurnsUp:
    'El trabajo diario cruza esta lista con tu tienda y manda los nombres que ' +
    'coinciden. Si marcaste algo que Riot no vende —casi todo el pase de batalla, ' +
    'cada premio de evento— la fila existe y no va a coincidir nunca. No hay de ' +
    'dónde saber cuáles son: el catálogo público no lo dice y el endpoint de Riot ' +
    'que lo decía ya no existe.',
  hundredWhy:
    'Cien es el techo para las dos listas juntas. El trabajo diario es una ' +
    'intersección de conjuntos y la lista entera viaja en una sola fila, así que ' +
    'el límite es por mantener esa fila chica — no por cómputo, que este trabajo ' +
    'casi no usa.',

  // --- agregar -------------------------------------------------------------
  kinds: { spray: 'Spray', buddy: 'Colgante', card: 'Tarjeta', title: 'Título' },
  sellsCount: (n: number) => (n === 1 ? '1 que no tenés.' : `${n} que no tenés.`),
  listFull: (max: number) =>
    `La lista está llena: ${max} entre las dos. Sacá una para poder marcar otra.`,
  notInThisList:
    'Lo que no está acá: todo lo que ya tenés, y cada cuchillo — el panel diario ' +
    'son cuatro armas y nunca un melee. El pase de batalla sí está, y no es un ' +
    'descuido: nada publicado dice qué skins vende Riot, así que preferimos ' +
    'mostrarlas y decirte esto a filtrar a ojo.',
  searchIsLocal:
    'El buscador corre contra el catálogo que el navegador ya tiene, así que ' +
    'filtra mientras escribís sin preguntarle nada al Worker ni a Riot.',

  // --- el código -----------------------------------------------------------
  sentOut: 'Enviado',
  typeTheCode: 'Escribí el código que te mandamos',
  sixDigitsTo: (to: string) => `Seis dígitos, a ${to}. Vale diez minutos y cinco intentos.`,
  verify: 'Verificar',
  sendItAgain: 'Mandar otro',
  codeWrong: (left: number) => (left > 0 ? `No es ese. Te quedan ${left} intentos.` : 'No es ese.'),
  codeGone: 'Ese código venció. Pedí otro.',
  codeSpent: 'Se acabaron los intentos. Pedí un código nuevo.',
  tenAndFive:
    'Diez minutos y cinco intentos, y después el código muere y pedís otro. Los ' +
    'dos números existen por lo mismo: seis dígitos son un millón de intentos, y ' +
    'sin techo un script paciente llega.',
  whatHappensAfter: 'Qué pasa después',
  afterWhy:
    'La dirección queda verificada y el mensaje de la mañana empieza a ir ahí. A ' +
    'una dirección que no trajo un código de vuelta no se le manda nada — ni una ' +
    'sola vez — que es lo que impide que esto sea un botón para mandarle correo ' +
    'a desconocidos.',

  // --- rechazado -----------------------------------------------------------
  refusedLede:
    'Salió una prueba y el proveedor la rechazó. Acá no se perdió nada: tus ' +
    'marcas quedaron intactas.',
  bouncedLede:
    'La prueba salió y el servidor del otro lado la devolvió. Acá no se perdió ' +
    'nada: tus marcas quedaron intactas.',
  refusedWhy:
    'La dirección fue rechazada antes de mandar nada: esa casilla no sirve. No ' +
    'que esté llena, y no que haya rebotado después. Revisá cómo está escrita y ' +
    'mandá otro código.',
  wasRefused: 'Rechazada',
  wasBounced: 'Rebotó',
  wasBlocked: 'Bloqueada',
  blockedLede:
    'Ni siquiera salió: esa dirección ya estaba marcada como que no recibe. Acá ' +
    'no se perdió nada, tus marcas quedaron intactas.',
  blockedWhy:
    'El canal se negó a intentarlo. Esa dirección quedó en su lista de bloqueo ' +
    'por un rebote o una queja de antes, así que ningún mensaje nuestro va a ' +
    'salir hacia ahí. Insistir no la saca de esa lista: hace falta otra.',
  bouncedWhy:
    'El mensaje salió y el servidor del otro lado lo devolvió. Eso es la casilla ' +
    'misma diciendo que no, así que mandar lo mismo otra vez es el único consejo ' +
    'que no puede ayudar: hace falta otra dirección.',
  taken:
    'Esa dirección ya está verificada en otra cuenta. Una casilla recibe los ' +
    'avisos de una sola, así que hace falta otra — o desconectá la otra cuenta ' +
    'primero.',
  changeIt:
    'Esa dirección rebotó: el servidor del otro lado la devolvió. Mandarle lo ' +
    'mismo otra vez es lo único que no puede funcionar, así que hace falta ' +
    'cambiarla.',
  alreadyThere:
    'Ese mensaje ya llegó a la casilla y el código que lleva sigue vivo. ' +
    'Buscalo ahí. Cuando se venza, el botón vuelve.',
  sendAnother: 'Mandar otro código',
  editAddress: 'Cambiar la dirección',
  oneChannelMeans:
    'Un solo canal quiere decir que un rechazo es la historia completa: no fue a ' +
    'ningún lado. Tus marcas están intactas y el trabajo diario sigue corriendo ' +
    '— solo que no tiene dónde poner el resultado hasta que esto se arregle.',
  codeIsTheirs:
    'Las dos son cosas distintas. Un rechazo es la dirección estando mal antes ' +
    'de que saliera nada, y va a seguir mal; un rebote es el otro lado ' +
    'devolviéndola después de mirarla.',
  canAndCannot: 'Qué puede y qué no puede decirte un envío',
  canTell: 'Que el canal lo aceptó, y después lo que ese canal nos cuente',
  cannotTell: 'Que llegó a una bandeja, que sobrevivió un filtro, o que se leyó',
};

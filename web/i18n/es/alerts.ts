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
  comingNext: 'El buscador de skins es lo que sigue.',
  anAddress: 'Una dirección que puedas abrir ahora mismo.',
  sendATest: 'Mandar una prueba',
  badAddress: 'Eso no tiene forma de dirección. Revisá el arroba y el punto.',
  waitSeconds: (n: number) => `Esperá ${n} segundos antes de pedir otro código.`,
  testIsProof:
    'La prueba es la verificación: mandamos un código de seis dígitos y vos lo ' +
    'escribís de vuelta. Hasta que eso pase, a esta dirección no se le manda nada.',
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

  // --- el código -----------------------------------------------------------
  sentAs: (said: string) => `Enviado · ${said}`,
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
  refusedWhy: (said: string) =>
    `La dirección fue rechazada antes de mandar nada. ${said} es el proveedor ` +
    `diciendo que esa casilla no sirve — no que esté llena, y no que haya ` +
    `rebotado después. Revisá cómo está escrita y mandá otro código.`,
  bouncedWhy:
    'El mensaje salió y el servidor del otro lado lo devolvió. Eso es la casilla ' +
    'misma diciendo que no, así que mandar lo mismo otra vez es el único consejo ' +
    'que no puede ayudar: hace falta otra dirección.',
  taken:
    'Esa dirección ya está verificada en otra cuenta. Una casilla recibe los ' +
    'avisos de una sola, así que hace falta otra — o desconectá la otra cuenta ' +
    'primero.',
  sendAnother: 'Mandar otro código',
  editAddress: 'Cambiar la dirección',
  oneChannelMeans:
    'Un solo canal quiere decir que un rechazo es la historia completa: no fue a ' +
    'ningún lado. Tus marcas están intactas y el trabajo diario sigue corriendo ' +
    '— solo que no tiene dónde poner el resultado hasta que esto se arregle.',
  codeIsTheirs:
    'El código es del proveedor, no nuestro, y se muestra tal cual llegó. Un 4xx ' +
    'es la dirección estando mal y va a seguir mal; un rebote es el otro lado ' +
    'devolviéndolo después de mirarla.',
  canAndCannot: 'Qué puede y qué no puede decirte un envío',
  canTell: 'Que el canal lo aceptó (un 2xx), y después lo que diga su webhook',
  cannotTell: 'Que llegó a una bandeja, que sobrevivió un filtro, o que se leyó',
};

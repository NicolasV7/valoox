// Los avisos. La única pestaña cuyo tema entero es nuestro: qué marcaste y a
// dónde iría viven en nuestra propia fila, así que nada aquí espera a Riot.

export const alerts = {
  what:
    'Marca las skins que estás esperando. Cuando una aparece en tu tienda te la ' +
    'enviamos — una vez, apenas tu tienda rota.',

  // --- primera vez ---------------------------------------------------------
  noneYet: 'Todavía no marcaste nada',
  someYet: (n: number) => `${n} marcadas`,
  twoThings: 'Dos cosas por hacer, en este orden: elegir a dónde va el aviso, y marcar una skin.',

  stepOne: 'Paso 1 · a dónde va',
  stepTwo: 'Paso 2 · qué vigilar',

  yourEmail: 'Tu correo',
  oneAddress: 'Una dirección, verificada una vez.',
  // El nombre de Riot va en el encabezado del correo, debajo de la marca:
  // `who` en `src/alerts/mail/layout.ts`.
  sameInbox:
    'La misma casilla sirve para varias cuentas. Cada correo lleva arriba el ' +
    'nombre de Riot al que corresponde.',

  searchASkin: 'Buscar una skin…',
  // La condición es `mail.ok`, no que haya una dirección escrita: AlertsFirst
  // abre el buscador con `mail?.ok === true` y con nada más.
  opensOnce: 'Se abre cuando haya una dirección verificada.',

  // La fila es la que arma `cleanWishlist` en `src/routes/wishlist.ts`, y la
  // misma lista que enumera `account.keepListWhy`. Nada que no estuviera ya
  // en la pantalla donde apretaste la estrella.
  whatAStarIs:
    'Una marca aquí es una fila en nuestra base con lo que ya tenías en ' +
    'pantalla: el id de la skin, el nombre, el tier, los niveles y el color medido.',

  // --- esperando -----------------------------------------------------------
  whereItGoes: 'A dónde va',
  watching: 'Vigilando',
  // La espera es corta porque esta pantalla no toca Riot ni el catálogo: una
  // sola llamada a este origen. Los nombres y los renders llegan después.
  waitingWhy:
    'Lo que vigilas y a dónde va son nuestros: una sola llamada a este origen, ' +
    'nada a Riot. Los nombres y los renders llegan después, del catálogo de la ' +
    'comunidad.',

  // --- dónde va ------------------------------------------------------------
  email: 'Correo',
  verified: 'Verificado',
  notVerified: 'Sin verificar',
  notVerifiedYet: 'Guardado, sin verificar todavía.',
  pickSomething: 'Elige qué vigilar.',
  comingNext: 'El buscador de skins es lo que sigue.',
  anAddress: 'Una dirección que puedas abrir ahora mismo.',
  sendATest: 'Enviar el código',
  badAddress: 'Eso no tiene forma de dirección. Revisa el arroba y el punto.',
  waitSeconds: (n: number) => `Espera ${n} segundos antes de pedir otro código.`,
  // Un servidor no ve una casilla: lo único que sabemos es que salió.
  oneIsOut: 'Ya hay un código en camino a esa casilla.',
  testIsProof:
    'Ese código es la verificación: lo escribes de vuelta y la dirección queda ' +
    'probada. Hasta que eso pase, aquí no se envía nada más.',
  // Un segundo canal duplica las formas de perder el correo de la mañana y
  // parte al medio la atención que se le presta a cualquiera de los dos.
  oneChannel: 'Un solo canal, no un menú: una casilla es el único lugar que todo el mundo ya mira.',
  whyACode:
    'Por qué un código y no un enlace: a un enlace lo abren los escáneres antes ' +
    'que una persona, y eso verificaría una dirección que nadie leyó.',
  // La vieja no sigue recibiendo: `setChannel` pisa `mail.to` y deja `ok` en
  // false, y `post()` solo envía con `mail.ok === true`. No quedó dónde
  // guardar la dirección anterior.
  changeItLater:
    'Si la cambias después, la nueva arranca sin verificar: el código va ahí y ' +
    'no sale ningún correo hasta que lo escribas de vuelta.',

  watch: (name: string) => `Vigilar ${name}`,

  standby: 'Tu lista está en espera',
  standbyKept: (n: number) =>
    n === 1
      ? 'Lo que marcaste sigue aquí. No sale nada hasta que haya una dirección verificada.'
      : `Las ${n} cosas que marcaste siguen aquí. No sale nada hasta que haya una dirección verificada.`,
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
  // No hay de dónde saber qué vende Riot: el catálogo público no lo dice y el
  // endpoint que lo decía ya no existe.
  onlyWhatTurnsUp:
    'El trabajo diario cruza esta lista con tu tienda y envía lo que coincide. ' +
    'Lo que Riot no vende —casi todo el pase de batalla, los premios de evento— ' +
    'no coincide nunca.',
  // El techo es por mantener pequeña la fila, no por cómputo: el trabajo diario
  // es una intersección de conjuntos y casi no gasta.
  hundredWhy:
    'Cien es el techo para las dos listas juntas: la lista entera viaja en una sola fila.',

  // --- agregar -------------------------------------------------------------
  kinds: { spray: 'Grafiti', buddy: 'Amuleto', card: 'Tarjeta', title: 'Título' },
  sellsCount: (n: number) => (n === 1 ? '1 que no tienes.' : `${n} que no tienes.`),
  listFull: (max: number) =>
    `La lista está llena: ${max} entre las dos. Saca una para poder marcar otra.`,
  notInThisList:
    'Lo único que no está aquí es lo que ya tienes. El pase de batalla sí está: ' +
    'nada publicado dice qué skins vende Riot, así que preferimos mostrarlo y ' +
    'decírtelo.',
  searchIsLocal:
    'El buscador corre contra el catálogo que el navegador ya tiene, así que ' +
    'filtra mientras escribes sin preguntar nada al Worker ni a Riot.',

  // --- el código -----------------------------------------------------------
  sentOut: 'Enviado',
  typeTheCode: 'Escribe el código que te enviamos',
  sixDigitsTo: (to: string) => `Seis dígitos, a ${to}. Dura diez minutos y admite cinco intentos.`,
  verify: 'Verificar',
  sendItAgain: 'Enviar otro',
  codeWrong: (left: number) => (left > 0 ? `No es ese. Te quedan ${left} intentos.` : 'No es ese.'),
  codeGone: 'Ese código venció. Pide otro.',
  codeSpent: 'Se acabaron los intentos. Pide un código nuevo.',
  tenAndFive:
    'Diez minutos y cinco intentos, y después el código muere y pides otro: seis ' +
    'dígitos son un millón de combinaciones y sin techo un script paciente llega.',
  whatHappensAfter: 'Qué pasa después',
  // Lo que impide que esto sea un botón para mandarle correo a desconocidos.
  afterWhy:
    'La dirección queda verificada y el correo de la mañana empieza a ir ahí. A ' +
    'una dirección que no trajo un código de vuelta no se le envía nada, ni una ' +
    'sola vez.',

  // --- rechazado -----------------------------------------------------------
  refusedLede: 'Salió una prueba y el proveedor la rechazó. Tus marcas quedaron intactas.',
  bouncedLede:
    'La prueba salió y el servidor del otro lado la devolvió. Tus marcas quedaron intactas.',
  refusedWhy:
    'La dirección fue rechazada antes de enviar nada: esa casilla no sirve. ' +
    'Revisa cómo está escrita y envía otro código.',
  wasRefused: 'Rechazada',
  wasBounced: 'Rebotó',
  wasBlocked: 'Bloqueada',
  blockedLede:
    'Ni siquiera salió: esa dirección ya estaba marcada como que no recibe. Tus ' +
    'marcas quedaron intactas.',
  blockedWhy:
    'Esa dirección está en la lista de bloqueo del canal por un rebote o una ' +
    'queja de antes. Insistir no la saca de esa lista: hace falta otra.',
  bouncedWhy:
    'El correo salió y el servidor del otro lado lo devolvió. Enviar lo mismo ' +
    'otra vez no puede funcionar: hace falta otra dirección.',
  // Sin uso desde que una casilla sirve para varias cuentas. Se deja porque
  // el Worker todavía puede devolver 'taken' si alguna vez vuelve la regla.
  taken:
    'Esa dirección ya está verificada en otra cuenta. Hace falta otra, o ' +
    'desconecta la otra cuenta primero.',
  changeIt: 'Esa dirección rebotó: el servidor del otro lado la devolvió. Hace falta cambiarla.',
  // Esta pantalla aparece con `gotThere(said)`, o sea `email.delivered` o
  // `email.opened`. Eso es lo que dijo el proveedor, no que la casilla lo
  // tenga: "ya llegó" sería una afirmación que nadie puede ver.
  alreadyThere:
    'El proveedor dice que el servidor del otro lado lo aceptó, y el código ' +
    'sigue vivo. Cuando venza, el botón vuelve.',
  sendAnother: 'Enviar otro código',
  editAddress: 'Cambiar la dirección',
  oneChannelMeans:
    'Un solo canal quiere decir que un rechazo es la historia completa: no fue a ' +
    'ningún lado. El trabajo diario sigue corriendo, pero no tiene dónde dejar ' +
    'el resultado.',
  codeIsTheirs:
    'Un rechazo es la dirección estando mal antes de que saliera nada; un rebote ' +
    'es el otro lado devolviéndola después de mirarla.',
  canAndCannot: 'Qué puede y qué no puede decirte un envío',
  canTell: 'Que el canal lo aceptó, y después lo que ese canal nos cuente',
  cannotTell: 'Que llegó a una casilla, que sobrevivió un filtro, o que se leyó',
};

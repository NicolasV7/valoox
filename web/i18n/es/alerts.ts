// Alerts. The one tab whose whole subject is ours: what you starred and where
// it would go live in our own row, so nothing here waits on Riot.

export const alerts = {
  what:
    'Marca las skins que estás esperando. Cuando una aparece en tu tienda te la ' +
    'enviamos — una vez, apenas tu tienda rota.',

  // --- first run -----------------------------------------------------------
  noneYet: 'Todavía no marcaste nada',
  someYet: (n: number) => `${n} marcadas`,
  twoThings: 'Dos cosas por hacer, en este orden: elegir a dónde va el aviso, y marcar una skin.',

  stepOne: 'Paso 1 · a dónde va',
  stepTwo: 'Paso 2 · qué vigilar',

  yourEmail: 'Tu correo',
  oneAddress: 'Una dirección, verificada una vez.',
  // The Riot name goes in the email header, under the wordmark: `who` in
  // `src/alerts/mail/layout.ts`.
  sameInbox:
    'La misma casilla sirve para varias cuentas. Cada correo lleva arriba el ' +
    'nombre de Riot al que corresponde.',

  searchASkin: 'Buscar una skin…',
  // Lists can be edited before either destination is connected.
  opensOnce: 'Guarda tu lista y conecta un destino para recibir coincidencias.',

  // The row is the one `cleanWishlist` builds in `src/routes/wishlist.ts`, and
  // the same list `account.keepListWhy` spells out. Nothing that was not
  // already on the screen the star was pressed on.
  whatAStarIs:
    'Una marca aquí es una fila en nuestra base con lo que ya tenías en ' +
    'pantalla: el id de la skin, el nombre, el tier, los niveles y el color medido.',

  // --- waiting -------------------------------------------------------------
  whereItGoes: 'A dónde va',
  watching: 'Vigilando',
  // The wait is short because this screen touches neither Riot nor the
  // catalogue: one call to this origin. Names and renders come after.
  waitingWhy:
    'Lo que vigilas y a dónde va son nuestros: una sola llamada a este origen, ' +
    'nada a Riot. Los nombres y los renders llegan después, del catálogo de la ' +
    'comunidad.',

  // --- where it goes -------------------------------------------------------
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
  // A server cannot see an inbox: all we know is that it went out.
  oneIsOut: 'Ya hay un código en camino a esa casilla.',
  testIsProof:
    'Ese código es la verificación: lo escribes de vuelta y la dirección queda ' +
    'probada. Hasta que eso pase, aquí no se envía nada más.',
  oneChannel: 'Email y Discord se conectan por separado. Elige uno o ambos destinos.',
  whyACode:
    'Por qué un código y no un enlace: a un enlace lo abren los escáneres antes ' +
    'que una persona, y eso verificaría una dirección que nadie leyó.',
  // The old one does not keep receiving: `setChannel` overwrites `mail.to` and
  // leaves `ok` false, and `post()` only sends on `mail.ok === true`. There is
  // nowhere left to hold the previous address.
  changeItLater:
    'Si la cambias después, la nueva arranca sin verificar: el código va ahí y ' +
    'no sale ningún correo hasta que lo escribas de vuelta.',

  watch: (name: string) => `Vigilar ${name}`,

  // Why the star refuses the tap. Not "not in the store today" — this one is
  // handed out by a contract, so no store ever carries it and the alert could
  // never fire. See data/sellable.ts.
  notSoldOne: (name: string) => `${name} no sale en la tienda`,
  notSoldWhy: 'Esto se gana, no se vende, así que un aviso nunca sonaría.',

  standby: 'Tu lista está en espera',
  standbyKept: (n: number) =>
    n === 1
      ? 'Lo que marcaste sigue aquí. No sale nada hasta que conectes un destino.'
      : `Las ${n} cosas que marcaste siguen aquí. No sale nada hasta que conectes un destino.`,
  standbyNone: 'Guarda tus favoritos y conecta un destino cuando quieras.',
  addAnAddress: 'Poner una dirección',

  // --- the working list ----------------------------------------------------
  change: 'Cambiar',
  weapons: 'Armas',
  // Inside Weapons, to tell them from melee. Not "Weapons" again: a tab named
  // after the one above it says nothing.
  firearms: 'De fuego',
  accessories: 'Accesorios',
  rotatesIn: 'rota en',
  noGuns: 'Ninguna skin de arma marcada todavía.',
  noBits: 'Ningún accesorio marcado todavía.',
  addSomething: 'Agregar algo…',
  addSomethingTitle: 'Agregar algo',
  outOf: (n: number, max: number) => `${n} / ${max}`,
  // There is no way to know what Riot sells: the public catalogue does not
  // say, and the endpoint that did is gone.
  onlyWhatTurnsUp:
    'El trabajo diario cruza esta lista con tu tienda y envía lo que coincide. ' +
    'Lo que entregan los pases y los contratos no se puede marcar; de lo demás, ' +
    'nadie puede decirte cuándo rota.',
  // The ceiling is about keeping the row small, not about compute: the daily
  // job is a set intersection and barely uses any.
  hundredWhy:
    'Cincuenta armas y cien accesorios: son dos rotaciones distintas y llenar ' +
    'una no debería frenarte en la otra.',
  outOfBoth: (g: number, gm: number, b: number, bm: number) => `${g}/${gm} · ${b}/${bm}`,
  /** A tab, with how much sits behind it. */
  withCount: (said: string, n: number) => `${said} ${n}`,

  // --- adding --------------------------------------------------------------
  kinds: { spray: 'Grafiti', buddy: 'Amuleto', card: 'Tarjeta', title: 'Título' },
  sellsCount: (n: number) => (n === 1 ? '1 que no tienes.' : `${n} que no tienes.`),
  listFull: (max: number) => `Esta lista está llena: ${max}. Saca una para marcar otra.`,
  notInThisList:
    'No está lo que ya tienes, y no se puede marcar lo que se gana: un pase, un ' +
    'contrato, un rango o un premio de VCT. Lo demás sí se muestra, aunque que ' +
    'esté aquí no quiere decir que vaya a salir esta semana.',
  searchIsLocal:
    'El buscador corre contra el catálogo que el navegador ya tiene, así que ' +
    'filtra mientras escribes sin preguntar nada al Worker ni a Riot.',

  // --- the code ------------------------------------------------------------
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
  // What keeps this from being a button that mails strangers.
  afterWhy:
    'La dirección queda verificada y el correo de la mañana empieza a ir ahí. A ' +
    'una dirección que no trajo un código de vuelta no se le envía nada, ni una ' +
    'sola vez.',

  // --- refused -------------------------------------------------------------
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
  // Unused since one inbox serves several accounts. Kept because the Worker
  // can still return 'taken' if that rule ever comes back.
  taken:
    'Esa dirección ya está verificada en otra cuenta. Hace falta otra, o ' +
    'desconecta la otra cuenta primero.',
  changeIt: 'Esa dirección rebotó: el servidor del otro lado la devolvió. Hace falta cambiarla.',
  // This one shows on `gotThere(said)`, which is `email.delivered` or
  // `email.opened`. That is what the provider said, not that an inbox holds
  // it: "reached the inbox" would be a claim nobody can see.
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

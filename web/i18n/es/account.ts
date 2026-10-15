// The account, and leaving.
//
// Account and not Settings: there is nothing here to configure. Who is signed
// in, the things worth saying out loud, the coffee, and the way out. The
// order is the rule — the further down, the more permanent — and the only
// destructive thing is last and red.

export const account = {
  title: 'Cuenta',

  // --- who is signed in ----------------------------------------------------
  live: 'Conectado',
  region: 'Región',

  justNow: 'hace un momento',
  daysAgo: (n: number) => (n === 1 ? 'hace un día' : `hace ${n} días`),
  hoursAgo: (n: number) => (n === 1 ? 'hace una hora' : `hace ${n} horas`),

  // --- the sections --------------------------------------------------------
  alerts: 'Avisos',
  whereAlertsGo: 'A dónde van los avisos',
  noAddress: 'Sin dirección todavía',
  verified: 'Verificado',
  notVerified: 'Sin verificar',
  watching: 'Qué estás vigilando',
  starredCount: (n: number) =>
    n === 0 ? 'Nada marcado' : n === 1 ? 'Una cosa marcada' : `${n} cosas marcadas`,
  outOf: (n: number, max: number) => `${n} / ${max}`,

  honest: 'Lo que hay que decir',
  whatWeKeep: 'Qué guardamos',
  whatWeKeepUnder: 'Una fila sellada, tu lista, tu dirección',
  whatItCalls: 'Qué tiene permitido llamar',
  whatItCallsUnder: (n: number) => `${n} líneas, y casi todas son lecturas`,
  source: 'Código',
  sourceUnder: 'El Worker, el esquema y los tests',

  // Which commit this page was built from. Stamped by the build — see
  // web/built.ts — and the note below says exactly what that proves and what
  // it does not, because overclaiming here would be worse than silence.
  version: 'Versión',
  versionAt: (sha: string, at: string) => (at ? `${sha} · ${at.slice(0, 10)}` : sha),
  versionDirty: (sha: string) => `${sha}, con cambios sin guardar`,
  versionProves:
    'Es el commit del que se armó esta página, estampado al compilarla. Dice de ' +
    'dónde salió el código, no quién lo subió.',

  coffee: 'Si te sirvió',
  coffeeSaid: 'Esto anda a punta de café',
  coffeeUnder:
    'Gratis, no se vende nada y no se mide nada. Si esta semana te ahorró abrir el juego.',
  coffeeButton: 'Invítame un café',
  coffeeNote:
    'El botón va a Buy Me a Coffee y no lleva nada de tu cuenta: es un enlace ' +
    'normal que sale de esta página.',

  notAffiliated: 'Sin relación con Riot Games',
  notAffiliatedUnder: 'Y qué quiere decir eso aquí',

  /** Where a row goes, in the right-hand column. */
  onGithub: 'github',
  onApi: 'valorant-api.com',

  build: 'Esta versión',
  catalogue: 'Catálogo',
  catalogueUnder: 'Nombres, renders y clips',

  madeBy: 'Hecho por',
  madeByUnder: 'Termo#GOD',

  legal:
    'VALORANT y su arte son de Riot Games, Inc. valoox no tiene relación con ' +
    'Riot. Los nombres y los renders salen de valorant-api.com; los precios, de ' +
    'tu propia cuenta.',

  leaving: 'Irse',
  disconnect: 'Desconectar',
  disconnectUnder: 'Borra el frasco y tu correo.',

  // --- what we keep --------------------------------------------------------
  keepTitle: 'Qué guardamos',
  keepLede:
    'Primero lo importante: la sesión que esta app guarda lee tu cuenta sin ' +
    'contraseña y sin segundo factor. Eso es lo que entregas al escanear.',
  kept: 'Guardado',
  notKept: 'No guardado',

  keepJar: 'El frasco sellado',
  keepJarWhy:
    'Las cookies de Riot, cifradas antes de escribirse. La clave vive en los ' +
    'secretos del Worker y no en la base, así que una copia de la base sola no ' +
    'abre nada.',
  keepWho: 'Tu id de cuenta y tu región',
  keepWhoWhy: 'Riot responde al id, no a un nombre. La región es de dónde sale tu tienda.',
  keepList: 'Tu lista',
  keepListWhy:
    'Los ids de tus favoritos y sus detalles del catálogo, cifrados para tu cuenta de Riot. ' +
    'Se comparten entre dispositivos conectados y se eliminan al terminar la última sesión.',
  keepMail: 'Tu correo y su verificación',
  keepMailWhy:
    'La dirección que escribiste, si confirmaste el código, el idioma y la zona ' +
    'horaria de la pestaña. Vive dentro de tu sesión cifrada.',

  noPassword: 'Tu contraseña',
  noPasswordWhy: 'Nunca se escribe aquí. No hay campo para eso en ninguna pantalla.',
  noLog: 'Un registro de lo que miraste',
  noLogWhy:
    'El registro de peticiones está apagado. La ruta de la tienda lleva tu id de ' +
    'cuenta, así que registrarla sería registrarte.',
  noReach: 'El acceso de este navegador después de desconectar',
  noReachWhy:
    'Se borra la sesión de este navegador. Las tareas dejan de usar sus cachés y ' +
    'mensajes pendientes, aunque las copias cifradas caducan más tarde. Si conectaste ' +
    'otro navegador, su sesión sigue activa.',

  twoLocks:
    'Dos cerraduras, no una: la base guarda texto cifrado y la clave se guarda en ' +
    'otro lado. Rotar esa clave retira todos los frascos a la vez.',
  alsoKv:
    'También guardamos cachés cifradas, QR pendientes por diez minutos, pruebas de ' +
    'correo por diez minutos y registros de mensajes por una semana. Hay límites ' +
    'de envío, enlaces de baja con vencimiento y una cola cifrada de avisos. Las ' +
    'copias de recuperación de la base pueden conservar datos borrados durante siete días.',

  // --- leaving -------------------------------------------------------------
  leaveTitle: 'Desconectar este navegador',
  leaveLede:
    'Se eliminan el acceso y las alertas de este navegador. Tu lista se conserva ' +
    'mientras haya otro dispositivo conectado.',
  goes: 'Qué se va',
  goesJar: 'El frasco sellado — lo único aquí que puede leer tu cuenta',
  goesMail: 'Tu dirección de correo y su marca de verificada',
  goesList: 'La lista compartida, si este es tu último dispositivo conectado',
  goesDiscord: 'Las alertas por Discord activadas para este navegador',
  staysTitle: 'Qué sigue existiendo',
  staysRiot:
    'La sesión que aprobaste en tu teléfono. Sigue viva del lado de Riot hasta ' +
    'que venza sola: borrar el frasco termina nuestro acceso, no la credencial.',
  staysWhy:
    'Si quieres cortar esa sesión en el origen, la página de cuenta de Riot ' +
    'cierra sesión en todos los dispositivos.',
  listGoesWhy:
    'La lista se va con la fila porque vive adentro de ella. No hay una segunda ' +
    'tabla con tu id de Riot.',
  cancel: 'Cancelar',
  leaveFailed: 'No pudimos confirmar la desconexión. Tu sesión sigue visible aquí. Reintenta.',
  noDialog: 'No hay diálogo de confirmación encima: esta pantalla es la confirmación.',

  // --- riot said no --------------------------------------------------------
  gone: 'Tu sesión venció en Riot',
  scanAgain: 'Escanear otra vez',
  notNow: 'Ahora no',
  whichTwo: 'Cuál de las dos pasó',
  itEnded: 'La sesión terminó',
  itEndedWhy: 'Esta. Riot rechazó las cookies guardadas, que es lo normal y lo esperado.',
  riotChanged: 'Riot cambió algo',
  riotChangedWhy: 'Otro mensaje, y escanear otra vez no ayudaría.',
  jobSkips: 'El trabajo diario salta una sesión que no puede abrir en vez de reintentarla.',
};

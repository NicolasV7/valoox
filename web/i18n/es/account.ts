// La cuenta, y cómo irse.
//
// Account y no Ajustes: aquí no hay nada que configurar. Quién entró, las
// cosas que hay que decir en voz alta, el café, y la salida. El orden es la
// regla — cuanto más abajo, más permanente — y lo único destructivo va
// último y en rojo.

export const account = {
  title: 'Cuenta',

  // --- quién entró ---------------------------------------------------------
  live: 'Conectado',
  region: 'Región',
  lastSeen: (said: string) => `Sesión usada ${said}`,
  justNow: 'hace un momento',
  daysAgo: (n: number) => (n === 1 ? 'hace un día' : `hace ${n} días`),
  hoursAgo: (n: number) => (n === 1 ? 'hace una hora' : `hace ${n} horas`),

  // --- las secciones -------------------------------------------------------
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

  coffee: 'El café',
  coffeeSaid: 'Invítame un café',
  coffeeUnder: 'Esto corre en el plan gratis de Cloudflare.',

  madeBy: 'Hecho por',
  madeByUnder: 'NicolasV7 · Termo#GOD en el juego',

  legal:
    'VALORANT y su arte son de Riot Games, Inc. valoox no tiene relación con ' +
    'Riot. Los nombres y los renders salen de valorant-api.com; los precios, de ' +
    'tu propia cuenta.',

  leaving: 'Irse',
  disconnect: 'Desconectar',
  disconnectUnder: 'Borra el frasco y tu correo.',

  // --- qué guardamos -------------------------------------------------------
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
    'Ids y los nombres que viste al marcarlos, más el tier, los niveles y el ' +
    'color medido. Vive dentro de la misma fila sellada.',
  keepMail: 'Tu correo, una vez probado',
  keepMailWhy:
    'La dirección, la marca de que un código volvió desde ella, el idioma y la ' +
    'zona horaria de la pestaña que la puso. Se va con el frasco al desconectar.',

  noPassword: 'Tu contraseña',
  noPasswordWhy: 'Nunca se escribe aquí. No hay campo para eso en ninguna pantalla.',
  noLog: 'Un registro de lo que miraste',
  noLogWhy:
    'El registro de peticiones está apagado. La ruta de la tienda lleva tu id de ' +
    'cuenta, así que registrarla sería registrarte.',
  noReach: 'Una forma de alcanzarte después de desconectar',
  noReachWhy:
    'El frasco y la dirección se van juntos, y la fila entera con ellos. No queda ' +
    'nada que pueda tocar tu cuenta ni con qué escribirte.',

  twoLocks:
    'Dos cerraduras, no una: la base guarda texto cifrado y la clave se guarda en ' +
    'otro lado. Rotar esa clave retira todos los frascos a la vez.',
  alsoKv:
    'Fuera de esa fila, lo que caduca solo: tienda e inventario en caché; el hash ' +
    'de un código de seis dígitos, diez minutos; un id de mensaje de este ' +
    'navegador, una semana.',

  // --- irse ----------------------------------------------------------------
  leaveTitle: 'Desconectar este navegador',
  leaveLede:
    'Se borra una fila y esta app deja de poder alcanzar tu cuenta. Escanear un ' +
    'código nuevo empieza de cero.',
  goes: 'Qué se va',
  goesJar: 'El frasco sellado — lo único aquí que puede leer tu cuenta',
  goesMail: 'Tu dirección de correo y su marca de verificada',
  goesList: 'Tu lista de marcados, que vive dentro de la misma fila',
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
  noDialog: 'No hay diálogo de confirmación encima: esta pantalla es la confirmación.',

  // --- riot dijo que no ----------------------------------------------------
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

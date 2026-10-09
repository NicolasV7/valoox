// La cuenta, y cómo irse.
//
// Account y no Ajustes: acá no hay nada que configurar. Quién entró, las
// cosas que hay que decir en voz alta, el café, y la salida. El orden es la
// regla — cuanto más abajo, más permanente — y lo único destructivo va
// último y en rojo.

export const account = {
  title: 'Cuenta',

  // --- quién entró ---------------------------------------------------------
  live: 'Conectado',
  region: 'Región',
  lastSeen: (said: string) => `Sesión usada ${said}`,
  justNow: 'recién',
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
  madeBy: 'Hecho por',
  madeByUnder: 'NicolasV7 · Termo#GOD en el juego',

  legal:
    'VALORANT y su arte son de Riot Games, Inc. valoox no tiene relación con ' +
    'Riot. Los nombres y los renders salen de valorant-api.com; los precios, de ' +
    'tu propia cuenta, tal como Riot los devuelve.',

  leaving: 'Irse',
  disconnect: 'Desconectar',
  disconnectUnder: 'Borra el frasco y tu correo.',

  // --- qué guardamos -------------------------------------------------------
  keepTitle: 'Qué guardamos',
  keepLede:
    'Vale decirlo primero: la sesión que esta app guarda lee tu cuenta sin ' +
    'contraseña y sin segundo factor. Eso es lo que entrega escanear, y por eso ' +
    'esta página es corta como para leerla entera.',
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
    'Ids y los nombres que viste cuando los marcaste, más el tier, los niveles y ' +
    'el color que se midió — todo eso lo manda el navegador, porque el Worker no ' +
    'tiene catálogo. Vive dentro de la misma fila sellada.',
  keepMail: 'Tu correo, una vez probado',
  keepMailWhy:
    'La dirección, la marca de que un código volvió desde ella, el idioma y el ' +
    'huso de la pestaña que la puso. Se va junto con el frasco al desconectar.',

  noPassword: 'Tu contraseña',
  noPasswordWhy: 'Nunca se escribe acá. No hay campo para eso en ninguna pantalla.',
  noLog: 'Un registro de lo que miraste',
  noLogWhy:
    'El registro de peticiones está apagado. La ruta de la tienda lleva tu id de ' +
    'cuenta, así que registrarla sería registrarte.',
  noReach: 'Una forma de alcanzarte después de desconectar',
  noReachWhy:
    'El frasco y la dirección se van juntos, y la fila entera con ellos. No queda ' +
    'nada que pueda actuar sobre tu cuenta ni nada con qué escribirte.',

  twoLocks:
    'Dos cerraduras, no una: la base guarda texto cifrado y la clave se guarda en ' +
    'otro lado. Rotar esa clave retira todos los frascos guardados a la vez, que ' +
    'es un simulacro que corremos y no una propiedad que suponemos.',
  alsoKv:
    'Fuera de esa fila hay cosas que caducan solas y que vale nombrar: la tienda ' +
    'y el inventario en caché, el hash de un código de seis dígitos por diez ' +
    'minutos, y un id de mensaje apuntando a este navegador por una semana para ' +
    'que el webhook del correo encuentre la fila. Todas tienen fecha de ' +
    'vencimiento puesta al escribirlas.',

  // --- irse ----------------------------------------------------------------
  leaveTitle: 'Desconectar este navegador',
  leaveLede:
    'Se borra una fila y esta app deja de poder alcanzar tu cuenta. Escanear un ' +
    'código nuevo empieza de cero.',
  goes: 'Qué se va',
  goesJar: 'El frasco sellado — lo único acá que puede leer tu cuenta',
  goesMail: 'Tu dirección de correo y su marca de verificada',
  goesList: 'Tu lista de marcados, que vive dentro de la misma fila',
  staysTitle: 'Qué sigue existiendo',
  staysRiot:
    'La sesión que aprobaste en tu teléfono. Sigue viva del lado de Riot hasta ' +
    'que venza sola: borrar el frasco termina nuestro acceso, no la credencial.',
  staysWhy:
    'Lo decimos largo porque la palabra corta sería una afirmación sobre un ' +
    'sistema que no controlamos, y la gente decide cosas con esa palabra. Si lo ' +
    'querés cortado en el origen, la página de cuenta de Riot cierra sesión en ' +
    'todos los dispositivos.',
  listGoesWhy:
    'La lista se va con la fila porque vive adentro de ella. No hay una segunda ' +
    'tabla con tu id de Riot, y no la hay a propósito: sería justo el dato que el ' +
    'esquema está escrito para no tener.',
  cancel: 'Cancelar',
  noDialog:
    'No hay diálogo de confirmación encima de esta pantalla: la pantalla es la ' +
    'confirmación. Un segundo entrena a la gente a pasar por los dos.',

  // --- riot dijo que no ----------------------------------------------------
  gone: 'Tu sesión venció en Riot',
  goneLede:
    'Acá no pasó nada malo. Riot termina una sesión al rato, y después de un ' +
    'cambio de contraseña o de cerrar sesión en todos lados termina enseguida. ' +
    'Escaneá otra vez y vuelve todo.',
  scanAgain: 'Escanear otra vez',
  notNow: 'Ahora no',
  whichTwo: 'Cuál de las dos pasó',
  itEnded: 'La sesión terminó',
  itEndedWhy: 'Esta. Riot rechazó las cookies guardadas, que es lo normal y lo esperado.',
  riotChanged: 'Riot cambió algo',
  riotChangedWhy:
    'Otro mensaje, y escanear otra vez no ayudaría. La app lo dice en vez de ' +
    'mandarte a dar la vuelta.',
  jobSkips:
    'El trabajo diario salta una sesión que no puede abrir en vez de reintentarla. ' +
    'Un bucle sin supervisión repitiendo credenciales muertas es lo que parece un ' +
    'ataque de credenciales desde el lado de Riot, así que se detiene.',
};

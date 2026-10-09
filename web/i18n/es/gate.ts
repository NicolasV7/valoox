// The way in: four screens that are all one argument. A stranger is about to
// scan a code that signs into their game account, and the only thing that earns
// that is saying plainly what happens — before they do it, not after.

export const gate = {
  title: 'Tu tienda de VALORANT, sin abrir el juego.',
  lede: 'Entras escaneando un código con Riot Mobile. Esto es lo que pasa con tu cuenta.',

  // One line each wherever the sentence allows it. This screen has to be read
  // in one piece on a phone, and a fact below the fold is a fact nobody read —
  // the long version of all four is on valoox.store, where somebody who wants
  // it goes looking.
  facts: {
    password: 'Tu contraseña no llega aquí.',
    passwordWhy: 'Riot te hace entrar dentro de su propia app. Aquí no hay dónde escribirla.',
    keep: 'Guardamos una sola cosa.',
    keepWhy: 'La sesión que Riot devuelve, cifrada, con la clave fuera de la base de datos.',
    read: 'Solo sabe leer.',
    readWhy:
      'Los endpoints que cambian algo —equipar, entrar a cola, comprar— no están ' +
      'en el código, y un test lo prueba.',
    leave: 'Te puedes ir.',
    // `forget()` deletes our row and nothing else, so the subject of the first
    // sentence is what we keep — never the session, which is Riot's to end.
    leaveWhy:
      'Desconectas y lo que guardamos se borra al instante. Del lado de Riot la sesión vence sola.',
  },

  show: 'Muéstrame el código',
  // The one line on this screen that is also an instruction: a QR that points
  // anywhere else is the attack this flow has.
  destination: 'El código apunta a',
  destinationWhy: 'Tiene que ser así.',

  scan: {
    title: 'Escanea el código, o abre la app.',
    lede: 'En los dos casos Riot aprueba el ingreso en tu teléfono. Aquí no se escribe nada.',
    // The asterisks are bold, rendered by components/Marked.tsx. They sit on
    // the two things you have to find inside somebody else's app.
    how: 'Abre *Riot Mobile* en tu teléfono y ve a *Perfil → Ajustes → Escanear código QR*.',
    or: 'o',
    open: 'Abrir Riot Mobile',
    openWhy: 'Si estás leyendo esto desde el teléfono.',
    waiting: 'Esperando que lo apruebes…',
    alt: 'Código QR para entrar con Riot',
  },

  approved: {
    title: 'Escanea esto desde Riot Mobile.',
    lede:
      'En la app: Perfil → Ajustes → Escanear código QR. Si ya estás en el ' +
      'teléfono, toca el botón y se abre sola.',
    /** The whole sentence, tag included — the screen only dims the tag. */
    signedIn: (name: string) => `Entraste como ${name}`,
    loading: 'Cargando tu tienda…',
    nothingTyped: 'Riot aprobó el escaneo. Nada de lo que escribiste pasó por esta página.',
  },

  expired: {
    title: 'Este código venció.',
    // Riot's timer, not ours. Two minutes is the figure web/sign-in.ts is
    // written against, which is why the line hedges it rather than states it.
    lede: 'Duran unos dos minutos, a propósito. Uno dando vueltas es una forma de entrar a tu cuenta.',
    again: 'Hacer un código nuevo',
    nothingHappened: 'No le pasó nada a tu cuenta. Riot ignora un código vencido.',
  },
};

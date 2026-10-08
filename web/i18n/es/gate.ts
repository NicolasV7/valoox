// The way in: four screens that are all one argument. A stranger is about to
// scan a code that signs into their game account, and the only thing that earns
// that is saying plainly what happens — before they do it, not after.

export const gate = {
  title: 'Tu tienda de VALORANT, sin abrir el juego.',
  lede: 'Antes de escanear, esto es lo que pasa con tu cuenta.',

  // One line each wherever the sentence allows it. This screen has to be read
  // in one piece on a phone, and a fact below the fold is a fact nobody read —
  // the long version of all four is on valoox.store, where somebody who wants
  // it goes looking.
  facts: {
    password: 'Tu contraseña no llega acá.',
    passwordWhy: 'Se escribe en la app de Riot, nunca en esta página.',
    keep: 'Guardamos una sola cosa.',
    keepWhy: 'La sesión que Riot devuelve, cifrada, con la clave fuera de la base.',
    read: 'Solo sabe leer.',
    readWhy: 'Comprar, equipar y entrar a cola no están en el código, y un test lo prueba.',
    leave: 'Te podés ir.',
    leaveWhy: 'Desconectás y se borra al instante. En Riot vence sola.',
  },

  show: 'Mostrame el código',
  // The one line on this screen that is also an instruction: a QR that points
  // anywhere else is the attack this flow has.
  destination: 'El código apunta a',
  destinationWhy: 'Tiene que ser así.',

  scan: {
    title: 'Escaneá el código, o abrí la app.',
    lede: 'En cualquiera de los dos casos Riot aprueba el ingreso en tu teléfono. Acá no se escribe nada.',
    how: 'Abrí Riot Mobile en tu teléfono: Perfil → Ajustes → Escanear código QR.',
    or: 'o',
    open: 'Abrir Riot Mobile',
    openWhy: 'Si estás leyendo esto desde el teléfono.',
    waiting: 'Esperando que lo apruebes…',
    alt: 'Código QR para entrar con Riot',
  },

  approved: {
    title: 'Listo, entraste.',
    as: (name: string, tag: string) => `${name}#${tag}`,
    loading: 'Cargando tu tienda…',
    nothingTyped: 'Riot aprobó el escaneo. Nada de lo que escribiste pasó por esta página.',
  },

  expired: {
    title: 'Este código venció.',
    lede:
      'Duran unos dos minutos, a propósito. Uno dando vueltas es una forma de ' +
      'entrar a tu cuenta.',
    again: 'Hacer un código nuevo',
    nothingHappened: 'No le pasó nada a tu cuenta. Un código vencido Riot lo ignora y ya.',
  },
};

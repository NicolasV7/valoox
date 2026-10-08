// La pantalla a la que lleva el pie de un correo.

export const stopped = {
  stopping: 'Dando de baja…',
  stopped: 'Listo, no te escribimos más',
  couldNot: 'No pudimos darte de baja',
  couldNotWhy:
    'El enlace no abrió ninguna fila. Puede que ya no sea válido, o que la ' +
    'sesión de esa cuenta haya vencido — en los dos casos no hay nada a dónde ' +
    'mandarte nada, así que el resultado es el mismo.',

  noMoreTo: (to: string) => `Sacamos ${to}. No sale nada más para esa dirección.`,
  alreadyOff: 'No había ninguna dirección guardada, así que no salía nada.',

  standby: 'Tu lista queda en espera',
  keptCount: (n: number) =>
    n === 1
      ? 'La cosa que marcaste sigue ahí, intacta. Nadie la toca.'
      : `Las ${n} cosas que marcaste siguen ahí, intactas. Nadie las toca.`,
  keptNone: 'No tenías nada marcado todavía. Si marcás algo, queda esperando acá.',
  putOneBack: 'Poner otra dirección',

  whatWeDid:
    'Qué pasó exactamente: borramos la dirección de tu fila y soltamos la ' +
    'reserva que tenía, así que queda libre para usarla de nuevo, acá o en otra ' +
    'cuenta. El trabajo diario deja de mirar esta fila hasta que haya una ' +
    'dirección nueva verificada.',
  riotIsSeparate:
    'Esto no toca tu sesión de Riot ni tu cuenta. Es solo a dónde iba el correo ' + 'de la mañana.',
};

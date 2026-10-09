// La pantalla a la que lleva el pie de un correo.

export const stopped = {
  sure: '¿Parar los avisos?',
  sureWhy: 'Dejas de recibir el correo de la mañana. Lo que marcaste no se toca.',
  yesStop: 'Sí, parar',
  no: 'No',

  stopped: 'Listo',
  noMoreTo: (to: string) => `No sale nada más para ${to}.`,
  alreadyOff: 'No había ninguna dirección guardada, así que no salía nada.',
  keptCount: (n: number) =>
    n === 1 ? 'Tu marca queda donde estaba.' : `Tus ${n} marcas quedan donde estaban.`,
  keptNone: 'No tenías nada marcado.',

  nothingChanged: 'No tocamos nada',
  stillOn: 'Los avisos siguen andando. Puedes cerrar esta pestaña.',

  alreadyUsed: 'Este enlace ya se usó',
  alreadyUsedWhy:
    'Ya respondiste desde aquí, y cada correo trae el suyo. Si quieres cambiar ' +
    'la decisión, hazlo desde la app o usa el enlace del correo siguiente.',
  couldNot: 'Ese enlace no sirve',
  couldNotWhy: 'No abrió ninguna fila. Puede que ya no valga, o que no sea el enlace entero.',
};

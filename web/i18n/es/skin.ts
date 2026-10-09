// Una skin abierta desde la colección. Los mismos tres bloques que la pantalla
// de la tienda — clip, niveles, variantes — porque es la misma pregunta. Lo que
// cambia es la respuesta a "¿es tuya?", que la tienda nunca tiene que dar.

export const skin = {
  watch: 'Ver el clip de Riot',
  yours: 'Ya lo tienes',

  // --- los dos bloques de elección -----------------------------------------
  /** Un melee llega hasta tres niveles y un arma de fuego hasta cinco. Medido
   *  sobre el catálogo: 176 skins de cuerpo a cuerpo y 1.239 de fuego. La razón
   *  es que no hay animación de disparo ni finisher que subir. */
  meleeLevels: (n: number) =>
    `${n} niveles, no cinco: una skin de cuerpo a cuerpo llega como máximo a tres.`,

  twoReceipts:
    'Riot cobra un nivel y una variante por separado, así que una skin llega como ' +
    'varios ids: una variante que no tienes es la misma skin en otro renglón del recibo.',

  // --- lo que es para ti ---------------------------------------------------
  equippedNow: 'Puesta ahora',
  howItLooks: 'Cómo se ve',
  notYoursPreview:
    'Así se ve la variante que elegiste arriba. No la tienes: es el render que ' +
    'publica Riot, no una foto de tu inventario.',
  alsoOn: (which: string) => `Tienes puesto el ${which} de esta skin.`,
  yoursNotOn: 'Tuya, sin poner',

  readOff: (level: string, colour: string) =>
    `${level}, ${colour} — leído de tu loadout. Nunca le escribimos: equipar ` +
    `sigue donde corresponde, en el juego.`,
  holds: (other: string) =>
    `${other} ocupa la ranura. Aquí no hay botón de equipar: la lista de egreso ` +
    `lleva el GET de esa ruta, no el PUT que equipa.`,

  /** Sale de la misma tabla que la tienda usa al revés, donde deduce el tier a
   *  partir de lo que Riot cobró. */
  listPrice:
    'El precio de arriba es el de lista del tier, no uno que Riot haya dicho sobre ' +
    'esta skin: una que no está hoy en tu tienda no viene con ningún costo.',

  // --- mientras no llegó el catálogo ---------------------------------------
  waitingWhy:
    'Riot contesta con ids. Los nombres, los renders y el clip salen del catálogo ' +
    'de la comunidad, que el navegador descarga una vez y guarda.',
};

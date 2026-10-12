// A skin opened out of the collection. The same three blocks as the store's
// offer screen — clip, levels, variants — because it is the same question.
// What changes is the answer to "do you own it", which the store never has to
// give.

export const skin = {
  watch: 'Ver el clip de Riot',
  yours: 'Ya lo tienes',

  // --- the two blocks of choices -------------------------------------------
  /** A melee tops out at three levels and a gun at five. Measured over the
   *  catalogue: 176 melee skins and 1,239 gun skins. The reason is that there
   *  is no firing animation and no finisher to upgrade. */
  meleeLevels: (n: number) =>
    `${n} niveles, no cinco: una skin de cuerpo a cuerpo llega como máximo a tres.`,

  twoReceipts:
    'Riot cobra un nivel y una variante por separado, así que una skin llega como ' +
    'varios ids: una variante que no tienes es la misma skin en otro renglón del recibo.',

  // --- what it is to you ---------------------------------------------------
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

  /** It comes out of the same table the store reads the other way, where it
   *  deduces a tier from what was charged. */
  listPrice:
    'El precio de arriba es el de lista del tier, no uno que Riot haya dicho sobre ' +
    'esta skin: una que no está hoy en tu tienda no viene con ningún costo.',

  // --- before the catalogue lands ------------------------------------------
  waitingWhy:
    'Riot contesta con ids. Los nombres, los renders y el clip salen del catálogo ' +
    'de la comunidad, que el navegador descarga una vez y guarda.',
};

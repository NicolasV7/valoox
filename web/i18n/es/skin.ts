// Una skin abierta desde la colección. Los mismos tres bloques que la pantalla
// de la tienda — clip, niveles, variantes — porque es la misma pregunta. Lo que
// cambia es la respuesta a «¿es tuya?», que la tienda nunca tiene que dar.

export const skin = {
  watch: 'Ver el clip de Riot',
  yours: 'Es tuya',

  // --- los dos bloques de elección -----------------------------------------
  /** Un melee llega hasta tres niveles y un arma de fuego hasta cinco. Medido
   *  sobre el catálogo: 176 skins de cuerpo a cuerpo y 1.239 de fuego. */
  meleeLevels: (n: number) =>
    `${n} niveles, no cinco. Una skin de cuerpo a cuerpo llega como mucho a ` +
    `tres — medido sobre las 176 del catálogo, contra cinco en las 1.239 de ` +
    `fuego — porque no hay animación de disparo ni finisher que subir.`,

  twoReceipts:
    'Riot cobra un nivel y una variante como pertenencias distintas, bajo dos ' +
    'tipos de ítem distintos, así que una sola skin llega como varios ids. Una ' +
    'variante que no tenés es la misma skin en otro renglón del recibo, y por ' +
    'eso está acá en lugar de estar escondida.',

  // --- lo que es para vos --------------------------------------------------
  equippedNow: 'Puesta ahora',
  howItLooks: 'Cómo se ve',
  notYoursPreview:
    'Así se ve la variante que elegiste arriba. No la tenés — esto es el render ' +
    'que publica Riot, no una foto de tu inventario.',
  alsoOn: (which: string) => `Tenés puesto el ${which} de esta skin.`,
  yoursNotOn: 'Tuya, sin poner',

  readOff: (level: string, colour: string) =>
    `${level}, ${colour} — leído de tu loadout. Nunca le escribimos: la lista ` +
    `de egreso lleva el GET de un loadout y no lleva el PUT que equipa uno, ` +
    `así que equipar sigue donde corresponde, en el juego.`,
  holds: (other: string) =>
    `${other} ocupa la ranura. Acá no hay botón de equipar y no lo va a haber: ` +
    `equipar es un PUT a esa misma ruta, y de esa ruta la lista de egreso solo ` +
    `lleva el GET.`,

  listPrice:
    'El precio de arriba es el de lista del tier, no uno que Riot haya dicho ' +
    'sobre esta skin: una que no está hoy en tu tienda no viene con ningún ' +
    'costo. Sale de la misma tabla que la tienda usa al revés, donde deduce el ' +
    'tier a partir de lo que cobró.',

  // --- mientras no llegó el catálogo ---------------------------------------
  waitingWhy:
    'Riot contesta con ids. Los nombres, los renders y el clip salen del ' +
    'catálogo de la comunidad, que el navegador baja una vez y se queda — así ' +
    'que esta pantalla es de la primera visita a un arma y casi nunca de la ' +
    'segunda.',
};

// A card, a spray, a buddy or a title, opened. One screen, four bodies — so
// four sets of facts, because what Riot publishes for each kind is different
// and the screen says which.

export const piece = {
  kind: 'Tipo',
  goesOn: 'Va en',
  oneAtATime: 'Un arma a la vez',
  yours: 'Ya es tuyo',
  yes: 'Sí',
  no: 'No',

  /** The one line inside a title's stage. */
  markSays: 'La marca dice qué es. La palabra es el ítem.',

  crops: 'Los otros dos recortes',
  wideWhere: 'Ancho · el lobby, detrás de tu nombre',
  smallWhere: 'Chico · el marcador, a 54px',
  size: '128×128',

  buddyNote:
    'Riot publica una sola imagen de 128×128 para un amuleto. La luz de atrás ' +
    'sale de esa imagen: un accesorio no tiene rareza de la que tomar un color.',
  // The light comes off the art because an accessory has no rarity: buddyNote
  // already says that, and the four notes never appear together.
  cardNote:
    'Riot envía los tres y son recortes, no escalas: el alto tiene detalle que ' +
    'el chico no muestra nunca.',
  titleNote:
    'El catálogo de Riot le da a un título un titleText y ningún campo de ' +
    'imagen. La marca de arriba es la del juego, no arte de este.',
  sprayNote:
    'Algunos grafitis se animan en el juego. Riot publica esos cuadros como ' +
    'animationGif; este no tiene.',
  sprayMoves:
    'Este se anima en el juego: lo que ves son los cuadros que publica Riot. ' +
    'La mayoría de los grafitis no los tienen.',
};

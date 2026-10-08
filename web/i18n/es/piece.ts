// A card, a spray, a charm or a title, opened. One screen, four bodies — so
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
    'Riot publica una sola imagen de 128×128 para un amuleto y nada más. La luz ' +
    'de atrás sale de esa imagen: un accesorio no tiene rareza, así que no hay ' +
    'color de tier del que agarrarse.',
  cardNote:
    'Riot manda los tres y están recortados distinto, no escalados — el alto ' +
    'tiene detalle que el chico no muestra nunca. La luz de esta pantalla sale ' +
    'del arte misma; un accesorio no tiene rareza de la cual tomar un color.',
  titleNote:
    'El catálogo de Riot le da a un título un titleText y ningún campo de ' +
    'imagen. La marca de arriba es la del juego, la que aparece donde sea que ' +
    'haya un título — dice «esto es un título». No es arte de este, porque no existe.',
  sprayNote:
    'Algunos grafitis se animan en el juego. Riot publica los cuadros de esos ' +
    'como animationGif; este no tiene, así que lo que ves es lo que es.',
  sprayMoves:
    'Este se anima en el juego y lo que estás viendo son los cuadros que Riot ' +
    'publica, no una captura: la mayoría de los grafitis no tienen ninguno.',
};

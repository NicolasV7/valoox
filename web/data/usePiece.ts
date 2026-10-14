// A uuid becomes a name and a picture, as a hook.
//
// One request per item rather than an index: the store shows eight or nine
// things and the weapons index alone is 3.5 MB. catalogue.ts remembers every
// answer for the life of the page, so a skin that appears in the daily store
// and again inside a bundle is fetched once.

import { cardArt, piece, rankIcon, skin } from './catalogue.ts';
import { useResource } from './resource.ts';
import { familyOf } from './skins.ts';

/** The daily store and the night market are always weapon skins. */
export const useSkin = (id: string) => useResource('skin:' + id, () => skin(id));

/** A bundle's contents and the accessory store are mixed types. */
export const usePiece = (type: string, id: string) =>
  useResource('piece:' + type + ':' + id, () => piece(type, id));

export { useBundle } from './useBundle.ts';

/** The levels and chromas beside the one that was opened. Null until the
 *  weapons index lands, and null forever for anything that is not a skin. */
export const useFamily = (levelId: string) =>
  useResource('family:' + levelId, () => familyOf(levelId));

/** Removed profile art must disappear immediately, without a replacement fetch. */
export const useCardArt = (id?: string | null) =>
  useResource('card:' + (id ?? ''), () => (id ? cardArt(id) : Promise.resolve(null)));

export const useRankIcon = (tier?: number | null) =>
  useResource('rank:' + (tier ?? ''), () => (tier ? rankIcon(tier) : Promise.resolve(null)));

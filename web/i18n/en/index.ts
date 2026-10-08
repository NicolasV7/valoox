// One bundle per locale, composed from one module per area. Split this way so
// no file grows past a screenful and so a translator opens the screen they are
// translating rather than a thousand-line map.

import { collection } from './collection.ts';
import { common } from './common.ts';
import { gate } from './gate.ts';
import { piece } from './piece.ts';
import { sprays } from './sprays.ts';
import { bundle, offer, store } from './store.ts';
import { weapon } from './weapon.ts';

export const en = { common, gate, store, offer, bundle, piece, collection, weapon, sprays };

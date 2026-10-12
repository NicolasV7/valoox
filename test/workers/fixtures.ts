import type { Session, StoreView } from '../../src/types.ts';
export const UID = 'a'.repeat(64);
export const OTHER = 'b'.repeat(64);
export const session = (): Session => ({
  jar: { ssid: 'test-credential' },
  puuid: '1aefc04b-4455-8b2f-6332-79b4260aaffe',
  shard: 'na',
  name: 'Player#TAG',
});
export const storeView = (): StoreView => ({
  offers: [{ id: 'level', cost: 1775 }],
  remaining: 3600,
  night: null,
  bundles: [],
  accessory: null,
  wallet: { vp: 0, rad: 0, kc: 0 },
  account: { name: 'Player#TAG', rank: null },
  fetchedAt: Math.floor(Date.now() / 1000),
});

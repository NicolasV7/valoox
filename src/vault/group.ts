import { type Channel, channels, target } from '../alerts/target.ts';
import type { Env, Session, Starred } from '../types.ts';
import * as repo from './repo.ts';
import { CURRENT_KID } from './seal.ts';
import { alerting, readSession } from './session.ts';

export interface Recipient {
  uid: string;
  session: Session;
  rows: string[];
  channel: Channel;
}
/** Union watchlists for the same account/destination, without a catalogue. */
export async function recipients(env: Env, row: repo.Row): Promise<Recipient[]> {
  const owner = await readSession(env, row.uid);
  if (!owner) return [];
  const rows = row.acct ? await repo.accountRows(env, row.acct) : [row];
  const groups = new Map<string, { value: Recipient; wishlist: Map<string, Starred> }>();
  for (const member of rows) {
    if (member.kid !== CURRENT_KID) continue;
    const held = await readSession(env, member.uid);
    if (!held || held.session.puuid !== owner.session.puuid || !alerting(held.session)) continue;
    const s = held.session;
    for (const channel of channels) {
      const destination = target(s, channel);
      if (!destination) continue;
      const key = channel + ':' + destination.to;
      let group = groups.get(key);
      if (!group) {
        group = {
          value: { uid: member.uid, session: s, rows: [], channel },
          wishlist: new Map(),
        };
        groups.set(key, group);
      }
      group.value.rows.push(member.uid);
      for (const item of s.wishlist ?? [])
        group.wishlist.set((item.type ?? '') + ':' + item.id, item);
    }
  }
  return [...groups.values()].map(({ value, wishlist }) => ({
    ...value,
    session: { ...value.session, wishlist: [...wishlist.values()] },
  }));
}

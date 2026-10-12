import type { Env } from '../types.ts';
import * as repo from './repo.ts';
import { CURRENT_KID } from './seal.ts';
import { type Held, readSession } from './session.ts';

/** An email alert represents the account/destination, including other browsers.
 * A footer stops that pair together; unrelated accounts and addresses survive. */
export async function mailGroup(env: Env, uid: string, held: Held): Promise<Array<[string, Held]>> {
  const group: Array<[string, Held]> = [[uid, held]];
  const row = await repo.get(env, uid);
  if (!row?.acct || !held.session.mail) return group;
  const to = held.session.mail.to.toLowerCase();
  for (const member of await repo.accountRows(env, row.acct, false)) {
    if (member.kid !== CURRENT_KID) continue;
    if (member.uid === uid) continue;
    const value = await readSession(env, member.uid);
    if (
      value &&
      value.session.puuid === held.session.puuid &&
      value.session.mail?.to.toLowerCase() === to
    ) {
      group.push([member.uid, value]);
    }
  }
  return group;
}

import type { Env, Session, Tokens } from '../types.ts';
import { identify, reauth } from './auth.ts';
import { forget, readSession, saveSession } from './session.ts';

/**
 * A session that can talk to Riot right now, or null.
 *
 * Every data route goes through here, so the reauth-and-heal exists once. It is
 * in the vault rather than in routes/ because all three things it does are jar
 * work: open the sealed row, roll the cookies forward, and put them back.
 */
export async function live(env: Env, uid: string): Promise<{ session: Session; t: Tokens } | null> {
  const held = await readSession(env, uid);
  if (!held) return null;

  const { session, ver } = held;
  const t = await reauth(session.jar);
  if (!t) {
    // Dead at Riot. Keeping the row until the 10-day prune would leave a useless
    // credential sitting in anything that reads the table.
    await forget(env, uid);
    return null;
  }

  // A sign-in that stored the jar but died before identify heals itself here —
  // and so does a session from before the name was worth remembering. An empty
  // string means "we asked and there is none", so we do not ask again.
  if (!session.puuid || !session.shard || session.name === undefined) {
    const who = await identify(t);
    Object.assign(session, { ...who, name: who.name ?? '' });
  }

  // The jar was rolled forward by absorb(). Losing the CAS means another tab
  // already persisted a newer jar — theirs wins and ours is dropped on purpose.
  await saveSession(env, uid, session, ver);
  return { session, t };
}

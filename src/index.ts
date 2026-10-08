import { route } from './router.ts';
import type { Env } from './types.ts';
import { runAlerts } from './vault/alerts.ts';
import { prune } from './vault/repo.ts';

export default {
  /**
   * Abandoned rows are the ones that would sit in a stale dump long after their
   * owner stopped caring. Deleting them beats shortening their life: they are
   * gone, not merely shorter-lived. Active sessions roll their own last_used
   * forward on every visit and are untouched.
   *
   * Honest caveat for the disclosure page: D1 Time Travel retains deleted rows
   * for 7 days with no purge API, so a DELETE is not erasure. Rotating JAR_KEY
   * is what orphans those snapshots.
   */
  async scheduled(
    _event: unknown,
    env: Env,
    ctx: { waitUntil(p: Promise<unknown>): void },
  ): Promise<void> {
    ctx.waitUntil(
      runAlerts(env)
        .then((r) => console.log('alerts checked ' + r.checked + ' sent ' + r.sent))
        .then(() => prune(env))
        .then((n) => console.log('pruned ' + n)),
    );
  },

  fetch: route,
};

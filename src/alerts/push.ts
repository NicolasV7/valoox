import type { Session } from '../types.ts';
import type { Budget } from '../vault/budget.ts';
import { rf } from '../vault/http.ts';

type Notify = NonNullable<Session['notify']>;
export async function deliver(to: Notify, said: string, budget?: Budget): Promise<string[]> {
  if (!to.discord) throw new Error('no notification channel');
  let last: Response | null = null;
  for (let i = 0; i < 3; i++) {
    if (budget && budget.left <= 0) break;
    try {
      const res = await rf('https://discord.com/api/webhooks/' + to.discord, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: said }),
        budget,
        signal: AbortSignal.timeout(6000),
      });
      last = res;
      if (res.status < 500) break;
    } catch {
      /* Every aborted attempt also spends its request budget. */
    }
  }
  const status = last?.status ?? 504;
  if (!last?.ok) throw new Error('discord ' + status);
  return ['discord ' + status];
}

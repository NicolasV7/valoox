import type { Hit, Session } from '../types.ts';
import { renderUrl } from '../vault/render.ts';
import type { DiscordOutbox } from './types.ts';
import { words } from './words.ts';

const LEVELS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const safe = (value: string) =>
  value.replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, ' ').replace(/[\\`*_{}[\]()<>~|]/g, '\\$&');

export function build(uid: string, s: Session, found: Hit[], left: number): DiscordOutbox {
  const w = words(s.discord?.lang);
  const until = Date.now() + Math.max(0, Math.min(left, 23 * 3600)) * 1000;
  const lines = [w.alertTitle, s.name ? w.alertAccount(safe(s.name)) : '', ''];
  let shown = 0;
  for (const item of found) {
    const coin = !item.type || item.type === LEVELS ? 'VP' : 'KC';
    const price = typeof item.cost === 'number' ? w.price(item.cost, coin) : w.unknownPrice;
    const line = '• ' + safe(item.name) + ' · ' + price;
    if (lines.join('\n').length + line.length > 1500) break;
    lines.push(line);
    shown++;
  }
  if (shown < found.length) lines.push(w.alertCount(found.length - shown));
  lines.push('', w.alertExpiry(Math.floor(until / 1000)), w.alertStop);
  return {
    uid,
    channel: 'discord',
    to: s.discord?.user ?? '',
    room: s.discord?.room ?? '',
    gen: s.discord?.gen ?? '',
    until,
    message: {
      content: lines.filter((line) => line !== undefined).join('\n'),
      embeds: found
        .filter((item) => (!item.type || item.type === LEVELS) && UUID.test(item.id))
        .slice(0, 4)
        .map((item) => ({ image: { url: renderUrl(item.id) } })),
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: w.viewStore,
              url: 'https://drop.valoox.store/',
            },
          ],
        },
      ],
    },
  };
}

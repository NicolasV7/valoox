import type { Message } from './types.ts';
import { words } from './words.ts';

export const ACCENT = 0xd8cbaf;
export type Reply =
  | 'botReceived'
  | 'botPrivate'
  | 'botInvalid'
  | 'botLimited'
  | 'botTest'
  | 'botStopped'
  | 'botActive'
  | 'botInactive'
  | 'botUnknown';

/** A compact card: brand accent, one title, clear copy and one way back. */
export function message(lang: 'en' | 'es', kind: Reply): Message {
  const s = words(lang);
  return {
    content: '',
    embeds: [
      {
        title: s[`${kind}Title`],
        description: s[kind],
        color: ACCENT,
        footer: { text: s.messageFooter },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: s.backToApp,
            url: 'https://drop.valoox.store/alerts/discord',
          },
        ],
      },
    ],
  };
}

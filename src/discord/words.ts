import { discord as en } from '../../web/i18n/en/discord.ts';
import { discord as es } from '../../web/i18n/es/discord.ts';

export const langOf = (value?: unknown): 'en' | 'es' =>
  typeof value === 'string' && /^es(?:-|$)/.test(value) ? 'es' : 'en';
export const words = (locale?: string) => (langOf(locale) === 'es' ? es : en);

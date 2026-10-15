import { discord as en } from '../../web/i18n/en/discord.ts';
import { discord as es } from '../../web/i18n/es/discord.ts';

export const words = (locale?: string) => (locale?.startsWith('es') ? es : en);

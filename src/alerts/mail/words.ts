// Everything a message says, in the two languages the app is served in.
//
// Here rather than in web/i18n because the Worker builds the message and the
// browser never sees it — but the rule is the same one: the strings live
// together, interpolation is a function, and nothing is concatenated around a
// value. The locale comes from the tab that asked, so a mail arrives in the
// language of the screen that sent it.

import { at, on } from './clock.ts';

export type Lang = 'es' | 'en';

export const langOf = (raw: unknown): Lang => (raw === 'en' ? 'en' : 'es');

export interface Words {
  subject: (code: string) => string;
  expiresIn: (mins: number) => string;
  /** Under the code itself: the two numbers that bound it. */
  bounds: (mins: number) => string;
  asked: string;
  askedWhy: string;
  neverAsk: string;
  neverPassword: string;
  foot: string;
  text: (code: string, mins: number) => string;

  // --- the morning message -------------------------------------------------
  hitSubject: (first: string, n: number) => string;
  inYourStore: string;
  openYourStore: string;
  goneIn: string;
  goneInAside: (clock: string) => string;
  /** The line under a name: the tier, then only the counts worth saying. */
  tier: Record<'select' | 'deluxe' | 'premium' | 'exclusive' | 'ultra', string>;
  levels: (n: number) => string;
  chromas: (n: number) => string;
  youStarred: (days: number) => string;
  oneADay: string;
  hitFoot: string;
  stopThese: string;
  hitText: (names: string[], link: string) => string;
  /** The header's right-hand line. A clock where the reader's offset is
   *  known, and how long is left where it is not. */
  sentAt: (ms: number, tz: number | undefined, lang: Lang) => string;
  expiresAt: (ms: number, tz: number | undefined, mins: number) => string;
}

const es: Words = {
  subject: (code) => code + ' es tu código de valoox',
  expiresIn: (mins) => 'Vence en ' + mins + ' minutos',
  bounds: (mins) => mins + ' minutos · cinco intentos',
  asked: 'Alguien pidió avisos de tienda acá',
  askedWhy:
    'Si fuiste vos, la pestaña que dejaste abierta está esperando esos seis ' +
    'dígitos. Si no, no hagas nada: a una dirección que no contesta no se le ' +
    'manda nada más, y acá no llega ningún aviso hasta que el código vuelva.',
  neverAsk:
    'Nadie de valoox te va a pedir este código. Ni por respuesta, ni en el ' +
    'juego, en ningún lado: solo te lo pedimos en la pestaña que abriste vos.',
  neverPassword:
    'Tampoco te vamos a pedir tu contraseña de Riot, y no la tenemos: el ' +
    'ingreso es por QR, dentro de la app de Riot.',
  foot:
    'Recibís esto porque alguien escribió esta dirección en valoox, para la ' +
    'cuenta de arriba. No se manda ningún aviso acá hasta que el código se ' +
    'escriba de vuelta.',
  text: (code, mins) =>
    code +
    ' es tu código de valoox.\n\n' +
    'Escribilo en la pestaña que dejaste abierta. Vence en ' +
    mins +
    ' minutos y admite cinco intentos.\n\n' +
    'Si no fuiste vos, no hagas nada: a una dirección que no contesta no se le ' +
    'manda nada más, y acá no llega ningún aviso hasta que el código vuelva.\n\n' +
    'Nadie de valoox te va a pedir este código. Ni por respuesta, ni en el ' +
    'juego, en ningún lado. Tampoco tu contraseña de Riot: no la tenemos, el ' +
    'ingreso es por QR dentro de la app de Riot.\n',
  hitSubject: (first, n) =>
    n > 1 ? first + ' y ' + (n - 1) + ' más están en tu tienda' : first + ' está en tu tienda',
  inYourStore: 'Está en tu tienda ahora mismo.',
  openYourStore: 'Abrir tu tienda',
  goneIn: 'Se va en',
  goneInAside: (clock) => 'Se va en ' + clock,
  tier: {
    select: 'Select',
    deluxe: 'Deluxe',
    premium: 'Premium',
    exclusive: 'Exclusive',
    ultra: 'Ultra',
  },
  levels: (n) => n + ' niveles',
  chromas: (n) => n + ' variantes',
  youStarred: (days) =>
    days > 1
      ? 'Lo marcaste hace ' + days + ' días, y esta es la primera mañana que coincide.'
      : 'Lo marcaste en valoox y esta mañana coincidió. El trabajo diario cruza tu ' +
        'lista con tu tienda y manda solo los nombres que coinciden.',
  sentAt: (ms, tz, lang) => (tz === undefined ? '' : on(ms, tz, lang)),
  expiresAt: (ms, tz, mins) =>
    tz === undefined ? 'Vence en ' + mins + ' minutos' : 'Vence ' + at(ms, tz),
  oneADay:
    'Un correo por día como máximo, y solo cuando algo de tu lista está ' +
    'efectivamente delante tuyo. Los accesorios corren con su propio reloj semanal ' +
    'y llegan igual.',
  hitFoot:
    'Marcaste esto en valoox. Este correo lleva nombres de skins y el nombre de ' +
    'Riot de la cuenta — el que ve cualquiera que juegue con vos. Ningún id ' +
    'interno, ninguna sesión, nada con lo que alguien pueda entrar como vos.',
  stopThese: 'Dejar de recibir estos correos',
  hitText: (names, link) =>
    (names.length === 1
      ? names[0] + ' está en tu tienda hoy.'
      : names.join(', ') + ' están en tu tienda hoy.') +
    '\n\nAbrí tu tienda en https://valoox.store\n\n' +
    'Para dejar de recibir estos correos: ' +
    link +
    '\n',
};

const en: Words = {
  subject: (code) => code + ' is your valoox code',
  expiresIn: (mins) => 'Expires in ' + mins + ' minutes',
  bounds: (mins) => mins + ' minutes · five attempts',
  asked: 'Somebody asked for store alerts here',
  askedWhy:
    'If that was you, the tab you left open is waiting for those six digits. ' +
    'If it was not, do nothing: an address that never answers never hears from ' +
    'us again, and nothing is sent here until the code comes back.',
  neverAsk:
    'Nobody at valoox will ever ask you for this code. Not in a reply, not in ' +
    'game, nowhere — we only ask for it in the tab you opened yourself.',
  neverPassword:
    'We will never ask for your Riot password either, and we do not have one. ' +
    'Signing in happens by QR, inside Riot’s own app.',
  foot:
    'You are getting this because someone entered this address at valoox, for ' +
    'the account above. No alerts are sent here until the code is typed back.',
  text: (code, mins) =>
    code +
    ' is your valoox code.\n\n' +
    'Type it back in the tab you left open. It expires in ' +
    mins +
    ' minutes and allows five attempts.\n\n' +
    'If it was not you, do nothing: an address that never answers never hears ' +
    'from us again, and nothing is sent here until the code comes back.\n\n' +
    'Nobody at valoox will ever ask you for this code. Not in a reply, not in ' +
    'game, nowhere. Nor your Riot password: we do not have one, signing in ' +
    'happens by QR inside Riot’s own app.\n',
  hitSubject: (first, n) =>
    n > 1 ? first + ' and ' + (n - 1) + ' more are in your store' : first + ' is in your store',
  inYourStore: 'It is in your store right now.',
  openYourStore: 'Open your store',
  goneIn: 'Gone in',
  goneInAside: (clock) => 'Gone in ' + clock,
  tier: {
    select: 'Select',
    deluxe: 'Deluxe',
    premium: 'Premium',
    exclusive: 'Exclusive',
    ultra: 'Ultra',
  },
  levels: (n) => n + ' levels',
  chromas: (n) => n + ' chromas',
  youStarred: (days) =>
    days > 1
      ? 'You starred this one ' + days + ' days ago, and this is the first morning it has matched.'
      : 'You starred this at valoox and this morning it matched. The daily job ' +
        'crosses your list with your store and sends only the names that match.',
  sentAt: (ms, tz, lang) => (tz === undefined ? '' : on(ms, tz, lang)),
  expiresAt: (ms, tz, mins) =>
    tz === undefined ? 'Expires in ' + mins + ' minutes' : 'Expires ' + at(ms, tz),
  oneADay:
    'One mail a day at most, and only when something on your list is actually ' +
    'in front of you. Accessories run on their own weekly clock and arrive the ' +
    'same way.',
  hitFoot:
    'You starred this at valoox. This mail carries skin names and the account’s ' +
    'Riot name — the one anybody you play with sees. No internal id, no session, ' +
    'nothing that would let anyone sign in as you.',
  stopThese: 'Stop these emails',
  hitText: (names, link) =>
    (names.length === 1
      ? names[0] + ' is in your store today.'
      : names.join(', ') + ' are in your store today.') +
    '\n\nOpen your store at https://valoox.store\n\n' +
    'To stop these emails: ' +
    link +
    '\n',
};

export const words = { es, en };

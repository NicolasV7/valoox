// Everything a message says, in the two languages the app is served in.
//
// Here rather than in web/i18n because the Worker builds the message and the
// browser never sees it — but the rule is the same one: the strings live
// together, interpolation is a function, and nothing is concatenated around a
// value. The locale comes from the tab that asked, so a mail arrives in the
// language of the screen that sent it.

import { at, on } from './clock.ts';
import type { Words } from './said.ts';

export type { Lang, Words } from './said.ts';
export { langOf } from './said.ts';

const es: Words = {
  subject: (code) => code + ' es tu código de valoox',
  bounds: (mins) => mins + ' minutos · cinco intentos',
  asked: 'Alguien pidió avisos de tienda aquí',
  askedWhy:
    'Si fuiste tú, la pestaña que dejaste abierta espera esos seis dígitos. Si ' +
    'no, no hagas nada: aquí no llega ningún aviso hasta que el código vuelva.',
  neverAsk:
    'Nadie de valoox te va a pedir este código: ni por respuesta, ni en el ' +
    'juego. Solo se escribe en la pestaña que abriste tú.',
  neverPassword:
    'Tu contraseña de Riot tampoco: no la tenemos. El ingreso es por QR, dentro ' +
    'de la app de Riot.',
  foot: 'Recibes esto porque alguien escribió esta dirección en valoox, para la cuenta de arriba.',
  text: (code, mins) =>
    code +
    ' es tu código de valoox.\n\n' +
    'Escríbelo en la pestaña que dejaste abierta. Vence en ' +
    mins +
    ' minutos y admite cinco intentos.\n\n' +
    'Si no fuiste tú, no hagas nada: aquí no llega ningún aviso hasta que el ' +
    'código vuelva.\n\n' +
    'Nadie de valoox te va a pedir este código, ni tu contraseña de Riot: no la ' +
    'tenemos, el ingreso es por QR dentro de la app de Riot.\n',
  hitSubject: (first, n) =>
    n > 1 ? first + ' y ' + (n - 1) + ' más están en tu tienda' : first + ' está en tu tienda',
  inYourStore: 'Está en tu tienda ahora mismo.',
  openYourStore: 'Abrir tu tienda',
  goneIn: 'Se va en',
  tier: {
    select: 'Select',
    deluxe: 'Deluxe',
    premium: 'Premium',
    exclusive: 'Exclusive',
    ultra: 'Ultra',
  },
  levels: (n) => n + ' niveles',
  chromas: (n) => n + ' variantes',
  // No "la primera mañana": `waited()` in alert.ts is whole days since the star
  // was pressed, and nothing keeps a last-sent date, so first is unknowable.
  youStarred: (days) =>
    days > 1
      ? 'Lo marcaste hace ' + days + ' días y hoy apareció.'
      : 'Lo marcaste en valoox y hoy apareció.',
  sentAt: (ms, tz, lang) => (tz === undefined ? '' : on(ms, tz, lang)),
  expiresAt: (ms, tz, mins) =>
    tz === undefined ? 'Vence en ' + mins + ' minutos' : 'Vence ' + at(ms, tz),
  pushLine: (names) =>
    names.length === 1
      ? names[0] + ' está en tu tienda hoy.'
      : names.join(', ') + ' están en tu tienda hoy.',
  pushTest: 'Prueba de valoox. Los avisos llegan bien por aquí.',
  riotNotice: 'Sin relación con Riot Games. VALORANT y su arte son de Riot Games, Inc.',
  oneADay: 'Un correo por día como máximo, y solo cuando algo de tu lista está en tu tienda.',
  // No "ningún id interno": the stop link in the footer is `<uid>.<nonce>.<sig>`,
  // so this email does carry the row's id. What it does not carry is the jar.
  hitFoot:
    'Este correo lleva nombres de skins y el nombre de Riot de la cuenta. Nada de ' +
    'tu sesión, nada con lo que alguien pueda entrar como tú.',
  stopThese: 'Dejar de recibir estos correos',
  hitText: (names, link) =>
    (names.length === 1
      ? names[0] + ' está en tu tienda hoy.'
      : names.join(', ') + ' están en tu tienda hoy.') +
    '\n\nAbre tu tienda en https://valoox.store\n\n' +
    'Para dejar de recibir estos correos: ' +
    link +
    '\n',
};

const en: Words = {
  subject: (code) => code + ' is your valoox code',
  bounds: (mins) => mins + ' minutes · five attempts',
  asked: 'Somebody asked for store alerts here',
  askedWhy:
    'If that was you, the tab you left open is waiting for those six digits. ' +
    'If not, do nothing: nothing is sent here until the code comes back.',
  neverAsk:
    'Nobody at valoox will ask you for this code: not in a reply, not in game. ' +
    'You only type it in the tab you opened.',
  neverPassword:
    'Nor your Riot password: we do not have one. Signing in happens by QR, ' +
    'inside Riot’s own app.',
  foot: 'You are getting this because someone entered this address at valoox, for the account above.',
  text: (code, mins) =>
    code +
    ' is your valoox code.\n\n' +
    'Type it back in the tab you left open. It expires in ' +
    mins +
    ' minutes and allows five attempts.\n\n' +
    'If it was not you, do nothing: nothing is sent here until the code comes ' +
    'back.\n\n' +
    'Nobody at valoox will ask you for this code, or for your Riot password: we ' +
    'do not have one, signing in happens by QR inside Riot’s own app.\n',
  hitSubject: (first, n) =>
    n > 1 ? first + ' and ' + (n - 1) + ' more are in your store' : first + ' is in your store',
  inYourStore: 'It is in your store right now.',
  openYourStore: 'Open your store',
  goneIn: 'Gone in',
  tier: {
    select: 'Select',
    deluxe: 'Deluxe',
    premium: 'Premium',
    exclusive: 'Exclusive',
    ultra: 'Ultra',
  },
  levels: (n) => n + ' levels',
  /** "Variants" is the word the app's own screens use for these. */
  chromas: (n) => n + ' variants',
  // Not "the first morning": `waited()` in alert.ts is whole days since the
  // star was pressed, and nothing keeps a last-sent date, so first is
  // unknowable.
  youStarred: (days) =>
    days > 1
      ? 'You starred this ' + days + ' days ago, and today it turned up.'
      : 'You starred this at valoox, and today it turned up.',
  sentAt: (ms, tz, lang) => (tz === undefined ? '' : on(ms, tz, lang)),
  expiresAt: (ms, tz, mins) =>
    tz === undefined ? 'Expires in ' + mins + ' minutes' : 'Expires ' + at(ms, tz),
  pushLine: (names) =>
    names.length === 1
      ? names[0] + ' is in your store today.'
      : names.join(', ') + ' are in your store today.',
  pushTest: 'valoox test. Alerts arrive fine on this channel.',
  riotNotice: 'Not affiliated with Riot Games. VALORANT and its art belong to Riot Games, Inc.',
  oneADay: 'One email a day at most, and only when something on your list is in your store.',
  // Not "no internal id": the stop link in the footer is `<uid>.<nonce>.<sig>`,
  // so this email does carry the row's id. What it does not carry is the jar.
  hitFoot:
    'This email carries skin names and the account’s Riot name. Nothing from your ' +
    'session, nothing that would let anyone sign in as you.',
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

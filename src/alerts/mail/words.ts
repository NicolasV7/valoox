// Everything a message says, in the two languages the app is served in.
//
// Here rather than in web/i18n because the Worker builds the message and the
// browser never sees it — but the rule is the same one: the strings live
// together, interpolation is a function, and nothing is concatenated around a
// value. The locale comes from the tab that asked, so a mail arrives in the
// language of the screen that sent it.

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
    'Recibís esto porque alguien escribió esta dirección en valoox. No se ' +
    'manda ningún aviso acá hasta que el código se escriba de vuelta.',
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
    'You are getting this because someone entered this address at valoox. No ' +
    'alerts are sent here until the code is typed back.',
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
};

export const words = { es, en };

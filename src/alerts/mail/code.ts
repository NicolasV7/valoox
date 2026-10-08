// The six digits, in a mailbox.
//
// What this is not: a bold line, a bordered box and a centred pill. That is
// the shape of every notification anybody has ever ignored. The code is the
// whole message, so the code is the size of the message — and the two numbers
// that bound it sit under it rather than in a footnote.
//
// Two sentences carry more weight than the design does. "If it was not you, do
// nothing" has to be true, and it is: an address that never answers is never
// written to again. And nobody will ever ask for this code — which is worth
// saying in the one place a stranger could later claim otherwise.

import { FONT, INK, shell, weave } from './layout.ts';

/** The purple the sign-in screens use for a thing being proved. */
const HUE = '152, 96, 192';

export const subject = (code: string): string => code + ' es tu código de valoox';

export function text(code: string, mins: number): string {
  return (
    code +
    ' es tu código de valoox.\n\n' +
    'Escribilo en la pestaña que dejaste abierta. Vence en ' +
    mins +
    ' minutos y admite cinco intentos.\n\n' +
    'Si no fuiste vos, no hagas nada: a una dirección que no contesta no se le ' +
    'manda nada más, y acá no llega ningún aviso hasta que el código vuelva.\n\n' +
    'Nadie de valoox te va a pedir este código. Ni por respuesta, ni en el ' +
    'juego, en ningún lado. Tampoco tu contraseña de Riot: no la tenemos, el ' +
    'ingreso es por QR dentro de la app de Riot.\n'
  );
}

export function html(code: string, mins: number, until: string): string {
  const spaced = code.split('').join(' ');

  const body =
    // the code, at the size of the message
    `<tr><td align="center" style="padding:44px 28px 46px;${weave(HUE, INK.page)}">` +
    `<div style="font-family:${FONT.mono};font-size:46px;font-weight:700;` +
    `letter-spacing:0.18em;color:${INK.text};line-height:1">${spaced}</div>` +
    `<div style="font-family:${FONT.mono};font-size:11.5px;letter-spacing:0.16em;` +
    `text-transform:uppercase;color:${INK.body};padding-top:22px">` +
    `${mins} minutos · cinco intentos</div></td></tr>` +
    // what it is for, and what to do if it was not you
    `<tr><td style="padding:26px 28px 0">` +
    `<div style="font-size:23px;font-weight:500;letter-spacing:-0.02em;` +
    `color:${INK.text};line-height:1.25">Alguien pidió avisos de tienda acá</div>` +
    `<p style="margin:10px 0 0;font-size:14px;line-height:1.65;color:${INK.body}">` +
    'Si fuiste vos, la pestaña que dejaste abierta está esperando esos seis ' +
    'dígitos. Si no, no hagas nada: a una dirección que no contesta no se le ' +
    'manda nada más, y acá no llega ningún aviso hasta que el código vuelva.' +
    '</p></td></tr>' +
    // the one line that matters if somebody later asks for the code
    `<tr><td style="padding:22px 28px 0">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"` +
    ` style="border-radius:14px;${weave(HUE, INK.stage)}"><tr>` +
    `<td style="padding:18px 22px;font-size:14px;line-height:1.6;color:#D2D6D9">` +
    'Nadie de valoox te va a pedir este código. Ni por respuesta, ni en el ' +
    'juego, en ningún lado: solo te lo pedimos en la pestaña que abriste vos.' +
    '</td></tr></table></td></tr>' +
    `<tr><td style="padding:22px 28px 24px">` +
    `<p style="margin:0;font-size:13.5px;line-height:1.65;color:${INK.faint}">` +
    'Tampoco te vamos a pedir tu contraseña de Riot, y no la tenemos: el ' +
    'ingreso es por QR, dentro de la app de Riot.</p></td></tr>';

  const foot =
    `<p style="margin:0;font-size:12px;line-height:1.6;color:${INK.quiet}">` +
    'Recibís esto porque alguien escribió esta dirección en valoox. No se manda ' +
    'ningún aviso acá hasta que el código se escriba de vuelta.</p>';

  return shell({ aside: 'Vence ' + until, body, foot });
}

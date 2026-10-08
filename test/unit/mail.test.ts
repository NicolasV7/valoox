import assert from 'node:assert';
import { test } from 'vitest';
import { html as alertHtml } from '../../src/alerts/mail/alert.ts';
import { html as codeHtml } from '../../src/alerts/mail/code.ts';

// Every bug these messages have had was a rendering bug, and the one that
// came back three times was the same message arriving in two different tones
// depending on the reader's phone. These are the four lines that stop it.
//
// What a test can hold is the HTML, not a mail client. `npm run mail` renders
// both to a file for the half that needs eyes.

const ORIGIN = 'https://drop.valoox.store';
const STOP = ORIGIN + '/stop?t=t';

const BOTH = [
  ['code', codeHtml('418302', 10, 'en', ORIGIN, STOP)],
  ['alert', alertHtml([{ id: '1', name: 'Reaver Vandal' }], 4000, 'en', ORIGIN, STOP)],
] as const;

test('each message tells the client not to adapt it', () => {
  for (const [what, body] of BOTH) {
    // `only` is the keyword that does the work: without it a client in dark
    // mode runs its own pass over an already-dark design and darkens it
    // further, which is exactly the report.
    assert.ok(body.includes('color-scheme:only light'), what + ' css');
    assert.ok(body.includes('content="only light"'), what + ' meta');
  }
});

test('nothing can inherit the user agent default, which is the one value that moves', () => {
  for (const [what, body] of BOTH) {
    // Black under light and white under dark. A single line of type written
    // without a colour of its own would be the one thing in the message that
    // changed with the phone, so <body> carries ours.
    const open = /<body[^>]*>/.exec(body)?.[0] ?? '';
    assert.match(open, /color:#[0-9A-Fa-f]{6}/, what + ' body colour');
  }
});

test('every background is painted as an image as well as a colour', () => {
  for (const [what, body] of BOTH) {
    // Gmail honours none of the declarations above and rewrites
    // background-color while leaving background-image alone. A one-stop
    // gradient is an image to that pass and a flat colour to the eye.
    // Inline only. The <style> block holds the [data-ogsc] override, which is
    // Outlook.com's own hook and is a colour on purpose.
    const inline = body.replace(/<style>[\s\S]*?<\/style>/g, '');
    const colours = inline.match(/background-color:\s*#[0-9A-Fa-f]{6}/g) ?? [];
    const images =
      inline.match(/linear-gradient\(\s*#[0-9A-Fa-f]{6}\s*,\s*#[0-9A-Fa-f]{6}\s*\)/g) ?? [];
    assert.ok(colours.length > 0, what + ' has surfaces');
    assert.equal(images.length, colours.length, what + ' every surface is also an image');
  }
});

test('nothing in a message loads from anywhere but this origin', () => {
  for (const [what, body] of BOTH) {
    for (const [, url] of body.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)) {
      assert.ok(url.startsWith(ORIGIN), what + ' points off-origin: ' + url);
    }
  }
});

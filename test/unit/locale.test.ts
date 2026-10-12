import assert from 'node:assert/strict';
import { afterEach, test, vi } from 'vitest';
import { langOf } from '../../src/alerts/mail/said.ts';
import { locale, preferred, setLocale, t } from '../../web/i18n/index.ts';

afterEach(() => vi.unstubAllGlobals());

function browser(languages: string[]) {
  const root = { lang: 'en' };
  vi.stubGlobal('navigator', { languages });
  vi.stubGlobal('document', { documentElement: root });
  setLocale(preferred());
  return root;
}

test('an unsupported browser language gets an English page and document language', () => {
  const root = browser(['fr-FR', 'ja-JP']);
  assert.equal(locale(), 'en');
  assert.equal(root.lang, 'en');
  assert.equal(t().gate.title, 'Your VALORANT store, without opening the game.');
});

test('the Spanish translation is still selected by a Spanish browser preference', () => {
  const root = browser(['es-CO', 'en-US']);
  assert.equal(root.lang, 'es');
  assert.match(t().gate.title, /VALORANT/);
  assert.notEqual(t().gate.title, 'Your VALORANT store, without opening the game.');
});

test('English wins when it is the first supported browser preference', () => {
  const root = browser(['fr-FR', 'en-GB', 'es-CO']);
  assert.equal(root.lang, 'en');
  assert.equal(t().gate.title, 'Your VALORANT store, without opening the game.');
});

test('emails without a supported language fall back to English; explicit Spanish stays', () => {
  for (const raw of [undefined, null, 42, 'fr', 'en']) assert.equal(langOf(raw), 'en');
  assert.equal(langOf('es'), 'es');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { langFromNavigator, resolveLang } from './i18n.ts';

test('idioma del teléfono', () => {
  assert.equal(langFromNavigator(['en-US', 'es-PE']), 'en');
  assert.equal(langFromNavigator(['es-PE', 'en']), 'es');
  assert.equal(langFromNavigator(['pt-BR', 'en-GB']), 'en');
  assert.equal(langFromNavigator(['fr-FR']), 'es');
  assert.equal(langFromNavigator(undefined), 'es');
});

test('el perfil gana al dispositivo y el dispositivo al teléfono', () => {
  assert.equal(resolveLang('en', 'es', ['es-PE']), 'en');
  assert.equal(resolveLang(undefined, 'en', ['es-PE']), 'en');
  assert.equal(resolveLang(null, 'xx', ['en-US']), 'en');
  assert.equal(resolveLang(undefined, null, []), 'es');
});

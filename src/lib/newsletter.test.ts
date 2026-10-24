import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNewsletterSignup } from './newsletter.ts';

test('acepta una suscripción válida y normaliza el correo', () => {
  const r = parseNewsletterSignup({ email: ' Ana@Gmail.com ', name: ' Ana ', consent: true, extra: 'x' });
  assert.ok(r.ok);
  assert.deepEqual(r.data, { email: 'ana@gmail.com', name: 'Ana', source: 'sitio' });
});

test('rechaza un correo inválido o sin autorización', () => {
  assert.equal(parseNewsletterSignup({ email: 'ana', consent: true }).ok, false);
  assert.equal(parseNewsletterSignup({ email: 'ana@gmail.com' }).ok, false);
  assert.equal(parseNewsletterSignup({ email: 'ana@gmail.com', consent: 'true' }).ok, false);
});

test('solo acepta orígenes conocidos', () => {
  const r = parseNewsletterSignup({ email: 'ana@gmail.com', consent: true, source: 'otro' });
  assert.ok(r.ok);
  assert.equal(r.data.source, 'sitio');
});

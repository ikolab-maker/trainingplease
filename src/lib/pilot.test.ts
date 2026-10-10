import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInvestorContact, parsePilotRequest } from './pilot.ts';

const valid = {
  name: ' Ana Pérez ', email: 'Ana@Gmail.com', phone: '+51 999 888 777', city: 'Lima',
  level: 'regular', weeklyKm: '10 a 25 km', raceName: '10K Callao', raceDate: '2027-04-18', raceKm: '10,5',
  consent: true, extra: 'se ignora',
};

test('acepta una solicitud válida y normaliza los campos', () => {
  const r = parsePilotRequest(valid);
  assert.ok(r.ok);
  assert.equal(r.data.name, 'Ana Pérez');
  assert.equal(r.data.email, 'ana@gmail.com');
  assert.equal(r.data.raceKm, 10.5);
  assert.equal(r.data.raceDate, '2027-04-18');
  assert.equal('extra' in r.data, false);
});

test('exige nombre, correo y consentimiento', () => {
  assert.equal(parsePilotRequest({ ...valid, name: '' }).ok, false);
  assert.equal(parsePilotRequest({ ...valid, email: 'no-es-correo' }).ok, false);
  assert.equal(parsePilotRequest({ ...valid, consent: 'true' }).ok, false);
  assert.equal(parsePilotRequest(null).ok, false);
});

test('descarta valores fuera de las opciones', () => {
  const r = parsePilotRequest({ ...valid, level: 'pro', weeklyKm: '999', raceDate: 'mañana', raceKm: '-3', phone: '' });
  assert.ok(r.ok);
  assert.equal(r.data.level, '');
  assert.equal(r.data.weeklyKm, '');
  assert.equal(r.data.raceDate, null);
  assert.equal(r.data.raceKm, null);
});

test('rechaza un teléfono con letras', () => {
  assert.equal(parsePilotRequest({ ...valid, phone: 'llámame' }).ok, false);
});

test('contacto de inversión', () => {
  assert.ok(parseInvestorContact({ name: 'Luis', email: 'l@x.pe', message: 'Hola', consent: true }).ok);
  assert.equal(parseInvestorContact({ name: 'Luis', email: 'l@x.pe', consent: false }).ok, false);
});

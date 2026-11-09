import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRaces, principalRace, racesFromLegacy, splitRaces, toGoalRace } from './races.ts';

const r = (o: Record<string, unknown>) => ({ id: 'a', name: 'Media de Lima', date: '2027-08-22', distanceKm: 21.1, principal: false, goalTimeMin: null, resultMin: null, ...o });

test('carreras: una sola principal y con meta de tiempo', () => {
  assert.match(parseRaces([r({ principal: true })]).error ?? '', /meta de tiempo/);
  assert.match(parseRaces([r({ principal: true, goalTimeMin: 115 }), r({ id: 'b', principal: true, goalTimeMin: 50 })]).error ?? '', /Solo una/);
  const ok = parseRaces([r({ id: 'b', date: '2026-12-06', distanceKm: 10 }), r({ principal: true, goalTimeMin: 115 })]);
  assert.equal(ok.error, undefined);
  assert.deepEqual(ok.races.map((x) => x.id), ['b', 'a']); // por fecha
  assert.deepEqual(toGoalRace(principalRace(ok.races)), { name: 'Media de Lima', date: '2027-08-22', distanceKm: 21.1 });
});

test('carreras: valida nombre, fecha, distancia y tiempos', () => {
  assert.ok(parseRaces([r({ name: '' })]).error);
  assert.ok(parseRaces([r({ date: '22/08/2027' })]).error);
  assert.ok(parseRaces([r({ distanceKm: -1 })]).error);
  assert.ok(parseRaces([r({ resultMin: 1 })]).error);
  assert.ok(parseRaces('x').error);
});

test('carreras: la carrera objetivo de antes entra como principal; próximas y corridas', () => {
  const legacy = racesFromLegacy(undefined, { name: '10K Callao', date: '2026-10-25', distanceKm: 10 });
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].principal, true);
  const { upcoming, past } = splitRaces([r({}), r({ id: 'b', date: '2026-10-25' })], '2026-11-09');
  assert.deepEqual([upcoming.map((x) => x.id), past.map((x) => x.id)], [['a'], ['b']]);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { equivalentRange, fitnessIndex, fmtPace, fmtTime, goalCheck, parseReference, parseTime, raceTimeMin, trainingPaces } from './fitness.ts';

test('índice de forma: reproduce las cifras publicadas del libro', () => {
  assert.equal(fmtTime(raceTimeMin(60, 5)), '17:03'); // "un VDOT de 60 corresponde a un 5K en 17:03"
  assert.equal(fmtTime(raceTimeMin(50, 5)), '19:56');
});

test('índice de forma: atletas del piloto', () => {
  const claudia = fitnessIndex(10, parseTime('1:05:15')!);
  assert.equal(claudia.toFixed(1), '29.2');
  assert.equal(fmtTime(raceTimeMin(claudia, 21.0975)), '2:24:25');
  const ronnil = fitnessIndex(12, parseTime('1:05:52')!);
  assert.equal(ronnil.toFixed(1), '36.4');
  assert.equal(fmtTime(raceTimeMin(ronnil, 21.0975)), '2:00:17');
  const p = trainingPaces(ronnil);
  assert.equal(fmtPace(p.easy[0]), '6:18');
  assert.equal(fmtPace(p.easy[1]), '7:32');
  assert.equal(fmtPace(p.threshold), '5:30');
  assert.equal(fmtPace(p.interval), '5:04');
  assert.equal(fitnessIndex(10, 56).toFixed(1), '35.0');
});

test('meta: rango con Riegel y lectura según las semanas que faltan', () => {
  const ref = { label: '12 km', distanceKm: 12, timeMin: parseTime('1:05:52')!, date: '2026-09-26', maxEffort: false };
  const [lo, hi] = equivalentRange(ref, 21.0975);
  assert.equal(fmtTime(lo), '1:59:47');
  assert.equal(fmtTime(hi), '2:01:09');
  const g = goalCheck(ref, { distanceKm: 21.0975, timeMin: 110 }, 2);
  assert.equal(g.goalIndex.toFixed(1), '40.4');
  assert.ok(g.gapPct > 8 && g.gapPct < 9);
  assert.equal(g.label, 'poco realista para esta carrera');
  assert.equal(goalCheck(ref, { distanceKm: 21.0975, timeMin: 110 }, 8).label, 'ambiciosa');
  assert.equal(goalCheck(ref, { distanceKm: 21.0975, timeMin: 125 }, 2).label, 'al alcance con la forma actual');
});

test('tiempos y referencias: se validan', () => {
  assert.equal(parseTime('56:00'), 56);
  assert.equal(parseTime('65:15'), 65.25);
  assert.equal(parseTime('1:65:00'), null);
  assert.equal(parseTime('abc'), null);
  assert.deepEqual(parseReference({ label: 'BBVA', distanceKm: 10, timeMin: 65.25, date: '2026-06-01', maxEffort: true }),
    { label: 'BBVA', distanceKm: 10, timeMin: 65.25, date: '2026-06-01', maxEffort: true });
  assert.equal(parseReference({ distanceKm: 10, timeMin: 20, date: '2026-06-01' }), null); // 10K en 20 min: imposible
  assert.equal(parseReference({ distanceKm: 10, timeMin: 65, date: 'ayer' }), null);
});

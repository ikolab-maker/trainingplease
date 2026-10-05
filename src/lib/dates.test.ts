import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoWeekId, mondayOf, sessionStatus, compliance, rangeLabel, daysUntil } from './dates.ts';
import type { Session } from './types.ts';

test('semana ISO', () => {
  assert.equal(isoWeekId('2026-10-04'), '2026-W40'); // domingo
  assert.equal(isoWeekId('2026-09-28'), '2026-W40'); // lunes
  assert.equal(isoWeekId('2027-01-01'), '2026-W53');
  assert.equal(isoWeekId('2026-01-01'), '2026-W01');
});

test('lunes de la semana', () => {
  assert.equal(mondayOf('2026-10-04'), '2026-09-28');
  assert.equal(mondayOf('2026-09-28'), '2026-09-28');
});

test('rango de semana', () => {
  assert.equal(rangeLabel('2026-09-21'), '21 al 27 de septiembre');
  assert.equal(rangeLabel('2026-09-28'), '28 de septiembre al 4 de octubre');
});

test('estado de sesión con margen hasta el día siguiente', () => {
  const s = { date: '2026-10-01', sport: 'running' as const };
  assert.equal(sessionStatus(s, undefined, '2026-10-01'), 'today');
  assert.equal(sessionStatus(s, undefined, '2026-10-02'), 'late');
  assert.equal(sessionStatus(s, undefined, '2026-10-03'), 'missed');
  assert.equal(sessionStatus(s, { done: true }, '2026-10-03'), 'done');
  assert.equal(sessionStatus(s, undefined, '2026-09-30'), 'upcoming');
  assert.equal(sessionStatus({ date: '2026-09-01', sport: 'descanso' }, undefined, '2026-10-03'), 'rest');
});

test('cumplimiento', () => {
  const base = { sport: 'running' as const, title: '', durationMin: null, distanceKm: null, rpe: null, steps: [] as string[], core: true };
  const sessions: Session[] = [
    { ...base, id: 'a', date: '2026-09-28' },
    { ...base, id: 'b', date: '2026-09-29' },
    { ...base, id: 'c', date: '2026-10-03' }, // late
    { ...base, id: 'd', date: '2026-10-05' }, // futura, hecha por adelantado
    { ...base, id: 'e', date: '2026-09-30', core: false },
  ];
  const c = compliance(sessions, { a: { done: true }, d: { done: true } }, '2026-10-04');
  assert.deepEqual(c, { planned: 3, done: 2, pct: 67 });
  assert.equal(compliance([], {}, '2026-10-04').pct, null);
});

test('días hasta la carrera', () => {
  assert.equal(daysUntil('2027-08-22', '2026-10-04'), 322);
});

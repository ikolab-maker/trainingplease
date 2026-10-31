import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gamificationOn, scoreWeek, summarize, POINTS } from './gamification.ts';
import type { Session } from './types.ts';

const S = (id: string, date: string, extra: Partial<Session> = {}): Session => ({
  id, date, sport: 'running', title: id, durationMin: 40, distanceKm: 6, rpe: 4, steps: [], core: true, ...extra,
});
// Semana 2026-W43: lunes 19/10
const w43 = { id: '2026-W43', start: '2026-10-19' };
const week = [S('a', '2026-10-20'), S('b', '2026-10-22'), S('c', '2026-10-24'), S('d', '2026-10-25'), S('r', '2026-10-21', { sport: 'descanso', core: false })];
const AFTER = '2026-10-28';

test('semana completa: sesiones, RPE, comentario y bono', () => {
  const logs = {
    a: { done: true, rpe: 4, comment: 'Suave, piernas frescas todo el rato' },
    b: { done: true, rpe: 5, comment: '' },
    c: { done: true, rpe: null, comment: 'ok' },
    d: { done: true, rpe: 6, comment: 'Fondo bien, al final algo cansado' },
  };
  const w = scoreWeek(w43, week, logs, AFTER);
  assert.equal(w.state, 'ok');
  assert.equal(w.pct, 100);
  assert.deepEqual(w.points, { sessions: 40, rpe: 9, comments: 10, bonus: 30, notice: 0, total: 89 });
});

test('extras y descanso no dan puntos', () => {
  const extra = S('x', '2026-10-23', { core: false, distanceKm: 20 });
  const w = scoreWeek(w43, [extra], { x: { done: true, rpe: 5, comment: 'Me metí 20 km extra porque sí' } }, AFTER);
  assert.equal(w.points.total, 0);
  assert.equal(w.state, 'frozen');
  assert.equal(w.reason, 'noPlan');
});

test('comentario repetido cuenta una vez', () => {
  const t = 'Todo bien, sin novedades hoy';
  const w = scoreWeek(w43, week, { a: { done: true, rpe: null, comment: t }, b: { done: true, rpe: null, comment: t + '  ' } }, AFTER);
  assert.equal(w.points.comments, POINTS.comment);
});

test('bajo 80 %: corta la racha, salvo dolor o semana congelada', () => {
  const logs = { a: { done: true, rpe: 4, comment: '' }, b: { done: true, rpe: 4, comment: '' } };
  assert.equal(scoreWeek(w43, week, logs, AFTER).state, 'broken');
  const pain = { ...logs, c: { done: false, rpe: null, comment: 'No salí, me duele la rodilla derecha' } };
  const p = scoreWeek(w43, week, pain, AFTER);
  assert.equal(p.state, 'frozen');
  assert.equal(p.reason, 'health');
  assert.equal(p.points.comments, POINTS.comment); // contar el dolor también suma
  assert.equal(scoreWeek({ ...w43, frozen: true }, week, logs, AFTER).reason, 'coach');
});

test('semana en curso no corta la racha', () => {
  assert.equal(scoreWeek(w43, week, { a: { done: true, rpe: 4, comment: '' } }, '2026-10-22').state, 'open');
  // el domingo aún se puede marcar el lunes
  const almost = { a: { done: true, rpe: 4, comment: '' }, b: { done: true, rpe: 4, comment: '' }, c: { done: true, rpe: 4, comment: '' } };
  assert.equal(scoreWeek(w43, week, almost, '2026-10-26').state, 'open');
  assert.equal(scoreWeek(w43, week, almost, '2026-10-27').state, 'broken'); // 3 de 4 = 75 %
  assert.equal(scoreWeek(w43, week, { ...almost, d: { done: true, rpe: 6, comment: '' } }, '2026-10-25').state, 'ok'); // completa antes de cerrar
});

test('avisos para la semana siguiente suman', () => {
  const w = scoreWeek(w43, week, { 'aviso-2026-W44': { done: false, rpe: null, comment: 'Viajo el jueves' } }, AFTER);
  assert.equal(w.points.notice, POINTS.notice);
});

test('racha: congeladas no cortan, rotas sí; récord', () => {
  const weeks = ['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26'].map((start, i) => ({ id: `2026-W${40 + i}`, start, frozen: i === 1 }));
  const sessions = weeks.map((w, i) => S(`s${i}`, w.start));
  const done = (_id: string) => ({ done: true, rpe: null, comment: '' });
  // W40 ok, W41 sin hacer pero congelada, W42 ok, W43 rota, W44 ok
  const logs = { s0: done('s0'), s2: done('s2'), s4: done('s4') };
  const g = summarize(weeks, sessions, logs, '2026-11-10');
  assert.deepEqual(g.weeks.map((w) => w.state), ['ok', 'frozen', 'ok', 'broken', 'ok']);
  assert.equal(g.best, 2);
  assert.equal(g.streak, 1);
});

test('apagado para menores o si el coach lo apaga', () => {
  assert.equal(gamificationOn({ profile: { age: '15' } }), false);
  assert.equal(gamificationOn({ profile: { age: '34' } }), true);
  assert.equal(gamificationOn({ profile: {} }), true);
  assert.equal(gamificationOn({ gamification: false, profile: { age: '40' } }), false);
});

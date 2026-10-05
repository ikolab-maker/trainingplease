import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parsePlanFile } from './planFile.ts';

const base = () => [{
  id: '2026-W41',
  week: { start: '2026-10-05', title: 'Semana 3', notes: [{ title: 'Nota', body: 'x' }] },
  sessions: [{ id: 'sem-03-lun', date: '2026-10-05', sport: 'gimnasio', title: 'Gym', durationMin: 45, distanceKm: null, rpe: 6, steps: ['a'], core: true, extra: 'se ignora' }],
}];

test('acepta un plan válido y descarta campos desconocidos', () => {
  const { plan, errors } = parsePlanFile(base());
  assert.deepEqual(errors, []);
  assert.equal(plan[0].sessions[0].sport, 'gimnasio');
  assert.equal('extra' in plan[0].sessions[0], false);
  assert.equal('phase' in plan[0].week, false); // ausente: no borra el existente
});

test('rechaza deporte, fecha fuera de la semana, core y lunes', () => {
  const p = base();
  p[0].sessions[0].sport = 'yoga';
  p[0].sessions[0].date = '2026-10-12';
  (p[0].sessions[0] as any).core = 'si';
  const { errors } = parsePlanFile(p);
  assert.equal(errors.length, 3);
  const q = base();
  q[0].week.start = '2026-10-06';
  assert.match(parsePlanFile(q).errors.join(' '), /lunes/);
  const r = base();
  r[0].id = '2026-W42';
  assert.match(parsePlanFile(r).errors.join(' '), /no cae en esa semana/);
});

test('rechaza lo que no es una lista de semanas', () => {
  assert.equal(parsePlanFile(null).errors.length, 1);
  assert.equal(parsePlanFile([]).errors.length, 1);
});

const real = '/mnt/project-files/train-please/atletas/claudia/propuestas/2026-W41.json';
test('la propuesta real de la semana 41 es válida', { skip: !existsSync(real) }, () => {
  const { plan, errors } = parsePlanFile(JSON.parse(readFileSync(real, 'utf8')));
  assert.deepEqual(errors, []);
  assert.equal(plan[0].id, '2026-W41');
});

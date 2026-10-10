import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { suggestDecision, weekMetrics } from './metrics.ts';
import { checkProposal, type GuardContext } from './guardrails.ts';
import { OUTPUT_SCHEMA, toPlanFile, type AgentOutput } from './proposal.ts';
import type { Session } from '../types.ts';

const ses = (id: string, date: string, sport: Session['sport'], km: number | null, rpe: number | null, core = true): Session =>
  ({ id, date, sport, title: id, durationMin: null, distanceKm: km, rpe, steps: [], core });

const week = { id: '2026-W41', start: '2026-10-05', phase: 'Construcción' };
const sessions = [
  ses('lun', '2026-10-05', 'gimnasio', null, 6),
  ses('mar', '2026-10-06', 'running', 8, 4),
  ses('jue', '2026-10-08', 'running', 8, 4),
  ses('vie', '2026-10-09', 'descanso', null, null, false),
  ses('sab', '2026-10-10', 'running', 6, 7),
  ses('dom', '2026-10-11', 'fondo', 16, 5),
];

test('métricas: cumplimiento sin contar descanso ni lo pendiente del domingo', () => {
  const logs = { lun: { done: true, rpe: 6, comment: '' }, mar: { done: true, rpe: 5, comment: 'bien' }, sab: { done: true, rpe: 7, comment: '' } };
  const m = weekMetrics(week, sessions, logs, '2026-10-11');
  assert.equal(m.corePlanned, 4); // lun, mar, jue (saltada), sab
  assert.equal(m.coreDone, 3);
  assert.equal(m.compliancePct, 75);
  assert.equal(m.corePending, 1); // el fondo del domingo
  assert.equal(m.kmPlanned, 38);
  assert.equal(m.kmDone, 14);
  assert.deepEqual(m.missedCore, ['jue']);
  assert.equal(suggestDecision(m).decision, 'mantener');
});

test('métricas: dolor en el comentario manda descarga', () => {
  const logs = { mar: { done: true, rpe: 4, comment: 'Me molestó la rodilla derecha al final' } };
  const m = weekMetrics(week, sessions, logs, '2026-10-12');
  assert.equal(m.painMentions.length, 1);
  assert.equal(suggestDecision(m).decision, 'descarga');
});

test('métricas: RPE alto dos veces en rodaje suave manda descarga; sin registros, sin datos', () => {
  const logs = { mar: { done: true, rpe: 8, comment: '' }, jue: { done: true, rpe: 9, comment: '' } };
  assert.equal(suggestDecision(weekMetrics(week, sessions, logs, '2026-10-12')).decision, 'descarga');
  assert.equal(suggestDecision(weekMetrics(week, sessions, null, '2026-10-12')).decision, 'sin-datos');
});

test('decisión: progresa con buen cumplimiento y descarga por calendario', () => {
  const logs = Object.fromEntries(sessions.map((s) => [s.id, { done: true, rpe: s.rpe, comment: '' }]));
  const m = weekMetrics(week, sessions, logs, '2026-10-12');
  assert.equal(suggestDecision(m).decision, 'progresar');
  assert.equal(suggestDecision(m, { weeksSinceDeload: 3 }).decision, 'descarga');
});

const ctx: GuardContext = {
  weekId: '2026-W42', start: '2026-10-12', decision: 'progresar', painAlert: false,
  prevKm: 30, recentMaxKm: 30, prevWasDeload: false, raceDate: '2027-08-22',
};

const out = (kms: number[], rpe = 4): AgentOutput => ({
  decision: 'progresar', decisionRule: 'r', summary: 's', alerts: [], questionsForAthlete: [], coachMessage: 'c', memoryRow: 'm',
  week: { title: 'Semana 4', phase: 'Construcción', goal: 'g', notes: [] },
  sessions: kms.map((km, i) => ({
    id: `w42-${i}`, date: `2026-10-${String(12 + i).padStart(2, '0')}`, sport: i === kms.length - 1 ? 'fondo' : 'running', title: `S${i}`,
    summary: '', durationMin: null, distanceKm: km, rpe, steps: ['x'], focus: '', tip: '', core: true,
  })),
});

test('Guardián: acepta +10 % y rechaza más', () => {
  assert.deepEqual(checkProposal(toPlanFile(out([8, 8, 17]), '2026-W42', '2026-10-12'), ctx).issues, []);
  const { issues, km } = checkProposal(toPlanFile(out([10, 10, 16]), '2026-W42', '2026-10-12'), ctx);
  assert.equal(km, 36);
  assert.match(issues.join(), /Sube demasiado/);
});

test('Guardián: descarga baja km y quita calidad; dolor pide nota de qué hacer', () => {
  const { issues } = checkProposal(toPlanFile(out([8, 8, 10], 8), '2026-W42', '2026-10-12'), { ...ctx, decision: 'descarga', painAlert: true });
  assert.match(issues.join('|'), /descarga baja 30/);
  assert.match(issues.join('|'), /no va calidad/);
  assert.match(issues.join('|'), /posible dolor/);
});

test('Guardián: la semana de carrera respeta el taper y la semana debe ser la pedida', () => {
  const race = { ...ctx, raceDate: '2026-10-18' }; // domingo de la semana propuesta
  assert.match(checkProposal(toPlanFile(out([10, 8, 8, 8, 8, 21]), '2026-W42', '2026-10-12'), race).issues.join(), /taper/);
  assert.deepEqual(checkProposal(toPlanFile(out([6, 5, 4, 21]), '2026-W42', '2026-10-12'), { ...race, raceDate: '2026-10-15' }).issues, []);
  assert.match(checkProposal(toPlanFile(out([8]), '2026-W43', '2026-10-19'), ctx).issues.join(), /debe ser 2026-W42/);
});

test('esquema de salida estricto: todo objeto cierra propiedades y las exige', () => {
  const walk = (s: any) => {
    if (s?.type === 'object') {
      assert.equal(s.additionalProperties, false);
      assert.deepEqual([...s.required].sort(), Object.keys(s.properties).sort());
      Object.values(s.properties).forEach(walk);
    }
    if (s?.items) walk(s.items);
  };
  walk(OUTPUT_SCHEMA);
});

test('Guardián: las propuestas W41 que Chris ya revisó pasan el formato', { skip: !existsSync('/mnt/project-files/train-please/atletas') }, () => {
  for (const name of ['claudia', 'manuel', 'ronnil']) {
    const raw = JSON.parse(readFileSync(`/mnt/project-files/train-please/atletas/${name}/propuestas/2026-W41.json`, 'utf8'));
    const { issues } = checkProposal(raw, { ...ctx, weekId: '2026-W41', start: '2026-10-05', prevKm: null, raceDate: null });
    assert.deepEqual(issues, [], name);
  }
});

test('Ajuste: conserva ids y no toca lo ya registrado', async () => {
  const { checkAdjustment } = await import('./guardrails.ts');
  const original = [ses('w41-jue', '2026-10-08', 'running', 8, 4), ses('w41-sab', '2026-10-10', 'fondo', 16, 5), ses('w41-dom', '2026-10-11', 'descanso', null, null, false)];
  const moved = [{ id: '2026-W41', week: { start: '2026-10-05', title: 'S' }, sessions: [
    { ...original[0] }, { ...original[1], date: '2026-10-11' }, { ...original[2], date: '2026-10-10' },
  ] }];
  assert.deepEqual(checkAdjustment(moved as never, original, [original[0]]), []);
  const broken = [{ ...moved[0], sessions: [{ ...original[0], date: '2026-10-09' }, { ...original[1], id: 'nuevo' }] }];
  const issues = checkAdjustment(broken as never, original, [original[0]]).join('|');
  assert.match(issues, /Faltan sesiones.*w41-sab.*w41-dom/);
  assert.match(issues, /w41-jue.*no se puede cambiar/);
});

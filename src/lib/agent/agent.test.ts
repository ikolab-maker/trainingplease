import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { effectiveKm, longestRecentRun, suggestDecision, weekMetrics } from './metrics.ts';
import { checkProposal, type GuardContext } from './guardrails.ts';
import { OUTPUT_SCHEMA, sessionExtras, toPlanFile, type AgentOutput, type QualityWork } from './proposal.ts';
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
  prevKm: 30, recentMaxKm: 30, prevWasDeload: false, race: { date: '2027-08-22', distanceKm: 21.1 },
};

const out = (kms: number[], rpe = 4, more: Partial<AgentOutput['sessions'][number]>[] = []): AgentOutput => ({
  decision: 'progresar', decisionRule: 'r', summary: 's', alerts: [], questionsForAthlete: [], coachMessage: 'c', memoryRow: 'm',
  week: { title: 'Semana 4', phase: 'Construcción', goal: 'g', notes: [] },
  sessions: kms.map((km, i) => ({
    id: `w42-${i}`, date: `2026-10-${String(12 + i).padStart(2, '0')}`, sport: i === kms.length - 1 ? 'fondo' : 'running', title: `S${i}`,
    summary: '', durationMin: null, distanceKm: km, rpe, steps: ['x'], focus: '', tip: '', core: true, race: false, work: [],
    ...more[i],
  })),
});
const plan = (o: AgentOutput) => toPlanFile(o, '2026-W42', '2026-10-12');
const check = (o: AgentOutput, c: Partial<GuardContext> = {}) => checkProposal(plan(o), { ...ctx, ...c }, sessionExtras(o));
const work = (zone: QualityWork['zone'], km: number, repMin: number | null = null): QualityWork[] => [{ zone, km, repMin }];

test('Guardián: +20 % es el tope duro de la semana y +30 % el de dos semanas', () => {
  assert.deepEqual(check(out([10, 11, 15])).issues, []); // 36 km: +20 %
  const { issues, km } = check(out([12, 12, 16]));
  assert.equal(km, 40);
  assert.match(issues.join(), /Sube demasiado: 40 km/);
  assert.match(check(out([10, 11, 15]), { prev2Km: 26 }).issues.join(), /dos semanas/); // 36 > 26 × 1,3
});

test('Guardián: descarga baja km y quita calidad; dolor pide nota de qué hacer', () => {
  const { issues } = checkProposal(plan(out([8, 8, 10], 8)), { ...ctx, decision: 'descarga', painAlert: true });
  assert.match(issues.join('|'), /descarga baja 30/);
  assert.match(issues.join('|'), /no va calidad/);
  assert.match(issues.join('|'), /posible dolor/);
});

test('Guardián: la semana de carrera respeta el taper y la semana debe ser la pedida', () => {
  const race = { ...ctx, race: { date: '2026-10-18', distanceKm: 21.1 } }; // domingo de la semana propuesta
  assert.match(checkProposal(plan(out([10, 8, 8, 8, 8, 21])), race).issues.join(), /taper/);
  assert.deepEqual(checkProposal(plan(out([6, 5, 4, 21])), { ...race, race: { date: '2026-10-15', distanceKm: 21.1 } }).issues, []);
  assert.match(checkProposal(toPlanFile(out([8]), '2026-W43', '2026-10-19'), ctx).issues.join(), /debe ser 2026-W42/);
});

test('Guardián: taper de media desde la semana anterior y de 10K solo en la semana de carrera', () => {
  const half = { race: { date: '2026-10-25', distanceKm: 21.1 } }; // domingo de la semana siguiente
  assert.match(check(out([8, 8, 12]), half).issues.join(), /taper empieza ya.*24,5/); // 28 km > 80 % de 30
  assert.deepEqual(check(out([7, 7, 10]), half).issues, []);
  assert.deepEqual(check(out([8, 8, 12]), { race: { date: '2026-10-25', distanceKm: 10 } }).issues, []);
  // Semana de un 10K: sin contarlo, hasta 70 % del volumen normal.
  assert.match(check(out([8, 8, 6, 10]), { race: { date: '2026-10-15', distanceKm: 10 } }).issues.join(), /taper permite hasta 21,5/);
});

test('Guardián: ninguna salida más de 10 % sobre la más larga de 30 días; la carrera avisa', () => {
  const r = check(out([8, 8, 18]), { longestRecentKm: 16 });
  assert.match(r.issues.join(), /supera en más de 10 %.*máximo 17,6 km/);
  assert.deepEqual(check(out([8, 8, 17.6]), { longestRecentKm: 16 }).issues.filter((i) => /10 %/.test(i)), []);
  const race = check(out([6, 5, 4, 21.1]), { longestRecentKm: 16, race: { date: '2026-10-15', distanceKm: 21.1 } });
  assert.deepEqual(race.issues, []);
  assert.match(race.warnings.join(), /salto de \+32 %/);
});

test('Guardián: el fondo va hasta 150 min y pesa hasta 50 % con 3 o 4 días', () => {
  assert.match(check(out([5, 5, 20]), { prevKm: 28, easyPaceSecPerKm: 480 }).issues.join(), /dura unos 160 min/);
  assert.match(check(out([5, 5, 12])).issues.join(), /es el 55 % de la semana/);
  const ok = check(out([7, 7, 10]));
  assert.deepEqual(ok.issues, []);
  assert.match(ok.warnings.join(), /42 %/);
});

test('Guardián: topes de Daniels por sesión y declaración del trabajo de calidad', () => {
  // 30 km en la semana: T hasta 3 km, I hasta 2,4 km en series de 5 min, R hasta 1,5 km en series de 2 min.
  assert.deepEqual(check(out([10, 10, 10], 4, [{ rpe: 7, work: work('T', 3) }])).issues, []);
  assert.match(check(out([10, 10, 10], 4, [{ rpe: 7, work: work('T', 4) }])).issues.join(), /4 km a ritmo de umbral pasan el tope de 3 km/);
  assert.match(check(out([10, 10, 10], 4, [{ rpe: 8, work: work('I', 2, 6) }])).issues.join(), /intervalos van hasta 5 min/);
  assert.match(check(out([10, 10, 10], 4, [{ rpe: 8, work: work('R', 2, 1) }])).issues.join(), /repeticiones pasan el tope de 1,5 km/);
  assert.match(check(out([10, 10, 10], 4, [{ rpe: 7 }])).issues.join(), /declara en work/);
});

test('Guardián: cuántas sesiones de calidad y nunca dos días duros seguidos', () => {
  const rest = { sport: 'descanso', distanceKm: null, rpe: null, core: false };
  const t = { rpe: 7, work: work('T', 2) };
  const i = { rpe: 8, work: work('I', 2, 3) };
  // 3 días de carrera (lun, mié, vie): solo 1 sesión de calidad.
  assert.match(check(out([8, 0, 8, 0, 10], 4, [t, rest, i, rest])).issues.join(), /2 sesiones de calidad.*con 3 días de carrera van como máximo 1/);
  assert.deepEqual(check(out([8, 0, 8, 0, 10], 4, [t, rest, {}, rest])).issues, []);
  // 4 días: 2 solo si no hubo dolor en las semanas recientes.
  const four = out([7, 0, 7, 6, 0, 10], 4, [t, rest, i, {}, rest]);
  assert.match(check(four).issues.join(), /como máximo 1/);
  assert.deepEqual(check(four, { painFreeWeeks: true }).issues, []);
  // Dos días duros seguidos.
  assert.match(check(out([7, 7, 0, 6, 0, 10], 4, [t, i, rest, {}, rest]), { painFreeWeeks: true }).issues.join(), /dos días duros seguidos \(2026-10-12 y 2026-10-13\)/);
});

test('Guardián: después de una carrera, 1 día suave por cada 3 km', () => {
  const tune = out([6, 0, 0, 0, 0, 10, 4], 4, [{}, { sport: 'descanso', distanceKm: null, rpe: null, core: false }, {}, {}, {}, { race: true, rpe: 9 }, {}]);
  // Carrera el sábado 17 y el domingo 18 suave: pasa. Con calidad el domingo: demasiado pronto.
  const ok = check(tune, { prevKm: 30 });
  assert.deepEqual(ok.issues, []);
  const bad = out([6, 0, 0, 0, 0, 10, 4], 4, [{}, { sport: 'descanso', distanceKm: null, rpe: null, core: false }, {}, {}, {}, { race: true, rpe: 9 }, { rpe: 7, work: work('T', 1) }]);
  assert.match(check(bad, { prevKm: 30 }).issues.join('|'), /van 4 días suaves.*demasiado pronto/);
  // La carrera objetivo fue el domingo anterior (media): la semana siguiente empieza suave.
  assert.match(check(out([8, 8, 10], 4, [{ rpe: 7, work: work('T', 2) }]), { race: { date: '2026-10-11', distanceKm: 21.1 } }).issues.join(), /van 8 días suaves/);
});

test('Guardián: en un ajuste las reglas de estructura avisan sin bloquear', () => {
  const o = out([5, 5, 12]);
  assert.match(check(o).issues.join(), /55 %/);
  const adj = check(o, { mode: 'ajuste' });
  assert.deepEqual(adj.issues, []);
  assert.match(adj.warnings.join(), /55 %/);
});

test('Análisis: enfermedad manda descarga; km efectivos y salida más larga de 30 días', () => {
  const logs = { mar: { done: true, rpe: 4, comment: 'Tuve fiebre el miércoles' } };
  const m = weekMetrics(week, sessions, logs, '2026-10-12');
  assert.equal(m.illnessMentions.length, 1);
  assert.match(suggestDecision(m).rule, /enfermedad/);
  // mar hecho (8) y jue saltado; sab y dom aún no vencen el sábado.
  const partial = { mar: { done: true, rpe: 4, comment: '' } };
  assert.equal(effectiveKm(sessions, partial, '2026-10-10'), 30);
  assert.equal(effectiveKm(sessions, {}, '2026-10-10'), 38); // sin registros: lo planificado
  assert.deepEqual(longestRecentRun(sessions, partial, '2026-10-12'), { km: 8, source: 'registros' });
  assert.deepEqual(longestRecentRun(sessions, partial, '2026-10-11'), { km: 16, source: 'registros' }); // el fondo de hoy cuenta
  assert.deepEqual(longestRecentRun(sessions, {}, '2026-10-12'), { km: 16, source: 'plan' });
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
    const { issues } = checkProposal(raw, { ...ctx, weekId: '2026-W41', start: '2026-10-05', prevKm: null, race: null });
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

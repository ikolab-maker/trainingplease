// Lo que el agente principal le devuelve al harness: esquema de salida estructurada
// y su conversión al formato de plan de la app (el mismo de scripts/seed-plan.mjs).

import { SPORT_KEYS } from '../sports.ts';
import type { PlanWeekFile } from '../planFile.ts';
import { DECISIONS, type Decision } from './metrics.ts';

/** Trabajo de calidad que el modelo declara por sesión (zona de Daniels y km a ese ritmo). El Guardián lo topa. */
export interface QualityWork { zone: 'M' | 'T' | 'I' | 'R'; km: number; repMin: number | null }
export const WORK_ZONES = ['M', 'T', 'I', 'R'] as const;

export interface AgentOutput {
  decision: Decision;
  decisionRule: string;
  summary: string;
  alerts: string[];
  questionsForAthlete: string[];
  coachMessage: string;
  memoryRow: string;
  week: { title: string; phase: string; goal: string; notes: { title: string; body: string }[] };
  sessions: {
    id: string; date: string; sport: string; title: string; summary: string;
    durationMin: number | null; distanceKm: number | null; rpe: number | null;
    steps: string[]; focus: string; tip: string; core: boolean;
    race: boolean; // carrera o test a tope
    work: QualityWork[]; // vacío en sesiones suaves
  }[];
}

const str = { type: 'string' } as const;
const strList = { type: 'array', items: str } as const;
const numOrNull = { anyOf: [{ type: 'number' }, { type: 'null' }] } as const;
const obj = (properties: Record<string, unknown>) => ({
  type: 'object', additionalProperties: false, properties, required: Object.keys(properties),
});

/** Esquema JSON de la salida (structured outputs de la Claude API). */
export const OUTPUT_SCHEMA = obj({
  decision: { type: 'string', enum: DECISIONS },
  decisionRule: str,
  summary: str,
  alerts: strList,
  questionsForAthlete: strList,
  coachMessage: str,
  memoryRow: str,
  week: obj({
    title: str, phase: str, goal: str,
    notes: { type: 'array', items: obj({ title: str, body: str }) },
  }),
  sessions: {
    type: 'array',
    items: obj({
      id: str, date: str, sport: { type: 'string', enum: SPORT_KEYS }, title: str, summary: str,
      durationMin: numOrNull, distanceKm: numOrNull, rpe: numOrNull,
      steps: strList, focus: str, tip: str, core: { type: 'boolean' },
      race: { type: 'boolean' },
      work: { type: 'array', items: obj({ zone: { type: 'string', enum: WORK_ZONES }, km: { type: 'number' }, repMin: numOrNull }) },
    }),
  },
});

/** Lo que la app no guarda pero el Guardián revisa: carreras y trabajo de calidad por sesión. */
export function sessionExtras(out: AgentOutput): Record<string, { race: boolean; work: QualityWork[] }> {
  return Object.fromEntries(out.sessions.map((s) => [s.id, { race: s.race === true, work: Array.isArray(s.work) ? s.work : [] }]));
}

/** Arma el archivo de plan con la semana y el lunes que fija el harness, siempre marcado como IA. */
export function toPlanFile(out: AgentOutput, weekId: string, start: string): PlanWeekFile[] {
  return [{
    id: weekId,
    week: { start, title: out.week.title, phase: out.week.phase, goal: out.week.goal, aiAssisted: true, notes: out.week.notes },
    sessions: out.sessions.map(({ race: _race, work: _work, ...s }) => ({ ...s, sport: s.sport as PlanWeekFile['sessions'][number]['sport'] })),
  }];
}

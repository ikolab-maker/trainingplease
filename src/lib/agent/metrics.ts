// Agente de Análisis: métricas de la semana calculadas en código (sin modelo).
// El agente principal recibe estos números como hechos y solo los interpreta.

import type { LogEntry, Session, Week } from '../types.ts';

/** Deportes que suman km de carrera. */
export const RUN_SPORTS = new Set(['running', 'fondo', 'tecnica']);

/** Palabras en los comentarios que el Guardián trata como posible dolor o lesión. */
const PAIN_RE = /dolor|duel[eo]|molest|lesi[oó]n|rodilla|tobillo|cadera|gemelo|pantorrilla|isquio|pinchazo|calambre|tir[oó]n|inflama|fisio/i;

export type Decision = 'descarga' | 'bajar' | 'mantener' | 'progresar' | 'sin-datos';
export const DECISIONS: Decision[] = ['descarga', 'bajar', 'mantener', 'progresar', 'sin-datos'];

export interface SessionRow {
  id: string;
  date: string;
  sport: string;
  title: string;
  core: boolean;
  distanceKm: number | null;
  rpeTarget: number | null;
  /** done: marcada · missed: pasó sin marcar · pending: hoy o después (la semana aún no termina) */
  status: 'done' | 'missed' | 'pending' | 'rest';
  rpeReal: number | null;
  comment: string;
}

export interface WeekMetrics {
  weekId: string;
  start: string;
  phase: string;
  logsAvailable: boolean;
  corePlanned: number; // principales que ya vencieron o se hicieron
  coreDone: number;
  compliancePct: number | null;
  corePending: number;
  kmPlanned: number;
  kmDone: number; // km de las sesiones de carrera marcadas como hechas (según el plan; la app no guarda km reales)
  rpeOverTarget: { id: string; title: string; target: number; real: number }[]; // real ≥ objetivo + 2
  easyRunHighRpe: { id: string; title: string; target: number; real: number }[]; // rodaje suave (obj ≤ 5) con RPE ≥ 8
  painMentions: { id: string; title: string; comment: string }[];
  missedCore: string[];
  rows: SessionRow[];
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

export function runKm(sessions: Pick<Session, 'sport' | 'distanceKm'>[]): number {
  return round1(sessions.reduce((n, s) => n + (RUN_SPORTS.has(s.sport) && s.distanceKm ? s.distanceKm : 0), 0));
}

/**
 * Métricas de una semana. `today` es la fecha de Lima en que corre el análisis: las sesiones
 * de hoy o posteriores sin registro cuentan como pendientes, no como saltadas (la semana
 * cierra el domingo al mediodía y el fondo del domingo puede no estar marcado aún).
 */
export function weekMetrics(
  week: Pick<Week, 'id' | 'start' | 'phase'>,
  sessions: Session[],
  logs: Record<string, Pick<LogEntry, 'done' | 'rpe' | 'comment'> | undefined> | null,
  today: string,
): WeekMetrics {
  const logsAvailable = logs != null;
  const rows: SessionRow[] = [...sessions].sort((a, b) => a.date.localeCompare(b.date)).map((s) => {
    const l = logs?.[s.id];
    const status: SessionRow['status'] = s.sport === 'descanso' ? 'rest'
      : l?.done ? 'done'
      : s.date >= today ? 'pending'
      : 'missed';
    return {
      id: s.id, date: s.date, sport: s.sport, title: s.title, core: s.core,
      distanceKm: s.distanceKm, rpeTarget: s.rpe, status,
      rpeReal: l?.rpe ?? null, comment: (l?.comment ?? '').trim(),
    };
  });

  const core = rows.filter((r) => r.core && r.status !== 'rest');
  const coreDone = core.filter((r) => r.status === 'done').length;
  const corePlanned = core.filter((r) => r.status === 'done' || r.status === 'missed').length;
  const rpeOverTarget: WeekMetrics['rpeOverTarget'] = [];
  const easyRunHighRpe: WeekMetrics['easyRunHighRpe'] = [];
  for (const r of rows) {
    if (r.rpeReal == null || r.rpeTarget == null) continue;
    if (r.rpeReal >= r.rpeTarget + 2) rpeOverTarget.push({ id: r.id, title: r.title, target: r.rpeTarget, real: r.rpeReal });
    if (RUN_SPORTS.has(r.sport) && r.rpeTarget <= 5 && r.rpeReal >= 8) easyRunHighRpe.push({ id: r.id, title: r.title, target: r.rpeTarget, real: r.rpeReal });
  }

  return {
    weekId: week.id,
    start: week.start,
    phase: week.phase ?? '',
    logsAvailable,
    corePlanned,
    coreDone,
    compliancePct: logsAvailable && corePlanned ? Math.round((coreDone / corePlanned) * 100) : null,
    corePending: core.filter((r) => r.status === 'pending').length,
    kmPlanned: runKm(sessions),
    kmDone: runKm(sessions.filter((s) => logs?.[s.id]?.done)),
    rpeOverTarget,
    easyRunHighRpe,
    painMentions: rows.filter((r) => r.comment && PAIN_RE.test(r.comment)).map((r) => ({ id: r.id, title: r.title, comment: r.comment })),
    missedCore: core.filter((r) => r.status === 'missed').map((r) => r.title),
    rows,
  };
}

export function isDeloadPhase(phase: string | undefined): boolean {
  return /descarga|taper|recuperaci/i.test(phase ?? '');
}

/**
 * Regla de decisión de 06-analisis-semanal.md, en el orden en que manda.
 * El modelo puede proponer otra decisión, pero el Guardián compara contra esta.
 */
export function suggestDecision(m: WeekMetrics, opts: { weeksSinceDeload?: number | null } = {}): { decision: Decision; rule: string } {
  if (m.painMentions.length) return { decision: 'descarga', rule: 'Comentario con posible dolor o molestia: descarga, nada de calidad y sugerir revisión profesional.' };
  if (m.rpeOverTarget.length >= 2) return { decision: 'descarga', rule: 'RPE real ≥ objetivo + 2 en 2 o más sesiones.' };
  if (m.easyRunHighRpe.length >= 2) return { decision: 'descarga', rule: 'RPE ≥ 8 en un rodaje suave dos veces.' };
  if (!m.logsAvailable || m.corePlanned === 0) return { decision: 'sin-datos', rule: 'Sin registros de la semana: se sigue el plan y se marca "sin datos".' };
  const pct = m.compliancePct ?? 0;
  if (pct < 70) return { decision: 'bajar', rule: 'Cumplimiento < 70 %: bajar 10–20 % y simplificar; preguntar la causa.' };
  if (pct < 90) return { decision: 'mantener', rule: 'Cumplimiento 70–89 %: mantener la carga, sin subir.' };
  if (opts.weeksSinceDeload != null && opts.weeksSinceDeload >= 3) return { decision: 'descarga', rule: `Toca descarga por calendario (${opts.weeksSinceDeload} semanas de carga seguidas).` };
  return { decision: 'progresar', rule: 'Cumplimiento ≥ 90 % y RPE en rango: progresar sin pasar de +10 % de km.' };
}

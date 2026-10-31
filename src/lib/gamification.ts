// Puntos y racha semanal (ver 15-gamificacion.md del proyecto).
// Premia cumplir el plan y contar cómo te fue, nunca hacer más: las sesiones extra y los km
// de más no suman. Todo se deriva de los registros (no hay un campo "puntos" que escribir).
// El agente no recibe nada de esto, para que la carga nunca dependa de los puntos.

import { addDays, compliance, isoWeekId, sessionStatus } from './dates.ts';
import { ILLNESS_RE, PAIN_RE } from './agent/metrics.ts';
import { noticeId } from './notice.ts';
import type { LogEntry, Session, UserDoc, Week } from './types.ts';

export const POINTS = {
  session: 10, // sesión principal hecha
  rpe: 3, // RPE real registrado en una sesión hecha
  comment: 5, // comentario de 20 caracteres o más (también si cuenta un dolor)
  week80: 20, // semana con cumplimiento ≥ 80 %
  week100: 10, // extra por semana al 100 %
  notice: 5, // avisos para la semana siguiente
} as const;
export const MIN_COMMENT = 20;
export const STREAK_PCT = 80;

/**
 * ok: suma a la racha · frozen: ni suma ni rompe (dolor o enfermedad, el coach la congeló o no
 * había sesiones principales) · broken: corta la racha · open: la semana sigue en curso.
 */
export type WeekState = 'ok' | 'frozen' | 'broken' | 'open';
export type FreezeReason = 'health' | 'coach' | 'noPlan';

export interface WeekScore {
  weekId: string;
  start: string;
  state: WeekState;
  reason?: FreezeReason;
  pct: number | null;
  points: { sessions: number; rpe: number; comments: number; bonus: number; notice: number; total: number };
}

export interface GameSummary {
  weeks: WeekScore[]; // en orden de fecha
  streak: number; // semanas seguidas ≥ 80 % (las congeladas no cortan)
  best: number;
  total: number;
}

type Logs = Record<string, Pick<LogEntry, 'done' | 'rpe' | 'comment'> | undefined>;

/** Apagado si el coach lo apagó o si el atleta es menor de edad (falta el consentimiento del tutor). */
export function gamificationOn(user: Pick<UserDoc, 'gamification' | 'profile'>): boolean {
  if (user.gamification === false) return false;
  const age = Number(String(user.profile?.age ?? '').replace(',', '.'));
  return !(Number.isFinite(age) && age > 0 && age < 18);
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export function scoreWeek(week: Pick<Week, 'id' | 'start' | 'frozen'>, sessions: Session[], logs: Logs, today: string): WeekScore {
  const core = sessions.filter((s) => s.core && s.sport !== 'descanso');
  const pts = { sessions: 0, rpe: 0, comments: 0, bonus: 0, notice: 0, total: 0 };
  const seen = new Set<string>();
  let health = false;

  for (const s of sessions) {
    const l = logs[s.id];
    const text = (l?.comment ?? '').trim();
    if (text && (PAIN_RE.test(text) || ILLNESS_RE.test(text))) health = true;
    if (!core.includes(s) || s.date > today) continue;
    if (l?.done) {
      pts.sessions += POINTS.session;
      if (l.rpe != null) pts.rpe += POINTS.rpe;
    }
    // Un comentario vale aunque la sesión no se haya hecho ("no pude, me dolía la rodilla"),
    // pero el mismo texto repetido en la semana cuenta una sola vez.
    if (text.length >= MIN_COMMENT && !seen.has(norm(text))) {
      seen.add(norm(text));
      pts.comments += POINTS.comment;
    }
  }
  if ((logs[noticeId(isoWeekId(addDays(week.start, 7)))]?.comment ?? '').trim()) pts.notice = POINTS.notice;

  const c = compliance(core, logs, today);
  const allDone = core.length > 0 && core.every((s) => logs[s.id]?.done);
  // Cerrada cuando ya no queda nada por marcar (el domingo se puede registrar hasta el lunes).
  const closed = allDone || core.every((s) => sessionStatus(s, logs[s.id], today) === 'done' || sessionStatus(s, logs[s.id], today) === 'missed');

  let state: WeekState;
  let reason: FreezeReason | undefined;
  if (core.length === 0) { state = 'frozen'; reason = 'noPlan'; }
  else if (!closed) state = 'open';
  else if ((c.pct ?? 0) >= STREAK_PCT) state = 'ok';
  else if (week.frozen) { state = 'frozen'; reason = 'coach'; }
  else if (health) { state = 'frozen'; reason = 'health'; }
  else state = 'broken';

  if (state === 'ok') pts.bonus = POINTS.week80 + (c.pct === 100 ? POINTS.week100 : 0);
  pts.total = pts.sessions + pts.rpe + pts.comments + pts.bonus + pts.notice;
  return { weekId: week.id, start: week.start, state, reason, pct: c.pct, points: pts };
}

export function summarize(weeks: Pick<Week, 'id' | 'start' | 'frozen'>[], sessions: Session[], logs: Logs, today: string): GameSummary {
  const byWeek = new Map<string, Session[]>();
  for (const s of sessions) {
    const id = isoWeekId(s.date);
    byWeek.set(id, [...(byWeek.get(id) ?? []), s]);
  }
  const scored = [...weeks].sort((a, b) => a.start.localeCompare(b.start))
    .filter((w) => w.start <= today)
    .map((w) => scoreWeek(w, byWeek.get(w.id) ?? [], logs, today));
  let streak = 0;
  let best = 0;
  for (const w of scored) {
    if (w.state === 'ok') best = Math.max(best, ++streak);
    else if (w.state === 'broken') streak = 0;
  }
  return { weeks: scored, streak, best, total: scored.reduce((n, w) => n + w.points.total, 0) };
}

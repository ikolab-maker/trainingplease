// Formato de archivo de plan (el mismo de scripts/seed-plan.mjs): [{ id, week, sessions }].
// La validación se comparte entre la vista previa del coach y la ruta /api/admin/plan.

import { addDays, isoWeekId } from './dates.ts';
import { SPORT_KEYS } from './sports.ts';
import type { Session, SportKey, Week } from './types.ts';

export interface PlanWeekFile {
  id: string;
  week: Omit<Week, 'id'>;
  sessions: (Omit<Session, 'id'> & { id: string })[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WEEK_RE = /^\d{4}-W\d{2}$/;
const SESSION_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
export const MAX_IMPORT_WEEKS = 8;
const MAX_SESSIONS = 30;

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : '');
const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const isDate = (v: unknown): v is string => typeof v === 'string' && DATE_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

/** Valida y limpia un plan. Devuelve solo campos conocidos; si hay errores, no se debe importar. */
export function parsePlanFile(raw: unknown): { plan: PlanWeekFile[]; errors: string[] } {
  const errors: string[] = [];
  const plan: PlanWeekFile[] = [];
  // También acepta un archivo exportado desde la app ({ weeks: [...] }) o una sola semana suelta.
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  const list = Array.isArray(raw) ? raw : Array.isArray(obj?.weeks) ? (obj.weeks as unknown[]) : obj ? [obj] : null;
  if (!list || list.length === 0) return { plan, errors: ['El archivo debe ser una lista de semanas: [{ id, week, sessions }].'] };
  if (list.length > MAX_IMPORT_WEEKS) errors.push(`Máximo ${MAX_IMPORT_WEEKS} semanas por importación.`);

  const seenWeeks = new Set<string>();
  list.slice(0, MAX_IMPORT_WEEKS).forEach((w: any, i: number) => {
    const where = `Semana ${i + 1}`;
    const id = str(w?.id, 10);
    const week = w?.week ?? {};
    if (!WEEK_RE.test(id)) { errors.push(`${where}: el id debe tener la forma 2026-W41.`); return; }
    if (seenWeeks.has(id)) errors.push(`${id}: está repetida en el archivo.`);
    seenWeeks.add(id);
    if (!isDate(week.start)) { errors.push(`${id}: week.start debe ser una fecha AAAA-MM-DD.`); return; }
    if (isoWeekId(week.start) !== id) errors.push(`${id}: week.start (${week.start}) no cae en esa semana.`);
    else if (new Date(`${week.start}T00:00:00Z`).getUTCDay() !== 1) errors.push(`${id}: week.start debe ser lunes.`);
    if (!str(week.title).trim()) errors.push(`${id}: falta week.title.`);
    if (!Array.isArray(w?.sessions)) { errors.push(`${id}: sessions debe ser una lista.`); return; }
    if (w.sessions.length > MAX_SESSIONS) errors.push(`${id}: demasiadas sesiones (máximo ${MAX_SESSIONS}).`);

    const end = addDays(week.start, 6);
    const seen = new Set<string>();
    const sessions: PlanWeekFile['sessions'] = [];
    w.sessions.slice(0, MAX_SESSIONS).forEach((s: any, j: number) => {
      const sid = str(s?.id, 64);
      const at = `${id}, sesión ${sid || j + 1}`;
      if (!SESSION_ID_RE.test(sid)) { errors.push(`${at}: id inválido (letras, números, - o _).`); return; }
      if (seen.has(sid)) errors.push(`${at}: id repetido.`);
      seen.add(sid);
      if (!isDate(s.date) || s.date < week.start || s.date > end) errors.push(`${at}: la fecha debe estar entre ${week.start} y ${end}.`);
      if (!SPORT_KEYS.includes(s.sport)) errors.push(`${at}: deporte "${s.sport}" no existe (usa ${SPORT_KEYS.join(', ')}).`);
      if (!str(s.title).trim()) errors.push(`${at}: falta el título.`);
      if (typeof s.core !== 'boolean') errors.push(`${at}: core debe ser true o false.`);
      if (s.steps != null && (!Array.isArray(s.steps) || s.steps.some((x: unknown) => typeof x !== 'string'))) errors.push(`${at}: steps debe ser una lista de textos.`);
      const rpe = numOrNull(s.rpe);
      if (rpe != null && (rpe < 1 || rpe > 10)) errors.push(`${at}: rpe debe estar entre 1 y 10.`);
      sessions.push({
        id: sid,
        date: s.date,
        sport: s.sport as SportKey,
        title: str(s.title, 200),
        durationMin: numOrNull(s.durationMin),
        distanceKm: numOrNull(s.distanceKm),
        rpe,
        steps: Array.isArray(s.steps) ? s.steps.filter((x: unknown) => typeof x === 'string').map((x: string) => x.slice(0, 500)).slice(0, 40) : [],
        summary: str(s.summary, 300),
        focus: str(s.focus, 1000),
        tip: str(s.tip, 1000),
        core: s.core === true,
        ...(s.race === true ? { race: true } : {}),
      });
    });

    // Como el script: la semana se fusiona, así que un campo ausente no borra el que ya existe.
    const meta: PlanWeekFile['week'] = { start: week.start, title: str(week.title, 120) };
    if (typeof week.phase === 'string') meta.phase = str(week.phase, 200);
    if (typeof week.goal === 'string') meta.goal = str(week.goal, 3000);
    if (typeof week.aiAssisted === 'boolean') meta.aiAssisted = week.aiAssisted;
    if (Array.isArray(week.notes)) {
      meta.notes = week.notes.filter((n: any) => n && typeof n.title === 'string').slice(0, 10)
        .map((n: any) => ({ title: str(n.title, 200), body: str(n.body, 3000) }));
    }
    plan.push({
      id,
      week: meta,
      sessions,
    });
  });
  return { plan, errors };
}

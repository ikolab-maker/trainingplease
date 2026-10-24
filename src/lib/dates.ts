import type { LogEntry, Session, SessionStatus } from './types';
import type { Lang } from './i18n';

const TZ = 'America/Lima';
const NAMES: Record<Lang, { mes: string[]; mesLargo: string[]; dow: string[] }> = {
  es: {
    mes: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    mesLargo: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    dow: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  },
  en: {
    mes: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    mesLargo: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
};

/** Fecha de hoy en Lima como YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

/** Lunes de la semana de la fecha. */
export function mondayOf(iso: string): string {
  const d = parse(iso);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = lunes
  return addDays(iso, -dow);
}

/** Semana ISO 8601, p. ej. 2026-W40. */
export function isoWeekId(iso: string): string {
  const d = parse(iso);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3); // jueves de esa semana
  const year = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week = 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function dayParts(iso: string, lang: Lang = 'es'): { dow: string; num: number; mes: string } {
  const d = parse(iso);
  const n = NAMES[lang];
  return { dow: n.dow[d.getUTCDay()], num: d.getUTCDate(), mes: n.mes[d.getUTCMonth()] };
}

/** "19 al 25 de octubre" o, en inglés, "October 19 to 25". */
export function rangeLabel(startIso: string, lang: Lang = 'es'): string {
  const a = parse(startIso);
  const b = parse(addDays(startIso, 6));
  const ma = NAMES[lang].mesLargo[a.getUTCMonth()];
  const mb = NAMES[lang].mesLargo[b.getUTCMonth()];
  const same = a.getUTCMonth() === b.getUTCMonth();
  if (lang === 'en') return same ? `${mb} ${a.getUTCDate()} to ${b.getUTCDate()}` : `${ma} ${a.getUTCDate()} to ${mb} ${b.getUTCDate()}`;
  return same ? `${a.getUTCDate()} al ${b.getUTCDate()} de ${mb}` : `${a.getUTCDate()} de ${ma} al ${b.getUTCDate()} de ${mb}`;
}

export function longDate(iso: string, lang: Lang = 'es'): string {
  const d = parse(iso);
  const m = NAMES[lang].mesLargo[d.getUTCMonth()];
  return lang === 'en' ? `${m} ${d.getUTCDate()}, ${d.getUTCFullYear()}` : `${d.getUTCDate()} de ${m} de ${d.getUTCFullYear()}`;
}

export function daysUntil(targetIso: string, today: string = todayISO()): number {
  return Math.round((parse(targetIso).getTime() - parse(today).getTime()) / 86400000);
}

/**
 * Estado de una sesión. "No realizada" se calcula al leer: una sesión pasada sin
 * registro queda como "late" (aún puede marcarse) hasta el final del día siguiente,
 * y después como "missed".
 */
export function sessionStatus(s: Pick<Session, 'date' | 'sport'>, log: Pick<LogEntry, 'done'> | undefined, today: string = todayISO()): SessionStatus {
  if (s.sport === 'descanso') return 'rest';
  if (log?.done) return 'done';
  if (s.date === today) return 'today';
  if (s.date > today) return 'upcoming';
  if (addDays(s.date, 1) >= today) return 'late';
  return 'missed';
}

export interface Compliance {
  planned: number; // sesiones que ya cuentan
  done: number;
  pct: number | null; // null si aún no hay sesiones que cuenten
}

/** Cumplimiento = realizadas / planificadas que ya vencieron (más las realizadas por adelantado). */
export function compliance(sessions: Session[], logs: Record<string, Pick<LogEntry, 'done'> | undefined>, today: string = todayISO()): Compliance {
  let planned = 0;
  let done = 0;
  for (const s of sessions) {
    if (!s.core) continue;
    const st = sessionStatus(s, logs[s.id], today);
    if (st === 'done') { planned++; done++; }
    else if (st === 'missed') planned++;
  }
  return { planned, done, pct: planned ? Math.round((done / planned) * 100) : null };
}

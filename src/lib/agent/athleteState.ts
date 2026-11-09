// Estado del atleta como datos (17-arquitectura-to-be.md, opción A y B): el tipo de cada semana,
// sus lesiones con estado y su rango de volumen. El código decide con esto, no con nombres de fase.

import { round1 } from './metrics.ts';
import type { Decision } from './metrics.ts';

export type WeekKind = 'carga' | 'descarga' | 'taper' | 'carrera' | 'recuperacion';
export const WEEK_KINDS: WeekKind[] = ['carga', 'descarga', 'taper', 'carrera', 'recuperacion'];
export const WEEK_KIND_LABEL: Record<WeekKind, string> = {
  carga: 'carga', descarga: 'descarga', taper: 'taper', carrera: 'carrera', recuperacion: 'recuperación',
};
export const isWeekKind = (v: unknown): v is WeekKind => typeof v === 'string' && (WEEK_KINDS as string[]).includes(v);

/** Semanas bajas a propósito: no sirven de base de volumen y al salir de ellas se vuelve al volumen previo. */
export const isLowKind = (k: WeekKind) => k !== 'carga';

/**
 * Tipo de una semana ya escrita. Si la guardó el agente o el coach, manda ese dato.
 * En las semanas de antes (sin el dato): carrera si tiene una sesión marcada como carrera,
 * descarga si planificó ≤ 80 % de los km de las semanas previas; si no, carga.
 */
export function weekKindOf(week: { kind?: unknown }, plannedKm: number, hasRace: boolean, previousPlannedKm: number[]): WeekKind {
  if (isWeekKind(week.kind)) return week.kind;
  if (hasRace) return 'carrera';
  const prevMax = Math.max(0, ...previousPlannedKm.slice(-3));
  if (prevMax > 0 && plannedKm > 0 && plannedKm <= prevMax * 0.8) return 'descarga';
  return 'carga';
}

/** Tipo de la semana que se propone, calculado por el código con la decisión y el calendario de carreras. */
export function targetKind(o: { decision: Decision; raceThisWeek: boolean; taperWeek: boolean; afterRace: boolean }): WeekKind {
  if (o.raceThisWeek) return 'carrera';
  if (o.taperWeek) return 'taper';
  if (o.afterRace) return 'recuperacion';
  if (o.decision === 'descarga') return 'descarga';
  return 'carga';
}

/**
 * Base de volumen de 4 semanas (carga crónica): el promedio de km de las semanas de carga con km.
 * Una semana baja (descarga, carrera, viaje, sesiones sin marcar) no arrastra a las siguientes.
 */
export function chronicKm(weeks: { kind: WeekKind; km: number }[]): number | null {
  const load = weeks.slice(-4).filter((w) => !isLowKind(w.kind) && w.km > 0);
  if (!load.length) return null;
  return round1(load.reduce((n, w) => n + w.km, 0) / load.length);
}

// --- Lesiones con estado -------------------------------------------------------------------

export type InjuryStatus = 'activa' | 'en-control' | 'resuelta';
export const INJURY_STATUSES: InjuryStatus[] = ['activa', 'en-control', 'resuelta'];
export const INJURY_STATUS_LABEL: Record<InjuryStatus, string> = { activa: 'Activa', 'en-control': 'En control', resuelta: 'Resuelta' };
export interface Injury { id: string; zone: string; since: string; status: InjuryStatus; note: string }
export const MAX_INJURIES = 20;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseInjuries(raw: unknown): { injuries: Injury[]; error?: string } {
  if (raw == null) return { injuries: [] };
  if (!Array.isArray(raw)) return { injuries: [], error: 'Las lesiones deben ser una lista.' };
  if (raw.length > MAX_INJURIES) return { injuries: [], error: `Máximo ${MAX_INJURIES} lesiones.` };
  const injuries: Injury[] = [];
  for (const [i, x] of raw.entries()) {
    const zone = typeof x?.zone === 'string' ? x.zone.trim().slice(0, 80) : '';
    if (!zone) return { injuries: [], error: `Lesión ${i + 1}: falta la zona.` };
    if (!INJURY_STATUSES.includes(x?.status)) return { injuries: [], error: `Lesión ${i + 1}: estado inválido.` };
    const since = typeof x?.since === 'string' && DATE_RE.test(x.since) ? x.since : '';
    const id = typeof x?.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(x.id) ? x.id : `l${i + 1}`;
    injuries.push({ id, zone, since, status: x.status, note: typeof x?.note === 'string' ? x.note.trim().slice(0, 500) : '' });
  }
  return { injuries };
}

// --- Rango de volumen por atleta (opción B) ------------------------------------------------

export interface VolumeRange { minKm: number | null; maxKm: number | null }

export function parseVolumeRange(raw: unknown): { range: VolumeRange | null; error?: string } {
  if (raw == null) return { range: null };
  const num = (v: unknown) => (v == null || v === '' ? null : typeof v === 'number' && Number.isFinite(v) ? v : NaN);
  const minKm = num((raw as VolumeRange).minKm);
  const maxKm = num((raw as VolumeRange).maxKm);
  if (Number.isNaN(minKm) || Number.isNaN(maxKm)) return { range: null, error: 'El rango de km debe ser numérico.' };
  if ((minKm != null && (minKm < 0 || minKm > 250)) || (maxKm != null && (maxKm <= 0 || maxKm > 250))) return { range: null, error: 'El rango de km va de 0 a 250.' };
  if (minKm != null && maxKm != null && minKm > maxKm) return { range: null, error: 'El piso de km no puede ser mayor que el techo.' };
  if (minKm == null && maxKm == null) return { range: null };
  return { range: { minKm, maxKm } };
}

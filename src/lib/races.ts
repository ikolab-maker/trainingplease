// Carreras del atleta: una principal (con meta de tiempo, hacia la que apunta el plan)
// y las demás recreativas (se corren controladas, sin taper). Funciones puras: las usan
// la app, la API y el agente.

import type { GoalRace, Race } from './types.ts';

export const MAX_RACES = 30;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Valida la lista que llega de la app. Devuelve las carreras limpias o el primer error. */
export function parseRaces(raw: unknown): { races: Race[]; error?: string } {
  if (!Array.isArray(raw)) return { races: [], error: 'La lista de carreras no es válida.' };
  if (raw.length > MAX_RACES) return { races: [], error: `Hasta ${MAX_RACES} carreras.` };
  const races: Race[] = [];
  for (const r of raw) {
    const name = typeof r?.name === 'string' ? r.name.trim().slice(0, 120) : '';
    const date = typeof r?.date === 'string' && ISO.test(r.date) ? r.date : '';
    const id = typeof r?.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(r.id) ? r.id : '';
    if (!name || !date || !id) return { races: [], error: 'Cada carrera necesita nombre y fecha.' };
    const distanceKm = num(r.distanceKm);
    if (distanceKm != null && (distanceKm <= 0 || distanceKm > 250)) return { races: [], error: `La distancia de "${name}" no es válida.` };
    const goalTimeMin = num(r.goalTimeMin);
    const resultMin = num(r.resultMin);
    for (const t of [goalTimeMin, resultMin]) if (t != null && (t < 3 || t > 2000)) return { races: [], error: `El tiempo de "${name}" no es válido.` };
    const principal = r.principal === true;
    if (principal && goalTimeMin == null) return { races: [], error: `La carrera principal necesita una meta de tiempo.` };
    races.push({ id, name, date, distanceKm, principal, goalTimeMin, resultMin });
  }
  if (races.filter((r) => r.principal).length > 1) return { races: [], error: 'Solo una carrera puede ser la principal.' };
  if (new Set(races.map((r) => r.id)).size !== races.length) return { races: [], error: 'Hay carreras repetidas.' };
  return { races: sortRaces(races) };
}

export const sortRaces = (races: Race[]) => [...races].sort((a, b) => a.date.localeCompare(b.date));

export const principalRace = (races: Race[] | undefined | null): Race | null => races?.find((r) => r.principal) ?? null;

/** La carrera objetivo que usan el contador, el panel y el agente: la principal. */
export function toGoalRace(r: Race | null): GoalRace | null {
  return r ? { name: r.name, date: r.date, distanceKm: r.distanceKm } : null;
}

/** Lista inicial para quien todavía no tiene carreras: su carrera objetivo de antes, como principal. */
export function racesFromLegacy(races: Race[] | undefined | null, goalRace: GoalRace | null | undefined, goalTimeMin: number | null = null): Race[] {
  if (races?.length) return sortRaces(races);
  if (!goalRace) return [];
  return [{ id: 'principal', name: goalRace.name, date: goalRace.date, distanceKm: goalRace.distanceKm, principal: true, goalTimeMin, resultMin: null }];
}

export function splitRaces(races: Race[], today: string) {
  const sorted = sortRaces(races);
  return { upcoming: sorted.filter((r) => r.date >= today), past: sorted.filter((r) => r.date < today).reverse() };
}

// Agente Guardián: reglas duras que toda propuesta debe cumplir antes de llegar al coach.
// Si algo falla, el agente principal recibe la lista y corrige; si no lo logra, la
// propuesta llega al coach con estas observaciones a la vista.

import { addDays } from '../dates.ts';
import { parsePlanFile, type PlanWeekFile } from '../planFile.ts';
import { RUN_SPORTS, round1, runKm, type Decision } from './metrics.ts';

export interface GuardContext {
  weekId: string; // semana que se propone
  start: string; // su lunes
  decision: Decision; // decisión que adopta la propuesta
  painAlert: boolean; // el análisis encontró posible dolor
  prevKm: number | null; // km de carrera planificados la semana anterior
  recentMaxKm: number | null; // máximo de km planificados en las 4 semanas previas
  prevWasDeload: boolean;
  raceDate: string | null;
}

const QUALITY_RPE = 7;

/** Valida la propuesta. Devuelve el plan limpio y la lista de problemas (vacía si pasa). */
export function checkProposal(raw: unknown, ctx: GuardContext): { plan: PlanWeekFile[]; issues: string[]; km: number } {
  const { plan, errors } = parsePlanFile(raw);
  const issues = [...errors];
  if (plan.length !== 1) issues.push('La propuesta debe tener exactamente una semana.');
  const w = plan[0];
  if (!w) return { plan, issues, km: 0 };
  if (w.id !== ctx.weekId) issues.push(`La semana debe ser ${ctx.weekId}, no ${w.id}.`);
  if (w.week.start !== ctx.start) issues.push(`week.start debe ser ${ctx.start}.`);
  if (w.week.aiAssisted !== true) issues.push('week.aiAssisted debe ser true.');

  const km = runKm(w.sessions);
  const quality = w.sessions.filter((s) => RUN_SPORTS.has(s.sport) && (s.rpe ?? 0) >= QUALITY_RPE);
  const end = addDays(ctx.start, 6);
  const raceThisWeek = ctx.raceDate != null && ctx.raceDate >= ctx.start && ctx.raceDate <= end;

  if (ctx.prevKm != null && ctx.prevKm > 0 && !raceThisWeek) {
    // Al volver de una descarga se puede regresar al volumen previo; si no, máximo +10 %.
    const base = ctx.prevWasDeload && ctx.recentMaxKm ? Math.max(ctx.prevKm, ctx.recentMaxKm) : ctx.prevKm;
    const cap = round1(base * 1.1 + 0.5);
    if (km > cap) issues.push(`Sube demasiado: ${km} km de carrera contra ${ctx.prevKm} la semana anterior (máximo ${cap} km).`);
    if (ctx.decision === 'descarga' && km > round1(ctx.prevKm * 0.75 + 0.5)) {
      issues.push(`Una descarga baja 30–40 % de km: ${km} km es demasiado (máximo ${round1(ctx.prevKm * 0.75)} km).`);
    }
    if (ctx.decision === 'bajar' && km > round1(ctx.prevKm * 0.95)) {
      issues.push(`La decisión es bajar 10–20 %: ${km} km no baja lo suficiente (máximo ${round1(ctx.prevKm * 0.9)} km).`);
    }
    if (ctx.decision === 'mantener' && km > round1(ctx.prevKm * 1.03 + 0.5)) {
      issues.push(`La decisión es mantener: ${km} km sube respecto de ${ctx.prevKm}.`);
    }
  }
  if (raceThisWeek && ctx.prevKm) {
    // Semana de carrera: taper. Sin contar la carrera, como mucho ~70 % de la semana anterior.
    const kmExRace = runKm(w.sessions.filter((s) => s.date !== ctx.raceDate));
    const cap = round1(ctx.prevKm * 0.7 + 0.5);
    if (kmExRace > cap) issues.push(`Es la semana de la carrera (${ctx.raceDate}): sin contarla van ${kmExRace} km y el taper permite hasta ${cap}. No se recorta el taper.`);
  }
  if ((ctx.decision === 'descarga' || ctx.painAlert) && quality.length && !raceThisWeek) {
    issues.push(`Con descarga o posible dolor no va calidad: baja el RPE de ${quality.map((s) => s.title).join(', ')} por debajo de ${QUALITY_RPE}.`);
  }
  if (ctx.painAlert && !w.sessions.some((s) => /fisio|profesional|dolor|molest/i.test(`${s.tip} ${s.focus} ${s.steps.join(' ')}`))
    && !(w.week.notes ?? []).some((n) => /fisio|profesional|dolor|molest/i.test(`${n.title} ${n.body}`))) {
    issues.push('Hay posible dolor: agrega una nota o tip que diga qué hacer si la molestia sigue (parar y consultar a un profesional).');
  }
  const runDays = new Set(w.sessions.filter((s) => RUN_SPORTS.has(s.sport)).map((s) => s.date));
  if (runDays.size > 6) issues.push('Debe quedar al menos un día sin correr.');
  return { plan, issues, km };
}

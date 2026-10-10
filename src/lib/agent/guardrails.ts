// Agente Guardián: reglas duras que toda propuesta debe cumplir antes de llegar al coach.
// Si algo falla, el agente principal recibe la lista y corrige; si no lo logra, la
// propuesta llega al coach con estas observaciones a la vista. Los avisos no bloquean:
// van al coach junto con la propuesta. Fuentes de cada regla en 09-metodologia-agente-ciencia.md.

import { addDays } from '../dates.ts';
import { parsePlanFile, type PlanWeekFile } from '../planFile.ts';
import { RUN_SPORTS, round1, runKm, type Decision } from './metrics.ts';
import type { QualityWork } from './proposal.ts';
import type { Session } from '../types.ts';

export interface GuardContext {
  weekId: string; // semana que se propone
  start: string; // su lunes
  decision: Decision; // decisión que adopta la propuesta
  painAlert: boolean; // el análisis encontró posible dolor
  illnessAlert?: boolean; // el análisis encontró posible enfermedad
  prevKm: number | null; // km de carrera de la semana anterior (hechos y pendientes)
  prev2Km?: number | null; // km de carrera de dos semanas atrás
  recentMaxKm: number | null; // máximo de km de las 4 semanas previas (volumen normal antes del taper)
  prevWasDeload: boolean;
  prev2WasDeload?: boolean; // la semana de hace dos fue descarga o recuperación
  race: { date: string; distanceKm: number | null } | null; // carrera objetivo
  recentRaces?: { date: string; distanceKm: number; title: string }[]; // carreras o tests de la semana analizada
  lockedIds?: string[]; // en un ajuste: sesiones ya pasadas o registradas, que no se pueden cambiar
  longestRecentKm?: number | null; // salida de carrera más larga de los últimos 30 días
  easyPaceSecPerKm?: number | null; // ritmo suave medio del atleta, para estimar duraciones
  painFreeWeeks?: boolean; // sin dolor en las semanas recientes: con 4 días se permite una segunda calidad
  mode?: 'semanal' | 'ajuste'; // en un ajuste, las reglas de estructura (4 a 7) avisan en vez de bloquear
}

type VolumeContext = Pick<GuardContext, 'prevKm' | 'prev2Km' | 'recentMaxKm' | 'prevWasDeload' | 'prev2WasDeload'>;

/**
 * Referencias de volumen de la regla 1, compartidas con el resumen que recibe el modelo.
 * Si la semana anterior no tuvo km (lesión, enfermedad, viaje), se compara contra el volumen normal reciente.
 * Una semana de descarga no sirve de base: al volver se puede regresar al volumen previo.
 */
export function volumeLimits(ctx: VolumeContext) {
  const normal = Math.max(ctx.prev2Km ?? 0, ctx.recentMaxKm ?? 0) || null;
  const refFromNormal = !(ctx.prevKm && ctx.prevKm > 0);
  const refKm = refFromNormal ? normal : ctx.prevKm!;
  const weekBase = refKm && ctx.prevWasDeload && ctx.recentMaxKm ? Math.max(refKm, ctx.recentMaxKm) : refKm;
  const twoWeekBase = ctx.prev2Km && ctx.prev2Km > 0
    ? (ctx.prev2WasDeload && ctx.recentMaxKm ? Math.max(ctx.prev2Km, ctx.recentMaxKm) : ctx.prev2Km)
    : null;
  return {
    refKm, // referencia para descarga, bajar y mantener
    refFromNormal,
    weekBase,
    weekCap: weekBase ? round1(weekBase * WEEK_CAP + 0.5) : null,
    twoWeekBase,
    twoWeekCap: twoWeekBase ? round1(twoWeekBase * TWO_WEEK_CAP + 0.5) : null,
  };
}

/** Días suaves después de una carrera: 1 por cada 3 km (Daniels). 10K: 3; media: 7. */
export const easyDaysAfter = (km: number) => Math.max(1, Math.round(km / 3));

export type SessionExtras = Record<string, { race: boolean; work: QualityWork[] }>;

export const QUALITY_RPE = 7;
export const LONG_RUN_MAX_MIN = 150; // Daniels
const SPIKE = 1.1; // Frandsen 2025: ninguna salida > 10 % sobre la más larga de 30 días
const WEEK_CAP = 1.2; // Damsted 2019: < 20 % por semana
const TWO_WEEK_CAP = 1.3; // Nielsen 2014: > 30 % en 2 semanas
const HALF_KM = 15; // desde aquí, taper de media (y más largo)

/** Topes de Daniels por sesión, como fracción del volumen semanal y en km absolutos. */
export const WORK_CAPS: Record<QualityWork['zone'], { share: number; maxKm: number; maxRepMin: number | null; label: string }> = {
  M: { share: 0.2, maxKm: 29, maxRepMin: null, label: 'ritmo de maratón' },
  T: { share: 0.1, maxKm: Infinity, maxRepMin: null, label: 'umbral' },
  I: { share: 0.08, maxKm: 10, maxRepMin: 5, label: 'intervalos' },
  R: { share: 0.05, maxKm: 8, maxRepMin: 2, label: 'repeticiones' },
};

const fmtKm = (n: number) => String(round1(n)).replace('.', ',');
const dayDiff = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** Máximo de sesiones de calidad según los días de carrera de la semana. */
export function maxQualitySessions(runDays: number, painFree: boolean): number {
  if (runDays <= 3) return 1;
  if (runDays === 4) return painFree ? 2 : 1;
  return 2;
}

/** Valida la propuesta. Devuelve el plan limpio, los problemas (vacío si pasa) y avisos para el coach. */
export function checkProposal(raw: unknown, ctx: GuardContext, extras: SessionExtras = {}): { plan: PlanWeekFile[]; issues: string[]; warnings: string[]; km: number } {
  const { plan, errors } = parsePlanFile(raw);
  const issues = [...errors];
  const warnings: string[] = [];
  if (plan.length !== 1) issues.push('La propuesta debe tener exactamente una semana.');
  const w = plan[0];
  if (!w) return { plan, issues, warnings, km: 0 };
  if (w.id !== ctx.weekId) issues.push(`La semana debe ser ${ctx.weekId}, no ${w.id}.`);
  if (w.week.start !== ctx.start) issues.push(`week.start debe ser ${ctx.start}.`);
  if (w.week.aiAssisted !== true) issues.push('week.aiAssisted debe ser true.');

  const end = addDays(ctx.start, 6);
  const runs = w.sessions.filter((s) => RUN_SPORTS.has(s.sport));
  const isRace = (s: PlanWeekFile['sessions'][number]) => extras[s.id]?.race === true || s.race === true || (ctx.race != null && s.date === ctx.race.date);
  // En un ajuste, lo ya pasado o registrado no se puede cambiar: no se le piden correcciones.
  const locked = new Set(ctx.lockedIds ?? []);
  const open = (s: PlanWeekFile['sessions'][number]) => !locked.has(s.id);
  const workOf = (s: PlanWeekFile['sessions'][number]) => extras[s.id]?.work ?? [];
  const isQuality = (s: PlanWeekFile['sessions'][number]) => !isRace(s) && ((s.rpe ?? 0) >= QUALITY_RPE || workOf(s).length > 0);
  const km = runKm(w.sessions);
  const races = runs.filter(isRace);
  const kmExRace = runKm(runs.filter((s) => !isRace(s)));
  const quality = runs.filter(isQuality);
  const runDays = new Set(runs.map((s) => s.date)).size;

  const race = ctx.race;
  const raceThisWeek = race != null && race.date >= ctx.start && race.date <= end;
  const raceInDays = race != null ? dayDiff(ctx.start, race.date) : null; // desde el lunes
  const raceNextWeek = raceInDays != null && raceInDays >= 7 && raceInDays <= 13;
  const halfOrLonger = (race?.distanceKm ?? 0) >= HALF_KM;
  const taper = raceThisWeek || raceNextWeek;
  const normalKm = Math.max(ctx.prevKm ?? 0, ctx.recentMaxKm ?? 0) || null;
  // Un ajuste cambia solo lo pedido sobre una semana que el coach ya aprobó: lo que ya estaba no se reabre.
  const structural = (msg: string) => (ctx.mode === 'ajuste' ? warnings : issues).push(msg);

  // 1. Volumen semanal: +10 % es la guía del modelo; el tope duro es +20 % sobre la semana anterior
  //    y +30 % sobre la de dos semanas atrás. Al volver de una descarga se puede regresar al volumen previo.
  const vol = volumeLimits(ctx);
  if (!raceThisWeek) {
    const against = vol.refFromNormal ? `el volumen normal reciente (${fmtKm(vol.refKm ?? 0)} km; la semana anterior no tuvo km)` : `${fmtKm(vol.refKm ?? 0)} la semana anterior`;
    if (vol.weekCap != null && km > vol.weekCap) issues.push(`Sube demasiado: ${fmtKm(km)} km de carrera contra ${against} (máximo +20 %: ${fmtKm(vol.weekCap)} km; lo normal es +10 %).`);
    if (vol.twoWeekCap != null && km > vol.twoWeekCap) {
      issues.push(`Sube demasiado en dos semanas: ${fmtKm(km)} km contra ${fmtKm(vol.twoWeekBase!)} de hace dos semanas (máximo +30 %: ${fmtKm(vol.twoWeekCap)} km).`);
    }
    const ref = vol.refKm;
    if (ref && ctx.decision === 'descarga' && km > round1(ref * 0.75 + 0.5)) {
      issues.push(`Una descarga baja 30–40 % de km: ${fmtKm(km)} km es demasiado (máximo ${fmtKm(ref * 0.75)} km).`);
    }
    if (ref && ctx.decision === 'bajar' && km > round1(ref * 0.95)) {
      issues.push(`La decisión es bajar 10–20 %: ${fmtKm(km)} km no baja lo suficiente (máximo ${fmtKm(ref * 0.9)} km).`);
    }
    if (ref && ctx.decision === 'mantener' && km > round1(ref * 1.03 + 0.5)) {
      issues.push(`La decisión es mantener: ${fmtKm(km)} km sube respecto de ${fmtKm(ref)}.`);
    }
  }

  // 2. Taper. Semana de carrera, sin contarla: hasta 70 % del volumen normal en 10K y 60 % en media o más.
  //    Semana anterior a una media: hasta 80 %. No se quitan días de carrera.
  if (raceThisWeek && normalKm) {
    const share = halfOrLonger ? 0.6 : 0.7;
    const cap = round1(normalKm * share + 0.5);
    if (kmExRace > cap) issues.push(`Es la semana de la carrera (${race!.date}): sin contarla van ${fmtKm(kmExRace)} km y el taper permite hasta ${fmtKm(cap)} (${share * 100} % de ${fmtKm(normalKm)} km). No se recorta el taper.`);
  }
  if (raceNextWeek && halfOrLonger && normalKm) {
    const cap = round1(normalKm * 0.8 + 0.5);
    if (km > cap) issues.push(`La media es la semana siguiente (${race!.date}): el taper empieza ya y esta semana va hasta ${fmtKm(cap)} km (80 % de ${fmtKm(normalKm)}); van ${fmtKm(km)}.`);
  }

  // 3. Salto por sesión: ninguna salida supera en más de 10 % a la más larga de los últimos 30 días.
  if (ctx.longestRecentKm && ctx.longestRecentKm > 0) {
    const limit = round1(ctx.longestRecentKm * SPIKE);
    for (const s of runs.filter(open)) {
      if ((s.distanceKm ?? 0) <= limit + 0.05) continue;
      const pct = Math.round(((s.distanceKm ?? 0) / ctx.longestRecentKm - 1) * 100);
      if (isRace(s)) warnings.push(`La carrera "${s.title}" (${fmtKm(s.distanceKm ?? 0)} km) es un salto de +${pct} % sobre la salida más larga de los últimos 30 días (${fmtKm(ctx.longestRecentKm)} km).`);
      else issues.push(`"${s.title}" (${fmtKm(s.distanceKm ?? 0)} km) supera en más de 10 % la salida más larga de los últimos 30 días (${fmtKm(ctx.longestRecentKm)} km): máximo ${fmtKm(limit)} km.`);
    }
  }

  // 4. Fondo: ninguna salida pasa de 150 min (por duración o, sin ella, por km a ritmo suave);
  //    peso del fondo en la semana según los días de carrera.
  const nonRace = runs.filter((s) => !isRace(s));
  for (const s of nonRace.filter(open)) {
    const minutes = s.durationMin ?? (s.distanceKm && ctx.easyPaceSecPerKm ? (s.distanceKm * ctx.easyPaceSecPerKm) / 60 : null);
    if (minutes != null && minutes > LONG_RUN_MAX_MIN + 1) {
      structural(`"${s.title}" dura unos ${Math.round(minutes)} min: el fondo va hasta ${LONG_RUN_MAX_MIN} min.`);
    }
  }
  const long = nonRace.reduce<PlanWeekFile['sessions'][number] | null>((a, s) => ((s.distanceKm ?? 0) > (a?.distanceKm ?? 0) ? s : a), null);
  if (long?.distanceKm) {
    const share = kmExRace > 0 ? long.distanceKm / kmExRace : 0;
    // Con una carrera en la semana quedan pocas salidas suaves: la proporción no dice nada.
    if (!taper && !races.length && kmExRace >= 10 && runDays >= 3) {
      if (runDays <= 4 && share > 0.5) structural(`El fondo "${long.title}" es el ${Math.round(share * 100)} % de la semana: con ${runDays} días de carrera va hasta el 50 %.`);
      else if (runDays <= 4 && share > 0.4) warnings.push(`El fondo es el ${Math.round(share * 100)} % de los km de la semana (aviso desde el 40 %).`);
      else if (runDays >= 5 && share > 0.3) warnings.push(`El fondo es el ${Math.round(share * 100)} % de los km de la semana; con ${runDays} días, Daniels lo deja en 30 %.`);
    }
  }

  // 5. Calidad por sesión (topes de Daniels) y declaración del trabajo de calidad. Las carreras
  //    (también una de preparación corrida controlada) no llevan work ni topes por zona.
  const hasExtras = Object.keys(extras).length > 0;
  for (const s of runs.filter((x) => open(x) && !isRace(x))) {
    const work = workOf(s);
    if (hasExtras && (s.rpe ?? 0) >= QUALITY_RPE && !work.length) {
      issues.push(`"${s.title}" tiene RPE ${s.rpe}: declara en work su trabajo de calidad (zona M, T, I o R y km a ese ritmo).`);
    }
    const byZone = new Map<QualityWork['zone'], number>();
    for (const x of work) {
      byZone.set(x.zone, (byZone.get(x.zone) ?? 0) + (x.km > 0 ? x.km : 0));
      const capRep = WORK_CAPS[x.zone]?.maxRepMin;
      if (capRep != null && x.repMin != null && x.repMin > capRep) structural(`"${s.title}": las series de ${WORK_CAPS[x.zone].label} van hasta ${capRep} min cada una (hay de ${x.repMin}).`);
    }
    for (const [zone, zkm] of byZone) {
      const c = WORK_CAPS[zone];
      if (!c) continue;
      const cap = round1(Math.min(km * c.share, c.maxKm));
      if (zkm > cap + 0.1) structural(`"${s.title}": ${fmtKm(zkm)} km a ritmo de ${c.label} pasan el tope de ${fmtKm(cap)} km por sesión (${Math.round(c.share * 100)} % de ${fmtKm(km)} km${Number.isFinite(c.maxKm) ? ` y máximo ${c.maxKm} km` : ''}).`);
    }
  }

  // 6. Sesiones de calidad por semana y nunca dos días duros seguidos (las carreras cuentan como día duro).
  const maxQ = maxQualitySessions(runDays, ctx.painFreeWeeks ?? false);
  if (quality.length > maxQ) {
    structural(`Hay ${quality.length} sesiones de calidad (${quality.map((s) => s.title).join(', ')}): con ${runDays} días de carrera van como máximo ${maxQ}.`);
  }
  const recentRaces = (ctx.recentRaces ?? []).filter((r) => r.date < ctx.start);
  const hardDates = [...new Set([...quality.map((s) => s.date), ...races.map((s) => s.date), ...recentRaces.map((r) => r.date)])].sort();
  for (let i = 1; i < hardDates.length; i++) {
    if (dayDiff(hardDates[i - 1], hardDates[i]) === 1) structural(`Hay dos días duros seguidos (${hardDates[i - 1]} y ${hardDates[i]}): deja al menos un día suave o de descanso entre ellos.`);
  }

  // 7. Después de una carrera: 1 día suave por cada 3 km (Daniels), también tras una carrera o
  //    un test de la semana anterior.
  const raceDays = races.map((s) => ({ date: s.date, km: s.distanceKm ?? 0, title: `"${s.title}"` }));
  for (const r of recentRaces) raceDays.push({ date: r.date, km: r.distanceKm, title: `"${r.title}"` });
  if (race && race.date < ctx.start && race.distanceKm && !recentRaces.some((r) => r.date === race.date)) {
    raceDays.push({ date: race.date, km: race.distanceKm, title: 'la carrera objetivo' });
  }
  for (const r of raceDays) {
    const easyDays = easyDaysAfter(r.km);
    const tooSoon = quality.filter((s) => open(s) && s.date > r.date && dayDiff(r.date, s.date) <= easyDays);
    if (tooSoon.length) structural(`Después de ${r.title} (${fmtKm(r.km)} km, ${r.date}) van ${easyDays} días suaves: ${tooSoon.map((s) => s.title).join(', ')} es demasiado pronto.`);
  }

  // 8. Con descarga, dolor o enfermedad no va calidad, y la semana dice qué hacer.
  const openQuality = quality.filter(open);
  if ((ctx.decision === 'descarga' || ctx.painAlert || ctx.illnessAlert) && openQuality.length && !raceThisWeek) {
    issues.push(`Con descarga, posible dolor o enfermedad no va calidad: baja el RPE de ${openQuality.map((s) => s.title).join(', ')} por debajo de ${QUALITY_RPE} y deja work vacío.`);
  }
  const text = [...w.sessions.map((s) => `${s.tip} ${s.focus} ${s.steps.join(' ')}`), ...(w.week.notes ?? []).map((n) => `${n.title} ${n.body}`)].join(' ');
  if (ctx.painAlert && !/fisio|profesional|dolor|molest/i.test(text)) {
    issues.push('Hay posible dolor: agrega una nota o tip que diga qué hacer si la molestia sigue (parar y consultar a un profesional).');
  }
  if (ctx.illnessAlert && !/m[eé]dic|fiebre|s[ií]ntoma/i.test(text)) {
    issues.push('Hay posible enfermedad: agrega una nota con qué hacer (con fiebre o síntomas en el pecho no se entrena y se consulta a un médico; se vuelve suave y se avanza solo sin síntomas a las 24 h).');
  }

  // 9. Al menos un día sin correr.
  if (runDays > 6) issues.push('Debe quedar al menos un día sin correr.');
  return { plan, issues, warnings, km };
}

/** Reglas extra de un ajuste puntual a una semana ya cargada: mismos ids y nada de lo ya hecho cambia. */
export function checkAdjustment(plan: PlanWeekFile[], original: Session[], locked: Pick<Session, 'id'>[]): string[] {
  const issues: string[] = [];
  const next = new Map((plan[0]?.sessions ?? []).map((s) => [s.id, s]));
  const missing = original.filter((s) => !next.has(s.id));
  if (missing.length) issues.push(`Faltan sesiones de la semana cargada (para mover una sesión cambia su fecha, no su id): ${missing.map((s) => `${s.id} (${s.title})`).join(', ')}.`);
  for (const { id } of locked) {
    const a = original.find((s) => s.id === id);
    const b = next.get(id);
    if (a && b && (a.date !== b.date || a.sport !== b.sport || a.distanceKm !== b.distanceKm || a.title !== b.title || (a.rpe ?? null) !== b.rpe)) {
      issues.push(`La sesión ${id} (${a.title}) ya pasó o está registrada: no se puede cambiar.`);
    }
  }
  return issues;
}

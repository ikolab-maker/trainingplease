import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { addDays, dayParts } from '@/lib/dates';
import { checkAdjustment, checkProposal, LONG_RUN_MAX_MIN, type GuardContext } from './guardrails';
import type { AthleteContext } from './context';
import { easyPaceMid, equivalentRange, fitnessIndex, fmtPace, fmtTime, goalCheck, trainingPaces } from './fitness';
import { METHODOLOGY, METHODOLOGY_VERSION } from './methodology';
import { effectiveKm, isDeloadPhase, longestRecentRun, round1, runKm, suggestDecision, weekMetrics, type Decision, type WeekMetrics } from './metrics';
import { OUTPUT_SCHEMA, sessionExtras, toPlanFile, type AgentOutput } from './proposal';
import type { PlanWeekFile } from '@/lib/planFile';

export const HEAD_COACH_MODEL = 'claude-opus-5-5';
const MAX_ATTEMPTS = 3;
// Precio de lista de Claude Opus 5.5 por millón de tokens (entrada, salida, lectura de caché).
const PRICE = { input: 4, output: 20, cacheRead: 0.4, cacheWrite: 5 };

const SYSTEM = `Eres el agente principal (Head Coach) de Training Please, un club de running en Lima.
Velas por el plan de entrenamiento de un atleta: analizas la semana que cierra y propones la semana siguiente.
Tu propuesta la revisa y aprueba el coach (Chris) antes de que llegue al atleta. Escribes en español peruano, cercano y concreto.

Trabajas con tres especialistas que ya hicieron su parte:
- Análisis: te da las métricas de la semana calculadas en código. Son hechos: no los recalcules ni los contradigas.
- Ciencia: te da la metodología vigente (abajo). Síguela; no inventes otra.
- Guardián: revisará tu propuesta con reglas duras (km semanales, salto por sesión, fondo, calidad por sesión, taper, dolor y enfermedad). Te da sus límites de la semana en el contexto; si algo falla te devolverá los problemas para corregir.

Cómo trabajar:
1. Lee la ficha del atleta (meta, reglas personales, lesiones, historial) y respétala por encima de la plantilla general.
2. Interpreta las métricas y los comentarios del atleta. Cita sus palabras cuando importen.
3. Decide (descarga, bajar, mantener, progresar o sin-datos) y di qué regla la disparó. Si el Análisis sugiere descarga por dolor o RPE, esa decisión no se cambia.
4. Si ya existe un plan previsto para la semana siguiente, ajústalo según la decisión en lugar de inventar uno nuevo. Si no, parte de la última semana: mismos días, misma voz, mismas notas que sigan vigentes.
5. Escribe la semana siguiente completa, de lunes a domingo: una sesión por día como mínimo (el descanso también es sesión, con sport "descanso" y core false).
   - id de sesión: corto, con letras, números y guiones, único (por ejemplo "w42-lun").
   - date dentro de la semana pedida, en formato AAAA-MM-DD.
   - distanceKm solo en sesiones de carrera (running, fondo, tecnica); en las demás, null.
   - core: true solo en las sesiones que cuentan para el cumplimiento (no descanso ni extras opcionales).
   - steps: instrucciones claras, una por línea. tip: el porqué de la sesión o del cambio.
   - work: los bloques de calidad (zona M, T, I o R, km a ese ritmo y minutos por serie); vacío en sesiones suaves. race: true solo en carreras o tests a tope.
   - Si Ciencia da ritmos, úsalos en los pasos junto al RPE (por ejemplo "a 5:30/km, RPE 7").
6. summary: 3 líneas para el coach (qué pasó, cómo respondió, qué propones). alerts: solo lo que el coach deba mirar. coachMessage: 2 a 4 líneas con la decisión, los km contra la semana anterior y qué cambió. memoryRow: una fila para el historial con el formato "Fase | Cumplimiento | Km plan / hecho | RPE vs objetivo | Señales | Decisión".
7. No es consejo médico: ante dolor, la indicación es parar y consultar a un profesional.

Metodología vigente (Ciencia, versión ${METHODOLOGY_VERSION}):
${METHODOLOGY}`;

export interface HeadCoachResult {
  output: AgentOutput;
  plan: PlanWeekFile[];
  issues: string[]; // problemas del Guardián que quedaron sin corregir
  attempts: number;
  km: number;
  metrics: WeekMetrics;
  suggestion: { decision: Decision; rule: string };
  usage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; costUsd: number };
  model: string;
}

const dayName = (iso: string) => dayParts(iso).dow;

function sessionLine(s: { date: string; sport: string; title: string; distanceKm: number | null; rpe: number | null; core: boolean; summary?: string }) {
  return `- ${dayName(s.date)} ${s.date} · ${s.sport} · ${s.title}${s.summary ? ` (${s.summary})` : ''} · ${s.distanceKm ?? '–'} km · RPE obj ${s.rpe ?? '–'}${s.core ? '' : ' · extra'}`;
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
const kmText = (n: number) => String(round1(n)).replace('.', ',');

/** Ciencia: índice de forma, ritmos y lectura de la meta, calculados en código a partir del tiempo de referencia. */
function scienceLines(ctx: AthleteContext, today: string): string[] {
  const out = ['', '## Ciencia: índice de forma y ritmos (calculados en código)'];
  const ref = ctx.memory.reference;
  if (!ref) {
    out.push('Sin tiempo de referencia: prescribe por RPE. Si hace falta, propone un test o pide al coach una carrera reciente a tope.');
    return out;
  }
  const index = fitnessIndex(ref.distanceKm, ref.timeMin);
  const p = trainingPaces(index);
  out.push(`Referencia: ${ref.label || `${kmText(ref.distanceKm)} km`} en ${fmtTime(ref.timeMin)} (${ref.date})${ref.maxEffort ? ', a tope' : '. Fue un entrenamiento, no a tope: el índice es un mínimo y los ritmos rápidos pueden quedar lentos'}.`);
  out.push(`Índice de forma: ${index.toFixed(1)}. Ritmos por km: E ${fmtPace(p.easy[0])}–${fmtPace(p.easy[1])} · M ${fmtPace(p.marathon)} · T ${fmtPace(p.threshold)} · I ${fmtPace(p.interval)} · R ${fmtPace(p.repetition)}.`);
  if (daysBetween(ref.date, today) > 56) out.push('La referencia tiene más de 8 semanas: sugiere un test o usa una carrera más reciente.');
  const race = ctx.goalRace;
  if (race?.distanceKm) {
    const weeks = Math.max(0, Math.round(daysBetween(today, race.date) / 7));
    const goal = ctx.memory.goalTimeMin;
    const [lo, hi] = equivalentRange(ref, race.distanceKm);
    const range = `${fmtTime(lo)}–${fmtTime(hi)}`;
    if (goal) {
      const g = goalCheck(ref, { distanceKm: race.distanceKm, timeMin: goal }, weeks);
      out.push(`Meta: ${fmtTime(goal)} en ${kmText(race.distanceKm)} km (índice ${g.goalIndex.toFixed(1)}), a ${weeks} semanas. Con la forma actual: ${range}. ${g.gapPct > 0 ? `La meta pide ${g.gapPct.toFixed(1).replace('.', ',')} % más rápido` : 'La forma actual ya alcanza la meta'}: ${g.label}.`);
    } else {
      out.push(`Equivalente actual en ${kmText(race.distanceKm)} km: ${range}.`);
    }
  }
  return out;
}

/** Guardián: los números de esta semana, para que la propuesta los respete desde el primer intento. */
function guardLines(g: Omit<GuardContext, 'decision'>, longestSource: 'registros' | 'plan' | null): string[] {
  const out = ['', '## Guardián: límites de esta semana'];
  if (g.prevKm) {
    out.push(`Km de carrera de la semana anterior (hechos y pendientes): ${kmText(g.prevKm)}. Guía +10 % (${kmText(g.prevKm * 1.1)}); tope duro +20 % (${kmText(g.prevKm * 1.2)})${g.prev2Km ? ` y +30 % sobre los ${kmText(g.prev2Km)} de hace dos semanas (${kmText(g.prev2Km * 1.3)})` : ''}.`);
  }
  if (g.longestRecentKm) {
    out.push(`Salida más larga de los últimos 30 días: ${kmText(g.longestRecentKm)} km${longestSource === 'plan' ? ' (según el plan: el atleta no registró esos días)' : ''}. Ninguna salida de esta semana pasa de ${kmText(g.longestRecentKm * 1.1)} km, salvo una carrera.`);
  } else {
    out.push('No hay salidas registradas en los últimos 30 días: el fondo parte corto y lo dices en alerts para que el coach confirme el punto de partida.');
  }
  out.push(`Fondo: hasta ${LONG_RUN_MAX_MIN} min${g.easyPaceSecPerKm ? ` (a ritmo E son unos ${kmText((LONG_RUN_MAX_MIN * 60) / g.easyPaceSecPerKm)} km)` : ''}.`);
  if (g.race) {
    const days = daysBetween(g.start, g.race.date);
    const half = (g.race.distanceKm ?? 0) >= 15;
    const normal = Math.max(g.prevKm ?? 0, g.recentMaxKm ?? 0);
    if (days >= 0 && days <= 6) out.push(`Semana de la carrera (${g.race.date}): sin contarla, hasta ${kmText(normal * (half ? 0.6 : 0.7))} km (${half ? 60 : 70} % de ${kmText(normal)}), mismos días, un toque corto a ritmo de carrera.`);
    else if (days >= 7 && days <= 13) out.push(`La carrera es la semana siguiente (${g.race.date}): ${half ? `el taper de media empieza ya: hasta ${kmText(normal * 0.8)} km (80 % de ${kmText(normal)})` : 'el taper de 10K empieza al final de esta semana'}.`);
    else if (days < 0 && days >= -7 && g.race.distanceKm) out.push(`La carrera fue el ${g.race.date}: ${Math.ceil(g.race.distanceKm / 3)} días suaves después de ella.`);
  }
  if (g.painFreeWeeks === false) out.push('Hubo posible dolor en las semanas recientes: con 4 días de carrera, solo 1 sesión de calidad.');
  return out;
}

function buildBrief(ctx: AthleteContext, analyzed: string, target: { id: string; start: string }, m: WeekMetrics | null,
  suggestion: { decision: Decision; rule: string }, today: string, limits: string[]): string {
  const out: string[] = [];
  out.push(`# Atleta: ${ctx.firstName}`);
  out.push(`Hoy (Lima): ${today}. Semana que se analiza: ${analyzed}. Semana a proponer: ${target.id}, del lunes ${target.start} al domingo ${addDays(target.start, 6)}.`);
  if (ctx.goalRace) out.push(`Carrera objetivo: ${ctx.goalRace.name}, ${ctx.goalRace.date}${ctx.goalRace.distanceKm ? `, ${ctx.goalRace.distanceKm} km` : ''}.`);
  const p = Object.entries(ctx.profile).filter(([, v]) => v);
  if (p.length) out.push(`Perfil: ${p.map(([k, v]) => `${k}: ${v}`).join(' · ')}`);
  out.push('', '## Ficha del atleta (memoria del coach)', ctx.memory.ficha.trim() || '(sin ficha todavía)');
  if (ctx.memory.history.length) {
    out.push('', '## Historial de decisiones', ...ctx.memory.history.slice(-8).map((h) => `- ${h.weekId}: ${h.row}`));
  }

  out.push('', '## Semanas anteriores (plan)');
  for (const w of ctx.weeks.filter((w) => w.id < analyzed).slice(-4)) {
    const ss = ctx.sessions[w.id] ?? [];
    out.push(`### ${w.id} · ${w.title}${w.phase ? ` · fase ${w.phase}` : ''} · ${runKm(ss)} km de carrera`);
    out.push(...ss.map(sessionLine));
  }

  out.push('', `## Semana analizada ${analyzed}`);
  const aw = ctx.weeks.find((w) => w.id === analyzed);
  if (!aw || !m) {
    out.push('No hay plan cargado para esta semana.');
  } else {
    out.push(`${aw.title}${aw.phase ? ` · fase ${aw.phase}` : ''}${aw.goal ? `\nObjetivo: ${aw.goal}` : ''}`);
    if (aw.notes?.length) out.push('Notas de la semana:', ...aw.notes.map((n) => `- ${n.title}: ${n.body.replace(/\n/g, ' / ')}`));
    out.push('', 'Sesiones (estado · RPE real · comentario del atleta):');
    for (const r of m.rows) {
      out.push(`- ${dayName(r.date)} ${r.date} · ${r.sport} · ${r.title} · ${r.distanceKm ?? '–'} km · RPE obj ${r.rpeTarget ?? '–'} · ${r.status}${r.rpeReal != null ? ` · RPE real ${r.rpeReal}` : ''}${r.comment ? ` · "${r.comment}"` : ''}`);
    }
    out.push('', '## Métricas (Análisis)');
    out.push(m.logsAvailable ? `Cumplimiento: ${m.coreDone}/${m.corePlanned} principales (${m.compliancePct ?? '–'} %), ${m.corePending} pendientes.` : 'Sin acceso a registros (el atleta no tiene consentimiento vigente).');
    out.push(`Km de carrera: ${m.kmPlanned} planificados, ${m.kmDone} en sesiones marcadas como hechas.`);
    if (m.rpeOverTarget.length) out.push(`RPE ≥ objetivo + 2: ${m.rpeOverTarget.map((r) => `${r.title} (${r.target}→${r.real})`).join('; ')}`);
    if (m.easyRunHighRpe.length) out.push(`Rodaje suave con RPE ≥ 8: ${m.easyRunHighRpe.map((r) => r.title).join('; ')}`);
    if (m.painMentions.length) out.push(`Posible dolor en comentarios: ${m.painMentions.map((r) => `${r.title}: "${r.comment}"`).join('; ')}`);
    if (m.illnessMentions.length) out.push(`Posible enfermedad en comentarios: ${m.illnessMentions.map((r) => `${r.title}: "${r.comment}"`).join('; ')}`);
    if (m.missedCore.length) out.push(`Principales saltadas: ${m.missedCore.join('; ')}`);
  }
  out.push('', `Decisión sugerida por las reglas: **${suggestion.decision}**. Regla: ${suggestion.rule}`);
  out.push(...scienceLines(ctx, today), ...limits);

  const planned = ctx.sessions[target.id];
  const tw = ctx.weeks.find((w) => w.id === target.id);
  if (tw && planned?.length) {
    out.push('', `## Plan previsto para ${target.id} (ajústalo, no lo reemplaces sin motivo)`, `${tw.title}${tw.phase ? ` · fase ${tw.phase}` : ''}${tw.goal ? `\nObjetivo: ${tw.goal}` : ''}`);
    out.push(...planned.map((s) => `${sessionLine(s)}${s.steps?.length ? `\n    pasos: ${s.steps.join(' | ')}` : ''}`));
  }
  out.push('', 'Devuelve la propuesta en el formato pedido.');
  return out.join('\n');
}

/** Corre el agente principal para un atleta: generar → validar (Guardián) → corregir, hasta 3 vueltas. */
function buildAdjustBrief(ctx: AthleteContext, target: { id: string; start: string }, m: WeekMetrics | null, request: string, locked: Set<string>, today: string, limits: string[]): string {
  const out: string[] = [];
  out.push(`# Atleta: ${ctx.firstName}`);
  out.push(`Hoy (Lima): ${today}. Tarea: AJUSTE PUNTUAL de la semana ${target.id} (lunes ${target.start} a domingo ${addDays(target.start, 6)}), que el atleta ya tiene cargada.`);
  if (ctx.goalRace) out.push(`Carrera objetivo: ${ctx.goalRace.name}, ${ctx.goalRace.date}.`);
  out.push('', '## Pedido del coach', request.trim());
  out.push('', '## Ficha del atleta (memoria del coach)', ctx.memory.ficha.trim() || '(sin ficha todavía)');
  const w = ctx.weeks.find((x) => x.id === target.id);
  out.push('', `## Semana cargada ${target.id}`, `${w?.title ?? ''}${w?.phase ? ` · fase ${w.phase}` : ''}${w?.goal ? `\nObjetivo: ${w.goal}` : ''}`);
  if (w?.notes?.length) out.push('Notas:', ...w.notes.map((n) => `- ${n.title}: ${n.body.replace(/\n/g, ' / ')}`));
  for (const s of ctx.sessions[target.id] ?? []) {
    const r = m?.rows.find((x) => x.id === s.id);
    out.push(`${sessionLine(s)} · id ${s.id}${locked.has(s.id) ? ' · BLOQUEADA (ya pasó o está registrada)' : ''}${r?.rpeReal != null ? ` · RPE real ${r.rpeReal}` : ''}${r?.comment ? ` · "${r.comment}"` : ''}`);
    out.push(`    resumen: ${s.summary ?? ''} · duración ${s.durationMin ?? '–'} min · pasos: ${(s.steps ?? []).join(' | ')} · tip: ${s.tip ?? ''} · focus: ${s.focus ?? ''}`);
  }
  out.push(...scienceLines(ctx, today), ...limits);
  out.push('', `Devuelve la semana ${target.id} COMPLETA con el ajuste aplicado. Reglas del ajuste:`,
    '- Conserva el id de cada sesión existente; para mover una sesión cambia su date, no su id. Solo crea ids nuevos para sesiones nuevas.',
    '- No cambies las sesiones BLOQUEADAS.',
    '- Cambia solo lo que pide el coach y lo que la metodología exija por ese cambio (por ejemplo, si el fondo se adelanta, que no quede fuerza de pierna intensa 48 h antes; si quedan dos días seguidos de carrera dura, ajusta el otro). Copia el resto tal cual (título, pasos, tips, notas).',
    '- decision: "mantener" salvo que el pedido sea bajar o descargar. decisionRule: qué se cambió y por qué. summary y coachMessage: el cambio en 1 a 3 líneas. memoryRow: cadena vacía. alerts: solo si el ajuste tiene un riesgo.',
    '- En el tip de cada sesión que cambie, explica el cambio al atleta en una línea.');
  return out.join('\n');
}

export async function runHeadCoach(ctx: AthleteContext, opts: { today: string; analyzedWeekId: string; target: { id: string; start: string }; adjust?: { request: string } }): Promise<HeadCoachResult> {
  const { today, analyzedWeekId, target, adjust } = opts;
  const analyzedWeek = ctx.weeks.find((w) => w.id === analyzedWeekId);
  const metrics = analyzedWeek ? weekMetrics(analyzedWeek, ctx.sessions[analyzedWeekId] ?? [], ctx.logs, today) : null;

  const previous = ctx.weeks.filter((w) => w.id <= analyzedWeekId);
  let weeksSinceDeload: number | null = 0;
  for (let i = previous.length - 1; i >= 0 && !isDeloadPhase(previous[i].phase); i--) weeksSinceDeload++;
  if (weeksSinceDeload === previous.length) weeksSinceDeload = null; // nunca hubo descarga registrada: no se fuerza por calendario
  const emptyMetrics = weekMetrics({ id: analyzedWeekId, start: '', phase: '' }, [], null, today);
  const suggestion = suggestDecision(metrics ?? emptyMetrics, { weeksSinceDeload });
  const mustDeload = !adjust && suggestion.decision === 'descarga' && !/calendario/.test(suggestion.rule);

  // Sesiones que un ajuste no puede tocar: las ya registradas o pasadas.
  const original = adjust ? ctx.sessions[target.id] ?? [] : [];
  const locked = original.filter((s) => s.date < today || ctx.logs?.[s.id]?.done);

  // Volumen real de las semanas previas (hechos y pendientes; sin registros, lo planificado).
  const prevKm = analyzedWeek ? effectiveKm(ctx.sessions[analyzedWeekId] ?? [], ctx.logs, today) : null;
  const before = previous.filter((w) => w.id < analyzedWeekId).at(-1);
  const prev2Km = before ? effectiveKm(ctx.sessions[before.id] ?? [], ctx.logs, today) : null;
  const recent = previous.slice(-4).map((w) => runKm(ctx.sessions[w.id] ?? []));
  const longest = longestRecentRun(Object.values(ctx.sessions).flat(), ctx.logs, today);
  // En un ajuste no se reabre lo que el coach ya aprobó: las distancias de la semana cargada valen como referencia.
  const originalMax = Math.max(0, ...original.filter((s) => !locked.includes(s)).map((s) => (runKm([s]) > 0 ? s.distanceKm ?? 0 : 0)));
  const longestRecentKm = adjust ? Math.max(longest?.km ?? 0, originalMax / 1.1) || null : longest?.km ?? null;
  const painFreeWeeks = ctx.logs != null && previous.slice(-5).every((w) => !weekMetrics(w, ctx.sessions[w.id] ?? [], ctx.logs, today).painMentions.length);
  const reference = ctx.memory.reference;
  // En un ajuste la referencia es la misma semana tal como estaba: no sube km sin que se pida, y
  // la semana de carrera ya quedó protegida cuando se aprobó.
  const guardBase: Omit<GuardContext, 'decision'> = {
    weekId: target.id,
    start: target.start,
    painAlert: !!metrics?.painMentions.length,
    illnessAlert: !!metrics?.illnessMentions.length,
    prevKm: adjust ? runKm(original) : prevKm,
    prev2Km: adjust ? null : prev2Km,
    recentMaxKm: adjust ? null : recent.length ? Math.max(...recent) : null,
    prevWasDeload: !adjust && isDeloadPhase(analyzedWeek?.phase),
    race: adjust || !ctx.goalRace ? null : { date: ctx.goalRace.date, distanceKm: ctx.goalRace.distanceKm },
    longestRecentKm,
    easyPaceSecPerKm: reference ? easyPaceMid(fitnessIndex(reference.distanceKm, reference.timeMin)) : null,
    painFreeWeeks,
    mode: adjust ? 'ajuste' : 'semanal',
  };
  const limits = guardLines(guardBase, adjust ? null : longest?.source ?? null);

  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: 'user', content: adjust ? buildAdjustBrief(ctx, target, metrics, adjust.request, new Set(locked.map((s) => s.id)), today, limits) : buildBrief(ctx, analyzedWeekId, target, metrics, suggestion, today, limits) },
  ];
  const usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0 };
  let last: { output: AgentOutput; plan: PlanWeekFile[]; issues: string[]; km: number } | null = null;
  let warnings: string[] = [];
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    const res = await client.beta.messages.stream({
      model: HEAD_COACH_MODEL,
      max_tokens: 32000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      cache_control: { type: 'ephemeral' },
      system: SYSTEM,
      messages,
    }).finalMessage();

    usage.inputTokens += res.usage.input_tokens;
    usage.outputTokens += res.usage.output_tokens;
    usage.cacheReadTokens += res.usage.cache_read_input_tokens ?? 0;
    usage.cacheWriteTokens += res.usage.cache_creation_input_tokens ?? 0;

    if (res.stop_reason === 'refusal') throw new Error('El modelo no quiso responder esta solicitud.');
    if (res.stop_reason === 'max_tokens') throw new Error('La respuesta del modelo quedó cortada.');
    const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    let output: AgentOutput;
    try {
      output = JSON.parse(text) as AgentOutput;
    } catch {
      throw new Error('El modelo devolvió un JSON inválido.');
    }

    const raw = toPlanFile(output, target.id, target.start);
    const checked = checkProposal(raw, { ...guardBase, decision: output.decision }, sessionExtras(output));
    const { plan, issues, km } = checked;
    warnings = checked.warnings;
    if (adjust) issues.push(...checkAdjustment(plan, original, locked));
    if (mustDeload && output.decision !== 'descarga') issues.unshift(`La regla exige descarga (${suggestion.rule}); no se puede cambiar.`);
    last = { output, plan, issues, km };
    if (!issues.length) break;

    // Corrección: se agrega a la conversación (sin editar lo anterior) con los problemas del Guardián.
    messages.push({ role: 'assistant', content: res.content as unknown as Anthropic.Beta.BetaContentBlockParam[] });
    messages.push({ role: 'user', content: `El Guardián revisó la propuesta y encontró:\n${issues.map((i) => `- ${i}`).join('\n')}\n\nCorrígela y devuelve la propuesta completa otra vez.` });
  }

  usage.costUsd = Math.round(((usage.inputTokens * PRICE.input + usage.outputTokens * PRICE.output
    + usage.cacheReadTokens * PRICE.cacheRead + usage.cacheWriteTokens * PRICE.cacheWrite) / 1e6) * 1000) / 1000;
  if (!last) throw new Error('El agente no produjo ninguna propuesta.');
  // Los avisos del Guardián no bloquean: van al coach con las alertas del modelo.
  last.output.alerts = [...new Set([...(last.output.alerts ?? []), ...warnings])];
  return { ...last, attempts, metrics: metrics ?? emptyMetrics, suggestion, usage, model: HEAD_COACH_MODEL };
}

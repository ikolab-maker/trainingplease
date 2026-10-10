import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { addDays, dayParts } from '@/lib/dates';
import { checkProposal, type GuardContext } from './guardrails';
import type { AthleteContext } from './context';
import { METHODOLOGY, METHODOLOGY_VERSION } from './methodology';
import { isDeloadPhase, runKm, suggestDecision, weekMetrics, type Decision, type WeekMetrics } from './metrics';
import { OUTPUT_SCHEMA, toPlanFile, type AgentOutput } from './proposal';
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
- Guardián: revisará tu propuesta con reglas duras (km, descarga, taper, dolor). Si algo falla te devolverá los problemas para corregir.

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

function buildBrief(ctx: AthleteContext, analyzed: string, target: { id: string; start: string }, m: WeekMetrics | null,
  suggestion: { decision: Decision; rule: string }, today: string): string {
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
    if (m.missedCore.length) out.push(`Principales saltadas: ${m.missedCore.join('; ')}`);
  }
  out.push('', `Decisión sugerida por las reglas: **${suggestion.decision}**. Regla: ${suggestion.rule}`);

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
export async function runHeadCoach(ctx: AthleteContext, opts: { today: string; analyzedWeekId: string; target: { id: string; start: string } }): Promise<HeadCoachResult> {
  const { today, analyzedWeekId, target } = opts;
  const analyzedWeek = ctx.weeks.find((w) => w.id === analyzedWeekId);
  const metrics = analyzedWeek ? weekMetrics(analyzedWeek, ctx.sessions[analyzedWeekId] ?? [], ctx.logs, today) : null;

  const previous = ctx.weeks.filter((w) => w.id <= analyzedWeekId);
  let weeksSinceDeload: number | null = 0;
  for (let i = previous.length - 1; i >= 0 && !isDeloadPhase(previous[i].phase); i--) weeksSinceDeload++;
  if (weeksSinceDeload === previous.length) weeksSinceDeload = null; // nunca hubo descarga registrada: no se fuerza por calendario
  const emptyMetrics = weekMetrics({ id: analyzedWeekId, start: '', phase: '' }, [], null, today);
  const suggestion = suggestDecision(metrics ?? emptyMetrics, { weeksSinceDeload });
  const mustDeload = suggestion.decision === 'descarga' && !/calendario/.test(suggestion.rule);

  const prevKm = analyzedWeek ? runKm(ctx.sessions[analyzedWeekId] ?? []) : null;
  const recent = previous.slice(-4).map((w) => runKm(ctx.sessions[w.id] ?? []));
  const guardBase: Omit<GuardContext, 'decision'> = {
    weekId: target.id,
    start: target.start,
    painAlert: !!metrics?.painMentions.length,
    prevKm,
    recentMaxKm: recent.length ? Math.max(...recent) : null,
    prevWasDeload: isDeloadPhase(analyzedWeek?.phase),
    raceDate: ctx.goalRace?.date ?? null,
  };

  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: 'user', content: buildBrief(ctx, analyzedWeekId, target, metrics, suggestion, today) },
  ];
  const usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0 };
  let last: { output: AgentOutput; plan: PlanWeekFile[]; issues: string[]; km: number } | null = null;
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
    const { plan, issues, km } = checkProposal(raw, { ...guardBase, decision: output.decision });
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
  return { ...last, attempts, metrics: metrics ?? emptyMetrics, suggestion, usage, model: HEAD_COACH_MODEL };
}

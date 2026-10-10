import 'server-only';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { addDays, isoWeekId, mondayOf, todayISO } from '@/lib/dates';
import { loadAthleteContext } from './context';
import { runHeadCoach, type HeadCoachResult } from './headCoach';

export type RunOutcome =
  | { uid: string; status: 'proposed'; id: string; weekId: string; decision: string; issues: number; costUsd: number }
  | { uid: string; status: 'skipped'; reason: string }
  | { uid: string; status: 'error'; error: string };

type Trigger = 'cron' | 'coach';

/**
 * Semanas del ciclo: se analiza la semana en curso (el domingo es la que cierra)
 * y se propone la siguiente.
 */
export function cycleWeeks(today: string) {
  const start = addDays(mondayOf(today), 7);
  return { analyzedWeekId: isoWeekId(today), target: { id: isoWeekId(start), start } };
}

function proposalDoc(r: HeadCoachResult, analyzedWeekId: string) {
  return {
    status: 'pending',
    weekId: r.plan[0]?.id ?? '',
    analyzedWeekId,
    decision: r.output.decision,
    decisionRule: r.output.decisionRule,
    suggestion: r.suggestion,
    summary: r.output.summary,
    alerts: r.output.alerts,
    questionsForAthlete: r.output.questionsForAthlete,
    coachMessage: r.output.coachMessage,
    memoryRow: r.output.memoryRow,
    metrics: {
      compliancePct: r.metrics.compliancePct, coreDone: r.metrics.coreDone, corePlanned: r.metrics.corePlanned,
      corePending: r.metrics.corePending, kmPlanned: r.metrics.kmPlanned, kmDone: r.metrics.kmDone,
      logsAvailable: r.metrics.logsAvailable, painMentions: r.metrics.painMentions.length,
      rpeOverTarget: r.metrics.rpeOverTarget.length,
    },
    km: r.km,
    plan: r.plan,
    issues: r.issues,
    attempts: r.attempts,
    model: r.model,
    createdAt: FieldValue.serverTimestamp(),
  };
}

async function fail(uid: string, runRef: DocumentReference, base: Record<string, unknown>, e: unknown): Promise<RunOutcome> {
  const error = (e instanceof Error ? e.message : String(e)).slice(0, 500);
  console.error('agent run', uid, e);
  await runRef.set({ ...base, status: 'error', error, finishedAt: FieldValue.serverTimestamp() }).catch(() => {});
  return { uid, status: 'error', error };
}

const runLog = (r: HeadCoachResult) => ({
  status: 'ok', decision: r.output.decision, issues: r.issues, attempts: r.attempts, model: r.model, usage: r.usage, finishedAt: FieldValue.serverTimestamp(),
});

/** Ciclo del agente principal para un atleta: contexto → propuesta validada → guardada para el coach. */
export async function runForAthlete(uid: string, opts: { trigger: Trigger; today?: string }): Promise<RunOutcome> {
  const today = opts.today ?? todayISO();
  const { analyzedWeekId, target } = cycleWeeks(today);
  const db = adminDb();
  const runRef = db.collection('agentRuns').doc();
  const base = { uid, kind: 'semanal', trigger: opts.trigger, analyzedWeekId, weekId: target.id, startedAt: FieldValue.serverTimestamp() };

  try {
    const ctx = await loadAthleteContext(uid, analyzedWeekId, target.id);
    if (!ctx) return { uid, status: 'skipped', reason: 'No es un atleta.' };
    if (!ctx.aiConsent) {
      await runRef.set({ ...base, status: 'skipped', reason: 'sin-permiso-ia' });
      return { uid, status: 'skipped', reason: 'El atleta no autorizó planes con IA en su consentimiento.' };
    }
    const proposalRef = db.doc(`proposals/${uid}/weeks/${target.id}`);
    const existing = await proposalRef.get();
    if (existing.exists && existing.get('status') === 'approved') {
      return { uid, status: 'skipped', reason: `La propuesta de ${target.id} ya fue aprobada.` };
    }

    const r = await runHeadCoach(ctx, { today, analyzedWeekId, target });
    await proposalRef.set({ ...proposalDoc(r, analyzedWeekId), kind: 'semanal', runId: runRef.id, trigger: opts.trigger });
    await runRef.set({ ...base, ...runLog(r) });
    return { uid, status: 'proposed', id: target.id, weekId: target.id, decision: r.output.decision, issues: r.issues.length, costUsd: r.usage.costUsd };
  } catch (e) {
    return fail(uid, runRef, base, e);
  }
}

/**
 * Ajuste puntual a pedido del coach sobre una semana ya cargada (por ejemplo, "mueve el
 * fondo del domingo al sábado"). Queda como propuesta aparte, para aprobar como cualquier otra.
 */
export async function runAdjustment(uid: string, weekId: string, request: string, opts: { today?: string } = {}): Promise<RunOutcome> {
  const today = opts.today ?? todayISO();
  const db = adminDb();
  const runRef = db.collection('agentRuns').doc();
  const base = { uid, kind: 'ajuste', trigger: 'coach', weekId, request, startedAt: FieldValue.serverTimestamp() };

  try {
    const ctx = await loadAthleteContext(uid, weekId, weekId);
    if (!ctx) return { uid, status: 'skipped', reason: 'No es un atleta.' };
    if (!ctx.aiConsent) return { uid, status: 'skipped', reason: 'El atleta no autorizó planes con IA en su consentimiento.' };
    const week = ctx.weeks.find((w) => w.id === weekId);
    if (!week || !ctx.sessions[weekId]?.length) return { uid, status: 'skipped', reason: `La semana ${weekId} no está cargada.` };

    const r = await runHeadCoach(ctx, { today, analyzedWeekId: weekId, target: { id: weekId, start: week.start }, adjust: { request } });
    const id = `${weekId}_${Date.now()}`;
    await db.doc(`proposals/${uid}/weeks/${id}`).set({ ...proposalDoc(r, weekId), memoryRow: '', kind: 'ajuste', request, runId: runRef.id, trigger: 'coach' });
    await runRef.set({ ...base, ...runLog(r) });
    return { uid, status: 'proposed', id, weekId, decision: r.output.decision, issues: r.issues.length, costUsd: r.usage.costUsd };
  } catch (e) {
    return fail(uid, runRef, base, e);
  }
}

/** Todos los atletas, en paralelo (el loop semanal del domingo). */
export async function runForAllAthletes(trigger: Trigger): Promise<RunOutcome[]> {
  const snap = await adminDb().collection('users').where('role', '==', 'athlete').get();
  return Promise.all(snap.docs.map((d) => runForAthlete(d.id, { trigger })));
}

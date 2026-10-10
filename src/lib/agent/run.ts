import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { addDays, isoWeekId, mondayOf, todayISO } from '@/lib/dates';
import { loadAthleteContext } from './context';
import { runHeadCoach } from './headCoach';

export type RunOutcome =
  | { uid: string; status: 'proposed'; weekId: string; decision: string; issues: number; costUsd: number }
  | { uid: string; status: 'skipped'; reason: string }
  | { uid: string; status: 'error'; error: string };

/**
 * Semanas del ciclo: se analiza la semana en curso (el domingo es la que cierra)
 * y se propone la siguiente.
 */
export function cycleWeeks(today: string) {
  const start = addDays(mondayOf(today), 7);
  return { analyzedWeekId: isoWeekId(today), target: { id: isoWeekId(start), start } };
}

/** Ciclo del agente principal para un atleta: contexto → propuesta validada → guardada para el coach. */
export async function runForAthlete(uid: string, opts: { trigger: 'cron' | 'coach'; today?: string } ): Promise<RunOutcome> {
  const today = opts.today ?? todayISO();
  const { analyzedWeekId, target } = cycleWeeks(today);
  const db = adminDb();
  const runRef = db.collection('agentRuns').doc();
  const base = { uid, trigger: opts.trigger, analyzedWeekId, weekId: target.id, startedAt: FieldValue.serverTimestamp() };

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
    await proposalRef.set({
      status: 'pending',
      weekId: target.id,
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
      runId: runRef.id,
      trigger: opts.trigger,
      createdAt: FieldValue.serverTimestamp(),
    });
    await runRef.set({ ...base, status: 'ok', decision: r.output.decision, issues: r.issues, attempts: r.attempts, model: r.model, usage: r.usage, finishedAt: FieldValue.serverTimestamp() });
    return { uid, status: 'proposed', weekId: target.id, decision: r.output.decision, issues: r.issues.length, costUsd: r.usage.costUsd };
  } catch (e) {
    const error = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    console.error('agent run', uid, e);
    await runRef.set({ ...base, status: 'error', error, finishedAt: FieldValue.serverTimestamp() }).catch(() => {});
    return { uid, status: 'error', error };
  }
}

/** Todos los atletas, en paralelo (el loop semanal del domingo). */
export async function runForAllAthletes(trigger: 'cron' | 'coach'): Promise<RunOutcome[]> {
  const snap = await adminDb().collection('users').where('role', '==', 'athlete').get();
  return Promise.all(snap.docs.map((d) => runForAthlete(d.id, { trigger })));
}

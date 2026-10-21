import 'server-only';
import { FieldValue, type DocumentSnapshot, type Firestore } from 'firebase-admin/firestore';
import { parsePlanFile } from '@/lib/planFile';
import { writePlan } from '@/lib/planWrite';

/**
 * Carga una propuesta pendiente en el plan del atleta y suma su fila al historial.
 * La usan el coach (al aprobar, con su versión editada si la hay) y el cron del domingo (carga automática).
 */
export async function applyProposal(db: Firestore, uid: string, snap: DocumentSnapshot, opts: { plan?: unknown; by: string }) {
  const weekId = String(snap.get('weekId') ?? '');
  const { plan, errors } = parsePlanFile(opts.plan ?? snap.get('plan'));
  if (errors.length) return { ok: false as const, errors };
  if (plan.length !== 1 || plan[0].id !== weekId) return { ok: false as const, errors: [`La propuesta debe ser solo la semana ${weekId}.`] };
  plan[0].week.aiAssisted = true;

  const written = await writePlan(db, uid, plan);
  await snap.ref.update({ status: 'approved', edited: opts.plan != null, approvedPlan: plan, reviewedAt: FieldValue.serverTimestamp(), reviewedBy: opts.by });
  const row = snap.get('memoryRow');
  if (typeof row === 'string' && row) {
    await db.doc(`athleteMemory/${uid}`).set({
      history: FieldValue.arrayUnion({ weekId: snap.get('analyzedWeekId'), decision: snap.get('decision'), row }),
    }, { merge: true });
  }
  return { ok: true as const, ...written };
}

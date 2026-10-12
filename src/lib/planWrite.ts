import 'server-only';
import type { Firestore } from 'firebase-admin/firestore';
import type { PlanWeekFile } from './planFile';

/** Escribe semanas ya validadas, igual que scripts/seed-plan.mjs: fusiona la semana y crea o sobrescribe sus sesiones; no borra nada. */
export async function writePlan(db: Firestore, uid: string, plan: PlanWeekFile[]) {
  const batch = db.batch();
  for (const w of plan) {
    batch.set(db.doc(`plans/${uid}/weeks/${w.id}`), w.week, { merge: true });
    for (const { id, ...s } of w.sessions) {
      batch.set(db.doc(`plans/${uid}/weeks/${w.id}/sessions/${id}`), { ...s, weekId: w.id });
    }
  }
  await batch.commit();
  return { weeks: plan.length, sessions: plan.reduce((n, w) => n + w.sessions.length, 0) };
}

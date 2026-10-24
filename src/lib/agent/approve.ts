import 'server-only';
import { FieldValue, type DocumentSnapshot, type Firestore } from 'firebase-admin/firestore';
import { parsePlanFile } from '@/lib/planFile';
import { writePlan } from '@/lib/planWrite';
import { APP_URL, addContact, sendEmail } from '@/lib/email';

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
  await notifyAthlete(db, uid, plan[0].week.title || weekId).catch((e) => console.error('aviso semana', e));
  return { ok: true as const, ...written };
}

/** Aviso por correo al atleta de que su semana ya está en la app. Sin RESEND_API_KEY no hace nada. */
async function notifyAthlete(db: Firestore, uid: string, title: string) {
  const user = await db.doc(`users/${uid}`).get();
  const email = user.get('email');
  if (typeof email !== 'string' || !email) return;
  const name = String(user.get('name') ?? '').split(' ')[0];
  await addContact(email, name, 'atletas');
  if (user.get('lang') === 'en') {
    await sendEmail(
      email,
      'Your training week is ready',
      name ? `${name}, your week is ready` : 'Your week is ready',
      [`Your plan is in the app: ${title}.`, 'Check it, plan your days and tick off each session when you finish it.'],
      { label: 'See my week', url: `${APP_URL}/plan` },
      'en',
    );
    return;
  }
  await sendEmail(
    email,
    'Tu semana de entrenamiento está lista',
    name ? `${name}, tu semana está lista` : 'Tu semana está lista',
    [`Ya tienes tu plan en la app: ${title}.`, 'Revísalo, organiza tus días y marca cada sesión al terminarla.'],
    { label: 'Ver mi semana', url: `${APP_URL}/plan` },
  );
}

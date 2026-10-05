import { NextResponse } from 'next/server';
import { adminDb, verifyRequest } from '@/lib/firebase-admin';
import { parsePlanFile } from '@/lib/planFile';

export const runtime = 'nodejs';

/**
 * Importa semanas a un atleta, igual que scripts/seed-plan.mjs:
 * fusiona cada semana y crea o sobrescribe sus sesiones; no borra nada.
 */
export async function POST(req: Request) {
  const token = await verifyRequest(req);
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const uid = typeof body?.uid === 'string' ? body.uid : '';
  if (!/^[A-Za-z0-9]{1,128}$/.test(uid)) return NextResponse.json({ error: 'Atleta inválido.' }, { status: 400 });

  const { plan, errors } = parsePlanFile(body?.plan);
  if (errors.length) return NextResponse.json({ error: 'invalid', errors }, { status: 400 });

  const db = adminDb();
  const user = await db.doc(`users/${uid}`).get();
  if (!user.exists || user.get('role') !== 'athlete') {
    return NextResponse.json({ error: 'Ese atleta no existe.' }, { status: 404 });
  }

  const batch = db.batch();
  for (const w of plan) {
    batch.set(db.doc(`plans/${uid}/weeks/${w.id}`), w.week, { merge: true });
    for (const { id, ...s } of w.sessions) {
      batch.set(db.doc(`plans/${uid}/weeks/${w.id}/sessions/${id}`), { ...s, weekId: w.id });
    }
  }
  await batch.commit();
  return NextResponse.json({ ok: true, weeks: plan.length, sessions: plan.reduce((n, w) => n + w.sessions.length, 0) });
}

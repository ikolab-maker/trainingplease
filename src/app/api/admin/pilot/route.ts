import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, verifyRequest } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/**
 * El coach responde una solicitud del piloto.
 * - approve: crea el alta en allowlist/{correo} (como el alta manual) y marca la solicitud.
 * - dismiss: la marca como descartada; la persona puede volver a postular.
 */
export async function POST(req: Request) {
  const token = await verifyRequest(req);
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? '').trim().toLowerCase();
  const action = body?.action;
  if (!email || (action !== 'approve' && action !== 'dismiss')) {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const db = adminDb();
  const reqRef = db.doc(`pilotRequests/${email}`);
  const snap = await reqRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const by = token.email ?? token.uid;

  if (action === 'dismiss') {
    await reqRef.update({ status: 'dismissed', reviewedAt: FieldValue.serverTimestamp(), reviewedBy: by });
    return NextResponse.json({ ok: true });
  }

  const r = snap.data()!;
  const allowRef = db.doc(`allowlist/${email}`);
  await db.runTransaction(async (tx) => {
    if (!(await tx.get(allowRef)).exists) {
      tx.set(allowRef, {
        email,
        name: String(r.name ?? '').slice(0, 120),
        goalRace: r.raceName && r.raceDate
          ? { name: r.raceName, date: r.raceDate, distanceKm: r.raceKm ?? null }
          : null,
        uid: null,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: by,
        source: 'pilotRequest',
      });
    }
    tx.update(reqRef, { status: 'approved', reviewedAt: FieldValue.serverTimestamp(), reviewedBy: by });
  });
  return NextResponse.json({ ok: true });
}

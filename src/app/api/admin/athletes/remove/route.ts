import { NextResponse } from 'next/server';
import { adminAuth, adminDb, adminEmails, verifyRequest } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Borra a un atleta por completo (zona de peligro de su ficha): perfil, plan, registros,
 * memoria y propuestas del agente, consentimientos, corridas del agente, su alta y su cuenta de Google en la app.
 * Solo el coach, solo atletas (nunca un admin) y solo si escribe el nombre exacto del atleta.
 */
export async function POST(req: Request) {
  const token = await verifyRequest(req);
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const uid = typeof body?.uid === 'string' ? body.uid : '';
  const confirmName = typeof body?.confirmName === 'string' ? body.confirmName.trim() : '';
  if (!/^[A-Za-z0-9]{1,128}$/.test(uid) || uid === token.uid) return NextResponse.json({ error: 'Atleta inválido.' }, { status: 400 });

  const db = adminDb();
  const userRef = db.doc(`users/${uid}`);
  const user = await userRef.get();
  if (!user.exists || user.get('role') !== 'athlete') return NextResponse.json({ error: 'No es un atleta.' }, { status: 404 });
  const name = String(user.get('name') ?? '').trim();
  const email = String(user.get('email') ?? '').toLowerCase();
  if (!confirmName || confirmName !== name) return NextResponse.json({ error: 'El nombre no coincide.' }, { status: 400 });
  if (email && adminEmails().includes(email)) return NextResponse.json({ error: 'Esa cuenta es de un coach.' }, { status: 400 });

  // Primero lo que no deja entrar de nuevo: el alta y la cuenta. Luego sus datos.
  const invites = await db.collection('allowlist').where('uid', '==', uid).get();
  await Promise.all(invites.docs.map((d) => d.ref.delete()));
  if (email) await db.doc(`allowlist/${email}`).delete();
  await adminAuth().deleteUser(uid).catch((e: { code?: string }) => { if (e?.code !== 'auth/user-not-found') throw e; });

  for (const path of [`plans/${uid}`, `logs/${uid}`, `athleteMemory/${uid}`, `proposals/${uid}`, `consents/${uid}`]) {
    await db.recursiveDelete(db.doc(path));
  }
  const runs = await db.collection('agentRuns').where('uid', '==', uid).get();
  const writer = db.bulkWriter();
  runs.docs.forEach((d) => writer.delete(d.ref));
  await writer.close();
  await userRef.delete();

  return NextResponse.json({ ok: true, name, agentRuns: runs.size });
}

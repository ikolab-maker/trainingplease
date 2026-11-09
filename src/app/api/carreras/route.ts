import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, verifyRequest } from '@/lib/firebase-admin';
import { parseRaces, principalRace, toGoalRace } from '@/lib/races';

export const runtime = 'nodejs';

/**
 * Guarda las carreras del atleta que llama (nunca las de otro) y deja como carrera
 * objetivo la principal. Pasa por el servidor para validar que haya una sola principal
 * y que tenga meta de tiempo, sin tocar las reglas de Firestore.
 */
export async function POST(req: Request) {
  const token = await verifyRequest(req);
  if (!token) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null);
  const { races, error } = parseRaces(body?.races);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const ref = adminDb().doc(`users/${token.uid}`);
  const snap = await ref.get();
  if (!snap.exists || snap.get('role') !== 'athlete') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await ref.update({ races, goalRace: toGoalRace(principalRace(races)), updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true, races });
}

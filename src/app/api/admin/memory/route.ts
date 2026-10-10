import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, verifyRequest } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/** Guarda la ficha del atleta que lee el agente principal (meta, reglas personales, lesiones). */
export async function POST(req: Request) {
  const token = await verifyRequest(req);
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null);
  const uid = typeof body?.uid === 'string' ? body.uid : '';
  if (!/^[A-Za-z0-9]{1,128}$/.test(uid)) return NextResponse.json({ error: 'Atleta inválido.' }, { status: 400 });
  if (typeof body?.ficha !== 'string' || body.ficha.length > 20000) return NextResponse.json({ error: 'La ficha debe ser texto (máximo 20 000 caracteres).' }, { status: 400 });
  await adminDb().doc(`athleteMemory/${uid}`).set({ ficha: body.ficha, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return NextResponse.json({ ok: true });
}

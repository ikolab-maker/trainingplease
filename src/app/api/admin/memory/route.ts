import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, verifyRequest } from '@/lib/firebase-admin';
import { todayISO } from '@/lib/dates';
import { parseReference } from '@/lib/agent/fitness';

export const runtime = 'nodejs';

/**
 * Guarda la ficha del atleta que lee el agente principal (meta, reglas personales, lesiones),
 * su tiempo de referencia (para el índice de forma y los ritmos) y su meta de tiempo.
 * Cada campo es opcional; null borra la referencia o la meta.
 */
export async function POST(req: Request) {
  const token = await verifyRequest(req);
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null);
  const uid = typeof body?.uid === 'string' ? body.uid : '';
  if (!/^[A-Za-z0-9]{1,128}$/.test(uid)) return NextResponse.json({ error: 'Atleta inválido.' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.ficha !== undefined) {
    if (typeof body.ficha !== 'string' || body.ficha.length > 20000) return NextResponse.json({ error: 'La ficha debe ser texto (máximo 20 000 caracteres).' }, { status: 400 });
    update.ficha = body.ficha;
  }
  if (body.reference !== undefined) {
    if (body.reference === null) update.reference = FieldValue.delete();
    else {
      const ref = parseReference(body.reference);
      if (!ref || ref.date > todayISO()) {
        return NextResponse.json({ error: 'El tiempo de referencia no es válido: distancia de 1 a 100 km, tiempo real y una fecha que ya pasó.' }, { status: 400 });
      }
      update.reference = ref;
    }
  }
  if (body.goalTimeMin !== undefined) {
    if (body.goalTimeMin === null) update.goalTimeMin = FieldValue.delete();
    else if (typeof body.goalTimeMin === 'number' && body.goalTimeMin >= 3 && body.goalTimeMin <= 900) update.goalTimeMin = body.goalTimeMin;
    else return NextResponse.json({ error: 'La meta de tiempo no es válida.' }, { status: 400 });
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nada que guardar.' }, { status: 400 });

  await adminDb().doc(`athleteMemory/${uid}`).set({ ...update, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return NextResponse.json({ ok: true });
}

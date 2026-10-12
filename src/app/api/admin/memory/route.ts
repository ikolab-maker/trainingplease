import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, verifyRequest } from '@/lib/firebase-admin';
import { todayISO } from '@/lib/dates';
import { fitnessIndex, parseReference } from '@/lib/agent/fitness';

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
    else {
      // Contra la distancia de la carrera objetivo: "1:50" leído como minutos en una media no pasa.
      const goal = body.goalTimeMin;
      const distanceKm = (await adminDb().doc(`users/${uid}`).get()).get('goalRace.distanceKm');
      const index = typeof goal === 'number' && typeof distanceKm === 'number' && distanceKm > 0 ? fitnessIndex(distanceKm, goal) : null;
      const ok = typeof goal === 'number' && goal >= 3 && goal <= 900 && (index == null || (index >= 15 && index <= 90));
      if (!ok) return NextResponse.json({ error: 'La meta de tiempo no cuadra con la distancia de la carrera objetivo (para horas usa h:mm:ss).' }, { status: 400 });
      update.goalTimeMin = goal;
    }
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nada que guardar.' }, { status: 400 });

  await adminDb().doc(`athleteMemory/${uid}`).set({ ...update, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return NextResponse.json({ ok: true });
}

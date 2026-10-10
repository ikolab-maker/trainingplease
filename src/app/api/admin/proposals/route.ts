import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb, verifyRequest } from '@/lib/firebase-admin';
import { parsePlanFile } from '@/lib/planFile';
import { writePlan } from '@/lib/planWrite';

export const runtime = 'nodejs';

const UID_RE = /^[A-Za-z0-9]{1,128}$/;
const WEEK_RE = /^\d{4}-W\d{2}$/;

const plain = (v: unknown): unknown =>
  v instanceof Timestamp ? v.toDate().toISOString()
  : Array.isArray(v) ? v.map(plain)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]))
  : v;

async function admin(req: Request) {
  const token = await verifyRequest(req);
  return token && token.role === 'admin' ? token : null;
}

/** Propuestas del agente principal para un atleta (las más recientes) y su ficha. */
export async function GET(req: Request) {
  if (!(await admin(req))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const uid = new URL(req.url).searchParams.get('uid') ?? '';
  if (!UID_RE.test(uid)) return NextResponse.json({ error: 'Atleta inválido.' }, { status: 400 });
  const db = adminDb();
  const [props, mem] = await Promise.all([
    db.collection(`proposals/${uid}/weeks`).orderBy('createdAt', 'desc').limit(4).get(),
    db.doc(`athleteMemory/${uid}`).get(),
  ]);
  return NextResponse.json({
    proposals: props.docs.map((d) => plain({ id: d.id, ...d.data() })),
    memory: plain(mem.data() ?? { ficha: '', history: [] }),
    agentReady: !!process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * El coach decide: "approve" carga la semana en el plan del atleta (opcionalmente con
 * su versión editada) y suma la fila al historial; "discard" la archiva sin cargar nada.
 */
export async function POST(req: Request) {
  const token = await admin(req);
  if (!token) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null);
  const uid = typeof body?.uid === 'string' ? body.uid : '';
  const weekId = typeof body?.weekId === 'string' ? body.weekId : '';
  const action = body?.action;
  if (!UID_RE.test(uid) || !WEEK_RE.test(weekId) || (action !== 'approve' && action !== 'discard')) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const db = adminDb();
  const ref = db.doc(`proposals/${uid}/weeks/${weekId}`);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'No existe esa propuesta.' }, { status: 404 });
  if (snap.get('status') !== 'pending') return NextResponse.json({ error: 'Esa propuesta ya fue revisada.' }, { status: 409 });

  if (action === 'discard') {
    await ref.update({ status: 'discarded', reviewedAt: FieldValue.serverTimestamp(), reviewedBy: token.email ?? token.uid });
    return NextResponse.json({ ok: true });
  }

  const { plan, errors } = parsePlanFile(body?.plan ?? snap.get('plan'));
  if (errors.length) return NextResponse.json({ error: 'invalid', errors }, { status: 400 });
  if (plan.length !== 1 || plan[0].id !== weekId) return NextResponse.json({ error: `La propuesta debe ser solo la semana ${weekId}.` }, { status: 400 });
  plan[0].week.aiAssisted = true;

  const written = await writePlan(db, uid, plan);
  const edited = body?.plan != null;
  await ref.update({ status: 'approved', edited, approvedPlan: plan, reviewedAt: FieldValue.serverTimestamp(), reviewedBy: token.email ?? token.uid });
  const row = snap.get('memoryRow');
  if (typeof row === 'string' && row) {
    await db.doc(`athleteMemory/${uid}`).set({
      history: FieldValue.arrayUnion({ weekId: snap.get('analyzedWeekId'), decision: snap.get('decision'), row }),
    }, { merge: true });
  }
  return NextResponse.json({ ok: true, ...written });
}

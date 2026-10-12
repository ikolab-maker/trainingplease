import { NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/firebase-admin';
import { runAdjustment, runForAthlete } from '@/lib/agent/run';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * El coach pide al agente, para un atleta: la propuesta de la semana siguiente (botón
 * "Generar propuesta") o, con weekId y request, un ajuste puntual de una semana ya cargada.
 */
export async function POST(req: Request) {
  const token = await verifyRequest(req);
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'Falta ANTHROPIC_API_KEY en Vercel.' }, { status: 503 });

  const body = await req.json().catch(() => null);
  const uid = typeof body?.uid === 'string' ? body.uid : '';
  if (!/^[A-Za-z0-9]{1,128}$/.test(uid)) return NextResponse.json({ error: 'Atleta inválido.' }, { status: 400 });

  const request = typeof body?.request === 'string' ? body.request.trim() : '';
  let out;
  if (request) {
    const weekId = typeof body?.weekId === 'string' ? body.weekId : '';
    if (!/^\d{4}-W\d{2}$/.test(weekId)) return NextResponse.json({ error: 'Semana inválida.' }, { status: 400 });
    if (request.length > 1000) return NextResponse.json({ error: 'El pedido es muy largo (máximo 1000 caracteres).' }, { status: 400 });
    out = await runAdjustment(uid, weekId, request);
  } else {
    out = await runForAthlete(uid, { trigger: 'coach' });
  }
  return NextResponse.json(out, { status: out.status === 'error' ? 500 : 200 });
}

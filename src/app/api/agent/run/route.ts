import { NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/firebase-admin';
import { runForAthlete } from '@/lib/agent/run';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** El coach pide una propuesta ahora para un atleta (botón "Generar propuesta"). */
export async function POST(req: Request) {
  const token = await verifyRequest(req);
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'Falta ANTHROPIC_API_KEY en Vercel.' }, { status: 503 });

  const body = await req.json().catch(() => null);
  const uid = typeof body?.uid === 'string' ? body.uid : '';
  if (!/^[A-Za-z0-9]{1,128}$/.test(uid)) return NextResponse.json({ error: 'Atleta inválido.' }, { status: 400 });

  const out = await runForAthlete(uid, { trigger: 'coach' });
  return NextResponse.json(out, { status: out.status === 'error' ? 500 : 200 });
}

import { NextResponse } from 'next/server';
import { runForAllAthletes } from '@/lib/agent/run';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Loop semanal: Vercel Cron lo llama el domingo a las 12:05 de Lima (vercel.json)
 * con el encabezado Authorization: Bearer $CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'Falta ANTHROPIC_API_KEY.' }, { status: 503 });
  const results = await runForAllAthletes('cron');
  return NextResponse.json({ results });
}

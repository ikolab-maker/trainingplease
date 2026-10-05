import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Diagnóstico sin datos sensibles: solo dice si la configuración del servidor está completa. */
export async function GET() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT ?? '';
  let serviceAccount = raw ? 'invalid_json' : 'missing';
  let projectId: string | undefined;
  try {
    if (raw) {
      projectId = JSON.parse(raw).project_id;
      serviceAccount = 'ok';
    }
  } catch {}
  let adminSdk = 'ok';
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    await adminDb().collection('allowlist').limit(1).get();
  } catch (e) {
    adminSdk = (e instanceof Error ? e.message : String(e)).slice(0, 300);
  }
  return NextResponse.json({
    serviceAccount,
    projectId,
    adminEmails: (process.env.ADMIN_EMAILS ?? '').split(',').filter(Boolean).length,
    adminSdk,
    env: process.env.VERCEL_ENV ?? 'local',
  });
}

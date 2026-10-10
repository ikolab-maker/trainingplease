import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { INVESTOR_CONSENT_TEXT, PILOT_CONSENT_TEXT, PILOT_CONSENT_VERSION, parseInvestorContact, parsePilotRequest } from '@/lib/pilot';

export const runtime = 'nodejs';

/**
 * Formularios públicos del sitio. Solo el servidor escribe estas colecciones:
 * - pilotRequests/{correo}: solicitud para unirse al piloto (el coach la aprueba en su panel).
 * - investorContacts/{id}: contacto de quien quiere sumarse al proyecto.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  // Campo trampa: las personas no lo ven; los bots suelen llenarlo.
  if (body?.website) return NextResponse.json({ ok: true });

  const consent = {
    version: PILOT_CONSENT_VERSION,
    text: body?.type === 'investor' ? INVESTOR_CONSENT_TEXT : PILOT_CONSENT_TEXT,
    at: FieldValue.serverTimestamp(),
    userAgent: (req.headers.get('user-agent') ?? '').slice(0, 200),
  };

  try {
    if (body?.type === 'investor') {
      const r = parseInvestorContact(body);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
      await adminDb().collection('investorContacts').add({ ...r.data, consent, status: 'new', createdAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ ok: true });
    }

    const r = parsePilotRequest(body);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    const db = adminDb();
    if ((await db.doc(`allowlist/${r.data.email}`).get()).exists) {
      return NextResponse.json({ ok: true, already: 'registered' });
    }
    const ref = db.doc(`pilotRequests/${r.data.email}`);
    const prev = await ref.get();
    if (prev.exists && prev.get('status') !== 'dismissed') {
      return NextResponse.json({ ok: true, already: 'pending' });
    }
    await ref.set({ ...r.data, consent, status: 'pending', createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('solicitudes', e);
    return NextResponse.json({ error: 'No pudimos guardar tu solicitud. Inténtalo otra vez en unos minutos.' }, { status: 500 });
  }
}

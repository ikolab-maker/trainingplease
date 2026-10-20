import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { APP_URL, addContact, sendEmail } from '@/lib/email';
import { NEWSLETTER_CONSENT_TEXT, NEWSLETTER_CONSENT_VERSION, parseNewsletterSignup } from '@/lib/newsletter';

export const runtime = 'nodejs';

/**
 * Suscripción al boletín desde el sitio. newsletter/{correo} (solo servidor) guarda el consentimiento como evidencia;
 * el contacto se copia a Resend, desde donde el coach envía el boletín y Resend gestiona las bajas.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (body?.website) return NextResponse.json({ ok: true });
  const r = parseNewsletterSignup(body);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });

  try {
    const ref = adminDb().doc(`newsletter/${r.data.email}`);
    if ((await ref.get()).get('status') === 'subscribed') return NextResponse.json({ ok: true, already: true });
    await ref.set({
      ...r.data,
      status: 'subscribed',
      consent: {
        version: NEWSLETTER_CONSENT_VERSION,
        text: NEWSLETTER_CONSENT_TEXT,
        at: FieldValue.serverTimestamp(),
        userAgent: (req.headers.get('user-agent') ?? '').slice(0, 200),
      },
      createdAt: FieldValue.serverTimestamp(),
    });
    await addContact(r.data.email, r.data.name, 'boletin');
    await sendEmail(
      r.data.email,
      'Bienvenido al boletín de Training Please',
      r.data.name ? `¡Hola, ${r.data.name}!` : '¡Hola!',
      [
        'Gracias por sumarte. Cada semana te llegará una idea práctica para entrenar mejor, novedades del club y lo que vamos aprendiendo con nuestros atletas.',
        'Si no fuiste tú, ignora este correo o date de baja desde cualquier boletín.',
      ],
      { label: 'Conoce Training Please', url: APP_URL },
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('boletin', e);
    return NextResponse.json({ error: 'No pudimos guardar tu correo. Inténtalo otra vez en unos minutos.' }, { status: 500 });
  }
}

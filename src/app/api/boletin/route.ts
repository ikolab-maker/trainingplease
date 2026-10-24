import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { APP_URL, addContact, sendEmail } from '@/lib/email';
import { NEWSLETTER_CONSENT_VERSION, newsletterConsentText, parseNewsletterSignup } from '@/lib/newsletter';
import { isLang } from '@/lib/i18n';

export const runtime = 'nodejs';

/**
 * Suscripción al boletín desde el sitio. newsletter/{correo} (solo servidor) guarda el consentimiento como evidencia;
 * el contacto se copia a Resend, desde donde el coach envía el boletín y Resend gestiona las bajas.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (body?.website) return NextResponse.json({ ok: true });
  const lang = isLang(body?.lang) ? body.lang : 'es';
  const r = parseNewsletterSignup(body, lang);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });

  try {
    const ref = adminDb().doc(`newsletter/${r.data.email}`);
    if ((await ref.get()).get('status') === 'subscribed') return NextResponse.json({ ok: true, already: true });
    await ref.set({
      ...r.data,
      lang,
      status: 'subscribed',
      consent: {
        version: NEWSLETTER_CONSENT_VERSION,
        text: newsletterConsentText(lang),
        at: FieldValue.serverTimestamp(),
        userAgent: (req.headers.get('user-agent') ?? '').slice(0, 200),
      },
      createdAt: FieldValue.serverTimestamp(),
    });
    await addContact(r.data.email, r.data.name, 'boletin');
    const w = lang === 'en' ? {
      subject: 'Welcome to the Training Please newsletter',
      title: r.data.name ? `Hi, ${r.data.name}!` : 'Hi!',
      body: [
        'Thanks for joining. Every week you’ll get a practical idea to train better, club news and what we’re learning with our athletes.',
        'If this wasn’t you, ignore this email or unsubscribe from any newsletter.',
      ],
      cta: 'Discover Training Please',
    } : {
      subject: 'Bienvenido al boletín de Training Please',
      title: r.data.name ? `¡Hola, ${r.data.name}!` : '¡Hola!',
      body: [
        'Gracias por sumarte. Cada semana te llegará una idea práctica para entrenar mejor, novedades del club y lo que vamos aprendiendo con nuestros atletas.',
        'Si no fuiste tú, ignora este correo o date de baja desde cualquier boletín.',
      ],
      cta: 'Conoce Training Please',
    };
    await sendEmail(r.data.email, w.subject, w.title, w.body, { label: w.cta, url: APP_URL }, lang);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('boletin', e);
    return NextResponse.json({
      error: lang === 'en' ? 'We couldn’t save your email. Please try again in a few minutes.' : 'No pudimos guardar tu correo. Inténtalo otra vez en unos minutos.',
    }, { status: 500 });
  }
}

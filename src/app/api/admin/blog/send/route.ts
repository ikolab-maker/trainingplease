import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, verifyRequest } from '@/lib/firebase-admin';
import { APP_URL, emailReady, sendBatch, sendBroadcast, type EmailItem } from '@/lib/email';
import { SLUG_RE, isLive, postContent, type Audience, type Post } from '@/lib/blog';
import type { Lang } from '@/lib/i18n';

export const runtime = 'nodejs';

const COPY: Record<Lang, { cta: string; kicker: string; english: string }> = {
  es: { cta: 'Leer el post', kicker: 'Nuevo en el blog de Training Please', english: 'También en inglés: ' },
  en: { cta: 'Read the post', kicker: 'New on the Training Please blog', english: '' },
};

/**
 * El coach envía por correo el enlace a un post publicado.
 * - atletas: un correo a cada atleta con consentimiento, en su idioma (privados incluidos).
 *   Si el post es personal, solo a sus atletas.
 * - boletin: un broadcast de Resend al segmento del boletín, en español; solo posts públicos.
 * Body: { slug, audience }. Queda registro en posts/{slug}.sends.
 */
export async function POST(req: Request) {
  const token = await verifyRequest(req);
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!emailReady()) return NextResponse.json({ error: 'Falta RESEND_API_KEY en Vercel: no se envió nada.' }, { status: 503 });

  const body = await req.json().catch(() => null);
  const slug = String(body?.slug ?? '');
  const audience = body?.audience as Audience;
  if (!SLUG_RE.test(slug) || (audience !== 'atletas' && audience !== 'boletin')) {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const db = adminDb();
  const ref = db.doc(`posts/${slug}`);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'No existe ese post.' }, { status: 404 });
  const post = snap.data() as Post;
  if (!isLive(post)) return NextResponse.json({ error: 'Publica el post antes de enviarlo.' }, { status: 400 });
  if (audience === 'boletin' && post.private) {
    return NextResponse.json({ error: 'Un post solo para atletas no se envía al boletín.' }, { status: 400 });
  }

  const url = `${APP_URL}/blog/${slug}`;
  const mail = (lang: Lang): Omit<EmailItem, 'to'> => {
    const { content, lang: used } = postContent(post, lang);
    const c = COPY[used];
    const paragraphs = [c.kicker, content.summary].filter(Boolean);
    if (used === 'es' && post.en?.title) paragraphs.push(`${c.english}${url}?lang=en`);
    return { subject: content.title, title: content.title, paragraphs, cta: { label: c.cta, url: used === 'en' ? `${url}?lang=en` : url }, lang: used };
  };

  let count = 0;
  if (audience === 'atletas') {
    const users = await db.collection('users').where('role', '==', 'athlete').get();
    const items: EmailItem[] = users.docs
      .filter((d) => d.get('email') && d.get('consent'))
      .filter((d) => post.status !== 'personal' || (post.athletes ?? []).includes(d.id))
      .map((d) => ({ to: d.get('email') as string, ...mail(d.get('lang') === 'en' ? 'en' : 'es') }));
    if (!items.length) return NextResponse.json({ error: 'No hay atletas con consentimiento a quienes enviar.' }, { status: 400 });
    count = await sendBatch(items);
    if (!count) return NextResponse.json({ error: 'Resend no aceptó el envío. Revisa el dominio en Resend.' }, { status: 502 });
  } else {
    const segment = process.env.RESEND_SEGMENT_BOLETIN;
    if (!segment) return NextResponse.json({ error: 'Falta RESEND_SEGMENT_BOLETIN en Vercel.' }, { status: 503 });
    const id = await sendBroadcast(segment, `Blog: ${post.es.title}`.slice(0, 120), mail('es'));
    if (!id) return NextResponse.json({ error: 'Resend no aceptó el broadcast. Revisa el segmento y el dominio.' }, { status: 502 });
  }

  const sent = { audience, at: new Date().toISOString(), count };
  await ref.update({ sends: FieldValue.arrayUnion(sent) });
  return NextResponse.json({ ok: true, ...sent });
}

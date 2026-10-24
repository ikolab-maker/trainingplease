import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, verifyRequest } from '@/lib/firebase-admin';
import { ANON_LIKES_PER_IP, SLUG_RE, isAnonId } from '@/lib/blog';

export const runtime = 'nodejs';

const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 32);

/**
 * Like o quitar like a un post publicado (o personal, solo sus atletas).
 * - Con sesión: un like por cuenta (likes/{uid}).
 * - Sin sesión: uno por navegador (likes/a_<hash del id anónimo>) y como máximo ANON_LIKES_PER_IP
 *   por post desde la misma conexión. La IP no se guarda: solo un hash con sal.
 * Body: { slug, like: boolean, anonId? }. Responde { likes, liked }.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = String(body?.slug ?? '');
  const like = body?.like === true;
  if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const hasToken = (req.headers.get('authorization') ?? '').startsWith('Bearer ');
  const token = hasToken ? await verifyRequest(req) : null;
  if (hasToken && !token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!token && !isAnonId(body?.anonId)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const db = adminDb();
  const postRef = db.doc(`posts/${slug}`);
  const post = await postRef.get();
  const status = post.get('status');
  if (!post.exists || (status !== 'published' && status !== 'personal')) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (status === 'personal') {
    const allowed = token && (token.role === 'admin' || ((post.get('athletes') as string[] | undefined) ?? []).includes(token.uid));
    if (!allowed) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (post.get('private') === true) {
    const member = token && (token.role === 'admin' || (await db.doc(`users/${token.uid}`).get()).exists);
    if (!member) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'sin-ip';
  const ipHash = hash(`${process.env.LIKE_SALT ?? process.env.CRON_SECRET ?? 'training-please'}:${ip}`);
  const key = token ? token.uid : `a_${hash(String(body.anonId))}`;
  const likeRef = postRef.collection('likes').doc(key);

  if (like && !token) {
    const fromIp = await postRef.collection('likes').where('ipHash', '==', ipHash).count().get();
    const mine = await likeRef.get();
    if (!mine.exists && fromIp.data().count >= ANON_LIKES_PER_IP) {
      return NextResponse.json({ error: 'limit', likes: post.get('likes') ?? 0, liked: false }, { status: 429 });
    }
  }

  const result = await db.runTransaction(async (tx) => {
    const [p, l] = await Promise.all([tx.get(postRef), tx.get(likeRef)]);
    const count = (p.get('likes') as number | undefined) ?? 0;
    if (like && !l.exists) {
      tx.set(likeRef, token ? { kind: 'user', at: FieldValue.serverTimestamp() } : { kind: 'anon', ipHash, at: FieldValue.serverTimestamp() });
      tx.update(postRef, { likes: FieldValue.increment(1) });
      return { likes: count + 1, liked: true };
    }
    if (!like && l.exists) {
      tx.delete(likeRef);
      tx.update(postRef, { likes: FieldValue.increment(-1) });
      return { likes: Math.max(0, count - 1), liked: false };
    }
    return { likes: count, liked: l.exists };
  });
  return NextResponse.json(result);
}

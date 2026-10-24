import type { Metadata } from 'next';
import { BlogPost } from '@/components/blog/BlogViews';
import { adminDb } from '@/lib/firebase-admin';
import type { Post } from '@/lib/blog';
import '../../site.css';
import '../blog.css';

type Params = { params: Promise<{ slug: string }> };

/** Título y resumen para la vista previa al compartir (WhatsApp, correo). Solo de posts públicos publicados. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const fallback: Metadata = { title: 'Blog · Training Please' };
  try {
    const snap = await adminDb().doc(`posts/${slug}`).get();
    const p = snap.data() as Post | undefined;
    if (!p || p.status !== 'published' || p.private) return fallback;
    return {
      title: `${p.es.title} · Training Please`,
      description: p.es.summary || undefined,
      openGraph: { title: p.es.title, description: p.es.summary || undefined, type: 'article', locale: 'es_PE' },
    };
  } catch {
    return fallback;
  }
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  return <BlogPost slug={slug} />;
}

// Blog del club: posts que el coach escribe en su panel (posts/{slug} en Firestore).
// El español es obligatorio; el inglés es opcional y, si falta, se muestra el español.
import type { Lang } from './i18n.ts';

export interface PostContent {
  title: string;
  summary: string; // va en la lista del blog, en la vista previa al compartir y en el correo
  body: string; // texto con formato simple (ver markdown.ts)
}

/** personal: publicado solo para los atletas de `athletes`; no sale en la lista general. */
export type PostStatus = 'draft' | 'published' | 'personal';
export type Audience = 'atletas' | 'boletin';

export interface PostSend {
  audience: Audience;
  at: string; // ISO
  count: number; // correos enviados (en el boletín, 0: lo cuenta Resend)
}

export interface Post {
  slug: string;
  es: PostContent;
  en?: PostContent | null;
  private: boolean; // solo atletas con sesión
  status: PostStatus;
  athletes?: string[] | null; // uid de los atletas que lo ven; vacío o null = todos según `private`
  likes: number;
  sends?: PostSend[];
  createdAt?: unknown;
  updatedAt?: unknown;
  publishedAt?: { toDate(): Date } | null;
}

export const isLive = (p: Pick<Post, 'status'>) => p.status === 'published' || p.status === 'personal';

/** Estado al publicar: personal si va dirigido a atletas concretos. */
export const liveStatus = (athletes: string[] | null | undefined): PostStatus => (athletes?.length ? 'personal' : 'published');

/** Topes que también validan las reglas de Firestore. */
export const POST_LIMITS = { title: 140, summary: 300, body: 20000, slug: 80 } as const;

/** Likes anónimos que se aceptan por post desde una misma conexión (una casa, una oficina). */
export const ANON_LIKES_PER_IP = 5;

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, POST_LIMITS.slug)
    .replace(/-+$/, '');
}

/** Contenido en el idioma pedido, o en español si no hay traducción. */
export function postContent(post: Pick<Post, 'es' | 'en'>, lang: Lang): { content: PostContent; lang: Lang } {
  if (lang === 'en' && post.en?.title) return { content: post.en, lang: 'en' };
  return { content: post.es, lang: 'es' };
}

/** Minutos de lectura a ~200 palabras por minuto. */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Errores del editor (en español: el panel del coach es solo en español). */
export function postErrors(p: Pick<Post, 'slug' | 'es' | 'en'>): string[] {
  const out: string[] = [];
  if (!SLUG_RE.test(p.slug) || p.slug.length > POST_LIMITS.slug) out.push('La dirección del post solo lleva minúsculas, números y guiones.');
  const check = (c: PostContent, tag: string) => {
    if (!c.title.trim()) out.push(`Falta el título${tag}.`);
    if (c.title.length > POST_LIMITS.title) out.push(`El título${tag} pasa de ${POST_LIMITS.title} caracteres.`);
    if (c.summary.length > POST_LIMITS.summary) out.push(`El resumen${tag} pasa de ${POST_LIMITS.summary} caracteres.`);
    if (c.body.length > POST_LIMITS.body) out.push(`El texto${tag} pasa de ${POST_LIMITS.body} caracteres.`);
  };
  check(p.es, '');
  if (p.en) check(p.en, ' en inglés');
  return out;
}

/** Id anónimo del navegador: letras, números y guiones, 16 a 64. */
export const isAnonId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(v);

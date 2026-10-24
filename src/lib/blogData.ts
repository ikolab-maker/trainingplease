'use client';

import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Post } from './blog';

const ANON_KEY = 'tp-anon';
const LIKED_KEY = 'tp-liked';

const publishedTime = (p: Post) => p.publishedAt?.toDate().getTime() ?? 0;

/**
 * Posts publicados, del más nuevo al más viejo. Sin cuenta, solo los públicos (así lo exigen las reglas).
 * Con `uid`, suma los personales dirigidos a ese atleta.
 */
export async function listPosts(member: boolean, uid?: string | null): Promise<Post[]> {
  const base = [where('status', '==', 'published')];
  const q = member
    ? query(collection(db(), 'posts'), ...base)
    : query(collection(db(), 'posts'), ...base, where('private', '==', false));
  const mine = member && uid
    ? getDocs(query(collection(db(), 'posts'), where('status', '==', 'personal'), where('athletes', 'array-contains', uid)))
    : null;
  const snaps = await Promise.all([getDocs(q), mine]);
  return snaps.flatMap((s) => s?.docs.map((d) => d.data() as Post) ?? []).sort((a, b) => publishedTime(b) - publishedTime(a));
}

/** Todos los posts, borradores incluidos (solo el coach). */
export async function listAllPosts(): Promise<Post[]> {
  const snap = await getDocs(collection(db(), 'posts'));
  return snap.docs.map((d) => d.data() as Post);
}

export type PostResult = { post: Post } | { missing: true } | { locked: true };

/** Un post; si las reglas lo niegan es porque es privado o no está publicado. */
export async function fetchPost(slug: string): Promise<PostResult> {
  try {
    const snap = await getDoc(doc(db(), 'posts', slug));
    return snap.exists() ? { post: snap.data() as Post } : { missing: true };
  } catch (e) {
    if ((e as { code?: string }).code === 'permission-denied') return { locked: true };
    throw e;
  }
}

export async function myLike(slug: string, uid: string): Promise<boolean> {
  return (await getDoc(doc(db(), 'posts', slug, 'likes', uid))).exists();
}

// ---- Likes anónimos: un id por navegador y la lista de posts que le gustaron ----

export function anonId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(ANON_KEY, id); }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function anonLiked(slug: string): boolean {
  try { return (JSON.parse(localStorage.getItem(LIKED_KEY) ?? '[]') as string[]).includes(slug); } catch { return false; }
}

export function setAnonLiked(slug: string, liked: boolean) {
  try {
    const set = new Set(JSON.parse(localStorage.getItem(LIKED_KEY) ?? '[]') as string[]);
    if (liked) set.add(slug); else set.delete(slug);
    localStorage.setItem(LIKED_KEY, JSON.stringify([...set]));
  } catch { /* sin almacenamiento: el servidor igual evita el doble like */ }
}

export function formatPostDate(p: Post, lang: 'es' | 'en'): string {
  const d = p.publishedAt?.toDate();
  return d ? d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

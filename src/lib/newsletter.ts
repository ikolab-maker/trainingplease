// Boletín de Training Please: suscripción desde el sitio público.
// Validación pura (sin Firebase) para poder probarla con node --test.

import { OWNER } from './legal.ts';

export const NEWSLETTER_CONSENT_VERSION = '1.0';
export const NEWSLETTER_CONSENT_TEXT =
  `Autorizo a ${OWNER} a usar mi correo para enviarme su boletín de entrenamiento y novedades. ` +
  'Puedo darme de baja cuando quiera desde el enlace de cada correo.';

export interface NewsletterSignup { email: string; name: string; source: string }

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCES = ['sitio', 'app'] as const;

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export function parseNewsletterSignup(body: unknown): Result<NewsletterSignup> {
  const b = (body ?? {}) as Record<string, unknown>;
  const email = str(b.email, 160).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Escribe un correo válido.' };
  if (b.consent !== true) return { ok: false, error: 'Necesitamos tu autorización para enviarte el boletín.' };
  const source = (SOURCES as readonly string[]).includes(String(b.source)) ? String(b.source) : 'sitio';
  return { ok: true, data: { email, name: str(b.name, 80), source } };
}

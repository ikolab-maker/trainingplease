// Boletín de Training Please: suscripción desde el sitio público.
// Validación pura (sin Firebase) para poder probarla con node --test.

import { OWNER } from './legal.ts';
import type { Lang } from './i18n.ts';

export const NEWSLETTER_CONSENT_VERSION = '1.0';
export const NEWSLETTER_CONSENT_TEXT =
  `Autorizo a ${OWNER} a usar mi correo para enviarme su boletín de entrenamiento y novedades. ` +
  'Puedo darme de baja cuando quiera desde el enlace de cada correo.';

const NEWSLETTER_CONSENT_TEXT_EN =
  `I authorize ${OWNER} to use my email to send me its training newsletter and news. ` +
  'I can unsubscribe at any time from the link in each email.';
export const newsletterConsentText = (lang: Lang) => (lang === 'en' ? NEWSLETTER_CONSENT_TEXT_EN : NEWSLETTER_CONSENT_TEXT);

const ERRORS = {
  es: { email: 'Escribe un correo válido.', consent: 'Necesitamos tu autorización para enviarte el boletín.' },
  en: { email: 'Please enter a valid email.', consent: 'We need your authorization to send you the newsletter.' },
};

export interface NewsletterSignup { email: string; name: string; source: string }

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCES = ['sitio', 'app'] as const;

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export function parseNewsletterSignup(body: unknown, lang: Lang = 'es'): Result<NewsletterSignup> {
  const b = (body ?? {}) as Record<string, unknown>;
  const email = str(b.email, 160).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: ERRORS[lang].email };
  if (b.consent !== true) return { ok: false, error: ERRORS[lang].consent };
  const source = (SOURCES as readonly string[]).includes(String(b.source)) ? String(b.source) : 'sitio';
  return { ok: true, data: { email, name: str(b.name, 80), source } };
}

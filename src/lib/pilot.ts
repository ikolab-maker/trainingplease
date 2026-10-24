// Solicitudes del sitio público: unirse al piloto y contacto de inversión.
// Validación pura (sin Firebase) para poder probarla con node --test.

import { OWNER } from './legal.ts';
import type { Lang } from './i18n.ts';

export const LEVELS = [
  { key: 'empiezo', label: 'Estoy empezando' },
  { key: 'regular', label: 'Corro o entreno con regularidad' },
  { key: 'competidor', label: 'Ya compito en carreras' },
] as const;

export const WEEKLY_KM = ['0 a 10 km', '10 a 25 km', '25 a 40 km', 'Más de 40 km'] as const;

export const PILOT_CONSENT_VERSION = '1.0';
export const PILOT_CONSENT_TEXT =
  `Soy mayor de 18 años y autorizo a ${OWNER} a usar estos datos solo para responder mi solicitud ` +
  'y, si soy aceptado, darme de alta en el piloto, conforme a la Política de Datos Personales.';

export const INVESTOR_CONSENT_TEXT = 'Autorizo a Training Please a usar estos datos solo para responder mi mensaje.';

// Traducción de referencia de los textos de autorización; se guarda el texto que vio la persona.
const PILOT_CONSENT_TEXT_EN =
  `I am 18 or older and I authorize ${OWNER} to use this data only to respond to my request ` +
  'and, if I am accepted, to sign me up for the pilot, in accordance with the Personal Data Policy.';
const INVESTOR_CONSENT_TEXT_EN = 'I authorize Training Please to use this data only to respond to my message.';

export const pilotConsentText = (lang: Lang) => (lang === 'en' ? PILOT_CONSENT_TEXT_EN : PILOT_CONSENT_TEXT);
export const investorConsentText = (lang: Lang) => (lang === 'en' ? INVESTOR_CONSENT_TEXT_EN : INVESTOR_CONSENT_TEXT);

const ERRORS = {
  es: {
    name: 'Escribe tu nombre.',
    googleEmail: 'Escribe un correo de Google válido.',
    email: 'Escribe un correo válido.',
    phone: 'Revisa tu número de WhatsApp.',
    pilotConsent: 'Necesitamos tu autorización para responder tu solicitud.',
    investorConsent: 'Necesitamos tu autorización para responderte.',
  },
  en: {
    name: 'Please enter your name.',
    googleEmail: 'Please enter a valid Google email.',
    email: 'Please enter a valid email.',
    phone: 'Please check your WhatsApp number.',
    pilotConsent: 'We need your authorization to respond to your request.',
    investorConsent: 'We need your authorization to respond to you.',
  },
};

export interface PilotRequest {
  name: string;
  email: string;
  phone: string;
  city: string;
  level: string;
  weeklyKm: string;
  raceName: string;
  raceDate: string | null;
  raceKm: number | null;
  message: string;
}

export interface InvestorContact { name: string; email: string; message: string }

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export function parsePilotRequest(body: unknown, lang: Lang = 'es'): Result<PilotRequest> {
  const b = (body ?? {}) as Record<string, unknown>;
  const E = ERRORS[lang];
  const name = str(b.name, 120);
  const email = str(b.email, 160).toLowerCase();
  const phone = str(b.phone, 30);
  if (!name) return { ok: false, error: E.name };
  if (!EMAIL_RE.test(email)) return { ok: false, error: E.googleEmail };
  if (phone && !/^[+\d\s()-]{6,30}$/.test(phone)) return { ok: false, error: E.phone };
  if (b.consent !== true) return { ok: false, error: E.pilotConsent };

  const level = LEVELS.some((l) => l.key === b.level) ? String(b.level) : '';
  const weeklyKm = (WEEKLY_KM as readonly string[]).includes(String(b.weeklyKm)) ? String(b.weeklyKm) : '';
  const raceDate = DATE_RE.test(String(b.raceDate ?? '')) ? String(b.raceDate) : null;
  const km = Number(String(b.raceKm ?? '').replace(',', '.'));
  const raceKm = Number.isFinite(km) && km > 0 && km <= 400 ? Math.round(km * 10) / 10 : null;

  return {
    ok: true,
    data: {
      name, email, phone,
      city: str(b.city, 80),
      level, weeklyKm,
      raceName: str(b.raceName, 120),
      raceDate, raceKm,
      message: str(b.message, 1000),
    },
  };
}

export function parseInvestorContact(body: unknown, lang: Lang = 'es'): Result<InvestorContact> {
  const b = (body ?? {}) as Record<string, unknown>;
  const E = ERRORS[lang];
  const name = str(b.name, 120);
  const email = str(b.email, 160).toLowerCase();
  const message = str(b.message, 2000);
  if (!name) return { ok: false, error: E.name };
  if (!EMAIL_RE.test(email)) return { ok: false, error: E.email };
  if (b.consent !== true) return { ok: false, error: E.investorConsent };
  return { ok: true, data: { name, email, message } };
}

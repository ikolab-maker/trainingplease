// Solicitudes del sitio público: unirse al piloto y contacto de inversión.
// Validación pura (sin Firebase) para poder probarla con node --test.

import { OWNER } from './legal.ts';

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

export function parsePilotRequest(body: unknown): Result<PilotRequest> {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = str(b.name, 120);
  const email = str(b.email, 160).toLowerCase();
  const phone = str(b.phone, 30);
  if (!name) return { ok: false, error: 'Escribe tu nombre.' };
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Escribe un correo de Google válido.' };
  if (phone && !/^[+\d\s()-]{6,30}$/.test(phone)) return { ok: false, error: 'Revisa tu número de WhatsApp.' };
  if (b.consent !== true) return { ok: false, error: 'Necesitamos tu autorización para responder tu solicitud.' };

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

export function parseInvestorContact(body: unknown): Result<InvestorContact> {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = str(b.name, 120);
  const email = str(b.email, 160).toLowerCase();
  const message = str(b.message, 2000);
  if (!name) return { ok: false, error: 'Escribe tu nombre.' };
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Escribe un correo válido.' };
  if (b.consent !== true) return { ok: false, error: 'Necesitamos tu autorización para responderte.' };
  return { ok: true, data: { name, email, message } };
}

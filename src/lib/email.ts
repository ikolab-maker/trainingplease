import 'server-only';

// Correo con Resend (https://resend.com). Sin RESEND_API_KEY no se envía nada y la app sigue igual.
// - EMAIL_FROM: remitente verificado en Resend (por defecto avisos@trainingplease.app).
// - RESEND_SEGMENT_BOLETIN / RESEND_SEGMENT_ATLETAS: ids de los segmentos de Resend donde se suman los contactos.

const API = 'https://api.resend.com';
export const APP_URL = process.env.APP_URL ?? 'https://trainingplease.app';

export const emailReady = () => !!process.env.RESEND_API_KEY;

async function call(path: string, body: unknown): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error('resend', path, res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (e) {
    console.error('resend', path, e);
    return false;
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Plantilla simple con los colores de la marca. `paragraphs` es texto plano; `cta` agrega un botón. */
function layout(title: string, paragraphs: string[], cta?: { label: string; url: string }): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.5">${esc(p)}</p>`).join('');
  const button = cta
    ? `<p style="margin:22px 0"><a href="${esc(cta.url)}" style="background:#1d4e89;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">${esc(cta.label)}</a></p>`
    : '';
  return `<div style="font-family:Arial,sans-serif;color:#0f2a44;max-width:520px;margin:auto;padding:24px">
<p style="font-weight:800;letter-spacing:.5px;color:#1d4e89;margin:0 0 18px">TRAINING <span style="color:#f2b705">PLEASE</span></p>
<h1 style="font-size:22px;margin:0 0 16px">${esc(title)}</h1>${body}${button}
<p style="font-size:12px;color:#6b7c8f;margin-top:28px">Training Please · Lima, Perú</p></div>`;
}

export function sendEmail(to: string, subject: string, title: string, paragraphs: string[], cta?: { label: string; url: string }) {
  return call('/emails', {
    from: process.env.EMAIL_FROM ?? 'Training Please <avisos@trainingplease.app>',
    to: [to],
    subject,
    html: layout(title, paragraphs, cta),
    text: [title, ...paragraphs, cta ? `${cta.label}: ${cta.url}` : ''].filter(Boolean).join('\n\n'),
  });
}

/** Suma (o actualiza) un contacto en Resend y, si está configurado, en el segmento indicado. */
export function addContact(email: string, name: string, segment: 'boletin' | 'atletas') {
  const id = segment === 'boletin' ? process.env.RESEND_SEGMENT_BOLETIN : process.env.RESEND_SEGMENT_ATLETAS;
  return call('/contacts', {
    email,
    ...(name ? { first_name: name } : {}),
    unsubscribed: false,
    ...(id ? { segments: [{ id }] } : {}),
  });
}

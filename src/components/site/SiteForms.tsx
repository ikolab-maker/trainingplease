'use client';

import Link from 'next/link';
import { useState } from 'react';
import { INVESTOR_CONSENT_TEXT, LEVELS, PILOT_CONSENT_TEXT, WEEKLY_KM } from '@/lib/pilot';

type Status = { kind: 'idle' } | { kind: 'busy' } | { kind: 'ok'; text: string } | { kind: 'error'; text: string };

async function send(payload: Record<string, unknown>): Promise<{ ok: boolean; already?: string; error?: string }> {
  try {
    const res = await fetch('/api/solicitudes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, already: data.already } : { ok: false, error: data.error };
  } catch {
    return { ok: false, error: 'No pudimos conectar. Revisa tu conexión e inténtalo otra vez.' };
  }
}

/** Honeypot: oculto para las personas. */
function Trap({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="s-trap" aria-hidden="true">
      Sitio web <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function PilotForm() {
  const empty = {
    name: '', email: '', phone: '', city: '', level: '', weeklyKm: '',
    raceName: '', raceDate: '', raceKm: '', message: '', website: '',
  };
  const [f, setF] = useState(empty);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: 'busy' });
    const r = await send({ ...f, consent });
    if (!r.ok) { setStatus({ kind: 'error', text: r.error ?? 'No pudimos enviar tu solicitud.' }); return; }
    setStatus({
      kind: 'ok',
      text: r.already === 'registered'
        ? 'Ese correo ya tiene cuenta en Training Please. Entra con Google desde “Entrar”.'
        : r.already === 'pending'
          ? 'Ya teníamos tu solicitud. Te escribiremos pronto.'
          : '¡Listo! Recibimos tu solicitud. Te escribiremos por WhatsApp o correo. Cuando te aprobemos, entras con tu cuenta de Google.',
    });
    setF(empty);
    setConsent(false);
  }

  if (status.kind === 'ok') {
    return (
      <div className="s-form s-done" role="status">
        <p className="s-check" aria-hidden="true">✓</p>
        <p>{status.text}</p>
        <button type="button" className="s-btn ghost-dark" onClick={() => setStatus({ kind: 'idle' })}>Enviar otra solicitud</button>
      </div>
    );
  }

  return (
    <form className="s-form" onSubmit={submit} noValidate={false}>
      <div className="s-row">
        <label><span>Nombre y apellido *</span>
          <input required autoComplete="name" value={f.name} onChange={set('name')} /></label>
        <label><span>Correo de Google *</span>
          <input required type="email" autoComplete="email" placeholder="nombre@gmail.com" value={f.email} onChange={set('email')} /></label>
      </div>
      <div className="s-row">
        <label><span>WhatsApp</span>
          <input type="tel" autoComplete="tel" placeholder="+51 999 999 999" value={f.phone} onChange={set('phone')} /></label>
        <label><span>Ciudad o distrito</span>
          <input autoComplete="address-level2" placeholder="Miraflores, Lima" value={f.city} onChange={set('city')} /></label>
      </div>
      <div className="s-row">
        <label><span>¿Cómo vas hoy?</span>
          <select value={f.level} onChange={set('level')}>
            <option value="">Elige una opción</option>
            {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select></label>
        <label><span>Kilómetros por semana</span>
          <select value={f.weeklyKm} onChange={set('weeklyKm')}>
            <option value="">Elige una opción</option>
            {WEEKLY_KM.map((k) => <option key={k} value={k}>{k}</option>)}
          </select></label>
      </div>
      <div className="s-row three">
        <label><span>Carrera objetivo</span>
          <input placeholder="Media Maratón de Lima" value={f.raceName} onChange={set('raceName')} /></label>
        <label><span>Fecha</span>
          <input type="date" value={f.raceDate} onChange={set('raceDate')} /></label>
        <label><span>Distancia (km)</span>
          <input inputMode="decimal" placeholder="21,1" value={f.raceKm} onChange={set('raceKm')} /></label>
      </div>
      <label><span>¿Algo más que quieras contarnos?</span>
        <textarea rows={3} maxLength={1000} placeholder="Tu horario, por qué quieres entrenar, qué te ha frenado antes…" value={f.message} onChange={set('message')} /></label>
      <Trap value={f.website} onChange={(v) => setF({ ...f, website: v })} />
      <label className="s-consent">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{PILOT_CONSENT_TEXT} <Link href="/legal" target="_blank">Ver política</Link></span>
      </label>
      {status.kind === 'error' && <p className="s-error" role="alert">{status.text}</p>}
      <button className="s-btn primary" disabled={status.kind === 'busy'}>
        {status.kind === 'busy' ? 'Enviando…' : 'Quiero entrar al piloto'}
      </button>
    </form>
  );
}

export function InvestorForm() {
  const empty = { name: '', email: '', message: '', website: '' };
  const [f, setF] = useState(empty);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: 'busy' });
    const r = await send({ ...f, consent, type: 'investor' });
    if (!r.ok) { setStatus({ kind: 'error', text: r.error ?? 'No pudimos enviar tu mensaje.' }); return; }
    setStatus({ kind: 'ok', text: 'Gracias. Te escribiremos para conversar.' });
    setF(empty);
    setConsent(false);
  }

  if (status.kind === 'ok') return <p className="s-thanks" role="status">✓ {status.text}</p>;

  return (
    <form className="s-form light" onSubmit={submit}>
      <div className="s-row">
        <label><span>Nombre *</span>
          <input required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label><span>Correo *</span>
          <input required type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      </div>
      <label><span>Cuéntanos qué te interesa</span>
        <textarea rows={3} maxLength={2000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
      <Trap value={f.website} onChange={(v) => setF({ ...f, website: v })} />
      <label className="s-consent">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{INVESTOR_CONSENT_TEXT}</span>
      </label>
      {status.kind === 'error' && <p className="s-error" role="alert">{status.text}</p>}
      <button className="s-btn ghost" disabled={status.kind === 'busy'}>{status.kind === 'busy' ? 'Enviando…' : 'Conversemos'}</button>
    </form>
  );
}

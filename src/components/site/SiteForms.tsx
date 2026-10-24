'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { newsletterConsentText } from '@/lib/newsletter';
import { investorConsentText, LEVELS, pilotConsentText, WEEKLY_KM } from '@/lib/pilot';
import type { Lang } from '@/lib/i18n';

type Status = { kind: 'idle' } | { kind: 'busy' } | { kind: 'ok'; text: string } | { kind: 'error'; text: string };

/** Envía el formulario con el idioma, para que el servidor guarde el texto de autorización que vio la persona. */
async function send(payload: Record<string, unknown>, lang: Lang, networkError: string, url = '/api/solicitudes'): Promise<{ ok: boolean; already?: string; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, lang }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, already: data.already } : { ok: false, error: data.error };
  } catch {
    return { ok: false, error: networkError };
  }
}

/** Honeypot: oculto para las personas. */
function Trap({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  return (
    <label className="s-trap" aria-hidden="true">
      {t.forms.trap} <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function PilotForm() {
  const { t, lang } = useI18n();
  const T = t.forms.pilot;
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
    const r = await send({ ...f, consent }, lang, t.forms.networkError);
    if (!r.ok) { setStatus({ kind: 'error', text: r.error ?? T.sendError }); return; }
    setStatus({ kind: 'ok', text: r.already === 'registered' ? T.registered : r.already === 'pending' ? T.pending : T.ok });
    setF(empty);
    setConsent(false);
  }

  if (status.kind === 'ok') {
    return (
      <div className="s-form s-done" role="status">
        <p className="s-check" aria-hidden="true">✓</p>
        <p>{status.text}</p>
        <button type="button" className="s-btn ghost-dark" onClick={() => setStatus({ kind: 'idle' })}>{T.another}</button>
      </div>
    );
  }

  return (
    <form className="s-form" onSubmit={submit} noValidate={false}>
      <div className="s-row">
        <label><span>{T.name}</span>
          <input required autoComplete="name" value={f.name} onChange={set('name')} /></label>
        <label><span>{T.email}</span>
          <input required type="email" autoComplete="email" placeholder={lang === 'es' ? 'nombre@gmail.com' : 'name@gmail.com'} value={f.email} onChange={set('email')} /></label>
      </div>
      <div className="s-row">
        <label><span>{T.whatsapp}</span>
          <input type="tel" autoComplete="tel" placeholder="+51 999 999 999" value={f.phone} onChange={set('phone')} /></label>
        <label><span>{T.city}</span>
          <input autoComplete="address-level2" placeholder={T.cityPlaceholder} value={f.city} onChange={set('city')} /></label>
      </div>
      <div className="s-row">
        <label><span>{T.level}</span>
          <select value={f.level} onChange={set('level')}>
            <option value="">{t.forms.choose}</option>
            {LEVELS.map((l) => <option key={l.key} value={l.key}>{T.levels[l.key] ?? l.label}</option>)}
          </select></label>
        <label><span>{T.weeklyKm}</span>
          <select value={f.weeklyKm} onChange={set('weeklyKm')}>
            <option value="">{t.forms.choose}</option>
            {WEEKLY_KM.map((k, i) => <option key={k} value={k}>{T.weeklyKmOptions[i] ?? k}</option>)}
          </select></label>
      </div>
      <div className="s-row three">
        <label><span>{T.race}</span>
          <input placeholder={T.racePlaceholder} value={f.raceName} onChange={set('raceName')} /></label>
        <label><span>{T.date}</span>
          <input type="date" value={f.raceDate} onChange={set('raceDate')} /></label>
        <label><span>{T.distance}</span>
          <input inputMode="decimal" placeholder={lang === 'es' ? '21,1' : '21.1'} value={f.raceKm} onChange={set('raceKm')} /></label>
      </div>
      <label><span>{T.message}</span>
        <textarea rows={3} maxLength={1000} placeholder={T.messagePlaceholder} value={f.message} onChange={set('message')} /></label>
      <Trap value={f.website} onChange={(v) => setF({ ...f, website: v })} />
      <label className="s-consent">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{pilotConsentText(lang)} <Link href="/legal" target="_blank">{t.common.seePolicy}</Link></span>
      </label>
      {status.kind === 'error' && <p className="s-error" role="alert">{status.text}</p>}
      <button className="s-btn primary" disabled={status.kind === 'busy'}>
        {status.kind === 'busy' ? t.common.sending : T.submit}
      </button>
    </form>
  );
}

export function InvestorForm() {
  const { t, lang } = useI18n();
  const T = t.forms.investor;
  const empty = { name: '', email: '', message: '', website: '' };
  const [f, setF] = useState(empty);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: 'busy' });
    const r = await send({ ...f, consent, type: 'investor' }, lang, t.forms.networkError);
    if (!r.ok) { setStatus({ kind: 'error', text: r.error ?? T.sendError }); return; }
    setStatus({ kind: 'ok', text: T.ok });
    setF(empty);
    setConsent(false);
  }

  if (status.kind === 'ok') return <p className="s-thanks" role="status">✓ {status.text}</p>;

  return (
    <form className="s-form light" onSubmit={submit}>
      <div className="s-row">
        <label><span>{T.name}</span>
          <input required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label><span>{T.email}</span>
          <input required type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      </div>
      <label><span>{T.message}</span>
        <textarea rows={3} maxLength={2000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
      <Trap value={f.website} onChange={(v) => setF({ ...f, website: v })} />
      <label className="s-consent">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{investorConsentText(lang)}</span>
      </label>
      {status.kind === 'error' && <p className="s-error" role="alert">{status.text}</p>}
      <button className="s-btn ghost" disabled={status.kind === 'busy'}>{status.kind === 'busy' ? t.common.sending : T.submit}</button>
    </form>
  );
}

export function NewsletterForm() {
  const { t, lang } = useI18n();
  const T = t.forms.newsletter;
  const empty = { name: '', email: '', website: '' };
  const [f, setF] = useState(empty);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: 'busy' });
    const r = await send({ ...f, consent, source: 'sitio' }, lang, t.forms.networkError, '/api/boletin');
    if (!r.ok) { setStatus({ kind: 'error', text: r.error ?? T.sendError }); return; }
    setStatus({ kind: 'ok', text: r.already ? T.already : T.ok });
    setF(empty);
    setConsent(false);
  }

  if (status.kind === 'ok') return <p className="s-thanks" role="status">✓ {status.text}</p>;

  return (
    <form className="s-form light" onSubmit={submit}>
      <div className="s-row">
        <label><span>{T.name}</span>
          <input autoComplete="given-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label><span>{T.email}</span>
          <input required type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      </div>
      <Trap value={f.website} onChange={(v) => setF({ ...f, website: v })} />
      <label className="s-consent">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{newsletterConsentText(lang)} <Link href="/legal" target="_blank">{t.common.seePolicy}</Link></span>
      </label>
      {status.kind === 'error' && <p className="s-error" role="alert">{status.text}</p>}
      <button className="s-btn primary" disabled={status.kind === 'busy'}>{status.kind === 'busy' ? t.common.sending : T.submit}</button>
    </form>
  );
}

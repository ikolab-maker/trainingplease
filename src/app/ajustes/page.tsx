'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Gate } from '@/components/Gate';
import { TopNav } from '@/components/TopNav';
import { db } from '@/lib/firebase';
import { grantConsent, revokeConsent } from '@/lib/consent';
import { OPTIONAL_CHECKS } from '@/lib/legal';
import { DEFAULT_THEME, THEMES } from '@/lib/themes';
import type { Theme, UserDoc } from '@/lib/types';


export default function AjustesPage() {
  return (
    <Gate role="athlete">
      {({ user, profile }) => (
        <>
          <TopNav />
          <Settings uid={user.uid} profile={profile} />
        </>
      )}
    </Gate>
  );
}

function Settings({ uid, profile }: { uid: string; profile: UserDoc }) {
  const [first, setFirst] = useState(false);
  useEffect(() => { setFirst(new URLSearchParams(window.location.search).has('primera')); }, []);

  const [p, setP] = useState({
    age: profile.profile?.age ?? '',
    heightCm: profile.profile?.heightCm ?? '',
    weightKg: profile.profile?.weightKg ?? '',
    level: profile.profile?.level ?? '',
    availability: profile.profile?.availability ?? '',
    equipment: profile.profile?.equipment ?? '',
    limitations: profile.profile?.limitations ?? '',
    goals: profile.profile?.goals ?? '',
  });
  const [race, setRace] = useState({
    name: profile.goalRace?.name ?? '',
    date: profile.goalRace?.date ?? '',
    distanceKm: profile.goalRace?.distanceKm?.toString() ?? '',
  });
  const [msg, setMsg] = useState('');
  const userRef = doc(db(), 'users', uid);

  async function setTheme(theme: Theme) {
    await updateDoc(userRef, { theme, updatedAt: serverTimestamp() });
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const goalRace = race.name && race.date
      ? { name: race.name.trim(), date: race.date, distanceKm: race.distanceKm ? Number(race.distanceKm.replace(',', '.')) : null }
      : null;
    try {
      await updateDoc(userRef, { profile: p, goalRace, updatedAt: serverTimestamp() });
      setMsg('Perfil guardado.');
    } catch {
      setMsg('No se pudo guardar.');
    }
  }

  async function toggleOptional(key: 'ai' | 'marketing' | 'stats', value: boolean) {
    const current = profile.consent?.optional ?? { ai: false, marketing: false, stats: false };
    await grantConsent(uid, { ...current, [key]: value });
  }

  async function revoke() {
    const ok = window.confirm(
      '¿Revocar tu consentimiento? Tu coach dejará de ver tus registros al instante y no podrás usar la app hasta que vuelvas a aceptar.',
    );
    if (ok) await revokeConsent(uid);
  }

  const field = (key: keyof typeof p, label: string, hint?: string, area?: boolean) => (
    <label className="field">
      <span>{label}</span>
      {area
        ? <textarea value={p[key]} onChange={(e) => setP({ ...p, [key]: e.target.value })} />
        : <input value={p[key]} onChange={(e) => setP({ ...p, [key]: e.target.value })} />}
      {hint && <small>{hint}</small>}
    </label>
  );

  return (
    <main>
      <header className="banner"><h2>Ajustes</h2><p>{profile.email}</p></header>
      <div className="wrap" style={{ maxWidth: 760 }}>
        {first && <p className="alert">¡Bienvenida o bienvenido! Completa tu perfil para que tu coach ajuste tu plan.</p>}

        <section className="panel">
          <h3>Tema</h3>
          <div className="theme-options">
            {THEMES.map((t) => (
              <button key={t.key} type="button" className="theme-swatch" aria-pressed={(profile.theme ?? DEFAULT_THEME) === t.key} onClick={() => setTheme(t.key)}>
                <i style={{ background: t.color }} /> {t.label}
              </button>
            ))}
          </div>
        </section>

        <form className="panel form" onSubmit={saveProfile}>
          <h3>Mi perfil deportivo</h3>
          <div className="form-row">
            <label className="field"><span>Carrera objetivo</span>
              <input value={race.name} placeholder="Media Maratón de Lima" onChange={(e) => setRace({ ...race, name: e.target.value })} /></label>
            <label className="field"><span>Fecha</span>
              <input type="date" value={race.date} onChange={(e) => setRace({ ...race, date: e.target.value })} /></label>
            <label className="field"><span>Distancia (km)</span>
              <input inputMode="decimal" value={race.distanceKm} placeholder="21,1" onChange={(e) => setRace({ ...race, distanceKm: e.target.value })} /></label>
          </div>
          <div className="form-row">
            <label className="field"><span>Edad</span>
              <input inputMode="numeric" value={p.age} placeholder="35" onChange={(e) => setP({ ...p, age: e.target.value })} /></label>
            <label className="field"><span>Talla (cm)</span>
              <input inputMode="numeric" value={p.heightCm} placeholder="165" onChange={(e) => setP({ ...p, heightCm: e.target.value })} /></label>
            <label className="field"><span>Peso (kg)</span>
              <input inputMode="decimal" value={p.weightKg} placeholder="60" onChange={(e) => setP({ ...p, weightKg: e.target.value })} /></label>
          </div>
          {field('level', 'Nivel actual', 'Km por semana y salida más larga reciente')}
          {field('availability', 'Disponibilidad', 'Días y horarios en que puedes entrenar')}
          {field('equipment', 'Equipo', 'Reloj, gimnasio, bici, piscina…')}
          {field('goals', 'Objetivos', undefined, true)}
          {field('limitations', 'Lesiones o limitaciones', 'Dato de salud: solo lo ve tu coach', true)}
          <div className="actions">
            <button className="btn" type="submit">Guardar perfil</button>
            {msg && <span className="saved" role="status">{msg}</span>}
          </div>
        </form>

        <section className="panel" id="privacidad">
          <h3>Privacidad</h3>
          <p className="note">
            Aceptaste la versión {profile.consent?.version} de los términos. <Link href="/legal">Leer términos y política de datos</Link>.
          </p>
          <div className="form">
            {OPTIONAL_CHECKS.map((c) => (
              <label className="check" key={c.key}>
                <input type="checkbox" checked={!!profile.consent?.optional?.[c.key]} onChange={(e) => toggleOptional(c.key, e.target.checked)} />
                <span>{c.text}</span>
              </label>
            ))}
          </div>
          <div className="actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn danger" onClick={revoke}>Revocar consentimiento</button>
          </div>
        </section>
      </div>
    </main>
  );
}

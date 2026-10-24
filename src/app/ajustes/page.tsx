'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Gate } from '@/components/Gate';
import { useDialogs } from '@/components/Dialogs';
import { LangSwitch, useI18n } from '@/components/I18nProvider';
import { TopNav } from '@/components/TopNav';
import { db } from '@/lib/firebase';
import { grantConsent, revokeConsent } from '@/lib/consent';
import { legalText } from '@/lib/legalText';
import { MEMBERSHIPS, PILOT, membershipOf } from '@/lib/membership';
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
  const { confirm, toast } = useDialogs();
  const { t, lang } = useI18n();
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
      toast(t.settings.profileSaved);
    } catch {
      toast(t.common.saveError, 'error');
    }
  }

  async function toggleOptional(key: 'ai' | 'marketing' | 'stats', value: boolean) {
    const current = profile.consent?.optional ?? { ai: false, marketing: false, stats: false };
    await grantConsent(uid, { ...current, [key]: value }, lang);
  }

  async function revoke() {
    const ok = await confirm({
      title: t.settings.revokeTitle,
      message: t.settings.revokeText,
      confirmLabel: t.settings.revokeConfirm,
      danger: true,
    });
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
      <header className="banner"><h2>{t.settings.title}</h2><p>{profile.email}</p></header>
      <div className="wrap" style={{ maxWidth: 760 }}>
        {first && <p className="alert">{t.settings.welcome}</p>}

        <section className="panel" id="idioma">
          <h3>{t.lang.title}</h3>
          <p className="note">{t.lang.hint}</p>
          <LangSwitch />
        </section>

        <section className="panel">
          <h3>{t.settings.theme}</h3>
          <div className="theme-options">
            {THEMES.map((th) => (
              <button key={th.key} type="button" className="theme-swatch" aria-pressed={(profile.theme ?? DEFAULT_THEME) === th.key} onClick={() => setTheme(th.key)}>
                <i style={{ background: th.color }} /> {t.settings.themes[th.key]}
              </button>
            ))}
          </div>
        </section>

        <form className="panel form" onSubmit={saveProfile}>
          <h3>{t.settings.profile}</h3>
          <div className="form-row">
            <label className="field"><span>{t.settings.race}</span>
              <input value={race.name} placeholder={t.settings.racePlaceholder} onChange={(e) => setRace({ ...race, name: e.target.value })} /></label>
            <label className="field"><span>{t.settings.date}</span>
              <input type="date" value={race.date} onChange={(e) => setRace({ ...race, date: e.target.value })} /></label>
            <label className="field"><span>{t.settings.distance}</span>
              <input inputMode="decimal" value={race.distanceKm} placeholder={lang === 'es' ? '21,1' : '21.1'} onChange={(e) => setRace({ ...race, distanceKm: e.target.value })} /></label>
          </div>
          <div className="form-row">
            <label className="field"><span>{t.settings.age}</span>
              <input inputMode="numeric" value={p.age} placeholder="35" onChange={(e) => setP({ ...p, age: e.target.value })} /></label>
            <label className="field"><span>{t.settings.height}</span>
              <input inputMode="numeric" value={p.heightCm} placeholder="165" onChange={(e) => setP({ ...p, heightCm: e.target.value })} /></label>
            <label className="field"><span>{t.settings.weight}</span>
              <input inputMode="decimal" value={p.weightKg} placeholder="60" onChange={(e) => setP({ ...p, weightKg: e.target.value })} /></label>
          </div>
          {field('level', t.settings.level, t.settings.levelHint)}
          {field('availability', t.settings.availability, t.settings.availabilityHint)}
          {field('equipment', t.settings.equipment, t.settings.equipmentHint)}
          {field('goals', t.settings.goals, undefined, true)}
          {field('limitations', t.settings.limitations, t.settings.limitationsHint, true)}
          <div className="actions">
            <button className="btn" type="submit">{t.settings.saveProfile}</button>
          </div>
        </form>

        <section className="panel" id="suscripcion">
          <h3>{t.settings.subscription}</h3>
          <p className="note">{t.settings.subscriptionNote}</p>
          <ul className="plan-tiers">
            {MEMBERSHIPS.map((m) => {
              const current = membershipOf(profile.membership) === m.key;
              return (
                <li key={m.key} className={current ? 'current' : undefined} aria-current={current ? 'true' : undefined}>
                  <b>{t.settings.tiers[m.key]}</b>
                  {PILOT && <span>{current ? t.settings.pilotPrice : t.settings.priceTbd}</span>}
                  {current && <i>{t.settings.yourTier}</i>}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel" id="privacidad">
          <h3>{t.settings.privacy}</h3>
          <p className="note">
            {t.settings.acceptedVersion(profile.consent?.version ?? '')} <Link href="/legal">{t.settings.readLegal}</Link>.
          </p>
          <div className="form">
            {legalText(lang).optional.map((c) => (
              <label className="check" key={c.key}>
                <input type="checkbox" checked={!!profile.consent?.optional?.[c.key]} onChange={(e) => toggleOptional(c.key, e.target.checked)} />
                <span>{c.text}</span>
              </label>
            ))}
          </div>
          <div className="actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn danger" onClick={revoke}>{t.settings.revoke}</button>
          </div>
        </section>
      </div>
    </main>
  );
}

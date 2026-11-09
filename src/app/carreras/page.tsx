'use client';

import { useState } from 'react';
import { Gate } from '@/components/Gate';
import { TopNav } from '@/components/TopNav';
import { useAuth } from '@/components/AuthProvider';
import { useDialogs } from '@/components/Dialogs';
import { useI18n } from '@/components/I18nProvider';
import { daysUntil, longDate, todayISO } from '@/lib/dates';
import { fmtTime, parseTime } from '@/lib/agent/fitness';
import { racesFromLegacy, sortRaces, splitRaces } from '@/lib/races';
import type { Race, UserDoc } from '@/lib/types';
import './carreras.css';

export default function CarrerasPage() {
  return (
    <Gate role="athlete">
      {({ profile }) => (
        <>
          <TopNav />
          <Races profile={profile} />
        </>
      )}
    </Gate>
  );
}

interface Draft { id: string; name: string; date: string; distanceKm: string; principal: boolean; goal: string; result: string }

const emptyDraft = (): Draft => ({ id: `r${Date.now().toString(36)}`, name: '', date: '', distanceKm: '', principal: false, goal: '', result: '' });
const toDraft = (r: Race): Draft => ({
  id: r.id, name: r.name, date: r.date, distanceKm: r.distanceKm?.toString() ?? '', principal: r.principal,
  goal: r.goalTimeMin ? fmtTime(r.goalTimeMin) : '', result: r.resultMin ? fmtTime(r.resultMin) : '',
});

function Races({ profile }: { profile: UserDoc }) {
  const { t, lang } = useI18n();
  const { authHeaders } = useAuth();
  const { confirm, toast } = useDialogs();
  const [races, setRaces] = useState<Race[]>(() => racesFromLegacy(profile.races, profile.goalRace));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const today = todayISO();
  const { upcoming, past } = splitRaces(races, today);
  const hasPrincipal = races.some((r) => r.principal);

  async function save(next: Race[]): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch('/api/carreras', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ races: next }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? t.common.saveError); return false; }
      setRaces(data.races);
      toast(t.races.saved);
      return true;
    } catch {
      setError(t.common.saveError);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setError('');
    const goal = draft.goal.trim() ? parseTime(draft.goal) : null;
    const result = draft.result.trim() ? parseTime(draft.result) : null;
    if ((draft.goal.trim() && goal == null) || (draft.result.trim() && result == null)) return setError(t.races.timeInvalid);
    if (draft.principal && goal == null) return setError(t.races.goalRequired);
    const race: Race = {
      id: draft.id, name: draft.name.trim(), date: draft.date, principal: draft.principal,
      distanceKm: draft.distanceKm.trim() ? Number(draft.distanceKm.replace(',', '.')) : null,
      goalTimeMin: goal, resultMin: result,
    };
    // Una sola principal: marcar esta desmarca la anterior.
    const others = races.filter((r) => r.id !== race.id).map((r) => (race.principal ? { ...r, principal: false } : r));
    if (await save(sortRaces([...others, race]))) setDraft(null);
  }

  async function remove(r: Race) {
    const ok = await confirm({ title: t.races.removeTitle, message: t.races.removeText(r.name), confirmLabel: t.races.remove, danger: true });
    if (ok) await save(races.filter((x) => x.id !== r.id));
  }

  const card = (r: Race) => {
    const left = daysUntil(r.date, today);
    const ran = r.date < today;
    return (
      <li key={r.id} className={`race-card${r.principal ? ' principal' : ''}`}>
        <div className="race-head">
          <span className={`race-tag${r.principal ? ' main' : ''}`}>{r.principal ? t.races.principalTag : t.races.recreationalTag}</span>
          {!ran && <span className="race-left">{t.races.daysLeft(left)}</span>}
        </div>
        <h4>{r.name}</h4>
        <p className="race-meta">
          {longDate(r.date, lang)}{r.distanceKm ? ` · ${String(r.distanceKm).replace('.', lang === 'es' ? ',' : '.')} km` : ''}
          {r.goalTimeMin && !r.resultMin ? ` · ${t.races.goal}: ${fmtTime(r.goalTimeMin)}` : ''}
        </p>
        {r.resultMin && r.goalTimeMin && (
          <p className={`race-result${r.resultMin <= r.goalTimeMin ? ' met' : ''}`}>
            {t.races.goalVs(fmtTime(r.goalTimeMin), fmtTime(r.resultMin))} · {r.resultMin <= r.goalTimeMin ? t.races.goalMet : t.races.goalMissed(fmtTime(r.resultMin - r.goalTimeMin))}
          </p>
        )}
        {r.resultMin && !r.goalTimeMin && <p className="race-result">{t.races.result}: {fmtTime(r.resultMin)}</p>}
        {r.principal && !r.goalTimeMin && !ran && <p className="alert">{t.races.goalRequired}</p>}
        <div className="actions">
          <button type="button" className="btn small secondary" onClick={() => { setError(''); setDraft(toDraft(r)); }}>{ran && !r.resultMin ? t.races.result : t.races.edit}</button>
          <button type="button" className="btn small secondary" onClick={() => remove(r)} disabled={busy}>{t.races.remove}</button>
        </div>
      </li>
    );
  };

  return (
    <main>
      <header className="banner"><h2>{t.races.title}</h2></header>
      <div className="wrap" style={{ maxWidth: 760 }}>
        <p className="note">{t.races.intro}</p>
        {!hasPrincipal && <p className="alert">{t.races.noPrincipal}</p>}

        {draft ? (
          <form className="panel form" onSubmit={submit}>
            <h3>{races.some((r) => r.id === draft.id) ? t.races.edit : t.races.add}</h3>
            <label className="field"><span>{t.races.name}</span>
              <input required value={draft.name} placeholder={t.races.namePlaceholder} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <div className="form-row">
              <label className="field"><span>{t.races.date}</span>
                <input required type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
              <label className="field"><span>{t.races.distance}</span>
                <input inputMode="decimal" value={draft.distanceKm} placeholder={lang === 'es' ? '21,1' : '21.1'} onChange={(e) => setDraft({ ...draft, distanceKm: e.target.value })} /></label>
            </div>
            <label className="check">
              <input type="checkbox" checked={draft.principal} onChange={(e) => setDraft({ ...draft, principal: e.target.checked })} />
              <span><b>{t.races.principal}</b><br /><small>{t.races.principalHint}</small></span>
            </label>
            <div className="form-row">
              <label className="field"><span>{t.races.goal}{draft.principal ? ' *' : ''}</span>
                <input inputMode="numeric" value={draft.goal} placeholder="1:55:00" required={draft.principal} onChange={(e) => setDraft({ ...draft, goal: e.target.value })} />
                <small>{t.races.goalHint}</small></label>
              {draft.date && draft.date <= today && (
                <label className="field"><span>{t.races.result}</span>
                  <input inputMode="numeric" value={draft.result} placeholder="1:58:30" onChange={(e) => setDraft({ ...draft, result: e.target.value })} />
                  <small>{t.races.resultHint}</small></label>
              )}
            </div>
            {error && <p className="alert error" role="alert">{error}</p>}
            <div className="actions">
              <button className="btn" type="submit" disabled={busy}>{busy ? t.common.saving : t.races.save}</button>
              <button className="btn secondary" type="button" onClick={() => { setDraft(null); setError(''); }}>{t.races.cancel}</button>
            </div>
          </form>
        ) : (
          <div className="actions" style={{ marginBottom: '1.2rem' }}>
            <button type="button" className="btn" onClick={() => { setError(''); setDraft(emptyDraft()); }}>+ {t.races.add}</button>
          </div>
        )}

        <h3 className="section-title">{t.races.upcoming}</h3>
        {upcoming.length ? <ul className="race-list">{upcoming.map(card)}</ul> : <p className="note">{t.races.none}</p>}

        {past.length > 0 && (
          <>
            <h3 className="section-title">{t.races.past}</h3>
            <ul className="race-list">{past.map(card)}</ul>
          </>
        )}
      </div>
    </main>
  );
}

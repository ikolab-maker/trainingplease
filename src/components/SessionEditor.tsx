'use client';

import { useState } from 'react';
import { SPORT_KEYS, SPORTS } from '@/lib/sports';
import { addDays } from '@/lib/dates';
import type { Session, SportKey } from '@/lib/types';

type Draft = Omit<Session, 'id'> & { id?: string };

export function emptySession(date: string): Draft {
  return { date, sport: 'running', title: '', durationMin: null, distanceKm: null, rpe: null, steps: [], focus: '', tip: '', core: true };
}

/** Formulario para crear o editar una sesión del plan. */
export function SessionEditor({ initial, weekStart, onSave, onCancel }: {
  initial: Draft;
  weekStart: string;
  onSave: (s: Draft) => Promise<void>;
  onCancel: () => void;
}) {
  const [s, setS] = useState<Draft>(initial);
  const [steps, setSteps] = useState(initial.steps.join('\n'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        ...s,
        title: s.title.trim() || SPORTS[s.sport].label,
        steps: steps.split('\n').map((x) => x.trim()).filter(Boolean),
        core: s.sport === 'descanso' ? false : s.core,
      });
    } catch {
      setError('No se pudo guardar la sesión.');
      setBusy(false);
    }
  }

  return (
    <form className="editor form" onSubmit={submit}>
      <div className="form-row">
        <label className="field"><span>Fecha</span>
          <input type="date" required min={weekStart} max={addDays(weekStart, 6)} value={s.date} onChange={(e) => setS({ ...s, date: e.target.value })} /></label>
        <label className="field"><span>Deporte</span>
          <select value={s.sport} onChange={(e) => setS({ ...s, sport: e.target.value as SportKey })}>
            {SPORT_KEYS.map((k) => <option key={k} value={k}>{SPORTS[k].label}</option>)}
          </select></label>
        <label className="field"><span>Título</span>
          <input value={s.title} placeholder="Carrera suave" onChange={(e) => setS({ ...s, title: e.target.value })} /></label>
      </div>
      <div className="form-row">
        <label className="field"><span>Duración (min)</span>
          <input inputMode="numeric" value={s.durationMin ?? ''} onChange={(e) => setS({ ...s, durationMin: num(e.target.value) })} /></label>
        <label className="field"><span>Distancia (km)</span>
          <input inputMode="decimal" value={s.distanceKm ?? ''} onChange={(e) => setS({ ...s, distanceKm: num(e.target.value) })} /></label>
        <label className="field"><span>RPE objetivo</span>
          <select value={s.rpe ?? ''} onChange={(e) => setS({ ...s, rpe: e.target.value ? Number(e.target.value) : null })}>
            <option value="">—</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select></label>
      </div>
      <label className="field"><span>Resumen bajo el título (opcional)</span>
        <input value={s.summary ?? ''} placeholder="25 a 30 min · unos 3,5 km" onChange={(e) => setS({ ...s, summary: e.target.value })} />
        <small>Si lo dejas vacío se arma con duración, distancia y RPE.</small></label>
      <label className="field"><span>Enfoque (opcional)</span>
        <input value={s.focus ?? ''} onChange={(e) => setS({ ...s, focus: e.target.value })} /></label>
      <label className="field"><span>Instrucciones</span>
        <textarea value={steps} rows={5} placeholder="Una indicación por línea" onChange={(e) => setSteps(e.target.value)} />
        <small>Una indicación por línea.</small></label>
      <label className="field"><span>Consejo (opcional)</span>
        <input value={s.tip ?? ''} onChange={(e) => setS({ ...s, tip: e.target.value })} /></label>
      {s.sport !== 'descanso' && (
        <label className="check">
          <input type="checkbox" checked={s.core} onChange={(e) => setS({ ...s, core: e.target.checked })} />
          <span>Sesión principal (cuenta para el cumplimiento). Desmárcala para sesiones extra u opcionales.</span>
        </label>
      )}
      {error && <p className="alert error">{error}</p>}
      <div className="actions">
        <button className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Guardar sesión'}</button>
        <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

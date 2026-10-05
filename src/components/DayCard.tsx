'use client';

import { useEffect, useState } from 'react';
import { SPORTS } from '@/lib/sports';
import { dayParts } from '@/lib/dates';
import type { LogEntry, Session, SessionStatus } from '@/lib/types';

const STATUS_LABEL: Record<SessionStatus, string> = {
  done: 'Realizada',
  missed: 'No realizada',
  late: 'Pendiente',
  today: 'Hoy',
  upcoming: 'Próxima',
  rest: 'Descanso',
};

function metaLine(s: Session) {
  if (s.summary) return s.summary;
  const parts: string[] = [];
  if (s.durationMin) parts.push(`${s.durationMin} min`);
  if (s.distanceKm) parts.push(`${String(s.distanceKm).replace('.', ',')} km`);
  if (s.rpe) parts.push(`RPE ${s.rpe}`);
  return parts.join(' · ');
}

export function DayCard({ session: s, log, status, open, onToggle, onSave, readOnly }: {
  session: Session;
  log: LogEntry | undefined;
  status: SessionStatus;
  open: boolean;
  onToggle: () => void;
  onSave?: (entry: { done: boolean; rpe: number | null; comment: string }) => Promise<void>;
  readOnly?: boolean;
}) {
  const sport = SPORTS[s.sport] ?? SPORTS.otro;
  const { dow, num } = dayParts(s.date);
  const done = !!log?.done;
  const [rpe, setRpe] = useState<number | null>(log?.rpe ?? null);
  const [comment, setComment] = useState(log?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => { setRpe(log?.rpe ?? null); setComment(log?.comment ?? ''); }, [log?.rpe, log?.comment]);

  const canLog = !readOnly && onSave && s.sport !== 'descanso' && status !== 'upcoming';

  async function save(nextDone: boolean) {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({ done: nextDone, rpe, comment });
      setSavedMsg('Guardado');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch {
      setSavedMsg('No se pudo guardar. Revisa tu conexión.');
    } finally {
      setSaving(false);
    }
  }

  const cls = ['day', open && 'open', done && 'is-done', status === 'today' && 'is-today', status === 'missed' && 'is-missed']
    .filter(Boolean).join(' ');
  const style = { ['--type' as string]: sport.color, ['--type-ink' as string]: sport.ink };

  return (
    <article className={cls} style={style}>
      <div className="day-head">
        <button type="button" className="day-toggle" aria-expanded={open} onClick={onToggle}>
          <span className="day-date"><b>{dow}</b><i>{num}</i></span>
          <span className="day-main">
            <span className="badge">{sport.label}</span>
            <span className={`status ${status}`}>{STATUS_LABEL[status]}</span>
            {!s.core && s.sport !== 'descanso' && <span className="extra-flag">extra</span>}
            <span className="day-title">{s.title}</span>
            <span className="day-meta">{metaLine(s)}</span>
          </span>
          <span className="chev" aria-hidden="true">›</span>
        </button>
        {canLog && (
          <div className="day-check-wrap">
            <button
              type="button"
              className="day-check"
              aria-pressed={done}
              aria-label={done ? 'Marcar como no realizada' : 'Marcar como realizada'}
              disabled={saving}
              onClick={() => save(!done)}
            >✓</button>
          </div>
        )}
      </div>
      <div className="day-body">
        <div className="day-body-inner">
          <div className="day-content">
            {s.focus && <p className="focus">{s.focus}</p>}
            {s.steps.length > 0 && <ul>{s.steps.map((t, i) => <li key={i}>{t}</li>)}</ul>}
            {s.tip && <p className="tip">{s.tip}</p>}

            {canLog && (
              <div className="log-box">
                <h5>¿Cómo te sentiste?</h5>
                <div>
                  <small>Esfuerzo real (1 muy suave · 10 máximo)</small>
                  <div className="rpe-scale" role="group" aria-label="Esfuerzo percibido">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button key={n} type="button" aria-pressed={rpe === n} onClick={() => setRpe(rpe === n ? null : n)}>{n}</button>
                    ))}
                  </div>
                </div>
                <label className="field">
                  <span>Comentario para tu coach</span>
                  <textarea value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)}
                    placeholder="Sensaciones, molestias, sueño, lo que quieras contar" />
                </label>
                <div className="actions">
                  <button type="button" className="btn small" disabled={saving} onClick={() => save(true)}>
                    {done ? 'Actualizar' : 'Guardar y marcar realizada'}
                  </button>
                  {savedMsg && <span className="saved" role="status">{savedMsg}</span>}
                </div>
              </div>
            )}

            {readOnly && log && (log.rpe || log.comment) && (
              <div className="log-box">
                <h5>Registro del atleta</h5>
                {log.rpe && <p>RPE real: <b>{log.rpe}</b></p>}
                {log.comment && <p><i>“{log.comment}”</i></p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

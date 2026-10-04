'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DayCard } from './DayCard';
import { Countdown } from './Countdown';
import { saveLog, useLogs, useSessions, useWeeks } from '@/lib/data';
import { compliance, daysUntil, longDate, rangeLabel, sessionStatus, todayISO } from '@/lib/dates';
import type { UserDoc } from '@/lib/types';

/** Vista "Mi semana": la del atleta y la vista previa del coach. */
export function WeekView({ uid, profile, readOnly }: { uid: string; profile: UserDoc; readOnly?: boolean }) {
  const today = todayISO();
  const weeks = useWeeks(uid);
  const [idx, setIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!weeks || idx !== null) return;
    let i = 0;
    weeks.forEach((w, k) => { if (w.start <= today) i = k; });
    setIdx(i);
  }, [weeks, idx, today]);

  const week = weeks && idx !== null ? weeks[idx] : undefined;
  const sessions = useSessions(uid, week?.id);
  const { logs, error: logsError } = useLogs(uid);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessions) return;
    const t = sessions.find((s) => s.date === today);
    setOpenId(t ? t.id : null);
  }, [sessions, today]);

  const weekProgress = useMemo(() => {
    if (!sessions) return { n: 0, total: 0 };
    const core = sessions.filter((s) => s.core && s.sport !== 'descanso');
    return { n: core.filter((s) => logs[s.id]?.done).length, total: core.length };
  }, [sessions, logs]);
  const overall = useMemo(() => (sessions ? compliance(sessions, logs, today) : null), [sessions, logs, today]);

  const prevDone = useRef<number | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (prevDone.current !== null && weekProgress.total > 0 && weekProgress.n === weekProgress.total && prevDone.current < weekProgress.total) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 4200);
    }
    prevDone.current = weekProgress.n;
  }, [weekProgress]);

  const first = profile.name.split(' ')[0];
  const race = profile.goalRace;
  const pct = weekProgress.total ? Math.round((weekProgress.n / weekProgress.total) * 100) : 0;
  const allDone = weekProgress.total > 0 && weekProgress.n === weekProgress.total;

  return (
    <>
      <header className="hero">
        <div className="hero-inner">
          <p className="hero-kicker">Tu plan de entrenamiento</p>
          <h1>¡Hola {first}!</h1>
          <p className="hero-sub">{race ? `Tu camino a ${race.name}` : 'Vamos por tu meta'}</p>
          <div className="hero-tags">
            {week && (
              <div className="tag-row">
                <span className="tag">Esta semana</span>
                <span className="tag-text">{rangeLabel(week.start)}</span>
              </div>
            )}
            {race && (
              <div className="tag-row">
                <span className="tag">La meta</span>
                <span className="tag-text">
                  {race.name}{race.distanceKm ? ` · ${String(race.distanceKm).replace('.', ',')} km` : ''}<br />
                  <small>{longDate(race.date)}</small>
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {race && daysUntil(race.date, today) >= 0 && <Countdown date={race.date} label={race.name} />}

      <div className="wrap">
        {weeks === null || idx === null ? (
          <p className="loading">Cargando tu semana…</p>
        ) : weeks.length === 0 ? (
          <div className="panel">
            <h3>Tu plan está en camino</h3>
            <p>Tu coach todavía no publicó tu primera semana. Vuelve pronto.</p>
          </div>
        ) : week && (
          <>
            <div className="week-head">
              <div className="week-nav">
                <button type="button" aria-label="Semana anterior" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>‹</button>
                <h2 className="week-title">{week.title}</h2>
                <button type="button" aria-label="Semana siguiente" disabled={idx >= weeks.length - 1} onClick={() => setIdx(idx + 1)}>›</button>
              </div>
              <p className="week-range">{rangeLabel(week.start)}</p>
              {week.phase && <span className="week-phase">{week.phase}</span>}
              {week.aiAssisted && <span className="week-phase ai-flag" style={{ marginLeft: '.4rem' }}>Asistido por IA</span>}
              {week.goal && <p className="week-goal">{week.goal}</p>}
            </div>

            <div className={`progress${allDone ? ' done' : ''}`}>
              <div className="progress-top">
                <span>Sesiones de la semana</span>
                <b>{weekProgress.n} de {weekProgress.total}</b>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
              <p className="progress-msg">
                {allDone ? '¡Semana completa! Eso es constancia.' :
                  overall?.pct != null ? `Cumplimiento a la fecha: ${overall.pct}% (${overall.done} de ${overall.planned}).` :
                    'Marca cada sesión cuando la termines.'}
              </p>
            </div>

            {logsError && readOnly && (
              <p className="alert">El atleta revocó su consentimiento: sus registros no están disponibles.</p>
            )}

            <div className="days">
              {sessions === null ? <p className="loading">Cargando sesiones…</p> : sessions.map((s) => (
                <DayCard
                  key={s.id}
                  session={s}
                  log={logs[s.id]}
                  status={sessionStatus(s, logs[s.id], today)}
                  open={openId === s.id}
                  onToggle={() => setOpenId(openId === s.id ? null : s.id)}
                  readOnly={readOnly}
                  onSave={readOnly ? undefined : (e) => saveLog(uid, s.id, { ...e, weekId: week.id })}
                />
              ))}
            </div>

            {week.notes && week.notes.length > 0 && (
              <>
                <h3 className="section-title rules-title">Para esta semana</h3>
                <div className="rules">
                  {week.notes.map((n, i) => (
                    <div className="rule" key={i}><h4>{n.title}</h4><p style={{ whiteSpace: 'pre-line' }}>{n.body}</p></div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {celebrate && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 26 }, (_, i) => (
            <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s` }}>
              {['🎉', '⭐', '💖', '🏃‍♀️', '✨'][i % 5]}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

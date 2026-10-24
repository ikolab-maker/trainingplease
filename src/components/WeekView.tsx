'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DayCard } from './DayCard';
import { Countdown } from './Countdown';
import { useI18n } from './I18nProvider';
import { saveLog, useLogs, useSessions, useWeeks, type LogMap } from '@/lib/data';
import { addDays, compliance, daysUntil, isoWeekId, longDate, mondayOf, rangeLabel, sessionStatus, todayISO } from '@/lib/dates';
import { noticeId } from '@/lib/notice';
import { membershipOf } from '@/lib/membership';
import type { UserDoc } from '@/lib/types';

/** Vista "Mi semana": la del atleta y la vista previa del coach. */
export function WeekView({ uid, profile, readOnly }: { uid: string; profile: UserDoc; readOnly?: boolean }) {
  const { t, lang } = useI18n();
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
          <p className="hero-kicker">{t.week.kicker} <span className="member-badge">{t.settings.tiers[membershipOf(profile.membership)]}</span></p>
          <h1>{t.week.hello(first)}</h1>
          <p className="hero-sub">{race ? t.week.roadTo(race.name) : t.week.goForIt}</p>
          <div className="hero-tags">
            {week && (
              <div className="tag-row">
                <span className="tag">{t.week.thisWeek}</span>
                <span className="tag-text">{rangeLabel(week.start, lang)}</span>
              </div>
            )}
            {race && (
              <div className="tag-row">
                <span className="tag">{t.week.theGoal}</span>
                <span className="tag-text">
                  {race.name}{race.distanceKm ? ` · ${lang === 'es' ? String(race.distanceKm).replace('.', ',') : race.distanceKm} km` : ''}<br />
                  <small>{longDate(race.date, lang)}</small>
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {race && daysUntil(race.date, today) >= 0 && <Countdown date={race.date} label={race.name} />}

      <div className="wrap">
        {weeks === null || idx === null ? (
          <p className="loading">{t.week.loadingWeek}</p>
        ) : weeks.length === 0 ? (
          <div className="panel">
            <h3>{t.week.emptyTitle}</h3>
            <p>{t.week.emptyText}</p>
          </div>
        ) : week && (
          <>
            <div className="week-head">
              <div className="week-nav">
                <button type="button" aria-label={t.week.prevWeek} disabled={idx === 0} onClick={() => setIdx(idx - 1)}>‹</button>
                <h2 className="week-title">{week.title}</h2>
                <button type="button" aria-label={t.week.nextWeek} disabled={idx >= weeks.length - 1} onClick={() => setIdx(idx + 1)}>›</button>
              </div>
              <p className="week-range">{rangeLabel(week.start, lang)}</p>
              {week.phase && <span className="week-phase">{week.phase}</span>}
              {week.aiAssisted && <span className="week-phase ai-flag" style={{ marginLeft: '.4rem' }}>{t.week.aiFlag}</span>}
              {week.goal && <p className="week-goal">{week.goal}</p>}
            </div>

            <div className={`progress${allDone ? ' done' : ''}`}>
              <div className="progress-top">
                <span>{t.week.sessionsOfWeek}</span>
                <b>{t.week.nOfTotal(weekProgress.n, weekProgress.total)}</b>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
              <p className="progress-msg">
                {allDone ? t.week.allDone :
                  overall?.pct != null ? t.week.complianceSoFar(overall.pct, overall.done, overall.planned) :
                    t.week.markEach}
              </p>
            </div>

            {logsError && readOnly && (
              <p className="alert">{t.week.revoked}</p>
            )}

            <div className="days">
              {sessions === null ? <p className="loading">{t.week.loadingSessions}</p> : sessions.map((s) => (
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
                <h3 className="section-title rules-title">{t.week.forThisWeek}</h3>
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

      <div className="wrap"><NextWeekNotice uid={uid} today={today} logs={logs} readOnly={readOnly} /></div>

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

/** Avisos del atleta para la semana que viene: los ve el coach y los lee el agente al proponerla. */
function NextWeekNotice({ uid, today, logs, readOnly }: { uid: string; today: string; logs: LogMap; readOnly?: boolean }) {
  const { t, lang } = useI18n();
  const start = addDays(mondayOf(today), 7);
  const weekId = isoWeekId(start);
  const saved = logs[noticeId(weekId)]?.comment ?? '';
  const [text, setText] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const value = text ?? saved;

  if (readOnly) {
    return saved ? (
      <div className="panel"><h3>{t.notice.coachTitle(rangeLabel(start, lang))}</h3><p style={{ whiteSpace: 'pre-line' }}>{saved}</p></div>
    ) : null;
  }
  const save = async () => {
    setState('saving');
    try {
      await saveLog(uid, noticeId(weekId), { done: false, rpe: null, comment: value.trim(), weekId });
      setState('saved');
    } catch {
      setState('error');
    }
  };
  return (
    <div className="panel">
      <h3>{t.notice.title}</h3>
      <p>{t.notice.text(rangeLabel(start, lang))}</p>
      <textarea rows={3} maxLength={1000} value={value} placeholder={t.notice.placeholder}
        onChange={(e) => { setText(e.target.value); setState('idle'); }} style={{ width: '100%' }} />
      <button type="button" className="btn small" disabled={state === 'saving' || value.trim() === saved.trim()} onClick={save}>
        {state === 'saving' ? t.common.saving : t.notice.save}
      </button>
      {state === 'saved' && <p className="note">{t.notice.saved}</p>}
      {state === 'error' && <p className="alert">{t.notice.error}</p>}
    </div>
  );
}

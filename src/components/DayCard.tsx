'use client';

import { useEffect, useState } from 'react';
import { useDialogs } from '@/components/Dialogs';
import { useI18n } from '@/components/I18nProvider';
import { activityLink, activityLinkLabel } from '@/lib/activityLink';
import { SPORTS } from '@/lib/sports';
import { dayParts } from '@/lib/dates';
import type { Lang } from '@/lib/i18n';
import type { LogEntry, Session, SessionStatus } from '@/lib/types';

function metaLine(s: Session, lang: Lang) {
  if (s.summary) return s.summary;
  const parts: string[] = [];
  if (s.durationMin) parts.push(`${s.durationMin} min`);
  if (s.distanceKm) parts.push(`${lang === 'es' ? String(s.distanceKm).replace('.', ',') : s.distanceKm} km`);
  if (s.rpe) parts.push(`RPE ${s.rpe}`);
  return parts.join(' · ');
}

export function DayCard({ session: s, log, status, open, onToggle, onSave, readOnly }: {
  session: Session;
  log: LogEntry | undefined;
  status: SessionStatus;
  open: boolean;
  onToggle: () => void;
  onSave?: (entry: { done: boolean; rpe: number | null; comment: string; link: string }) => Promise<void>;
  readOnly?: boolean;
}) {
  const { t, lang } = useI18n();
  const sportKey = SPORTS[s.sport] ? s.sport : 'otro';
  const sport = SPORTS[sportKey];
  const { dow, num } = dayParts(s.date, lang);
  const done = !!log?.done;
  const [rpe, setRpe] = useState<number | null>(log?.rpe ?? null);
  const [comment, setComment] = useState(log?.comment ?? '');
  const [link, setLink] = useState(log?.link ?? '');
  const [saving, setSaving] = useState(false);
  const { toast } = useDialogs();

  useEffect(() => { setRpe(log?.rpe ?? null); setComment(log?.comment ?? ''); setLink(log?.link ?? ''); }, [log?.rpe, log?.comment, log?.link]);

  const canLog = !readOnly && onSave && s.sport !== 'descanso' && status !== 'upcoming';

  async function save(nextDone: boolean) {
    if (!onSave) return;
    if (link.trim() && !activityLink(link)) { toast(t.day.linkError, 'error'); return; }
    setSaving(true);
    try {
      await onSave({ done: nextDone, rpe, comment, link });
      toast(t.common.saved);
    } catch {
      toast(t.common.saveErrorNetwork, 'error');
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
            <span className="badge">{t.sports[sportKey]}</span>
            <span className={`status ${status}`}>{t.day.status[status as SessionStatus]}</span>
            {!s.core && s.sport !== 'descanso' && <span className="extra-flag">{t.day.extra}</span>}
            <span className="day-title">{s.title}</span>
            <span className="day-meta">{metaLine(s, lang)}</span>
          </span>
          <span className="chev" aria-hidden="true">›</span>
        </button>
        {canLog && (
          <div className="day-check-wrap">
            <button
              type="button"
              className="day-check"
              aria-pressed={done}
              aria-label={done ? t.day.markUndone : t.day.markDone}
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
                <h5>{t.day.howFelt}</h5>
                <div>
                  <small>{t.day.rpeScale}</small>
                  <div className="rpe-scale" role="group" aria-label={t.day.rpeAria}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button key={n} type="button" aria-pressed={rpe === n} onClick={() => setRpe(rpe === n ? null : n)}>{n}</button>
                    ))}
                  </div>
                </div>
                <label className="field">
                  <span>{t.day.comment}</span>
                  <textarea value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)}
                    placeholder={t.day.commentPlaceholder} />
                </label>
                <label className="field">
                  <span>{t.day.link}</span>
                  <input type="url" inputMode="url" value={link} maxLength={300} onChange={(e) => setLink(e.target.value)}
                    placeholder="https://www.strava.com/activities/…" />
                  <small>{t.day.linkHint}</small>
                </label>
                <div className="actions">
                  <button type="button" className="btn small" disabled={saving} onClick={() => save(true)}>
                    {done ? t.day.update : t.day.saveDone}
                  </button>
                </div>
              </div>
            )}

            {readOnly && log && (log.rpe || log.comment || log.link) && (
              <div className="log-box">
                <h5>{t.day.athleteLog}</h5>
                {log.rpe && <p>{t.day.realRpe} <b>{log.rpe}</b></p>}
                {log.comment && <p><i>“{log.comment}”</i></p>}
                {log.link && <p><a href={log.link} target="_blank" rel="noreferrer">{t.day.seeActivity(activityLinkLabel(log.link))}</a></p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

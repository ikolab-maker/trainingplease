'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from './I18nProvider';
import { fetchAllSessions, type LogMap } from '@/lib/data';
import { summarize, scoreWeek } from '@/lib/gamification';
import { isoWeekId } from '@/lib/dates';
import type { Session, Week } from '@/lib/types';

/** Todas las sesiones del atleta, recargadas cuando cambian sus semanas. */
export function useAllSessions(uid: string, weeks: Week[] | null) {
  const [all, setAll] = useState<Session[] | null>(null);
  const key = weeks?.map((w) => w.id).join(',');
  useEffect(() => {
    if (key === undefined) return;
    let alive = true;
    fetchAllSessions(uid).then((s) => { if (alive) setAll(s); }).catch(() => {});
    return () => { alive = false; };
  }, [uid, key]);
  return all;
}

/** Racha y puntos en "Mi semana". `sessions` son las de la semana elegida, en vivo. */
export function GameCard({ uid, weeks, week, sessions, logs, today }: {
  uid: string; weeks: Week[]; week: Week; sessions: Session[]; logs: LogMap; today: string;
}) {
  const { t } = useI18n();
  const all = useAllSessions(uid, weeks);
  const summary = useMemo(() => {
    if (!all) return null;
    // Las de la semana elegida llegan en vivo; el resto, de la carga inicial.
    const merged = [...all.filter((s) => isoWeekId(s.date) !== week.id), ...sessions];
    return summarize(weeks, merged, logs, today);
  }, [all, sessions, weeks, week.id, logs, today]);
  const ws = useMemo(() => scoreWeek(week, sessions, logs, today), [week, sessions, logs, today]);
  if (!summary || week.start > today) return null;
  const p = ws.points;

  return (
    <section className="game" aria-label={t.game.title}>
      <div className="game-top">
        <div>
          <p className="game-label">{t.game.title}</p>
          <p className="game-streak"><span aria-hidden="true">🔥</span> {t.game.streak(summary.streak)}</p>
          <p className="game-sub">{t.game.best(summary.best)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="game-label">{t.game.weekPoints}</p>
          <p className="game-streak">{p.total}</p>
          <p className="game-sub">{t.game.total(summary.total)}</p>
        </div>
      </div>
      <p className="game-msg">{t.game.state[ws.state]}{p.total > 0 && <><br /><small>{t.game.breakdown(p.sessions, p.rpe, p.comments, p.bonus, p.notice)}</small></>}</p>
      <details className="game-how">
        <summary>{t.game.how}</summary>
        <ul>{t.game.rules.map((r) => <li key={r}>{r}</li>)}</ul>
      </details>
      <p className="game-safety">{t.game.safety}</p>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Gate } from '@/components/Gate';
import { TopNav } from '@/components/TopNav';
import { WeekView } from '@/components/WeekView';
import { PlanTransfer } from '@/components/PlanTransfer';
import { AgentPanel } from '@/components/AgentPanel';
import { SessionEditor, emptySession } from '@/components/SessionEditor';
import { db } from '@/lib/firebase';
import { deleteSession, duplicateWeek, saveSession, saveWeek, useLogs, useSessions, useWeeks } from '@/lib/data';
import { addDays, compliance, dayParts, isoWeekId, longDate, mondayOf, rangeLabel, sessionStatus, todayISO } from '@/lib/dates';
import { SPORTS } from '@/lib/sports';
import { DEFAULT_THEME, THEMES } from '@/lib/themes';
import type { Session, UserDoc, Week } from '@/lib/types';

const STATUS_TXT = { done: 'Realizada', missed: 'No realizada', late: 'Pendiente', today: 'Hoy', upcoming: 'Próxima', rest: 'Descanso' } as const;

export default function AthletePage() {
  const { uid } = useParams<{ uid: string }>();
  return (
    <Gate role="admin">
      {() => (
        <>
          <TopNav />
          <AthleteDetail uid={uid} />
        </>
      )}
    </Gate>
  );
}

function AthleteDetail({ uid }: { uid: string }) {
  const [athlete, setAthlete] = useState<UserDoc | null>(null);
  useEffect(() => onSnapshot(doc(db(), 'users', uid), (s) => setAthlete(s.exists() ? (s.data() as UserDoc) : null)), [uid]);

  const weeks = useWeeks(uid);
  const [weekId, setWeekId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const today = todayISO();

  useEffect(() => {
    if (!weeks || weekId) return;
    const current = weeks.filter((w) => w.start <= today).pop() ?? weeks[0];
    if (current) setWeekId(current.id);
  }, [weeks, weekId, today]);

  if (!athlete) return <p className="loading">Cargando…</p>;

  if (preview) {
    return (
      <main>
        <div className="draft-banner">Vista previa como {athlete.name} · <button className="linklike" style={{ color: 'inherit', borderColor: 'currentColor' }} onClick={() => setPreview(false)}>Volver al editor</button></div>
        <WeekView uid={uid} profile={athlete} readOnly />
      </main>
    );
  }

  const week = weeks?.find((w) => w.id === weekId);

  async function newWeek() {
    const last = weeks?.[weeks.length - 1];
    const start = last ? addDays(last.start, 7) : mondayOf(today);
    const w: Week = { id: isoWeekId(start), start, title: `Semana ${(weeks?.length ?? 0) + 1}`, phase: last?.phase ?? '', goal: '' };
    await saveWeek(uid, w);
    setWeekId(w.id);
  }

  return (
    <main>
      <header className="banner">
        <h2>{athlete.name}</h2>
        <p>{athlete.goalRace ? `${athlete.goalRace.name} · ${longDate(athlete.goalRace.date)}` : 'Sin carrera objetivo'}</p>
      </header>
      <div className="wrap">
        <p><Link href="/coach">‹ Todos los atletas</Link></p>
        {!athlete.consent && <p className="alert">Consentimiento pendiente o revocado: no puedes ver sus registros hasta que acepte.</p>}

        <AthleteProfile uid={uid} athlete={athlete} />

        <AgentPanel uid={uid} athlete={athlete} onApproved={setWeekId} />

        <h3 className="section-title">Plan semanal</h3>
        <div className="week-tabs" role="group" aria-label="Semanas">
          {weeks?.map((w) => (
            <button key={w.id} type="button" aria-pressed={w.id === weekId} onClick={() => setWeekId(w.id)}>{w.title}</button>
          ))}
          <button type="button" onClick={newWeek}>+ Nueva semana</button>
        </div>

        {week ? (
          <WeekEditor uid={uid} week={week} weeks={weeks ?? []} today={today} hasConsent={!!athlete.consent}
            onPreview={() => setPreview(true)} onSelect={setWeekId} />
        ) : (
          <>
            <p className="section-sub">Crea la primera semana del plan o impórtala abajo.</p>
          </>
        )}

        <PlanTransfer uid={uid} athlete={athlete} weeks={weeks ?? []} weekId={weekId} onImported={setWeekId} />
      </div>
    </main>
  );
}

function AthleteProfile({ uid, athlete }: { uid: string; athlete: UserDoc }) {
  const p = athlete.profile ?? {};
  const rows: [string, string | undefined][] = [
    ['Edad', p.age], ['Talla (cm)', p.heightCm], ['Peso (kg)', p.weightKg],
    ['Nivel', p.level], ['Disponibilidad', p.availability], ['Equipo', p.equipment], ['Objetivos', p.goals], ['Limitaciones', p.limitations],
  ];
  const filled = rows.filter(([, v]) => v);
  return (
    <section className="panel">
      <h3>Perfil</h3>
      <p className="note">{athlete.email}</p>
      <div className="theme-options" style={{ margin: '.6rem 0' }}>
        {THEMES.map((t) => (
          <button key={t.key} type="button" className="theme-swatch" aria-pressed={(athlete.theme ?? DEFAULT_THEME) === t.key}
            onClick={() => updateDoc(doc(db(), 'users', uid), { theme: t.key, updatedAt: serverTimestamp() })}>
            <i style={{ background: t.color }} /> {t.label}
          </button>
        ))}
      </div>
      {filled.length === 0 ? <p className="note">El atleta aún no completó su perfil.</p> : (
        <dl style={{ display: 'grid', gap: '.4rem', margin: 0 }}>
          {filled.map(([k, v]) => <div key={k}><dt style={{ fontWeight: 700, display: 'inline' }}>{k}: </dt><dd style={{ display: 'inline', margin: 0 }}>{v}</dd></div>)}
        </dl>
      )}
    </section>
  );
}

function WeekEditor({ uid, week, weeks, today, hasConsent, onPreview, onSelect }: {
  uid: string; week: Week; weeks: Week[]; today: string; hasConsent: boolean;
  onPreview: () => void; onSelect: (id: string) => void;
}) {
  const sessions = useSessions(uid, week.id);
  const { logs } = useLogs(uid, hasConsent);
  const [meta, setMeta] = useState({ title: week.title, phase: week.phase ?? '', goal: week.goal ?? '', aiAssisted: !!week.aiAssisted });
  const [editing, setEditing] = useState<(Omit<Session, 'id'> & { id?: string }) | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setMeta({ title: week.title, phase: week.phase ?? '', goal: week.goal ?? '', aiAssisted: !!week.aiAssisted });
    setEditing(null);
  }, [week]);

  const c = sessions ? compliance(sessions, logs, today) : null;

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    await saveWeek(uid, { ...week, ...meta });
    setMsg('Semana guardada.');
    setTimeout(() => setMsg(''), 2500);
  }

  async function duplicate() {
    if (!sessions) return;
    const start = addDays(week.start, 7);
    const toId = isoWeekId(start);
    if (weeks.some((w) => w.id === toId)) { setMsg('La semana siguiente ya existe.'); return; }
    const n = (week.title.match(/\d+/)?.[0] ?? '');
    await duplicateWeek(uid, week, { id: toId, start, title: n ? `Semana ${Number(n) + 1}` : `${week.title} (copia)` }, sessions, (d) => addDays(d, 7));
    onSelect(toId);
  }

  async function remove(s: Session) {
    if (window.confirm(`¿Borrar “${s.title}” del ${longDate(s.date)}?`)) await deleteSession(uid, week.id, s.id);
  }

  return (
    <>
      <form className="panel form" onSubmit={saveMeta}>
        <h3>{rangeLabel(week.start)}</h3>
        <div className="form-row">
          <label className="field"><span>Título</span><input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></label>
          <label className="field"><span>Fase</span><input value={meta.phase} placeholder="Base · Construcción · Descarga…" onChange={(e) => setMeta({ ...meta, phase: e.target.value })} /></label>
        </div>
        <label className="field"><span>Objetivo de la semana</span><textarea value={meta.goal} onChange={(e) => setMeta({ ...meta, goal: e.target.value })} /></label>
        <label className="check">
          <input type="checkbox" checked={meta.aiAssisted} onChange={(e) => setMeta({ ...meta, aiAssisted: e.target.checked })} />
          <span>Plan generado o asistido por IA (se le indica al atleta).</span>
        </label>
        <div className="actions">
          <button className="btn">Guardar semana</button>
          <button type="button" className="btn secondary" onClick={duplicate}>Duplicar a la semana siguiente</button>
          <button type="button" className="btn secondary" onClick={onPreview}>Ver como atleta</button>
          {msg && <span className="saved" role="status">{msg}</span>}
        </div>
      </form>

      <section className="panel">
        <h3>Sesiones {c?.pct != null && <small style={{ fontSize: '1rem', color: 'var(--ink-soft)' }}>· cumplimiento {c.pct}% ({c.done}/{c.planned})</small>}</h3>
        {sessions === null ? <p className="loading">Cargando…</p> : (
          <div className="table-wrap">
            <table className="sessions">
              <thead><tr><th>Día</th><th>Sesión</th><th>Objetivo</th><th>Estado</th><th>RPE real</th><th>Comentario</th><th /></tr></thead>
              <tbody>
                {sessions.map((s) => {
                  const st = sessionStatus(s, logs[s.id], today);
                  const d = dayParts(s.date);
                  return (
                    <tr key={s.id}>
                      <td>{d.dow} {d.num}</td>
                      <td><b>{s.title}</b><br /><small>{SPORTS[s.sport]?.label}{!s.core && s.sport !== 'descanso' ? ' · extra' : ''}</small></td>
                      <td>{[s.durationMin && `${s.durationMin} min`, s.distanceKm && `${s.distanceKm} km`, s.rpe && `RPE ${s.rpe}`].filter(Boolean).join(' · ')}</td>
                      <td><span className={`status ${st}`} style={{ marginLeft: 0 }}>{STATUS_TXT[st]}</span></td>
                      <td>{logs[s.id]?.rpe ?? ''}</td>
                      <td className="comment">{logs[s.id]?.comment ?? ''}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button type="button" className="btn small secondary" onClick={() => setEditing(s)}>Editar</button>{' '}
                        <button type="button" className="btn small secondary" aria-label="Borrar sesión" onClick={() => remove(s)}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {editing ? (
          <SessionEditor
            key={editing.id ?? 'new'}
            initial={editing}
            weekStart={week.start}
            onCancel={() => setEditing(null)}
            onSave={async (s) => { await saveSession(uid, week.id, s); setEditing(null); }}
          />
        ) : (
          <div className="actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn" onClick={() => {
              const last = sessions?.[sessions.length - 1]?.date;
              setEditing(emptySession(last && last < addDays(week.start, 6) ? addDays(last, 1) : week.start));
            }}>+ Agregar sesión</button>
          </div>
        )}
      </section>
    </>
  );
}

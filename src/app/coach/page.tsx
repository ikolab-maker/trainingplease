'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Gate } from '@/components/Gate';
import { TopNav } from '@/components/TopNav';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { fetchAllSessions, fetchLogs } from '@/lib/data';
import { compliance, daysUntil, isoWeekId, todayISO } from '@/lib/dates';
import type { Compliance } from '@/lib/dates';
import type { GoalRace, UserDoc } from '@/lib/types';

interface AthleteRow {
  uid: string;
  user: UserDoc;
  total: Compliance;
  week: Compliance;
  lastComment?: { text: string; date: string };
  revoked: boolean;
}

interface Pending { email: string; name: string; goalRace: GoalRace | null }

export default function CoachPage() {
  return (
    <Gate role="admin">
      {() => (
        <>
          <TopNav />
          <Dashboard />
        </>
      )}
    </Gate>
  );
}

function Dashboard() {
  const [rows, setRows] = useState<AthleteRow[] | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);

  const load = useCallback(async () => {
    const today = todayISO();
    const thisWeek = isoWeekId(today);
    const users = await getDocs(query(collection(db(), 'users'), where('role', '==', 'athlete')));
    const out = await Promise.all(users.docs.map(async (d) => {
      const user = d.data() as UserDoc;
      const sessions = await fetchAllSessions(d.id);
      let logs = {};
      let revoked = !user.consent;
      if (!revoked) {
        try { logs = await fetchLogs(d.id); } catch { revoked = true; }
      }
      const withComment = sessions
        .filter((s) => (logs as Record<string, { comment?: string }>)[s.id]?.comment)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      return {
        uid: d.id,
        user,
        revoked,
        total: compliance(sessions, logs, today),
        week: compliance(sessions.filter((s) => isoWeekId(s.date) === thisWeek), logs, today),
        lastComment: withComment
          ? { text: (logs as Record<string, { comment: string }>)[withComment.id].comment, date: withComment.date }
          : undefined,
      } satisfies AthleteRow;
    }));
    out.sort((a, b) => a.user.name.localeCompare(b.user.name));
    setRows(out);

    const allow = await getDocs(query(collection(db(), 'allowlist'), where('uid', '==', null)));
    setPending(allow.docs.map((d) => d.data() as Pending));
  }, []);

  useEffect(() => { load().catch(() => setRows([])); }, [load]);

  return (
    <main>
      <header className="banner"><h2>Panel coach</h2><p>Atletas, planes y cumplimiento</p></header>
      <div className="wrap">
        <h3 className="section-title">Atletas</h3>
        {rows === null ? <p className="loading">Cargando…</p> : rows.length === 0 ? (
          <p className="section-sub">Todavía no hay atletas activos. Da de alta el primero abajo; aparecerá aquí cuando entre con Google.</p>
        ) : (
          <div className="athletes">
            {rows.map((r) => (
              <Link key={r.uid} href={`/coach/${r.uid}`} className="athlete-card">
                <h4>{r.user.name}</h4>
                <p className="meta">
                  {r.user.goalRace
                    ? `${r.user.goalRace.name} · faltan ${Math.max(0, daysUntil(r.user.goalRace.date))} días`
                    : 'Sin carrera objetivo'}
                </p>
                {r.revoked ? (
                  <p className="alert">Consentimiento pendiente o revocado: sus registros no están disponibles.</p>
                ) : (
                  <>
                    <p className="pct">{r.total.pct ?? '–'}{r.total.pct != null && '%'}<small>cumplimiento total ({r.total.done}/{r.total.planned})</small></p>
                    <p className="meta">Esta semana: {r.week.pct != null ? `${r.week.pct}% (${r.week.done}/${r.week.planned})` : 'sin sesiones vencidas aún'}</p>
                    {r.lastComment && <p className="meta"><i>“{r.lastComment.text.slice(0, 140)}”</i></p>}
                  </>
                )}
              </Link>
            ))}
          </div>
        )}

        {pending.length > 0 && (
          <>
            <h3 className="section-title">Esperando su primer acceso</h3>
            <PendingList pending={pending} onChange={load} />
          </>
        )}

        <h3 className="section-title">Dar de alta un atleta</h3>
        <p className="section-sub">El atleta entra con la cuenta de Google de este correo. No hay invitación por enlace: solo los correos registrados aquí pueden entrar.</p>
        <NewAthleteForm onCreated={load} />
      </div>
    </main>
  );
}

function PendingList({ pending, onChange }: { pending: Pending[]; onChange: () => void }) {
  const { authHeaders } = useAuth();
  async function remove(email: string) {
    if (!window.confirm(`¿Quitar el alta de ${email}?`)) return;
    await fetch(`/api/admin/athletes?email=${encodeURIComponent(email)}`, { method: 'DELETE', headers: await authHeaders() });
    onChange();
  }
  return (
    <ul className="pending-list">
      {pending.map((p) => (
        <li key={p.email}>
          <span><b>{p.name}</b> · {p.email}</span>
          <button type="button" className="btn small secondary" onClick={() => remove(p.email)}>Quitar</button>
        </li>
      ))}
    </ul>
  );
}

function NewAthleteForm({ onCreated }: { onCreated: () => void }) {
  const { authHeaders } = useAuth();
  const empty = { name: '', email: '', raceName: '', raceDate: '', raceKm: '' };
  const [f, setF] = useState(empty);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/admin/athletes', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        name: f.name,
        email: f.email,
        goalRace: f.raceName && f.raceDate
          ? { name: f.raceName, date: f.raceDate, distanceKm: f.raceKm ? Number(f.raceKm.replace(',', '.')) : null }
          : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: `Listo: ${f.name} ya puede entrar con ${f.email}.` });
      setF(empty);
      onCreated();
    } else {
      setMsg({ ok: false, text: data.error ?? 'No se pudo registrar.' });
    }
  }

  const input = (key: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="field"><span>{label}</span>
      <input value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} {...props} /></label>
  );

  return (
    <form className="panel form" onSubmit={submit}>
      <div className="form-row">
        {input('name', 'Nombre', { required: true, placeholder: 'Nombre y apellido' })}
        {input('email', 'Correo de Google', { required: true, type: 'email', placeholder: 'nombre@gmail.com' })}
      </div>
      <div className="form-row">
        {input('raceName', 'Carrera objetivo', { placeholder: 'Media Maratón de Lima' })}
        {input('raceDate', 'Fecha', { type: 'date' })}
        {input('raceKm', 'Distancia (km)', { inputMode: 'decimal', placeholder: '21,1' })}
      </div>
      {msg && <p className={`alert${msg.ok ? '' : ' error'}`}>{msg.text}</p>}
      <div className="actions"><button className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Dar de alta'}</button></div>
    </form>
  );
}

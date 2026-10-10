'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import './agent.css';
import { dayParts } from '@/lib/dates';
import { parsePlanFile, type PlanWeekFile } from '@/lib/planFile';
import { SPORTS } from '@/lib/sports';
import type { UserDoc } from '@/lib/types';

interface Proposal {
  id: string;
  status: 'pending' | 'approved' | 'discarded';
  weekId: string;
  analyzedWeekId: string;
  decision: string;
  decisionRule: string;
  summary: string;
  alerts: string[];
  questionsForAthlete: string[];
  coachMessage: string;
  km: number;
  metrics: { compliancePct: number | null; kmPlanned: number; kmDone: number; logsAvailable: boolean };
  plan: PlanWeekFile[];
  issues: string[];
  attempts: number;
  createdAt: string | null;
  trigger: string;
  kind?: 'semanal' | 'ajuste';
  request?: string;
}

const DECISION_LABEL: Record<string, string> = {
  descarga: 'Descarga', bajar: 'Bajar carga', mantener: 'Mantener', progresar: 'Progresar', 'sin-datos': 'Sin datos',
};
const STATUS_LABEL = { pending: 'Pendiente de tu aprobación', approved: 'Aprobada y cargada', discarded: 'Descartada' };

/**
 * Agente principal en la ficha del atleta: su memoria, la propuesta de la semana siguiente y
 * los ajustes puntuales que pide el coach, para aprobar, editar o descartar.
 */
export function AgentPanel({ uid, athlete, weekId, onApproved }: { uid: string; athlete: UserDoc; weekId: string | null; onApproved: (weekId: string) => void }) {
  const { authHeaders } = useAuth();
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [ficha, setFicha] = useState('');
  const [history, setHistory] = useState<{ weekId: string; row: string }[]>([]);
  const [agentReady, setAgentReady] = useState(true);
  const [busy, setBusy] = useState<'' | 'run' | 'adjust' | 'approve' | 'discard' | 'ficha'>('');
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState<string | null>(null); // id de la propuesta en edición
  const [request, setRequest] = useState('');
  const [draft, setDraft] = useState('');
  const aiConsent = athlete.consent?.optional?.ai === true;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/proposals?uid=${uid}`, { headers: await authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProposals(data.proposals);
      setFicha(data.memory?.ficha ?? '');
      setHistory(Array.isArray(data.memory?.history) ? data.memory.history : []);
      setAgentReady(!!data.agentReady);
    } catch {
      setProposals([]);
      setMsg('No se pudieron leer las propuestas.');
    }
  }, [uid, authHeaders]);

  useEffect(() => { load(); }, [load]);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function run() {
    setBusy('run'); setMsg('');
    try {
      const { data } = await post('/api/agent/run', { uid });
      setMsg(data.status === 'proposed' ? `Propuesta lista para ${data.weekId}.`
        : data.status === 'skipped' ? data.reason
        : data.error ?? 'El agente no pudo terminar.');
      await load();
    } catch {
      setMsg('Sin conexión.');
    } finally { setBusy(''); }
  }

  async function adjust() {
    if (!weekId || !request.trim()) return;
    setBusy('adjust'); setMsg('');
    try {
      const { data } = await post('/api/agent/run', { uid, weekId, request });
      setMsg(data.status === 'proposed' ? `Ajuste listo para revisar (${data.weekId}).`
        : data.status === 'skipped' ? data.reason
        : data.error ?? 'El agente no pudo terminar.');
      if (data.status === 'proposed') setRequest('');
      await load();
    } catch {
      setMsg('Sin conexión.');
    } finally { setBusy(''); }
  }

  async function decide(p: Proposal, action: 'approve' | 'discard') {
    let plan: unknown;
    if (action === 'approve' && editing === p.id) {
      try { plan = JSON.parse(draft); } catch { setMsg('El JSON editado no es válido.'); return; }
      const { errors } = parsePlanFile(plan);
      if (errors.length) { setMsg(errors.slice(0, 5).join(' · ')); return; }
    }
    setBusy(action); setMsg('');
    try {
      const { ok, data } = await post('/api/admin/proposals', { uid, id: p.id, action, plan });
      if (!ok) { setMsg(data.errors?.slice(0, 5).join(' · ') ?? data.error ?? 'No se pudo guardar.'); return; }
      setMsg(action === 'approve' ? `Listo: ${data.sessions} sesiones cargadas en ${p.weekId}.` : 'Propuesta descartada.');
      setEditing(null);
      if (action === 'approve') onApproved(p.weekId);
      await load();
    } catch {
      setMsg('Sin conexión.');
    } finally { setBusy(''); }
  }

  async function saveFicha() {
    setBusy('ficha'); setMsg('');
    try {
      const { ok, data } = await post('/api/admin/memory', { uid, ficha });
      setMsg(ok ? 'Ficha guardada.' : data.error ?? 'No se pudo guardar la ficha.');
    } finally { setBusy(''); }
  }

  const pending = proposals?.filter((p) => p.status === 'pending') ?? [];
  const shown = pending.length ? pending : proposals?.slice(0, 1) ?? [];
  const older = proposals?.filter((p) => !shown.includes(p)) ?? [];
  const weeklyPending = pending.some((p) => p.kind !== 'ajuste');
  const canRun = !busy && aiConsent && agentReady;

  return (
    <section className="panel agent-panel">
      <h3>Agente principal</h3>
      <p className="note">
        Cada domingo a las 12:05 analiza la semana que cierra y propone la siguiente. También ajusta una semana cargada cuando se lo pides. Nada llega al atleta hasta que lo apruebes.
      </p>
      {!aiConsent && (
        <p className="alert">Este atleta no marcó en su consentimiento la casilla de planes con IA: el agente no trabaja con sus datos.</p>
      )}
      {!agentReady && <p className="alert">Falta configurar ANTHROPIC_API_KEY en Vercel para que el agente pueda correr.</p>}

      {proposals == null ? <p className="note">Cargando…</p> : shown.length === 0 && <p className="note">Todavía no hay propuestas para este atleta.</p>}

      {shown.map((p) => (
        <div key={p.id} className="agent-item">
          <ProposalView p={p} />
          {p.status === 'pending' && (
            <>
              {editing === p.id && (
                <label className="field">
                  <span>Semana propuesta (JSON, puedes editarla antes de aprobar)</span>
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} rows={14} style={{ fontFamily: 'monospace', fontSize: '.85rem' }} />
                </label>
              )}
              <div className="agent-actions">
                <button type="button" className="btn" disabled={!!busy} onClick={() => decide(p, 'approve')}>
                  {busy === 'approve' ? 'Cargando…' : editing === p.id ? 'Aprobar con mis cambios' : 'Aprobar y cargar'}
                </button>
                <button type="button" className="btn secondary" disabled={!!busy}
                  onClick={() => { setEditing(editing === p.id ? null : p.id); setDraft(JSON.stringify(p.plan, null, 2)); }}>
                  {editing === p.id ? 'Cancelar edición' : 'Editar antes de aprobar'}
                </button>
                <button type="button" className="btn secondary" disabled={!!busy} onClick={() => decide(p, 'discard')}>
                  {busy === 'discard' ? 'Descartando…' : 'Descartar'}
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      <div className="agent-actions">
        <button type="button" className="btn small" disabled={!canRun} onClick={run}>
          {busy === 'run' ? 'Pensando… (1 a 3 minutos)' : weeklyPending ? 'Generar de nuevo la semana siguiente' : 'Generar la semana siguiente ahora'}
        </button>
      </div>

      <div className="agent-adjust">
        <h4>Pedir un ajuste{weekId ? ` a ${weekId}` : ''}</h4>
        <p className="note">Elige la semana en el plan (abajo) y di qué cambiar, por ejemplo: "mueve el fondo del domingo al sábado". El agente cambia solo eso (y lo que haga falta para que siga siendo seguro) y te lo deja para aprobar. Las sesiones pasadas o registradas no se tocan.</p>
        <label className="field">
          <span>Qué cambiar</span>
          <textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={2} maxLength={1000} />
        </label>
        <button type="button" className="btn small" disabled={!canRun || !weekId || !request.trim()} onClick={adjust}>
          {busy === 'adjust' ? 'Ajustando… (1 a 2 minutos)' : 'Pedir ajuste'}
        </button>
      </div>
      {msg && <p className="note" role="status">{msg}</p>}

      <details>
        <summary>Ficha del atleta para el agente</summary>
        <p className="note">Meta, reglas personales, lesiones y lo que el agente debe recordar siempre. La lee en cada análisis.</p>
        <label className="field">
          <span>Ficha</span>
          <textarea value={ficha} onChange={(e) => setFicha(e.target.value)} rows={10} />
        </label>
        <button type="button" className="btn small" disabled={!!busy} onClick={saveFicha}>{busy === 'ficha' ? 'Guardando…' : 'Guardar ficha'}</button>
        {history.length > 0 && (
          <>
            <h4>Historial de decisiones</h4>
            <ul className="agent-list">{history.slice(-8).reverse().map((h) => <li key={h.weekId + h.row}><strong>{h.weekId}</strong> · {h.row}</li>)}</ul>
          </>
        )}
      </details>

      {older.length > 0 && (
        <details>
          <summary>Propuestas anteriores</summary>
          <ul className="agent-list">
            {older.map((p) => <li key={p.id}>{p.weekId} · {p.kind === 'ajuste' ? `ajuste: ${p.request}` : DECISION_LABEL[p.decision] ?? p.decision} · {STATUS_LABEL[p.status]}</li>)}
          </ul>
        </details>
      )}
    </section>
  );
}

function ProposalView({ p }: { p: Proposal }) {
  const week = p.plan?.[0];
  const m = p.metrics;
  return (
    <div className="agent-proposal">
      <p>
        <strong>{p.kind === 'ajuste' ? `Ajuste de ${p.weekId}` : p.weekId}</strong> · {STATUS_LABEL[p.status]}
        {p.kind !== 'ajuste' && <> · decisión: <strong>{DECISION_LABEL[p.decision] ?? p.decision}</strong></>}
        {' '}· {p.km} km de carrera
      </p>
      {p.kind === 'ajuste' && <p className="note">Pediste: “{p.request}”</p>}
      <p className="note">
        {p.kind === 'ajuste' ? 'Ajuste' : `Semana ${p.analyzedWeekId}: ${m.logsAvailable ? `cumplimiento ${m.compliancePct ?? '–'} %` : 'sin registros'} · ${m.kmDone}/${m.kmPlanned} km`}
        {' '}· {p.trigger === 'cron' ? 'automática del domingo' : 'pedida por el coach'}
        {p.createdAt ? ` · ${new Date(p.createdAt).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' })}` : ''}
      </p>
      <p style={{ whiteSpace: 'pre-line' }}>{p.summary}</p>
      <p className="note">Regla: {p.decisionRule}</p>
      {p.alerts.length > 0 && <div className="alert"><strong>Mira esto:</strong><ul>{p.alerts.map((a) => <li key={a}>{a}</li>)}</ul></div>}
      {p.issues.length > 0 && (
        <div className="alert error"><strong>El Guardián no quedó conforme ({p.attempts} intentos):</strong><ul>{p.issues.map((a) => <li key={a}>{a}</li>)}</ul></div>
      )}
      {p.coachMessage && <p style={{ whiteSpace: 'pre-line' }}>{p.coachMessage}</p>}
      {p.questionsForAthlete.length > 0 && (
        <><h4>Preguntas para el atleta</h4><ul className="agent-list">{p.questionsForAthlete.map((q) => <li key={q}>{q}</li>)}</ul></>
      )}
      {week && (
        <>
          <h4>{week.week.title}{week.week.phase ? ` · ${week.week.phase}` : ''}</h4>
          {week.week.goal && <p className="note">{week.week.goal}</p>}
          <div className="table-wrap">
            <table className="sessions">
              <thead><tr><th>Día</th><th>Sesión</th><th>Km</th><th>RPE</th></tr></thead>
              <tbody>
                {week.sessions.map((s) => {
                  const d = dayParts(s.date);
                  return (
                    <tr key={s.id}>
                      <td>{d.dow} {d.num}</td>
                      <td>{SPORTS[s.sport]?.label ?? s.sport} · {s.title}{s.core ? '' : ' (extra)'}{s.tip ? <><br /><small>{s.tip}</small></> : null}</td>
                      <td>{s.distanceKm ?? '–'}</td>
                      <td>{s.rpe ?? '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

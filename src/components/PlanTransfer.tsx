'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { fetchLogs, fetchWeekSessions } from '@/lib/data';
import { parsePlanFile, type PlanWeekFile } from '@/lib/planFile';
import { SPORTS } from '@/lib/sports';
import type { UserDoc, Week } from '@/lib/types';

const PREVIOUS_WEEKS = 4;

const iso = (v: unknown) =>
  v && typeof (v as { toDate?: () => Date }).toDate === 'function' ? (v as { toDate: () => Date }).toDate().toISOString() : null;

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Exportar la semana elegida (con perfil y registros) e importar semanas desde un JSON. Solo coach. */
export function PlanTransfer({ uid, athlete, weeks, weekId, onImported }: {
  uid: string; athlete: UserDoc; weeks: Week[]; weekId: string | null; onImported: (weekId: string) => void;
}) {
  return (
    <div className="transfer">
      <ExportWeek uid={uid} athlete={athlete} weeks={weeks} weekId={weekId} />
      <ImportWeeks uid={uid} weeks={weeks} onImported={onImported} />
    </div>
  );
}

function ExportWeek({ uid, athlete, weeks, weekId }: { uid: string; athlete: UserDoc; weeks: Week[]; weekId: string | null }) {
  const [withPrevious, setWithPrevious] = useState(false);
  const [msg, setMsg] = useState('');
  const target = weeks.find((w) => w.id === weekId);

  async function build() {
    if (!target) return null;
    const idx = weeks.indexOf(target);
    const chosen = withPrevious ? weeks.slice(Math.max(0, idx - PREVIOUS_WEEKS), idx + 1) : [target];
    const hasConsent = !!athlete.consent;
    const allLogs = hasConsent ? await fetchLogs(uid) : {};
    const logs: Record<string, { done: boolean; rpe: number | null; comment: string; updatedAt: string | null }> = {};
    const out = [];
    for (const { id, ...week } of chosen) {
      const sessions = await fetchWeekSessions(uid, id);
      out.push({ id, week, sessions: sessions.map(({ weekId: _w, ...s }: typeof sessions[number] & { weekId?: string }) => s) });
      for (const s of sessions) {
        const l = allLogs[s.id];
        if (l) logs[s.id] = { done: l.done, rpe: l.rpe, comment: l.comment, updatedAt: iso(l.updatedAt) };
      }
    }
    return {
      format: 'training-please/semanas@1',
      exportedAt: new Date().toISOString(),
      athlete: { name: athlete.name, goalRace: athlete.goalRace ?? null, profile: athlete.profile ?? {} },
      logsIncluded: hasConsent,
      weeks: out,
      logs,
    };
  }

  async function download() {
    setMsg('');
    const data = await build().catch(() => null);
    if (!data || !target) { setMsg('No se pudo exportar.'); return; }
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug(athlete.name) || 'atleta'}-${target.id}${withPrevious ? '-y-anteriores' : ''}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('Descargado.');
  }

  async function copy() {
    setMsg('');
    const data = await build().catch(() => null);
    if (!data) { setMsg('No se pudo exportar.'); return; }
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 1));
      setMsg('Copiado al portapapeles.');
    } catch {
      setMsg('El navegador no dejó copiar; usa Descargar.');
    }
  }

  return (
    <section className="panel">
      <h3>Exportar semana</h3>
      {!target ? <p className="note">Elige una semana arriba para exportarla.</p> : (
        <>
          <p className="note">
            {target.title} ({target.id}) con el perfil del atleta y sus registros.
            {!athlete.consent && ' Sin consentimiento vigente: los registros no se incluyen.'}
          </p>
          <label className="check">
            <input type="checkbox" checked={withPrevious} onChange={(e) => setWithPrevious(e.target.checked)} />
            <span>Incluir las {PREVIOUS_WEEKS} semanas anteriores</span>
          </label>
          <div className="actions">
            <button type="button" className="btn" onClick={download}>Descargar JSON</button>
            <button type="button" className="btn secondary" onClick={copy}>Copiar</button>
            {msg && <span className="saved" role="status">{msg}</span>}
          </div>
        </>
      )}
    </section>
  );
}

function ImportWeeks({ uid, weeks, onImported }: { uid: string; weeks: Week[]; onImported: (weekId: string) => void }) {
  const { authHeaders } = useAuth();
  const [text, setText] = useState('');
  const [plan, setPlan] = useState<PlanWeekFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [existing, setExisting] = useState<Record<string, Set<string>>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!text.trim()) { setPlan([]); setErrors([]); return; }
    let raw: unknown;
    try { raw = JSON.parse(text); } catch { setPlan([]); setErrors(['No es un JSON válido.']); return; }
    const r = parsePlanFile(raw);
    setPlan(r.plan);
    setErrors(r.errors);
  }, [text]);

  // Qué semanas y sesiones ya existen, para avisar qué se sobrescribe.
  useEffect(() => {
    let alive = true;
    const known = new Set(weeks.map((w) => w.id));
    Promise.all(plan.filter((w) => known.has(w.id)).map(async (w) => [w.id, new Set((await fetchWeekSessions(uid, w.id)).map((s) => s.id))] as const))
      .then((pairs) => { if (alive) setExisting(Object.fromEntries(pairs)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [plan, weeks, uid]);

  function edit(value: string) {
    setMsg('');
    setText(value);
  }

  async function onFile(f: File | undefined) {
    if (f) edit(await f.text());
  }

  async function submit() {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ uid, plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setMsg(typeof data.error === 'string' && data.error !== 'invalid' ? data.error : 'No se pudo importar.');
        return;
      }
      setMsg(`Listo: ${data.weeks} semana(s) y ${data.sessions} sesiones.`);
      onImported(plan[0].id);
      setText('');
    } catch {
      setMsg('No se pudo importar (sin conexión).');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h3>Importar semana</h3>
      <p className="note">Pega o sube un JSON con el formato [{'{'} id, week, sessions {'}'}]. Crea la semana o la actualiza, y crea o reemplaza sus sesiones; no borra sesiones que no estén en el archivo.</p>
      <label className="field">
        <span>Archivo</span>
        <input type="file" accept="application/json,.json" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      <label className="field">
        <span>O pega el JSON</span>
        <textarea value={text} onChange={(e) => edit(e.target.value)} spellCheck={false} style={{ fontFamily: 'monospace', fontSize: '.85rem' }} />
      </label>

      {errors.length > 0 && (
        <div className="alert error" role="alert">
          <strong>Revisa el archivo:</strong>
          <ul>{errors.slice(0, 12).map((e) => <li key={e}>{e}</li>)}</ul>
          {errors.length > 12 && <p>…y {errors.length - 12} más.</p>}
        </div>
      )}

      {errors.length === 0 && plan.length > 0 && (
        <>
          <h4>Vista previa</h4>
          {plan.map((w) => {
            const old = existing[w.id];
            return (
              <div key={w.id} className="import-week">
                <p><strong>{w.week.title}</strong> · {w.id} · desde {w.week.start} · {old ? 'actualiza una semana existente' : 'semana nueva'}</p>
                <ul>
                  {w.sessions.map((s) => (
                    <li key={s.id}>
                      {s.date} · {SPORTS[s.sport].label} · {s.title}{s.core ? '' : ' (opcional)'}
                      {old?.has(s.id) && <em> · reemplaza la existente</em>}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <div className="actions">
            <button type="button" className="btn" disabled={busy} onClick={submit}>{busy ? 'Importando…' : 'Importar'}</button>
          </div>
        </>
      )}
      {msg && <p className="saved" role="status">{msg}</p>}
    </section>
  );
}

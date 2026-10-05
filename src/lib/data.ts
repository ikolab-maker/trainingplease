'use client';

import { useEffect, useState } from 'react';
import {
  collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { LogEntry, Session, Week } from './types';

export type LogMap = Record<string, LogEntry | undefined>;

const weeksCol = (uid: string) => collection(db(), 'plans', uid, 'weeks');
const sessionsCol = (uid: string, weekId: string) => collection(db(), 'plans', uid, 'weeks', weekId, 'sessions');
const logsCol = (uid: string) => collection(db(), 'logs', uid, 'entries');

export function useWeeks(uid: string | undefined) {
  const [weeks, setWeeks] = useState<Week[] | null>(null);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(query(weeksCol(uid), orderBy('start')), (s) =>
      setWeeks(s.docs.map((d) => ({ ...(d.data() as Omit<Week, 'id'>), id: d.id }))),
    );
  }, [uid]);
  return weeks;
}

export function useSessions(uid: string | undefined, weekId: string | undefined) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  useEffect(() => {
    setSessions(null);
    if (!uid || !weekId) return;
    return onSnapshot(query(sessionsCol(uid, weekId), orderBy('date')), (s) =>
      setSessions(s.docs.map((d) => ({ ...(d.data() as Omit<Session, 'id'>), id: d.id }))),
    );
  }, [uid, weekId]);
  return sessions;
}

export function useLogs(uid: string | undefined, enabled = true) {
  const [logs, setLogs] = useState<LogMap>({});
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!uid || !enabled) return;
    return onSnapshot(
      logsCol(uid),
      (s) => { setError(false); setLogs(Object.fromEntries(s.docs.map((d) => [d.id, d.data() as LogEntry]))); },
      () => setError(true),
    );
  }, [uid, enabled]);
  return { logs, error };
}

/** Todas las sesiones de un atleta (para el cumplimiento total en el panel coach). */
export async function fetchAllSessions(uid: string): Promise<Session[]> {
  const weeks = await getDocs(weeksCol(uid));
  const all = await Promise.all(weeks.docs.map((w) => getDocs(sessionsCol(uid, w.id))));
  return all.flatMap((s) => s.docs.map((d) => ({ ...(d.data() as Omit<Session, 'id'>), id: d.id })));
}

/** Sesiones de una semana, ordenadas por fecha (para exportar). */
export async function fetchWeekSessions(uid: string, weekId: string): Promise<Session[]> {
  const s = await getDocs(query(sessionsCol(uid, weekId), orderBy('date')));
  return s.docs.map((d) => ({ ...(d.data() as Omit<Session, 'id'>), id: d.id }));
}

export async function fetchLogs(uid: string): Promise<LogMap> {
  const s = await getDocs(logsCol(uid));
  return Object.fromEntries(s.docs.map((d) => [d.id, d.data() as LogEntry]));
}

// ---- Atleta ----

export async function saveLog(uid: string, sessionId: string, entry: Omit<LogEntry, 'updatedAt'>) {
  await setDoc(doc(logsCol(uid), sessionId), {
    done: entry.done,
    rpe: entry.rpe,
    comment: entry.comment.slice(0, 1000),
    weekId: entry.weekId,
    updatedAt: serverTimestamp(),
  });
}

// ---- Coach ----

export async function saveWeek(uid: string, week: Week) {
  const { id, ...data } = week;
  await setDoc(doc(weeksCol(uid), id), data, { merge: true });
}

export async function saveSession(uid: string, weekId: string, session: Omit<Session, 'id'> & { id?: string }) {
  const { id, ...data } = session;
  const ref = id ? doc(sessionsCol(uid, weekId), id) : doc(sessionsCol(uid, weekId));
  await setDoc(ref, { ...data, weekId });
  return ref.id;
}

export async function deleteSession(uid: string, weekId: string, sessionId: string) {
  await deleteDoc(doc(sessionsCol(uid, weekId), sessionId));
}

/** Copia las sesiones de una semana a la siguiente (misma estructura, fechas +7 días). */
export async function duplicateWeek(uid: string, from: Week, to: Week, sessions: Session[], shiftDays: (iso: string) => string) {
  const batch = writeBatch(db());
  const { id: toId, ...toData } = to;
  batch.set(doc(weeksCol(uid), toId), { ...toData, phase: from.phase ?? '', goal: from.goal ?? '' }, { merge: true });
  for (const s of sessions) {
    const { id: _ignored, ...data } = s;
    batch.set(doc(sessionsCol(uid, toId)), { ...data, date: shiftDays(s.date), weekId: toId });
  }
  await batch.commit();
}

export interface PlanFile {
  id: string;
  week: Omit<Week, 'id'>;
  sessions: (Omit<Session, 'id'> & { id: string })[];
}

/** Carga un plan guardado en JSON (data/*.json). Crea o sobrescribe semanas y sesiones. */
export async function importPlan(uid: string, plan: PlanFile[]) {
  const batch = writeBatch(db());
  for (const w of plan) {
    batch.set(doc(weeksCol(uid), w.id), w.week, { merge: true });
    for (const { id, ...s } of w.sessions) {
      batch.set(doc(sessionsCol(uid, w.id), id), { ...s, weekId: w.id });
    }
  }
  await batch.commit();
}

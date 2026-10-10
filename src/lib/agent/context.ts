import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import type { GoalRace, LogEntry, Session, UserDoc, Week } from '@/lib/types';
import { parseReference, type FitnessReference } from './fitness';

export interface MemoryRow { weekId: string; decision: string; row: string }
export interface AthleteMemory {
  ficha: string;
  history: MemoryRow[];
  reference: FitnessReference | null; // tiempo de referencia para el índice de forma y los ritmos
  goalTimeMin: number | null; // meta de tiempo en la carrera objetivo
}

export interface AthleteContext {
  uid: string;
  firstName: string;
  goalRace: GoalRace | null;
  profile: NonNullable<UserDoc['profile']>;
  hasConsent: boolean; // consentimiento vigente: sin él no se leen registros
  aiConsent: boolean; // finalidad opcional "planes con IA"
  memory: AthleteMemory;
  weeks: Week[]; // todas, ordenadas
  sessions: Record<string, Session[]>; // por semana, solo las que se cargaron
  logs: Record<string, LogEntry> | null;
}

const PREVIOUS_WEEKS = 4;

/** Junta lo que el agente necesita de un atleta (y nada de otros atletas). */
export async function loadAthleteContext(uid: string, analyzedWeekId: string, targetWeekId: string): Promise<AthleteContext | null> {
  const db = adminDb();
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists || userSnap.get('role') !== 'athlete') return null;
  const user = userSnap.data() as UserDoc;

  const weeks = (await db.collection(`plans/${uid}/weeks`).get()).docs
    .map((d) => ({ ...(d.data() as Omit<Week, 'id'>), id: d.id }))
    .sort((a, b) => a.id.localeCompare(b.id));

  // La semana analizada, las previas y la que se propone (si ya había un plan escrito para ella).
  const upTo = weeks.filter((w) => w.id <= analyzedWeekId).slice(-(PREVIOUS_WEEKS + 1)).map((w) => w.id);
  const wanted = [...upTo, ...weeks.filter((w) => w.id === targetWeekId).map((w) => w.id)];
  const sessions: Record<string, Session[]> = {};
  await Promise.all(wanted.map(async (id) => {
    const snap = await db.collection(`plans/${uid}/weeks/${id}/sessions`).get();
    sessions[id] = snap.docs.map((d) => ({ ...(d.data() as Omit<Session, 'id'>), id: d.id })).sort((a, b) => a.date.localeCompare(b.date));
  }));

  // Igual que las reglas de Firestore: sin consentimiento vigente, el coach (y su agente) no ve registros.
  const hasConsent = !!user.consent;
  let logs: AthleteContext['logs'] = null;
  if (hasConsent) {
    logs = {};
    const snap = await db.collection(`logs/${uid}/entries`).get();
    for (const d of snap.docs) {
      const l = d.data() as LogEntry;
      if (wanted.includes(l.weekId)) logs[d.id] = { done: !!l.done, rpe: l.rpe ?? null, comment: l.comment ?? '', weekId: l.weekId };
    }
  }

  const mem = (await db.doc(`athleteMemory/${uid}`).get()).data() ?? {};
  return {
    uid,
    firstName: (user.name ?? '').trim().split(/\s+/)[0] || 'Atleta',
    goalRace: user.goalRace ?? null,
    profile: user.profile ?? {},
    hasConsent,
    aiConsent: user.consent?.optional?.ai === true,
    memory: {
      ficha: typeof mem.ficha === 'string' ? mem.ficha : '',
      history: Array.isArray(mem.history) ? mem.history : [],
      reference: parseReference(mem.reference),
      goalTimeMin: typeof mem.goalTimeMin === 'number' && mem.goalTimeMin > 0 ? mem.goalTimeMin : null,
    },
    weeks,
    sessions,
    logs,
  };
}

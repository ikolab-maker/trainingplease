export type Role = 'admin' | 'athlete';
export type Theme = 'rosa' | 'azul' | 'oscuro';

export type SportKey =
  | 'running' | 'natacion' | 'ciclismo' | 'voley' | 'futbol'
  | 'gimnasio' | 'movilidad' | 'descanso' | 'fondo' | 'tecnica' | 'otro';

export interface GoalRace {
  name: string;
  date: string; // YYYY-MM-DD
  distanceKm: number | null;
}

export interface ConsentSnapshot {
  version: string;
  acceptedAt: unknown; // Timestamp de Firestore
  optional: { ai: boolean; marketing: boolean; stats: boolean };
}

export interface UserDoc {
  role: Role;
  name: string;
  email: string;
  photoURL?: string | null;
  theme?: Theme;
  goalRace?: GoalRace | null;
  profile?: {
    level?: string;
    availability?: string;
    equipment?: string;
    limitations?: string;
    goals?: string;
  };
  consent?: ConsentSnapshot | null;
}

export interface Week {
  id: string; // ISO week, p. ej. 2026-W40
  start: string; // lunes YYYY-MM-DD
  title: string;
  phase?: string;
  goal?: string;
  aiAssisted?: boolean;
  notes?: { title: string; body: string }[]; // reglas o recordatorios de la semana
}

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  sport: SportKey;
  title: string;
  durationMin: number | null;
  distanceKm: number | null;
  rpe: number | null; // RPE objetivo 1-10
  steps: string[]; // instrucciones, una por línea
  summary?: string; // texto libre bajo el título (p. ej. "25 a 30 min · unos 3,5 km")
  focus?: string;
  tip?: string;
  core: boolean; // cuenta para el cumplimiento
}

export interface LogEntry {
  done: boolean;
  rpe: number | null; // RPE real
  comment: string;
  weekId: string;
  updatedAt?: unknown;
}

export type SessionStatus = 'done' | 'missed' | 'late' | 'today' | 'upcoming' | 'rest';

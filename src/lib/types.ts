import type { Lang } from './i18n';

export type Role = 'admin' | 'athlete';
export type Theme = 'rosa' | 'azul' | 'oscuro';
export type Membership = 'base' | 'ritmo' | 'elite';

export type SportKey =
  | 'running' | 'natacion' | 'ciclismo' | 'voley' | 'futbol'
  | 'gimnasio' | 'movilidad' | 'descanso' | 'fondo' | 'tecnica' | 'otro';

export interface GoalRace {
  name: string;
  date: string; // YYYY-MM-DD
  distanceKm: number | null;
}

/** Carrera del atleta. Solo una es la principal: el plan apunta a ella y lleva meta de tiempo. */
export interface Race {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  distanceKm: number | null;
  principal: boolean;
  goalTimeMin: number | null; // meta de tiempo (obligatoria en la principal)
  resultMin: number | null; // tiempo real, cuando ya la corrió
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
  coachTheme?: Theme; // tema del panel coach (solo admin)
  membership?: Membership;
  gamification?: boolean; // false: puntos y racha apagados (lo decide el coach)
  lang?: Lang; // idioma elegido por el usuario; el agente y los correos lo usan
  goalRace?: GoalRace | null; // la principal de races (o la de antes de tener lista)
  races?: Race[];
  profile?: {
    age?: string;
    heightCm?: string;
    weightKg?: string;
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
  frozen?: boolean; // el coach congeló la semana (lesión, viaje): no corta la racha
  notes?: { title: string; body: string }[]; // reglas o recordatorios de la semana
  kind?: 'carga' | 'descarga' | 'taper' | 'carrera' | 'recuperacion'; // tipo de semana, calculado por el código (no por el nombre)
  why?: string; // "por qué esta semana", escrito para el atleta
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
  race?: boolean; // carrera o test: el agente deja días suaves después
}

export interface LogEntry {
  done: boolean;
  rpe: number | null; // RPE real
  comment: string;
  link?: string; // enlace a la actividad (Strava, Garmin…); el agente no lo lee
  weekId: string;
  updatedAt?: unknown;
}

export type SessionStatus = 'done' | 'missed' | 'late' | 'today' | 'upcoming' | 'rest';

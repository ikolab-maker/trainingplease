import type { SportKey } from './types';

// Colores del diseño original (web de Claudia).
export const SPORTS: Record<SportKey, { label: string; color: string; ink: string }> = {
  running:   { label: 'Carrera',   color: 'var(--pink)',      ink: '#fff' },
  fondo:     { label: 'Fondo',     color: 'var(--pink-dark)', ink: '#fff' },
  tecnica:   { label: 'Técnica',   color: 'var(--yellow)',    ink: 'var(--ink)' },
  gimnasio:  { label: 'Gimnasio',  color: 'var(--blue)',      ink: 'var(--ink)' },
  movilidad: { label: 'Movilidad', color: 'var(--mint)',      ink: 'var(--ink)' },
  descanso:  { label: 'Descanso',  color: 'var(--lilac)',     ink: 'var(--ink)' },
  natacion:  { label: 'Natación',  color: 'var(--blue-deep)', ink: '#fff' },
  ciclismo:  { label: 'Ciclismo',  color: 'var(--yellow)',    ink: 'var(--ink)' },
  voley:     { label: 'Vóley',     color: 'var(--mint)',      ink: 'var(--ink)' },
  futbol:    { label: 'Fútbol',    color: 'var(--mint)',      ink: 'var(--ink)' },
  otro:      { label: 'Otro',      color: 'var(--pink-soft)', ink: 'var(--ink)' },
};

export const SPORT_KEYS = Object.keys(SPORTS) as SportKey[];

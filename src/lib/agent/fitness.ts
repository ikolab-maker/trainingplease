// Agente Ciencia: índice de forma, equivalencias y ritmos de entrenamiento con las ecuaciones
// publicadas de Daniels y Gilbert (Oxygen Power, 1979). Es nuestro propio cálculo del método
// publicado: no copia las tablas del libro ni usa la marca VDOT (ver 09-metodologia-agente-ciencia.md).

/** Tiempo de referencia del atleta: una carrera o un test a tope reciente. */
export interface FitnessReference {
  label: string; // p. ej. "10K BBVA"
  distanceKm: number;
  timeMin: number;
  date: string; // YYYY-MM-DD
  maxEffort: boolean; // false: fue un entrenamiento, el índice es un mínimo
}

/** Ritmos en segundos por km. easy = [rápido, lento]. */
export interface TrainingPaces {
  easy: [number, number];
  marathon: number;
  threshold: number;
  interval: number;
  repetition: number;
}

// Costo de oxígeno (ml/kg/min) a una velocidad en m/min, y fracción del VO2max sostenible t minutos.
const vo2Cost = (v: number) => -4.6 + 0.182258 * v + 0.000104 * v * v;
const sustainable = (t: number) => 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
/** Velocidad (m/min) cuyo costo de oxígeno es `vo2`. */
const speedFor = (vo2: number) => (-0.182258 + Math.sqrt(0.182258 ** 2 + 4 * 0.000104 * (4.6 + vo2))) / (2 * 0.000104);

/** Índice de forma a partir de una distancia (km) corrida en `timeMin` minutos. */
export function fitnessIndex(distanceKm: number, timeMin: number): number {
  return vo2Cost((distanceKm * 1000) / timeMin) / sustainable(timeMin);
}

/** Tiempo (min) equivalente a un índice en otra distancia. */
export function raceTimeMin(index: number, distanceKm: number): number {
  let lo = 1;
  let hi = 1200;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (fitnessIndex(distanceKm, mid) > index) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const secPerKm = (metersPerMin: number) => 60_000 / metersPerMin;

/**
 * Ritmos por tipo de sesión: E al 59–74 % del índice, M al ritmo de maratón equivalente,
 * T al 88 %, I al 97,5 % y R al ritmo de milla equivalente. Son una aproximación de las tablas.
 * Con índices muy bajos la milla equivalente sale tan lenta como I: R queda al menos 3 % más rápido.
 */
export function trainingPaces(index: number): TrainingPaces {
  const interval = secPerKm(speedFor(0.975 * index));
  return {
    easy: [secPerKm(speedFor(0.74 * index)), secPerKm(speedFor(0.59 * index))],
    marathon: (raceTimeMin(index, 42.195) * 60) / 42.195,
    threshold: secPerKm(speedFor(0.88 * index)),
    interval,
    repetition: Math.min((raceTimeMin(index, 1.609) * 60) / 1.609, interval * 0.97),
  };
}

/** Ritmo E medio (s/km), para estimar la duración de un rodaje o un fondo. */
export function easyPaceMid(index: number): number {
  const [fast, slow] = trainingPaces(index).easy;
  return (fast + slow) / 2;
}

/** Riegel: T2 = T1 × (D2/D1)^k. */
export function riegelMin(timeMin: number, fromKm: number, toKm: number, k = 1.06): number {
  return timeMin * (toKm / fromKm) ** k;
}

/** Tiempo equivalente en otra distancia, como rango: índice de forma y Riegel con exponente 1,06–1,08. */
export function equivalentRange(ref: Pick<FitnessReference, 'distanceKm' | 'timeMin'>, distanceKm: number): [number, number] {
  const byIndex = raceTimeMin(fitnessIndex(ref.distanceKm, ref.timeMin), distanceKm);
  const riegel = [1.06, 1.08].map((k) => riegelMin(ref.timeMin, ref.distanceKm, distanceKm, k));
  return [Math.min(byIndex, ...riegel), Math.max(byIndex, ...riegel)];
}

export interface GoalCheck {
  predictedMin: number; // equivalente por el índice
  rangeMin: [number, number]; // índice y Riegel (k 1,06–1,08)
  goalIndex: number;
  gapPct: number; // cuánto más rápido que lo previsto pide la meta (negativo: ya está al alcance)
  weeks: number | null; // semanas a la carrera
  label: string;
}

/**
 * Qué tan lejos está la meta de la forma actual. Umbrales de 09: en ensayos con amateurs se
 * mejora 1–5 % en 8–10 semanas y el taper suma 2–3 %; son una inferencia para el coach, no una regla.
 */
export function goalCheck(ref: FitnessReference, goal: { distanceKm: number; timeMin: number }, weeks: number | null): GoalCheck {
  const predictedMin = raceTimeMin(fitnessIndex(ref.distanceKm, ref.timeMin), goal.distanceKm);
  const gapPct = ((predictedMin - goal.timeMin) / predictedMin) * 100;
  const label = gapPct <= 0 ? 'al alcance con la forma actual'
    : weeks != null && weeks <= 4 && gapPct > 5 ? 'poco realista para esta carrera'
    : weeks != null && weeks <= 10 && gapPct > 5 ? 'ambiciosa'
    : 'exigente: se revisa con cada test o carrera';
  return {
    predictedMin,
    rangeMin: equivalentRange(ref, goal.distanceKm),
    goalIndex: fitnessIndex(goal.distanceKm, goal.timeMin),
    gapPct,
    weeks,
    label,
  };
}

/** "1:05:52" → 65,87 min; "56:00" → 56. Null si no se entiende. */
export function parseTime(text: string): number | null {
  const parts = text.trim().split(':');
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d{1,3}$/.test(p))) return null;
  const [h, m, s] = parts.length === 3 ? parts.map(Number) : [0, ...parts.map(Number)];
  if (s >= 60 || (parts.length === 3 && m >= 60)) return null;
  const min = h * 60 + m + s / 60;
  return min > 0 ? min : null;
}

/** 65,87 → "1:05:52"; 26,5 → "26:30". */
export function fmtTime(min: number): string {
  const total = Math.round(min * 60);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

/** 329 → "5:29". */
export function fmtPace(secPerKmValue: number): string {
  const total = Math.round(secPerKmValue);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Valida un tiempo de referencia que llega de la API o de Firestore. */
export function parseReference(raw: unknown): FitnessReference | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const distanceKm = typeof r.distanceKm === 'number' ? r.distanceKm : NaN;
  const timeMin = typeof r.timeMin === 'number' ? r.timeMin : NaN;
  const date = typeof r.date === 'string' ? r.date : '';
  if (!(distanceKm >= 1 && distanceKm <= 100) || !(timeMin >= 3 && timeMin <= 900) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const index = fitnessIndex(distanceKm, timeMin);
  if (!(index >= 15 && index <= 90)) return null; // fuera de lo que cubren las ecuaciones
  return {
    label: typeof r.label === 'string' ? r.label.slice(0, 120) : '',
    distanceKm,
    timeMin,
    date,
    maxEffort: r.maxEffort === true,
  };
}

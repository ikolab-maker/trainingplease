// Contenido editable del sitio público (página principal).

export interface Testimonial { quote: string; name: string; goal: string }

/**
 * Testimonios de atletas del piloto. Solo con su permiso, con nombre de pila y sin fotos.
 * La sección no se muestra mientras esta lista esté vacía.
 */
export const TESTIMONIALS: Testimonial[] = [];

export const STEPS = [
  { title: 'Cuéntanos tu meta', text: 'Tu carrera, la fecha, cuánto entrenas hoy y cuánto tiempo tienes de verdad en la semana.' },
  { title: 'Recibe tu semana', text: 'Cada domingo tienes tu plan en el celular: qué toca cada día, cuánto y a qué esfuerzo.' },
  { title: 'Marca y cuenta', text: 'Un check al terminar, tu esfuerzo del 1 al 10 y cómo te sentiste. Menos de diez segundos.' },
  { title: 'Afinamos tu plan', text: 'Nuestros agentes de IA analizan tu semana y proponen el ajuste. Tu coach lo revisa y lo aprueba.' },
] as const;

export const PILLARS = [
  { title: 'Ciencia, IA y criterio', text: 'Agentes de IA que trabajan sobre metodología verificada, y una persona que te conoce y aprueba cada cambio.', soon: false },
  { title: 'Tu reloj, el que sea', text: 'No dependemos de ninguna marca. Entrenas con el reloj que tengas, o sin ninguno.', soon: false },
  { title: 'Rumbo a tu carrera', text: 'Una cuenta regresiva y tu cumplimiento semanal: siempre sabes cuánto falta y cuánto has avanzado.', soon: false },
  { title: 'Cerca de ti', text: 'Descarga muscular, clínica de técnica, test de sudoración y asesorías uno a uno en Lima.', soon: true },
] as const;

/** La red de agentes de IA (visión del producto; parte ya opera en el piloto). */
export const AGENTS = [
  { key: 'ciencia', name: 'Ciencia', text: 'Trae la metodología verificada: periodización, progresión gradual, zonas por esfuerzo, descargas y taper. Cada ajuste tiene un porqué.' },
  { key: 'analisis', name: 'Análisis', text: 'Lee cada sesión que registras: cumplimiento, kilómetros, esfuerzo real frente al planificado y lo que nos cuentas.' },
  { key: 'plan', name: 'Plan', text: 'Genera y afina tu semana siguiente a tu meta, tu calendario y cómo vienes respondiendo.' },
  { key: 'guardian', name: 'Guardián', text: 'Vigila las señales de alerta. Ante dolor o sobrecarga frena, propone descarga y avisa a tu coach.' },
] as const;

export const LOOPS = [
  { when: 'Al instante', text: 'Registras tu sesión y los agentes la leen en segundos. Si algo no cuadra, lo detectan y responden.' },
  { when: 'Cada domingo', text: 'Cierre de semana: análisis completo y una propuesta de tu próxima semana lista el mismo día.' },
  { when: 'Cada bloque', text: 'Cada 3 o 4 semanas miran la tendencia hacia tu carrera y recalibran el camino.' },
] as const;

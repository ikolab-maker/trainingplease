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
  { title: 'Ajustamos juntos', text: 'Revisamos tu semana y adaptamos la siguiente a lo que hiciste y a cómo te fue.' },
] as const;

export const PILLARS = [
  { title: 'Personas primero', text: 'La tecnología nos ayuda a leer tu semana. Las decisiones las toma una persona que te conoce y te pregunta cómo estás.', soon: false },
  { title: 'Tu reloj, el que sea', text: 'No dependemos de ninguna marca. Entrenas con el reloj que tengas, o sin ninguno.', soon: false },
  { title: 'Rumbo a tu carrera', text: 'Una cuenta regresiva y tu cumplimiento semanal: siempre sabes cuánto falta y cuánto has avanzado.', soon: false },
  { title: 'Cerca de ti', text: 'Descarga muscular, clínica de técnica, test de sudoración y asesorías uno a uno en Lima.', soon: true },
] as const;

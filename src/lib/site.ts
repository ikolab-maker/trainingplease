// Contenido editable del sitio público (página principal).

export interface Testimonial { quote: string; name: string; goal: string }

/**
 * Testimonios de atletas del piloto. Solo con su permiso, con nombre de pila y sin fotos.
 * La sección no se muestra mientras esta lista esté vacía.
 */
export const TESTIMONIALS: Testimonial[] = [];

// Pasos, pilares, agentes y ciclos del sitio están en src/i18n/es.ts y en.ts (site.*).

// Enlace a la actividad que el atleta pega en su registro (Strava, Garmin, Coros…).
// Solo se guarda el link: la app no trae datos de Strava, porque su API prohíbe usarlos con IA.

export const ACTIVITY_LINK_MAX = 300;

/** Devuelve el enlace limpio si es https y cabe; si no, cadena vacía. */
export function activityLink(raw: string): string {
  const s = raw.trim();
  if (!s || s.length > ACTIVITY_LINK_MAX) return '';
  try {
    return new URL(s).protocol === 'https:' ? s : '';
  } catch {
    return '';
  }
}

/** Nombre corto del servicio para mostrar el enlace ("Strava", "Garmin" o el dominio). */
export function activityLinkLabel(link: string): string {
  let host: string;
  try { host = new URL(link).hostname.replace(/^www\./, ''); } catch { return 'Actividad'; }
  if (/strava\.(com|app\.link)$/.test(host)) return 'Strava';
  if (host.endsWith('garmin.com')) return 'Garmin';
  return host;
}

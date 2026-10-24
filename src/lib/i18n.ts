// Idiomas de la app y del sitio. El texto vive en src/i18n/es.ts y src/i18n/en.ts;
// el panel del coach y Docs siguen solo en español (decisión de Chris, 24/10).

export type Lang = 'es' | 'en';
export const LANGS: { key: Lang; label: string }[] = [
  { key: 'es', label: 'Español' },
  { key: 'en', label: 'English' },
];
export const DEFAULT_LANG: Lang = 'es';
export const LANG_STORAGE_KEY = 'tp-lang';

export const isLang = (v: unknown): v is Lang => v === 'es' || v === 'en';

/** Idioma del teléfono o navegador: inglés si el primero que calza es inglés; si no, español. */
export function langFromNavigator(languages: readonly string[] | undefined): Lang {
  for (const l of languages ?? []) {
    const base = l.toLowerCase().split('-')[0];
    if (base === 'es') return 'es';
    if (base === 'en') return 'en';
  }
  return DEFAULT_LANG;
}

/** Orden: el que eligió el usuario en su perfil, el guardado en este dispositivo y el del teléfono. */
export function resolveLang(profileLang: unknown, storedLang: unknown, languages: readonly string[] | undefined): Lang {
  if (isLang(profileLang)) return profileLang;
  if (isLang(storedLang)) return storedLang;
  return langFromNavigator(languages);
}

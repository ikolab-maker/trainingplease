'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';
import { DEFAULT_LANG, LANG_STORAGE_KEY, LANGS, resolveLang, type Lang } from '@/lib/i18n';
import es, { type Messages } from '@/i18n/es';
import en from '@/i18n/en';

const MESSAGES: Record<Lang, Messages> = { es, en };

interface I18nApi {
  lang: Lang;
  t: Messages;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<I18nApi | null>(null);

export function useI18n(): I18nApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n fuera de I18nProvider');
  return v;
}

function readStored(): string | null {
  try { return localStorage.getItem(LANG_STORAGE_KEY); } catch { return null; }
}

/**
 * Idioma de la interfaz: el del perfil si el usuario lo eligió, si no el guardado en este
 * dispositivo y si no el del teléfono. El servidor siempre pinta en español y aquí se corrige.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  // El panel del coach y Docs están solo en español: el coach siempre ve la app en español.
  const isCoach = state.status === 'ready' && state.profile.role === 'admin';
  const profileLang = isCoach ? 'es' : state.status === 'ready' ? state.profile.lang : undefined;
  const uid = state.status === 'ready' ? state.user.uid : null;

  useEffect(() => {
    setLangState(resolveLang(profileLang, readStored(), typeof navigator !== 'undefined' ? navigator.languages : undefined));
  }, [profileLang]);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(LANG_STORAGE_KEY, l); } catch { /* sin almacenamiento: vale solo esta visita */ }
    // El agente y los correos usan el idioma del perfil. Si las reglas aún no lo permiten, queda en el dispositivo.
    if (uid) updateDoc(doc(db(), 'users', uid), { lang: l, updatedAt: serverTimestamp() }).catch(() => {});
  }, [uid]);

  return <Ctx.Provider value={{ lang, t: MESSAGES[lang], setLang }}>{children}</Ctx.Provider>;
}

/** Selector Español / English. */
export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <span className={`lang-switch${className ? ` ${className}` : ''}`} role="group" aria-label={t.lang.switchLabel}>
      {LANGS.map((l) => (
        <button key={l.key} type="button" aria-pressed={lang === l.key} lang={l.key} onClick={() => setLang(l.key)}>
          {l.key.toUpperCase()}
        </button>
      ))}
    </span>
  );
}

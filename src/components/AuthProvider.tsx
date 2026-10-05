'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, firebaseConfigured, googleProvider } from '@/lib/firebase';
import type { UserDoc } from '@/lib/types';
import { DEFAULT_THEME } from '@/lib/themes';

type State =
  | { status: 'loading' }
  | { status: 'unconfigured' }
  | { status: 'signedOut' }
  | { status: 'denied'; reason: string; detail?: string; user: User }
  | { status: 'ready'; user: User; profile: UserDoc };

interface AuthApi {
  state: State;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Headers con el ID token para llamar a las rutas API privadas. */
  authHeaders: () => Promise<Record<string, string>>;
}

const Ctx = createContext<AuthApi | null>(null);

export function useAuth(): AuthApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth fuera de AuthProvider');
  return v;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(
    firebaseConfigured ? { status: 'loading' } : { status: 'unconfigured' },
  );

  useEffect(() => {
    if (!firebaseConfigured) return;
    let unsubProfile: (() => void) | undefined;

    const unsub = onAuthStateChanged(auth(), async (user) => {
      unsubProfile?.();
      unsubProfile = undefined;
      if (!user) { setState({ status: 'signedOut' }); return; }
      setState({ status: 'loading' });

      try {
        const res = await fetch('/api/bootstrap', {
          method: 'POST',
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        });
        const raw = await res.text();
        let data: { error?: string; detail?: string; role?: string; claimsChanged?: boolean } = {};
        try {
          data = JSON.parse(raw);
        } catch {
          data = { detail: raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200) };
        }
        if (!res.ok) {
          setState({ status: 'denied', user, reason: data.error ?? `http_${res.status}`, detail: data.detail });
          return;
        }
        // El rol llega como custom claim: refrescar el token para que las reglas lo vean.
        if (data.claimsChanged) await user.getIdToken(true);
      } catch {
        setState({ status: 'denied', user, reason: 'network' });
        return;
      }

      unsubProfile = onSnapshot(
        doc(db(), 'users', user.uid),
        (snap) => {
          if (snap.exists()) setState({ status: 'ready', user, profile: snap.data() as UserDoc });
        },
        (err) => setState({ status: 'denied', user, reason: 'profile', detail: err.message }),
      );
    });

    return () => { unsub(); unsubProfile?.(); };
  }, []);

  // Tema elegido por el atleta (rosa por defecto).
  const theme = state.status === 'ready' ? state.profile.theme ?? DEFAULT_THEME : DEFAULT_THEME;
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  const api: AuthApi = {
    state,
    signIn: async () => { await signInWithPopup(auth(), googleProvider); },
    signOut: async () => { await fbSignOut(auth()); },
    authHeaders: async (): Promise<Record<string, string>> => {
      const u = auth().currentUser;
      return u ? { Authorization: `Bearer ${await u.getIdToken()}`, 'Content-Type': 'application/json' } : {};
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LEGAL_VERSION } from '@/lib/legal';
import type { Role, UserDoc } from '@/lib/types';
import type { User } from 'firebase/auth';

export function needsConsent(p: UserDoc): boolean {
  return p.role === 'athlete' && (!p.consent || p.consent.version !== LEGAL_VERSION);
}

/** Protege una página: exige sesión, rol y (para atletas) consentimiento vigente. */
export function Gate({ role, allowNoConsent, children }: {
  role?: Role;
  allowNoConsent?: boolean;
  children: (ctx: { user: User; profile: UserDoc }) => ReactNode;
}) {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === 'signedOut' || state.status === 'denied' || state.status === 'unconfigured') {
      router.replace('/entrar');
      return;
    }
    if (state.status !== 'ready') return;
    const p = state.profile;
    if (role && p.role !== role) router.replace(p.role === 'admin' ? '/coach' : '/plan');
    else if (!allowNoConsent && needsConsent(p)) router.replace('/bienvenida');
  }, [state, role, allowNoConsent, router]);

  if (state.status !== 'ready') return <Loading />;
  const p = state.profile;
  if (role && p.role !== role) return <Loading />;
  if (!allowNoConsent && needsConsent(p)) return <Loading />;
  return <>{children({ user: state.user, profile: p })}</>;
}

export function Loading() {
  return <div className="loading" role="status">Cargando…</div>;
}

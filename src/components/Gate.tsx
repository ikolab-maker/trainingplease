'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useI18n } from './I18nProvider';
import { LEGAL_VERSION } from '@/lib/legal';
import type { Role, UserDoc } from '@/lib/types';
import type { User } from 'firebase/auth';

/** El atleta siempre necesita consentimiento vigente; el coach, solo cuando entra a su propio plan. */
export function needsConsent(p: UserDoc, athleteView = false): boolean {
  return (p.role === 'athlete' || athleteView) && (!p.consent || p.consent.version !== LEGAL_VERSION);
}

/**
 * Protege una página: exige sesión, rol y (para atletas) consentimiento vigente.
 * `athleteView`: páginas del atleta que el coach también usa para su propio plan
 * (también le piden consentimiento, porque sus registros son datos de salud).
 */
export function Gate({ role, athleteView, allowNoConsent, children }: {
  role?: Role;
  athleteView?: boolean;
  allowNoConsent?: boolean;
  children: (ctx: { user: User; profile: UserDoc }) => ReactNode;
}) {
  const { state } = useAuth();
  const router = useRouter();
  const wrongRole = (r: Role) => (athleteView ? r !== 'athlete' && r !== 'admin' : !!role && r !== role);

  useEffect(() => {
    if (state.status === 'signedOut' || state.status === 'denied' || state.status === 'unconfigured') {
      router.replace('/entrar');
      return;
    }
    if (state.status !== 'ready') return;
    const p = state.profile;
    if (wrongRole(p.role)) router.replace(p.role === 'admin' ? '/coach' : '/plan');
    else if (!allowNoConsent && needsConsent(p, athleteView)) router.replace('/bienvenida');
  }, [state, role, athleteView, allowNoConsent, router]);

  if (state.status !== 'ready') return <Loading />;
  const p = state.profile;
  if (wrongRole(p.role)) return <Loading />;
  if (!allowNoConsent && needsConsent(p, athleteView)) return <Loading />;
  return <>{children({ user: state.user, profile: p })}</>;
}

export function Loading() {
  const { t } = useI18n();
  return <div className="loading" role="status">{t.common.loading}</div>;
}

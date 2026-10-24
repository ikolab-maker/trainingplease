'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { needsConsent } from '@/components/Gate';
import { LangSwitch, useI18n } from '@/components/I18nProvider';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

export default function LoginPage() {
  const { state, signIn, signOut } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (state.status !== 'ready') return;
    const p = state.profile;
    // Desde un post solo para atletas se vuelve al post (solo rutas del blog).
    const next = new URLSearchParams(window.location.search).get('next') ?? '';
    const back = /^\/blog\/[a-z0-9-]+$/.test(next) ? next : '';
    router.replace(p.role === 'admin' ? back || '/coach' : needsConsent(p) ? '/bienvenida' : back || '/plan');
  }, [state, router]);

  async function onSignIn() {
    setError('');
    try { await signIn(); } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError(
          code === 'auth/unauthorized-domain'
            ? t.login.unauthorizedDomain(window.location.hostname)
            : code === 'auth/popup-blocked'
              ? t.login.popupBlocked
              : t.login.genericError(code ?? t.login.unknown),
        );
      }
    }
  }

  return (
    <main>
      <header className="hero">
        <div className="hero-inner">
          <p className="hero-kicker">{t.login.kicker}</p>
          <h1>Training Please</h1>
          <p className="hero-sub">{t.login.sub}</p>
        </div>
      </header>

      <div className="wrap">
        <div className="login-card">
          {state.status === 'unconfigured' && (
            <p className="alert error">{t.login.unconfigured}</p>
          )}
          {state.status === 'denied' && (
            <>
              <p className="alert error">{t.login.denied[state.reason] ?? t.login.deniedDefault}</p>
              <p className="note">{t.login.code}: {state.reason}{state.detail ? ` · ${state.detail}` : ''}</p>
              <p>{t.login.signedInAs} <b>{state.user.email}</b>.</p>
              <button type="button" className="btn secondary" onClick={() => signOut()}>{t.login.otherAccount}</button>
            </>
          )}
          {error && <p className="alert error">{error}</p>}
          {(state.status === 'signedOut' || state.status === 'loading') && (
            <>
              <p>{t.login.useGoogle}</p>
              <button type="button" className="btn google" onClick={onSignIn} disabled={state.status === 'loading'}>
                <GoogleIcon /> {state.status === 'loading' ? t.login.signingIn : t.login.google}
              </button>
              <p className="note">{t.login.noAccount} <Link href="/#piloto">{t.login.joinPilot}</Link></p>
            </>
          )}
        </div>
        <p className="note" style={{ textAlign: 'center' }}><LangSwitch /></p>
        <p className="note" style={{ textAlign: 'center' }}><Link href="/">{t.login.backHome}</Link></p>
      </div>
    </main>
  );
}

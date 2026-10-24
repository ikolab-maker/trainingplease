'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/components/I18nProvider';

/** "Entrar" para visitantes; acceso directo al plan o al panel si ya hay sesión. */
export function AccountLink({ className }: { className?: string }) {
  const { state } = useAuth();
  const { t } = useI18n();
  if (state.status === 'ready') {
    const admin = state.profile.role === 'admin';
    return <Link className={className} href={admin ? '/coach' : '/plan'}>{admin ? t.nav.coachPanel : t.nav.myWeek}</Link>;
  }
  return <Link className={className} href="/entrar">{t.nav.signIn}</Link>;
}

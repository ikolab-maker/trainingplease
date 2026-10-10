'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

/** "Entrar" para visitantes; acceso directo al plan o al panel si ya hay sesión. */
export function AccountLink({ className }: { className?: string }) {
  const { state } = useAuth();
  if (state.status === 'ready') {
    const admin = state.profile.role === 'admin';
    return <Link className={className} href={admin ? '/coach' : '/plan'}>{admin ? 'Panel coach' : 'Mi semana'}</Link>;
  }
  return <Link className={className} href="/entrar">Entrar</Link>;
}

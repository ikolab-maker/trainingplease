'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function TopNav() {
  const { state, signOut } = useAuth();
  const path = usePathname();
  if (state.status !== 'ready') return null;
  const isAdmin = state.profile.role === 'admin';

  const links = isAdmin
    ? [{ href: '/coach', label: 'Atletas' }]
    : [{ href: '/plan', label: 'Mi semana' }, { href: '/ajustes', label: 'Ajustes' }];

  return (
    <nav className="topnav" aria-label="Secciones">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={path.startsWith(l.href) ? 'page' : undefined}>
          {l.label}
        </Link>
      ))}
      <button type="button" className="linklike" onClick={() => signOut()}>Salir</button>
    </nav>
  );
}

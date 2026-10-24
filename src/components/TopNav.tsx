'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useI18n } from './I18nProvider';

export function TopNav() {
  const { state, signOut } = useAuth();
  const { t } = useI18n();
  const path = usePathname();
  if (state.status !== 'ready') return null;
  const isAdmin = state.profile.role === 'admin';

  const links = isAdmin
    ? [{ href: '/coach', label: t.nav.athletes }, { href: '/coach/blog', label: t.nav.blog }, { href: '/coach/docs', label: t.nav.docs }]
    : [{ href: '/plan', label: t.nav.myWeek }, { href: '/blog', label: t.nav.blog }, { href: '/ajustes', label: t.nav.settings }];

  return (
    <nav className="topnav" aria-label={t.nav.sections}>
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={isCurrent(path, l.href, links.map((x) => x.href)) ? 'page' : undefined}>
          {l.label}
        </Link>
      ))}
      <button type="button" className="linklike" onClick={() => signOut()}>{t.nav.signOut}</button>
    </nav>
  );
}

/** La sección activa es el enlace más largo que calza con la ruta (Docs o Blog ganan a Atletas). */
function isCurrent(path: string, href: string, all: string[]) {
  const match = (h: string) => path === h || path.startsWith(`${h}/`);
  return match(href) && !all.some((h) => h.length > href.length && match(h));
}

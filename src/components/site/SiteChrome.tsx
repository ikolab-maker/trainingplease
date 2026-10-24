'use client';

import Link from 'next/link';
import { AccountLink } from '@/components/site/AccountLink';
import { LangSwitch, useI18n } from '@/components/I18nProvider';
import { OWNER, PRIVACY_EMAIL } from '@/lib/legal';

// Cabecera y pie del sitio público (inicio, blog y legal comparten marca).

export function Mark() {
  return (
    <svg className="s-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#2F9CC4" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="7">
        <g stroke="#164A5E" transform="translate(2.5 2.5)">
          <path d="M9 19H31M20 19V45" /><path d="M38 45V19H46C55 19 55 36 46 36H38" />
        </g>
        <g stroke="#FBE83A">
          <path d="M9 19H31M20 19V45" /><path d="M38 45V19H46C55 19 55 36 46 36H38" />
        </g>
      </g>
    </svg>
  );
}

/** En el inicio los enlaces son anclas de la misma página; fuera de él llevan al inicio. */
export function SiteHeader({ home = false }: { home?: boolean }) {
  const { t } = useI18n();
  const s = t.site;
  const at = (id: string) => (home ? `#${id}` : `/#${id}`);
  return (
    <header className="s-nav">
      <div className="s-container s-nav-inner">
        <Link href="/" className="s-brand"><Mark /><span>Training <em>Please</em></span></Link>
        <nav aria-label={s.navAria}>
          <a href={at('por-que')}>{s.navWhy}</a>
          <a href={at('como')}>{s.navHow}</a>
          <a href={at('motor')}>{s.navAi}</a>
          <Link href="/blog">{t.blog.nav}</Link>
          <a href={at('piloto')} className="s-nav-cta">{s.navJoin}<span className="s-hide-xs">{s.navJoinRest}</span></a>
          <AccountLink className="s-nav-account" />
          <LangSwitch className="s-lang" />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="s-footer">
      <div className="s-container s-footer-inner">
        <p className="s-brand"><Mark /><span>Training <em>Please</em></span></p>
        <p>
          <Link href="/blog">{t.blog.nav}</Link> · <Link href="/legal">{t.site.footerLegal}</Link> ·{' '}
          <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> · <AccountLink /> · <LangSwitch className="s-lang" />
        </p>
        <p className="s-fine">© {new Date().getFullYear()} {OWNER} · Lima, Perú</p>
      </div>
    </footer>
  );
}

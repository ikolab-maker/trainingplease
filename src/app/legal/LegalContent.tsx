'use client';

import Link from 'next/link';
import { LangSwitch, useI18n } from '@/components/I18nProvider';
import { LEGAL_VERSION } from '@/lib/legal';
import { legalText } from '@/lib/legalText';

// Anclas fijas en español (#aviso, #términos, #política) para que los enlaces no cambien con el idioma.
const IDS = legalText('es').sections.map((s) => s.title.toLowerCase().split(' ')[0]);

export function LegalContent() {
  const { t, lang } = useI18n();
  return (
    <main>
      <header className="banner">
        <h2>{t.legal.title}</h2>
        <p>{t.legal.version(LEGAL_VERSION)}</p>
      </header>
      <div className="wrap legal">
        <p><LangSwitch /></p>
        {t.legal.translationNote && <p className="alert">{t.legal.translationNote}</p>}
        {legalText(lang).sections.map((s, i) => (
          <section key={IDS[i]} id={IDS[i]}>
            <h3>{s.title}</h3>
            <ol>{s.items.map((item, k) => <li key={k}>{item}</li>)}</ol>
          </section>
        ))}
        <p><Link href="/">{t.common.back}</Link></p>
      </div>
    </main>
  );
}

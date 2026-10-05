import Link from 'next/link';
import { DISCLAIMER, LEGAL_VERSION, PRIVACY, TERMS } from '@/lib/legal';

export const metadata = { title: 'Términos y privacidad · Training Please' };

export default function LegalPage() {
  return (
    <main>
      <header className="banner">
        <h2>Términos y privacidad</h2>
        <p>Versión {LEGAL_VERSION}</p>
      </header>
      <div className="wrap legal">
        {[DISCLAIMER, TERMS, PRIVACY].map((s) => (
          <section key={s.title} id={s.title.toLowerCase().split(' ')[0]}>
            <h3>{s.title}</h3>
            <ol>{s.items.map((t, i) => <li key={i}>{t}</li>)}</ol>
          </section>
        ))}
        <p><Link href="/">Volver</Link></p>
      </div>
    </main>
  );
}

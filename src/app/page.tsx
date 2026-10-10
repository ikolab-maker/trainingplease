import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountLink } from '@/components/site/AccountLink';
import { InvestorForm, PilotForm } from '@/components/site/SiteForms';
import { OWNER, PRIVACY_EMAIL } from '@/lib/legal';
import { PILLARS, STEPS, TESTIMONIALS } from '@/lib/site';
import './site.css';

export const metadata: Metadata = {
  title: 'Training Please · Entrena, por favor',
  description:
    'Planes de entrenamiento semanales hechos para ti, con una persona que los mira cada semana. Piloto abierto en Lima: postula gratis.',
  openGraph: {
    title: 'Training Please · Entrena, por favor',
    description: 'Un plan hecho para ti y alguien que lo mira cada semana. Piloto abierto en Lima.',
    locale: 'es_PE',
    type: 'website',
  },
};

function Mark() {
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

/** Maqueta de la app: cuenta regresiva y tarjetas de la semana, sin datos reales. */
function PhoneMock() {
  const days = [
    { d: 'Lun', t: 'Rodaje suave', m: '35 min · RPE 4', done: true },
    { d: 'Mar', t: 'Fuerza y movilidad', m: '45 min · RPE 6', done: true },
    { d: 'Mié', t: 'Series 6 × 400 m', m: '50 min · RPE 7', done: false },
    { d: 'Jue', t: 'Descanso', m: 'Dormir bien también es entrenar', done: false },
  ];
  return (
    <div className="s-phone" aria-hidden="true">
      <div className="s-phone-top">
        <p className="s-phone-kicker">Tu carrera</p>
        <p className="s-phone-count"><b>47</b> días</p>
        <p className="s-phone-race">10K · Domingo de carrera</p>
      </div>
      <ul className="s-phone-days">
        {days.map((x) => (
          <li key={x.d} className={x.done ? 'done' : ''}>
            <span className="s-day">{x.d}</span>
            <span className="s-day-body"><b>{x.t}</b><small>{x.m}</small></span>
            <span className="s-tick">{x.done ? '✓' : ''}</span>
          </li>
        ))}
      </ul>
      <p className="s-phone-pct">Cumplimiento de la semana <b>100%</b></p>
    </div>
  );
}

export default function SitePage() {
  return (
    <div className="site">
      <header className="s-nav">
        <div className="s-container s-nav-inner">
          <Link href="/" className="s-brand"><Mark /><span>Training <em>Please</em></span></Link>
          <nav aria-label="Secciones del sitio">
            <a href="#por-que">Por qué</a>
            <a href="#como">Cómo funciona</a>
            <a href="#piloto" className="s-nav-cta">Únete<span className="s-hide-xs"> al piloto</span></a>
            <AccountLink className="s-nav-account" />
          </nav>
        </div>
      </header>

      <main>
        <section className="s-hero">
          <div className="s-container s-hero-grid">
            <div>
              <p className="s-pill"><span className="s-dot" /> Piloto abierto · Lima, Perú</p>
              <h1>Entrena,<br /><span>por favor.</span></h1>
              <p className="s-lede">
                Te lo pedimos de verdad. No para que cumplas una tabla, sino porque entrenar te cambia la vida.
                Un plan semanal hecho para ti, una app simple para contar cómo te fue y alguien que lo mira cada semana.
              </p>
              <div className="s-ctas">
                <a href="#piloto" className="s-btn primary">Quiero entrar al piloto</a>
                <Link href="/entrar" className="s-btn ghost">Ya tengo cuenta</Link>
              </div>
              <p className="s-fine">Gratis durante el piloto · Cupos limitados</p>
            </div>
            <PhoneMock />
          </div>
        </section>

        <section id="por-que" className="s-section">
          <div className="s-container s-split">
            <div>
              <p className="s-kicker">El nombre</p>
              <h2>¿Por qué “Please”?</h2>
            </div>
            <div className="s-prose">
              <p className="s-big">Hay plataformas que te piden picos. Nosotros te pedimos algo más simple: <b>por favor, entrena.</b></p>
              <p>
                El nombre nació como un guiño a las grandes apps de entrenamiento, pero la intención es genuina.
                Queremos que entrenes porque mejora tu salud, tu cabeza y tu día a día. La marca personal y la medalla
                llegan solas cuando hay constancia.
              </p>
            </div>
          </div>
        </section>

        <section id="como" className="s-section tint">
          <div className="s-container">
            <p className="s-kicker">Cómo funciona</p>
            <h2>Una semana a la vez</h2>
            <ol className="s-steps">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="s-step-n">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="s-section">
          <div className="s-container">
            <p className="s-kicker">Lo que nos hace distintos</p>
            <h2>Un club cercano,<br />con base técnica</h2>
            <div className="s-pillars">
              {PILLARS.map((p) => (
                <article key={p.title} className="s-card">
                  {p.soon && <span className="s-soon">Próximamente</span>}
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="s-section navy">
          <div className="s-container s-split">
            <div>
              <p className="s-kicker">Detrás de Training Please</p>
              <h2>No soy coach certificado.<br /><span>Soy la prueba.</span></h2>
            </div>
            <div className="s-prose">
              <p className="s-big">
                Vengo del mundo ejecutivo y del deporte, y sé que una agenda exigente y una vida activa caben en la misma semana.
              </p>
              <p>
                Training Please nace de lo que me funcionó a mí: un plan realista, constancia y alguien que te pregunta cómo te fue.
                Lo técnico se apoya en lo que funciona: progresión gradual, esfuerzo percibido y descanso, revisado semana a semana.
              </p>
              <p className="s-sign">Chris, fundador</p>
            </div>
          </div>
        </section>

        {TESTIMONIALS.length > 0 && (
          <section className="s-section">
            <div className="s-container">
              <p className="s-kicker">Desde el piloto</p>
              <h2>Lo que dicen</h2>
              <div className="s-quotes">
                {TESTIMONIALS.map((t) => (
                  <figure key={t.name} className="s-card">
                    <blockquote>“{t.quote}”</blockquote>
                    <figcaption><b>{t.name}</b> · {t.goal}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="piloto" className="s-section tint">
          <div className="s-container s-split wide">
            <div>
              <p className="s-kicker">Piloto 2026</p>
              <h2>Únete al piloto</h2>
              <p className="s-lead-dark">
                Hoy entrenan con nosotros atletas rumbo a 10K y medias maratones en Lima y Callao. Abrimos cupos limitados para
                quienes preparan una carrera.
              </p>
              <ul className="s-list">
                <li>Gratis mientras dure el piloto.</li>
                <li>Tu plan cada domingo, ajustado a tu semana.</li>
                <li>A cambio: constancia y tu opinión honesta.</li>
              </ul>
            </div>
            <PilotForm />
          </div>
        </section>

        <section id="crece" className="s-section">
          <div className="s-container">
            <details className="s-grow">
              <summary>
                <span>
                  <span className="s-kicker">Crece con nosotros</span>
                  <span className="s-grow-title">Estamos en etapa temprana. ¿Quieres ser parte?</span>
                </span>
                <span className="s-grow-plus" aria-hidden="true">+</span>
              </summary>
              <p>
                Training Please se está construyendo con atletas reales. Si te interesa acompañarnos como aliado,
                auspiciador o inversionista temprano, nos encantará conversar.
              </p>
              <InvestorForm />
            </details>
          </div>
        </section>
      </main>

      <footer className="s-footer">
        <div className="s-container s-footer-inner">
          <p className="s-brand"><Mark /><span>Training <em>Please</em></span></p>
          <p>
            <Link href="/legal">Términos y privacidad</Link> · <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> ·{' '}
            <AccountLink />
          </p>
          <p className="s-fine">© {new Date().getFullYear()} {OWNER} · Lima, Perú</p>
        </div>
      </footer>
    </div>
  );
}

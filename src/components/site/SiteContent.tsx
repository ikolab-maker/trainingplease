'use client';

import Link from 'next/link';
import { InvestorForm, NewsletterForm, PilotForm } from '@/components/site/SiteForms';
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import { useI18n } from '@/components/I18nProvider';
import { TESTIMONIALS } from '@/lib/site';

// Contenido del sitio público en el idioma del visitante (textos en src/i18n).

/** Maqueta de la app: cuenta regresiva y tarjetas de la semana, sin datos reales. */
function PhoneMock() {
  const { t } = useI18n();
  const p = t.site.phone;
  const days = p.list.map((x, i) => ({ ...x, done: i < 2 }));
  return (
    <div className="s-phone" aria-hidden="true">
      <div className="s-phone-top">
        <p className="s-phone-kicker">{p.kicker}</p>
        <p className="s-phone-count"><b>47</b> {p.days}</p>
        <p className="s-phone-race">{p.race}</p>
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
      <p className="s-phone-pct">{p.pct} <b>100%</b></p>
    </div>
  );
}

export function SiteContent() {
  const { t } = useI18n();
  const s = t.site;
  return (
    <div className="site">
      <SiteHeader home />

      <main>
        <section className="s-hero">
          <div className="s-container s-hero-grid">
            <div>
              <p className="s-pill"><span className="s-dot" /> {s.pill}</p>
              <h1>{s.h1a}<br /><span>{s.h1b}</span></h1>
              <p className="s-lede">{s.lede}</p>
              <div className="s-ctas">
                <a href="#piloto" className="s-btn primary">{s.ctaPilot}</a>
                <Link href="/entrar" className="s-btn ghost">{s.ctaHaveAccount}</Link>
              </div>
              <p className="s-fine">{s.fine}</p>
            </div>
            <PhoneMock />
          </div>
        </section>

        <section id="por-que" className="s-section">
          <div className="s-container s-split">
            <div>
              <p className="s-kicker">{s.whyKicker}</p>
              <h2>{s.whyTitle}</h2>
            </div>
            <div className="s-prose">
              <p className="s-big">{s.whyBig} <b>{s.whyBigBold}</b></p>
              <p>{s.whyText}</p>
            </div>
          </div>
        </section>

        <section id="como" className="s-section tint">
          <div className="s-container">
            <p className="s-kicker">{s.howKicker}</p>
            <h2>{s.howTitle}</h2>
            <ol className="s-steps">
              {s.steps.map((step, i) => (
                <li key={step.title}>
                  <span className="s-step-n">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="motor" className="s-section s-motor">
          <div className="s-container">
            <div className="s-split">
              <div>
                <p className="s-kicker">{s.motorKicker}</p>
                <h2>{s.motorTitleA}<br /><span>{s.motorTitleB}</span></h2>
              </div>
              <div className="s-prose">
                <p className="s-big">{s.motorBig}</p>
                <p>{s.motorText}</p>
              </div>
            </div>

            <div className="s-motor-grid">
              <div className="s-orbit" aria-hidden="true">
                <svg viewBox="0 0 400 400" className="s-orbit-svg">
                  <circle cx="200" cy="200" r="140" className="s-ring" />
                  <circle cx="200" cy="200" r="140" className="s-ring-run" />
                  <path d="M200 60 L200 140 M340 200 L260 200 M200 340 L200 260 M60 200 L140 200" className="s-spoke" />
                </svg>
                <div className="s-core"><b>{s.you}</b><small>{s.yourWeek}</small></div>
                {s.agents.map((a, i) => (
                  <span key={a.key} className={`s-node n${i}`}>{a.name}</span>
                ))}
                <span className="s-coach">{s.coachApproves}</span>
              </div>
              <div className="s-agents">
                {s.agents.map((a, i) => (
                  <article key={a.key} className="s-agent">
                    <span className={`s-agent-dot n${i}`} />
                    <div><h3>{s.agentPrefix} {a.name}</h3><p>{a.text}</p></div>
                  </article>
                ))}
              </div>
            </div>

            <ol className="s-loops">
              {s.loops.map((l) => (
                <li key={l.when}><span className="s-loop-when">↻ {l.when}</span><p>{l.text}</p></li>
              ))}
            </ol>
            <p className="s-motor-note">{s.motorNote}</p>
          </div>
        </section>

        <section className="s-section">
          <div className="s-container">
            <p className="s-kicker">{s.pillarsKicker}</p>
            <h2>{s.pillarsTitleA}<br />{s.pillarsTitleB}</h2>
            <div className="s-pillars">
              {s.pillars.map((p) => (
                <article key={p.title} className="s-card">
                  {p.soon && <span className="s-soon">{s.soon}</span>}
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
              <p className="s-kicker">{s.founderKicker}</p>
              <h2>{s.founderTitleA}<br /><span>{s.founderTitleB}</span></h2>
            </div>
            <div className="s-prose">
              <p className="s-big">{s.founderBig}</p>
              <p>{s.founderText}</p>
              <p className="s-sign">{s.founderSign}</p>
            </div>
          </div>
        </section>

        {TESTIMONIALS.length > 0 && (
          <section className="s-section">
            <div className="s-container">
              <p className="s-kicker">{s.quotesKicker}</p>
              <h2>{s.quotesTitle}</h2>
              <div className="s-quotes">
                {TESTIMONIALS.map((q) => (
                  <figure key={q.name} className="s-card">
                    <blockquote>“{q.quote}”</blockquote>
                    <figcaption><b>{q.name}</b> · {q.goal}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="piloto" className="s-section tint">
          <div className="s-container s-split wide">
            <div>
              <p className="s-kicker">{s.pilotKicker}</p>
              <h2>{s.pilotTitle}</h2>
              <p className="s-lead-dark">{s.pilotLead}</p>
              <ul className="s-list">
                {s.pilotList.map((li) => <li key={li}>{li}</li>)}
              </ul>
            </div>
            <PilotForm />
          </div>
        </section>

        <section id="boletin" className="s-section">
          <div className="s-container s-split wide">
            <div>
              <p className="s-kicker">{s.newsKicker}</p>
              <h2>{s.newsTitle}</h2>
              <p className="s-lead-dark">{s.newsLead}</p>
            </div>
            <NewsletterForm />
          </div>
        </section>

        <section id="crece" className="s-section tint">
          <div className="s-container">
            <details className="s-grow">
              <summary>
                <span>
                  <span className="s-kicker">{s.growKicker}</span>
                  <span className="s-grow-title">{s.growTitle}</span>
                </span>
                <span className="s-grow-plus" aria-hidden="true">+</span>
              </summary>
              <p>{s.growText}</p>
              <InvestorForm />
            </details>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

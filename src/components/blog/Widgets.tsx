'use client';

import { useId, useState } from 'react';
import es from '@/i18n/es';
import en from '@/i18n/en';
import type { Lang } from '@/lib/i18n';
import type { Widget } from '@/lib/markdown';

// Infografías interactivas que un post inserta con [[nombre]]. Van en el idioma del texto del post.

const words = (lang: Lang) => (lang === 'en' ? en : es).blog.widgets;

/** Color de cada nivel: del celeste suave al amarillo y al coral del esfuerzo máximo. */
const LEVEL_COLORS = ['#9fd3e6', '#8cc9dd', '#9CCBC4', '#b5d89a', '#d8e36a', '#FBE83A', '#f9c74f', '#f8961e', '#f3722c', '#e63946'];

function tipFor(level: number): number {
  return level <= 3 ? 0 : level <= 6 ? 1 : level <= 8 ? 2 : 3;
}

function RpeScale({ lang }: { lang: Lang }) {
  const w = words(lang);
  const [level, setLevel] = useState(4);
  const info = w.levels[level - 1];
  return (
    <figure className="bw bw-scale">
      <figcaption>
        <b>{w.scaleTitle}</b>
        <span>{w.scaleHint}</span>
      </figcaption>
      <div className="bw-levels" role="radiogroup" aria-label={w.scaleTitle}>
        {LEVEL_COLORS.map((c, i) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={level === i + 1}
            aria-label={`${i + 1} · ${w.levels[i].label}`}
            style={{ background: c }}
            onClick={() => setLevel(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="bw-card" aria-live="polite">
        <p className="bw-big" style={{ borderColor: LEVEL_COLORS[level - 1] }}>
          <span>{level}</span>
          <b>{info.label}</b>
        </p>
        <dl>
          <div><dt>{w.example}</dt><dd>{info.example}</dd></div>
          <div><dt>{w.talk}</dt><dd>{info.talk}</dd></div>
          <div className="bw-tip"><dt>{w.write}</dt><dd>{w.tips[tipFor(level)]}</dd></div>
        </dl>
      </div>
    </figure>
  );
}

const MAX_LOAD = 1000;

function LoadCalculator({ lang }: { lang: Lang }) {
  const w = words(lang);
  const id = useId();
  const [minutes, setMinutes] = useState(45);
  const [rpe, setRpe] = useState(6);
  const load = minutes * rpe;
  const easyRuns = Math.max(1, Math.round(load / 120));
  return (
    <figure className="bw bw-load">
      <figcaption><b>{w.loadTitle}</b></figcaption>
      <div className="bw-sliders">
        <label htmlFor={`${id}-m`}>
          <span>{w.minutes}</span><output>{minutes}</output>
          <input id={`${id}-m`} type="range" min={10} max={180} step={5} value={minutes} onChange={(e) => setMinutes(+e.target.value)} />
        </label>
        <label htmlFor={`${id}-r`}>
          <span>{w.rpe}</span><output>{rpe}</output>
          <input id={`${id}-r`} type="range" min={1} max={10} step={1} value={rpe} onChange={(e) => setRpe(+e.target.value)} />
        </label>
      </div>
      <p className="bw-formula" aria-live="polite">
        {minutes} × {rpe} = <b>{load}</b> <small>{w.load}</small>
      </p>
      <div className="bw-bar" aria-hidden="true">
        <span className="bw-fill" style={{ width: `${Math.min(100, (load / MAX_LOAD) * 100)}%`, background: LEVEL_COLORS[rpe - 1] }} />
        {w.refs.map((r) => <i key={r.value} style={{ left: `${(r.value / MAX_LOAD) * 100}%` }} />)}
      </div>
      <ul className="bw-refs">
        {w.refs.map((r) => <li key={r.value}><b>{r.value}</b> {r.label}</li>)}
      </ul>
      <p className="bw-note">{w.loadEquals(easyRuns)}</p>
    </figure>
  );
}

/** Colores de marca por momento del test: del celeste de la víspera al amarillo del test. */
const STEP_COLORS = ['#9fd3e6', '#9CCBC4', '#b5d89a', '#2F9CC4', '#FBE83A', '#9CCBC4'];

function TestSteps({ lang }: { lang: Lang }) {
  const w = words(lang);
  const [step, setStep] = useState(0);
  const info = w.steps[step];
  return (
    <figure className="bw bw-test">
      <figcaption>
        <b>{w.testTitle}</b>
        <span>{w.testHint}</span>
      </figcaption>
      <ol className="bw-cycle" aria-label={w.testHint}>
        {w.cycle.map((c, i) => (
          <li key={i} className={i === w.cycle.length - 1 ? 'is-test' : i === w.cycle.length - 2 ? 'is-light' : ''}>
            <small>{w.cycleLabel} {i + 1}</small>
            <span>{c}</span>
          </li>
        ))}
      </ol>
      <div className="bw-steps" role="tablist" aria-label={w.testTitle}>
        {w.steps.map((s, i) => (
          <button
            key={s.when}
            type="button"
            role="tab"
            aria-selected={step === i}
            style={{ borderColor: STEP_COLORS[i] }}
            onClick={() => setStep(i)}
          >
            <i style={{ background: STEP_COLORS[i] }}>{i + 1}</i>
            {s.when}
          </button>
        ))}
      </div>
      <div className="bw-card" aria-live="polite">
        <p className="bw-big" style={{ borderColor: STEP_COLORS[step] }}>
          <span>{step + 1}</span>
          <b>{info.title}</b>
        </p>
        <ul className="bw-list">
          {info.items.map((it) => <li key={it}>{it}</li>)}
        </ul>
      </div>
    </figure>
  );
}

/** Cinco ritmos, de lo suave a lo rápido; el ancho de la barra de la semana es ilustrativo. */
const PACE_COLORS = ['#9fd3e6', '#9CCBC4', '#FBE83A', '#f8961e', '#f3722c'];
const WEEK_SHARE = [78, 8, 7, 5, 2];

function Paces({ lang }: { lang: Lang }) {
  const w = words(lang);
  const [pace, setPace] = useState(0);
  const info = w.paces[pace];
  return (
    <figure className="bw bw-paces">
      <figcaption>
        <b>{w.pacesTitle}</b>
        <span>{w.pacesHint}</span>
      </figcaption>
      <div className="bw-pace-list" role="radiogroup" aria-label={w.pacesTitle}>
        {w.paces.map((p, i) => (
          <button
            key={p.name}
            type="button"
            role="radio"
            aria-checked={pace === i}
            style={{ background: PACE_COLORS[i] }}
            onClick={() => setPace(i)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="bw-card" aria-live="polite">
        <p className="bw-big" style={{ borderColor: PACE_COLORS[pace] }}>
          <span>{pace + 1}</span>
          <b>{info.name}</b>
        </p>
        <dl>
          <div><dt>{w.paceFeel}</dt><dd>{info.feel}</dd></div>
          <div><dt>{w.paceTalk}</dt><dd>{info.talk}</dd></div>
          <div className="bw-tip"><dt>{w.paceUse}</dt><dd>{info.use}</dd></div>
        </dl>
      </div>
      <p className="bw-week-label">{w.weekLabel}</p>
      <div className="bw-week" aria-hidden="true">
        {WEEK_SHARE.map((share, i) => (
          <span key={i} className={pace === i ? 'is-on' : ''} style={{ flexGrow: share, background: PACE_COLORS[i] }} />
        ))}
      </div>
      <p className="bw-note">{w.weekNote}</p>
    </figure>
  );
}

export function BlogWidget({ name, lang }: { name: Widget; lang: Lang }) {
  if (name === 'escala-rpe') return <RpeScale lang={lang} />;
  if (name === 'test-5k') return <TestSteps lang={lang} />;
  if (name === 'ritmos') return <Paces lang={lang} />;
  return <LoadCalculator lang={lang} />;
}

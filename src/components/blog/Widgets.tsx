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

export function BlogWidget({ name, lang }: { name: Widget; lang: Lang }) {
  if (name === 'escala-rpe') return <RpeScale lang={lang} />;
  return <LoadCalculator lang={lang} />;
}

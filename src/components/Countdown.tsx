'use client';

import { useEffect, useState } from 'react';

function remaining(now: Date, target: Date) {
  if (target <= now) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  // Meses completos y luego el resto, como en el diseño original.
  let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  const addMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
  if (addMonths(now, months) > target) months--;
  let rest = Math.floor((target.getTime() - addMonths(now, months).getTime()) / 1000);
  const days = Math.floor(rest / 86400); rest -= days * 86400;
  const hours = Math.floor(rest / 3600); rest -= hours * 3600;
  const minutes = Math.floor(rest / 60);
  return { months, days, hours, minutes, seconds: rest - minutes * 60 };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Cuenta regresiva a la carrera (hora de Lima, 6:00 por defecto). */
export function Countdown({ date, label }: { date: string; label: string }) {
  const target = new Date(`${date}T06:00:00-05:00`);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const r = now ? remaining(now, target) : null;
  const cells: [string, number | undefined][] = [
    ['Meses', r?.months], ['Días', r?.days], ['Horas', r?.hours], ['Min', r?.minutes], ['Seg', r?.seconds],
  ];
  return (
    <div className="countdown" role="timer" aria-label={`Cuenta regresiva a ${label}`}>
      {cells.map(([l, v]) => (
        <div className="cd-cell" key={l}>
          <span className="cd-num">{v === undefined ? '00' : pad(v)}</span>
          <span className="cd-label">{l}</span>
        </div>
      ))}
    </div>
  );
}

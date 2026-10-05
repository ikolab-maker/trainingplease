'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gate } from '@/components/Gate';
import { useAuth } from '@/components/AuthProvider';
import { grantConsent, type OptionalPurposes } from '@/lib/consent';
import { OPTIONAL_CHECKS, REQUIRED_CHECKS } from '@/lib/legal';

export default function BienvenidaPage() {
  return <Gate role="athlete" allowNoConsent>{({ user, profile }) => <Consent uid={user.uid} name={profile.name} renewing={!!profile.consent} />}</Gate>;
}

function Consent({ uid, name, renewing }: { uid: string; name: string; renewing: boolean }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [req, setReq] = useState<Record<string, boolean>>({});
  const [opt, setOpt] = useState<OptionalPurposes>({ ai: false, marketing: false, stats: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const allRequired = REQUIRED_CHECKS.every((c) => req[c.key]);

  async function accept() {
    setSaving(true);
    setError('');
    try {
      await grantConsent(uid, opt);
      router.replace(renewing ? '/plan' : '/ajustes?primera=1');
    } catch {
      setError('No se pudo guardar. Inténtalo otra vez.');
      setSaving(false);
    }
  }

  return (
    <main>
      <header className="banner">
        <h2>Antes de empezar</h2>
        <p>Hola {name.split(' ')[0]}{renewing ? ', actualizamos los términos' : ''}</p>
      </header>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <p className="section-sub">
          Training Please te da planes de entrenamiento y un espacio para registrar tu progreso. Antes de usarla, confirma lo siguiente.
          Puedes leer el <Link href="/legal" target="_blank">Aviso de responsabilidad, los Términos y la Política de Datos</Link> completos.
        </p>

        <div className="form">
          {REQUIRED_CHECKS.map((c) => (
            <label className="check" key={c.key}>
              <input type="checkbox" checked={!!req[c.key]} onChange={(e) => setReq({ ...req, [c.key]: e.target.checked })} />
              <span>{c.text}</span>
            </label>
          ))}

          <h3 className="section-title" style={{ fontSize: '1.8rem' }}>Opcional</h3>
          {OPTIONAL_CHECKS.map((c) => (
            <label className="check" key={c.key}>
              <input type="checkbox" checked={opt[c.key]} onChange={(e) => setOpt({ ...opt, [c.key]: e.target.checked })} />
              <span>{c.text}</span>
            </label>
          ))}

          <p className="note">
            Si no aceptas, no podrás usar la aplicación. La autorización de datos es obligatoria porque sin tus datos de salud y entrenamiento no
            podemos personalizar tu plan. Puedes revocarla cuando quieras desde Ajustes &gt; Privacidad.
          </p>
          {error && <p className="alert error">{error}</p>}
          <div className="actions">
            <button type="button" className="btn" disabled={!allRequired || saving} onClick={accept}>
              {saving ? 'Guardando…' : 'Aceptar y continuar'}
            </button>
            <button type="button" className="btn secondary" onClick={() => signOut()}>Salir</button>
          </div>
        </div>
      </div>
    </main>
  );
}

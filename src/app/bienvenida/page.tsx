'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gate } from '@/components/Gate';
import { useAuth } from '@/components/AuthProvider';
import { LangSwitch, useI18n } from '@/components/I18nProvider';
import { grantConsent, type OptionalPurposes } from '@/lib/consent';
import { legalText } from '@/lib/legalText';

export default function BienvenidaPage() {
  return <Gate role="athlete" allowNoConsent>{({ user, profile }) => <Consent uid={user.uid} name={profile.name} renewing={!!profile.consent} />}</Gate>;
}

function Consent({ uid, name, renewing }: { uid: string; name: string; renewing: boolean }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t, lang } = useI18n();
  const { required, optional } = legalText(lang);
  const [req, setReq] = useState<Record<string, boolean>>({});
  const [opt, setOpt] = useState<OptionalPurposes>({ ai: false, marketing: false, stats: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const allRequired = required.every((c) => req[c.key]);

  async function accept() {
    setSaving(true);
    setError('');
    try {
      await grantConsent(uid, opt, lang);
      router.replace(renewing ? '/plan' : '/ajustes?primera=1');
    } catch {
      setError(t.common.saveErrorRetry);
      setSaving(false);
    }
  }

  return (
    <main>
      <header className="banner">
        <h2>{t.consent.title}</h2>
        <p>{t.consent.hello(name.split(' ')[0], renewing)}</p>
      </header>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <p style={{ textAlign: 'right' }}><LangSwitch /></p>
        <p className="section-sub">
          {t.consent.intro} <Link href="/legal" target="_blank">{t.consent.introLink}</Link> {t.consent.introEnd}
        </p>

        <div className="form">
          {required.map((c) => (
            <label className="check" key={c.key}>
              <input type="checkbox" checked={!!req[c.key]} onChange={(e) => setReq({ ...req, [c.key]: e.target.checked })} />
              <span>{c.text}</span>
            </label>
          ))}

          <h3 className="section-title" style={{ fontSize: '1.8rem' }}>{t.consent.optional}</h3>
          {optional.map((c) => (
            <label className="check" key={c.key}>
              <input type="checkbox" checked={opt[c.key]} onChange={(e) => setOpt({ ...opt, [c.key]: e.target.checked })} />
              <span>{c.text}</span>
            </label>
          ))}

          <p className="note">{t.consent.note}</p>
          {error && <p className="alert error">{error}</p>}
          <div className="actions">
            <button type="button" className="btn" disabled={!allRequired || saving} onClick={accept}>
              {saving ? t.common.saving : t.consent.accept}
            </button>
            <button type="button" className="btn secondary" onClick={() => signOut()}>{t.nav.signOut}</button>
          </div>
        </div>
      </div>
    </main>
  );
}

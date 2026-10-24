'use client';

import { Gate } from '@/components/Gate';
import { TopNav } from '@/components/TopNav';
import { WeekView } from '@/components/WeekView';
import { useI18n } from '@/components/I18nProvider';

export default function PlanPage() {
  const { t } = useI18n();
  return (
    <Gate role="athlete">
      {({ user, profile }) => (
        <>
          <TopNav />
          <main><WeekView uid={user.uid} profile={profile} /></main>
          <footer className="footer">
            <p>Training Please</p>
            <p className="footer-small">{t.week.footerSafety}</p>
          </footer>
        </>
      )}
    </Gate>
  );
}

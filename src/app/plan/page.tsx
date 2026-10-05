'use client';

import { Gate } from '@/components/Gate';
import { TopNav } from '@/components/TopNav';
import { WeekView } from '@/components/WeekView';

export default function PlanPage() {
  return (
    <Gate role="athlete">
      {({ user, profile }) => (
        <>
          <TopNav />
          <main><WeekView uid={user.uid} profile={profile} /></main>
          <footer className="footer">
            <p>Training Please</p>
            <p className="footer-small">Si algún dolor pasa de 3 sobre 10 o te cambia la forma de pisar, corta la sesión y avísale a tu coach.</p>
          </footer>
        </>
      )}
    </Gate>
  );
}

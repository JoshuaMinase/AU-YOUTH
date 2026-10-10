'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { I } from '@/components/portal/ui';
import { MeProvider, useMe } from '@/lib/me';
import { deptTone } from '@/lib/data';
import { useReveal, useSwipeTabs } from '@/lib/hooks';
import { useChats } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

type NavItem = { href: string; label: string; short?: string; icon: JSX.Element };
const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: I.home },
  { href: '/dashboard/news', label: 'News', icon: I.news },
  { href: '/dashboard/opportunities', label: 'Opportunities', short: 'Opps', icon: I.book },
  { href: '/dashboard/people', label: 'People', icon: I.people },
  { href: '/dashboard/calendar', label: 'Calendar', icon: I.calendar },
  { href: '/dashboard/get-help', label: 'Get Help', icon: I.help },
];
const ADMIN_NAV: NavItem = { href: '/dashboard/admin', label: 'Admin', icon: I.shield };

function Shell({ children }: { children: React.ReactNode }) {
  const { me, ready, complete, canWrite, missing } = useMe();
  const pathname = usePathname();
  const router = useRouter();
  const main = useRef<HTMLElement>(null);
  const { unread } = useChats();
  /* admins and the super admin get an extra Admin tab */
  /* each department gets a slightly different calm tone (lib/data.ts deptTone) */
  const tone = useMemo(() => deptTone(me.dept), [me.dept]);
  const nav = useMemo(() => (me.access === 'user' ? NAV : [...NAV, ADMIN_NAV]), [me.access]);
  const tabs = useMemo(() => nav.map((n) => n.href), [nav]);
  useReveal(main, [pathname]);
  useSwipeTabs(main, tabs, pathname, (href) => router.push(href));

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  const active = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));

  return (
    <div className={s.shell} style={{
      '--p-bg': tone.bg, '--p-soft': tone.soft, '--p-accent': tone.accent, '--p-accent-lt': tone.accentLt,
      background: `radial-gradient(1100px 520px at 12% 0%, ${tone.glow}, transparent 70%), ${tone.bg}`,
    } as React.CSSProperties}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link href="/dashboard" className={s.brand} aria-label="AU Youth Community — dashboard home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.svg" alt="" className={s.brandLogo} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/wordmark.svg" alt="" className={s.brandWm} />
          </Link>

          <nav className={s.nav} aria-label="Portal">
            {nav.map(({ href, label, icon }) => (
              <Link key={href} href={href} className={s.navLink} aria-current={active(href) ? 'page' : undefined}>
                {icon}<span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className={s.hdrRight}>
            <Link href="/dashboard/chats" className={s.chatsBtn} aria-label={`Chats${unread ? `, ${unread} unread` : ''}`}
              aria-current={active('/dashboard/chats') ? 'page' : undefined}>
              {I.chat}<span>Chats</span>
              {unread > 0 && <span className={s.badge}>{unread}</span>}
            </Link>
            <Link href="/dashboard/profile" className={s.avatar} aria-label="Your profile"
              aria-current={active('/dashboard/profile') ? 'page' : undefined}>
              {me.initials}
            </Link>
            <button type="button" className={s.chatsBtn} onClick={signOut}>
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main ref={main} className={s.main} key={pathname}>
        {/* incomplete profile = view-only (also enforced in the database, docs/sql/022_profile_gate.sql) */}
        {ready && !complete && pathname !== '/dashboard/profile' && (
          <section className={`${s.card} ${s.completion}`} role="status">
            <div>
              <p className={s.cardEyebrow}>{canWrite ? 'Reminder' : 'View only for now'}</p>
              <h2 className={s.cardTitle} style={{ marginBottom: 6 }}>{canWrite ? 'Please finish your profile' : 'Complete your profile to unlock everything'}</h2>
              <p className={s.cardMeta}>
                {canWrite
                  ? `Members can see your profile. Still needed: ${missing.join(', ')}.`
                  : `You can read the news, but chatting, the calendar, connections and comments unlock once you add ${missing.join(', ')}.`}
              </p>
            </div>
            <Link href="/dashboard/profile" className={s.btnDark}>Complete profile</Link>
          </section>
        )}
        {children}
      </main>

      <nav className={s.tabbar} aria-label="Portal (mobile)">
        {nav.map(({ href, label, short, icon }) => (
          <Link key={href} href={href} aria-label={label} aria-current={active(href) ? 'page' : undefined}>{icon}{short ?? label}</Link>
        ))}
      </nav>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MeProvider>
      <Shell>{children}</Shell>
    </MeProvider>
  );
}

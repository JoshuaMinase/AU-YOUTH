'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { I } from '@/components/portal/ui';
import { ME } from '@/lib/data';
import { useReveal } from '@/lib/hooks';
import { useChats } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: I.home },
  { href: '/dashboard/news', label: 'News', icon: I.news },
  { href: '/dashboard/people', label: 'People', icon: I.people },
  { href: '/dashboard/calendar', label: 'Calendar', icon: I.calendar },
  { href: '/dashboard/get-help', label: 'Get Help', icon: I.help },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const main = useRef<HTMLElement>(null);
  const { unread } = useChats();
  useReveal(main, [pathname]);

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  const active = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link href="/" className={s.brand} aria-label="AU Youth Community — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.svg" alt="" className={s.brandLogo} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/wordmark.svg" alt="" className={s.brandWm} />
          </Link>

          <nav className={s.nav} aria-label="Portal">
            {NAV.map(({ href, label, icon }) => (
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
              {ME.initials}
            </Link>
            <button type="button" className={s.chatsBtn} onClick={signOut}>
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main ref={main} className={s.main} key={pathname}>
        {children}
      </main>

      <nav className={s.tabbar} aria-label="Portal (mobile)">
        {NAV.map(({ href, label, icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}>{icon}{label}</Link>
        ))}
      </nav>
    </div>
  );
}

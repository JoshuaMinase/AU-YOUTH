'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { I } from '@/components/portal/ui';
import NotificationBell from '@/components/portal/NotificationBell';
import BottomSheet from '@/components/portal/BottomSheet';
import { MeProvider, useMe } from '@/lib/me';
import { deptTone } from '@/lib/data';
import { useReveal, useSwipeTabs } from '@/lib/hooks';
import { ChatsProvider, NotificationsProvider, useChats } from '@/lib/portal';
import { LEGAL_LINKS } from '@/lib/legal';
import CookieSettingsButton from '@/components/CookieSettingsButton';
import s from '@/styles/Portal.module.css';

type NavItem = { href: string; label: string; icon: JSX.Element; also?: string[] };
const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: I.home },
  { href: '/dashboard/news', label: 'News', icon: I.news },
  { href: '/dashboard/opportunities', label: 'Opportunities', icon: I.book },
  { href: '/dashboard/people', label: 'People', icon: I.people },
  { href: '/dashboard/calendar', label: 'Calendar', icon: I.calendar },
  { href: '/dashboard/get-help', label: 'Get Help', icon: I.help },
];
const ADMIN_NAV: NavItem = { href: '/dashboard/admin', label: 'Admin', icon: I.shield };
const HELP_NAV = NAV.find((n) => n.href === '/dashboard/get-help')!;
const PROFILE_NAV: NavItem = { href: '/dashboard/profile', label: 'My Profile', icon: I.user };
/* phone tab bar: News also covers Opportunities (toggle at the top of both pages); the rest lives under More */
const byHref = (h: string) => NAV.find((n) => n.href === h)!;
const TABS: NavItem[] = [
  byHref('/dashboard'),
  { ...byHref('/dashboard/news'), also: ['/dashboard/opportunities'] },
  byHref('/dashboard/people'),
  byHref('/dashboard/calendar'),
];

function Shell({ children }: { children: React.ReactNode }) {
  const { me, ready, complete, canWrite, missing } = useMe();
  const { unread: unreadChats } = useChats();
  const pathname = usePathname();
  const router = useRouter();
  const main = useRef<HTMLElement>(null);
  /* admins and the super admin get an extra Admin tab */
  /* each department gets a slightly different calm tone (lib/data.ts deptTone) */
  const tone = useMemo(() => deptTone(me.dept), [me.dept]);
  const nav = useMemo(() => (me.access === 'user' ? NAV : [...NAV, ADMIN_NAV]), [me.access]);
  const tabs = useMemo(() => nav.map((n) => n.href), [nav]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  /* More = Get Help, Admin (admins only), My Profile, Log out */
  const moreItems = useMemo(() => [HELP_NAV, ...(me.access === 'user' ? [] : [ADMIN_NAV]), PROFILE_NAV], [me.access]);
  useReveal(main, [pathname]);
  useSwipeTabs(main, tabs, pathname, (href) => router.push(href));

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  const active = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));
  const moreActive = moreItems.some((n) => active(n.href));

  const item = (n: NavItem, close: () => void) => (
    <Link key={n.href} href={n.href} className={s.sheetItem} aria-current={active(n.href) ? 'page' : undefined} onClick={close}>
      {n.icon}<span>{n.label}</span>
    </Link>
  );
  const logout = (close: () => void) => (
    <button type="button" className={s.sheetItem} onClick={() => { close(); void signOut(); }}>
      {I.logout}<span>Log out</span>
    </button>
  );

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
            <Link href="/dashboard/chats" className={s.chatsBtn} aria-current={active('/dashboard/chats') ? 'page' : undefined}
              aria-label={`Chats${unreadChats ? `, ${unreadChats} unread` : ''}`}>
              {I.chat}<span className={s.chatsBtnLabel}>Chats</span>
              {unreadChats > 0 && <span className={s.redBubble} aria-hidden="true">{unreadChats > 99 ? '99+' : unreadChats}</span>}
            </Link>
            <NotificationBell />
            {/* desktop: the avatar opens the profile and Log out sits beside it; phone: the avatar opens a sheet instead */}
            <Link href="/dashboard/profile" className={`${s.avatar} ${s.avatarDesk}`} aria-label="Your profile"
              aria-current={active('/dashboard/profile') ? 'page' : undefined}>
              {me.initials}
            </Link>
            <button type="button" className={`${s.avatar} ${s.avatarMob}`} aria-label="Account menu" aria-haspopup="dialog"
              aria-expanded={acctOpen} aria-controls="account-sheet" onClick={() => setAcctOpen(true)}>
              {me.initials}
            </button>
            <button type="button" className={`${s.chatsBtn} ${s.logoutBtn}`} onClick={signOut}>
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
        <nav className={s.legalLinks} aria-label="Legal">
          {LEGAL_LINKS.map(([t, h]) => <Link key={h} href={h}>{t}</Link>)}
          <CookieSettingsButton className={s.legalLinkBtn} />
        </nav>
      </main>

      <nav className={s.tabbar} aria-label="Portal (mobile)">
        {TABS.map(({ href, label, icon, also }) => (
          <Link key={href} href={href} aria-label={label}
            aria-current={[href, ...(also ?? [])].some(active) ? 'page' : undefined}>{icon}<span>{label}</span></Link>
        ))}
        <button type="button" aria-label="More" aria-haspopup="dialog" aria-expanded={moreOpen} aria-controls="more-sheet"
          aria-current={moreActive ? 'page' : undefined} onClick={() => setMoreOpen(true)}>{I.moreH}<span>More</span></button>
      </nav>

      <BottomSheet id="more-sheet" title="More" open={moreOpen} onClose={() => setMoreOpen(false)}>
        {(close) => (
          <div className={s.sheetList}>
            {moreItems.map((n) => item(n, close))}
            <div className={s.sheetSep} role="separator" />
            {logout(close)}
          </div>
        )}
      </BottomSheet>

      <BottomSheet id="account-sheet" title={me.name} open={acctOpen} onClose={() => setAcctOpen(false)}>
        {(close) => (
          <div className={s.sheetList}>
            {item(PROFILE_NAV, close)}
            {item(HELP_NAV, close)}
            <div className={s.sheetSep} role="separator" />
            {logout(close)}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MeProvider>
      <ChatsProvider>
        <NotificationsProvider>
          <Shell>{children}</Shell>
        </NotificationsProvider>
      </ChatsProvider>
    </MeProvider>
  );
}

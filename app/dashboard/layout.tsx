'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from '@/styles/Dashboard.module.css';

const NAV = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg className={s.navIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 8.5L10 3l7 5.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V8.5z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 18v-7h6v7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/news',
    label: 'News',
    icon: (
      <svg className={s.navIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="4" width="14" height="13" rx="2" strokeLinecap="round"/>
        <path d="M7 8h6M7 11h4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/people',
    label: 'People',
    icon: (
      <svg className={s.navIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="8" cy="7" r="3" strokeLinecap="round"/>
        <path d="M2 17c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/>
        <circle cx="15" cy="7" r="2.5" strokeLinecap="round"/>
        <path d="M18 17c0-2.5-1.5-4.5-3.5-5.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/calendar',
    label: 'Calendar',
    icon: (
      <svg className={s.navIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="5" width="14" height="12" rx="2" strokeLinecap="round"/>
        <path d="M7 3v3M13 3v3M3 9h14" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/chats',
    label: 'Chats',
    icon: (
      <svg className={s.navIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 4h12a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V5a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badge: 3,
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: (
      <svg className={s.navIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="10" cy="7" r="3.5" strokeLinecap="round"/>
        <path d="M3 17c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Home',
  '/dashboard/news': 'News',
  '/dashboard/people': 'People',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/chats': 'Chats',
  '/dashboard/profile': 'Profile',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={s.shell}>
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className={s.sidebar}>
        <Link href="/dashboard" className={s.sidebarBrand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.svg" alt="AU Youth" className={s.sidebarLogo} />
          <span className={s.sidebarBrandName}>AU Youth<br/>Network</span>
        </Link>

        <nav className={s.sidebarNav}>
          {NAV.map(({ href, label, icon, badge }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`${s.navItem} ${active ? s.navItemActive : ''}`}
              >
                {icon}
                {label}
                {badge && <span className={s.navBadge}>{badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={s.sidebarFooter}>
          <Link href="/dashboard/profile" className={s.profileMini}>
            <div className={s.profileAvatar}>YD</div>
            <div className={s.profileMiniInfo}>
              <div className={s.profileMiniName}>Yididiya D.</div>
              <div className={s.profileMiniRole}>Intern · HRST</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────── */}
      <div className={s.main}>
        <header className={s.topbar}>
          <span className={s.topbarTitle}>{PAGE_TITLES[pathname] ?? 'Dashboard'}</span>
          <div className={s.topbarActions}>
            {/* Notifications */}
            <button className={s.topbarIconBtn} aria-label="Notifications">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 16a2 2 0 004 0" strokeLinecap="round"/>
              </svg>
              <span className={s.topbarBadge} />
            </button>
            {/* Quick chat */}
            <button className={s.topbarIconBtn} aria-label="Quick chat">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M4 4h12a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V5a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </header>

        <main className={s.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

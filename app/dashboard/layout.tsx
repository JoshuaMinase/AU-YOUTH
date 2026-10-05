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
    href: '/dashboard/get-help',
    label: 'Get Help',
    icon: (
      <svg className={s.navIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="10" cy="10" r="7" strokeLinecap="round"/>
        <path d="M10 11v-1a2 2 0 10-2-2" strokeLinecap="round"/>
        <circle cx="10" cy="14" r="0.5" fill="currentColor"/>
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={s.shell}>
      {/* ── Sidebar ──────────────────────────── */}
      <aside className={s.sidebar}>
        <Link href="/" className={s.sidebarBrand}>
          <div className={s.sidebarLogoMark}>AU</div>
          <div className={s.sidebarBrandText}>
            <span className={s.sidebarBrandPrimary}>AU Youth Network</span>
            <span className={s.sidebarBrandSub}>Intern Platform</span>
          </div>
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
            <div className={s.profileAvatarInitials}>YD</div>
            <div>
              <div className={s.profileMiniName}>Yididiya D.</div>
              <div className={s.profileMiniRole}>Intern · HRST</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────── */}
      <div className={s.main}>
        {/* Topbar — matches concept: right-aligned YD avatar + notification badge 4 */}
        <header className={s.topbar}>
          <div className={s.topbarRight}>
            <button className={s.notifBtn} aria-label="Notifications">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M10 2a6 6 0 00-6 6v3L2.5 14.5h15L16 11V8a6 6 0 00-6-6z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 16.5a2 2 0 004 0" strokeLinecap="round"/>
              </svg>
              <span className={s.notifCount}>4</span>
            </button>
            <Link href="/dashboard/profile">
              <button className={s.avatarBtn} aria-label="Profile">YD</button>
            </Link>
          </div>
        </header>

        <main className={s.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

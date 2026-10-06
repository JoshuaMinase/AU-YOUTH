'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from '@/styles/Dashboard.module.css';

const NAV = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/news',
    label: 'News',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2"/>
        <line x1="8" y1="9" x2="16" y2="9"/>
        <line x1="8" y1="13" x2="14" y2="13"/>
        <line x1="8" y1="17" x2="12" y2="17"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/people',
    label: 'People',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="7" r="4"/>
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        <path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/calendar',
    label: 'Calendar',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/get-help',
    label: 'Get Help',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={s.shell}>
      {/* ── Header ──────────────────────────────────── */}
      <header className={s.hdr}>
        {/* Brand */}
        <Link href="/" className={s.brand} aria-label="AU Youth Community home">
          {/* Globe logo placeholder — matches the HTML brand image */}
          <div className={s.brandLogo} aria-hidden="true">
            <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="24" stroke="#c9a63e" strokeWidth="1.8"/>
              <ellipse cx="26" cy="26" rx="10" ry="24" stroke="#c9a63e" strokeWidth="1.4"/>
              <line x1="2" y1="26" x2="50" y2="26" stroke="#c9a63e" strokeWidth="1.4"/>
              <line x1="4.5" y1="16" x2="47.5" y2="16" stroke="#c9a63e" strokeWidth="1.2"/>
              <line x1="4.5" y1="36" x2="47.5" y2="36" stroke="#c9a63e" strokeWidth="1.2"/>
            </svg>
          </div>
          <div className={s.brandText}>
            <b>AU YOUTH</b>
            <b>COMMUNITY</b>
          </div>
        </Link>

        {/* Centred nav — matches HTML: position:absolute; left:50%; transform:translateX(-50%) */}
        <nav className={s.nav} aria-label="Main navigation">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`${s.navLink} ${active ? s.navLinkOn : ''}`}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right: chats + avatar */}
        <div className={s.hdrRight}>
          <Link href="/dashboard/chats" className={s.chatsBtn} aria-label="Open chats, 3 unread">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chats
            <span className={s.badge}>3</span>
          </Link>
          <Link href="/dashboard/profile" className={s.avatar} aria-label="Open profile">
            YD
          </Link>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────── */}
      <main className={s.mainWrap}>
        {children}
      </main>
    </div>
  );
}

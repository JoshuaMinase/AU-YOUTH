import s from '@/styles/Dashboard.module.css';

const HELP_CARDS = [
  {
    title: 'Contact a department',
    sub: 'Send a direct message to an AU department or office.',
    accent: 'gold',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    title: 'Report an issue',
    sub: 'Let us know about a technical problem or platform concern.',
    accent: 'red',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    title: 'Intern handbook',
    sub: 'Access the AU intern guide, policies and code of conduct.',
    accent: 'green',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    title: 'FAQs',
    sub: 'Browse frequently asked questions from the intern community.',
    accent: 'blue',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
];

const DEPTS = [
  { name: 'Human Resources, Science & Technology', abbr: 'HRST',  email: 'hrst@au.int'  },
  { name: 'Political Affairs & Peace',             abbr: 'PAPS',  email: 'paps@au.int'  },
  { name: 'Economic Affairs',                      abbr: 'EA',    email: 'ea@au.int'    },
  { name: 'Social Affairs',                        abbr: 'SA',    email: 'sa@au.int'    },
  { name: 'Infrastructure & Energy',               abbr: 'IE',    email: 'ie@au.int'    },
];

const ACCENT_CLASS: Record<string, string> = {
  gold:  s.helpIconGold,
  red:   s.helpIconRed,
  green: s.helpIconGreen,
  blue:  s.helpIconBlue,
};

export default function GetHelpPage() {
  return (
    <>
      {/* ── Page header ────────────────────────────── */}
      <div className={s.pageHero}>
        <div>
          <p className={s.pageEyebrow}>SUPPORT</p>
          <h1 className={s.pageHeading}>Get Help</h1>
          <p className={s.pageDesc}>
            Find support, contact departments and access intern resources.
          </p>
        </div>
      </div>

      {/* ── Quick-action cards ─────────────────────── */}
      <div className={s.helpGrid}>
        {HELP_CARDS.map(h => (
          <button key={h.title} className={s.helpCard}>
            <div className={`${s.helpCardIcon} ${ACCENT_CLASS[h.accent]}`}>
              {h.icon}
            </div>
            <p className={s.helpCardTitle}>{h.title}</p>
            <p className={s.helpCardSub}>{h.sub}</p>
            <span className={s.helpCardArrow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </span>
          </button>
        ))}
      </div>

      {/* ── Department contacts ────────────────────── */}
      <div className={s.connectionsCard}>
        <div className={s.cardHead}>
          <div>
            <p className={s.cardEyebrow}>DIRECTORY</p>
            <h3 className={s.cardTitle}>Department Contacts</h3>
          </div>
        </div>

        <div className={s.deptList}>
          {DEPTS.map(d => (
            <div key={d.name} className={s.deptRow}>
              <div className={s.deptAbbr}>{d.abbr}</div>
              <div className={s.deptInfo}>
                <p className={s.deptName}>{d.name}</p>
                <p className={s.deptEmail}>{d.email}</p>
              </div>
              <button className={s.btnPrimary}>Contact</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Emergency / welfare contact ────────────── */}
      <div className={s.welfareCard}>
        <div className={s.welfareIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </div>
        <div className={s.welfareBody}>
          <p className={s.welfareName}>Welfare &amp; Wellbeing</p>
          <p className={s.welfareSub}>Confidential support for interns — available Mon–Fri, 09:00–17:00.</p>
        </div>
        <button className={s.btnSecondary}>welfare@au.int</button>
      </div>
    </>
  );
}

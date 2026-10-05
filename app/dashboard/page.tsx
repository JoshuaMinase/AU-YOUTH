import s from '@/styles/Dashboard.module.css';
import Link from 'next/link';

/* ── Calendar ─────────────────────────────────────────────── */
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const OFFSET = 1; // Sept 2026 starts Tuesday
const TOTAL = 30;
const TODAY = 8;
const EVENT_DAYS = [7, 9, 11];

function MiniCalendar() {
  const cells: (number | null)[] = [
    ...Array(OFFSET).fill(null),
    ...Array.from({ length: TOTAL }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={s.calGrid}>
      {DAYS.map(d => <div key={d} className={s.calHead}>{d}</div>)}
      {cells.map((day, i) => (
        <div
          key={i}
          className={[
            s.calDay,
            !day ? s.calDayEmpty : '',
            day === TODAY ? s.calDayToday : '',
            day && EVENT_DAYS.includes(day) && day !== TODAY ? s.calDayHasEvent : '',
          ].filter(Boolean).join(' ')}
        >
          {day ?? ''}
        </div>
      ))}
    </div>
  );
}

/* ── Announcements ───────────────────────────────────────── */
const ITEMS = [
  { day: '07', month: 'SEP', tag: 'meeting',  title: 'Weekly Intern Coordination',  meta: '10:00 Mandela Hall' },
  { day: '09', month: 'SEP', tag: 'event',    title: 'Youth Innovation Exchange',   meta: '14:00 Online' },
  { day: '11', month: 'SEP', tag: 'workshop', title: 'Skills Development Workshop', meta: '09:30 Nyerere Room' },
];

export default function DashboardHome() {
  return (
    <>
      {/* ── Profile completion banner ────────────── */}
      <div className={s.completionBanner}>
        <div className={s.completionLeft}>
          <p className={s.completionPct}>65%</p>
          <p className={s.completionTitle}>Complete your profile</p>
          <p className={s.completionSub}>
            Add the remaining required details so other interns can find and trust your profile.
          </p>
          <div className={s.progressBar}>
            <div className={s.progressFill} style={{ width: '65%' }} />
          </div>
        </div>
        <Link href="/dashboard/profile">
          <button className={s.completionBtn}>Finish profile</button>
        </Link>
      </div>

      {/* ── Greeting ────────────────────────────────── */}
      <div className={s.greetingSection}>
        <p className={s.greetingDate}>TUESDAY, 8 SEPTEMBER</p>
        <h1 className={s.greetingHeading}>Good morning, Yididiya.</h1>
        <p className={s.greetingSub}>
          Here is what is happening across your AU intern community.
        </p>
        <Link href="/dashboard/calendar" className={s.calendarBtn}>
          Open calendar
        </Link>
      </div>

      {/* ── Two column: Calendar + Announcements ─── */}
      <div className={s.homeGrid}>
        {/* Calendar widget */}
        <div className={s.calWidget}>
          <p className={s.sectionLabel}>SEPTEMBER 2026</p>
          <div className={s.calWidgetHeader}>
            <h2 className={s.calWidgetTitle}>Your calendar</h2>
            <Link href="/dashboard/calendar" className={s.calWidgetLink}>Full calendar →</Link>
          </div>
          <MiniCalendar />
          <div className={s.calEvents}>
            <div className={s.calEventRow}>
              <span className={s.calEventTime}>10:00</span>
              <span className={s.calEventTitle}>Weekly Intern Coordination</span>
            </div>
            <div className={s.calEventRow}>
              <span className={s.calEventTime}>14:00</span>
              <span className={s.calEventTitle}>Youth Innovation Exchange</span>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div>
          <p className={s.sectionLabel}>ANNOUNCEMENTS</p>
          <div className={s.announcements}>
            <div className={s.announcementsHeader}>
              <h2 className={s.announcementsTitle}>Coming up</h2>
              <span className={s.newBadge}>3 new</span>
            </div>
            {ITEMS.map(item => (
              <div key={item.day} className={s.announcementItem}>
                <div className={s.announceDateBlock}>
                  <span className={s.announceDay}>{item.day}</span>
                  <span className={s.announceMonth}>{item.month}</span>
                </div>
                <div className={s.announceBody}>
                  <span className={s.announceTag}>{item.tag}</span>
                  <p className={s.announceTitle}>{item.title}</p>
                  <span className={s.announceMeta}>{item.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick chat FAB ──────────────────────── */}
      <Link href="/dashboard/chats" className={s.fab}>
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 4h12a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V5a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Quick chat
      </Link>
    </>
  );
}

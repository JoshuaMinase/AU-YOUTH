import s from '@/styles/Dashboard.module.css';
import Link from 'next/link';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// September 2026 starts on Tuesday (offset 1)
const OFFSET = 1;
const DAYS_IN_MONTH = 30;
const TODAY = 8; // "Tuesday 8 September" from concept site
const EVENTS = [7, 9, 11]; // days with events

function CalGrid() {
  const cells: (number | null)[] = [
    ...Array(OFFSET).fill(null),
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
  ];
  // Pad to complete last week
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={s.calGrid}>
      {DAYS.map(d => <div key={d} className={s.calDayHead}>{d}</div>)}
      {cells.map((day, i) => (
        <div
          key={i}
          className={[
            s.calDay,
            day === TODAY ? s.calDayToday : '',
            day && EVENTS.includes(day) && day !== TODAY ? s.calDayEvent : '',
          ].join(' ')}
        >
          {day ?? ''}
        </div>
      ))}
    </div>
  );
}

const ANNOUNCEMENTS = [
  { day: '07', month: 'SEP', tag: 'Meeting', title: 'Weekly Intern Coordination', meta: '10:00 · Mandela Hall' },
  { day: '09', month: 'SEP', tag: 'Event', title: 'Youth Innovation Exchange', meta: '14:00 · Online' },
  { day: '11', month: 'SEP', tag: 'Workshop', title: 'Skills Development Workshop', meta: '09:30 · Nyerere Room' },
];

export default function DashboardHome() {
  return (
    <>
      {/* Profile completion banner */}
      <div className={s.completionBanner}>
        <div className={s.completionText}>
          <p className={s.completionTitle}>Complete your profile</p>
          <p className={s.completionSub}>
            Add the remaining details so other interns can find and trust your profile.
          </p>
          <div className={s.progressTrack}>
            <div className={s.progressFill} style={{ width: '65%' }} />
          </div>
        </div>
        <Link href="/dashboard/profile">
          <button className={s.completionBtn}>Finish profile</button>
        </Link>
      </div>

      {/* Greeting */}
      <div className={s.greeting}>
        <p className={s.greetingLabel}>Tuesday, 8 September</p>
        <h1 className={s.greetingTitle}>Good morning, Yididiya.</h1>
        <p style={{ margin: '8px 0 0', fontSize: 15, color: 'rgba(3,34,16,0.5)', lineHeight: 1.6 }}>
          Here is what is happening across your AU intern community.
        </p>
      </div>

      {/* Two-column: Calendar + Announcements */}
      <div className={s.grid2}>
        {/* Calendar */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Your Calendar · Sept 2026</span>
            <Link href="/dashboard/calendar" className={s.cardLink}>Full calendar →</Link>
          </div>
          <CalGrid />

          {/* Upcoming events */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: '#f8f9fb', borderRadius: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(3,34,16,0.4)', width: 40 }}>10:00</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#032210' }}>Weekly Intern Coordination</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: '#f8f9fb', borderRadius: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(3,34,16,0.4)', width: 40 }}>14:00</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#032210' }}>Youth Innovation Exchange</span>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Announcements</span>
            <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(251,177,60,0.15)', color: '#c27d00', padding: '3px 10px', borderRadius: 999 }}>3 new</span>
          </div>
          <div className={s.announcementList}>
            {ANNOUNCEMENTS.map(a => (
              <div key={a.day} className={s.announcementItem}>
                <div className={s.announcementDate}>
                  <span className={s.announcementDay}>{a.day}</span>
                  <span className={s.announcementMonth}>{a.month}</span>
                </div>
                <div className={s.announcementBody}>
                  <span className={s.announcementTag}>{a.tag}</span>
                  <p className={s.announcementTitle}>{a.title}</p>
                  <span className={s.announcementMeta}>{a.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

import s from '@/styles/Dashboard.module.css';
import Link from 'next/link';

/* ── Mini calendar (Sept 2026, starts Tuesday, offset=1) ─── */
const WEEK  = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const TODAY = 4;   // concept site shows day 4 as today
const EVENT_DAYS = [7, 9, 11];

function MiniCalendar() {
  // Sept 2026: 1st is a Tuesday → 1 blank before it
  const cells: (number | null)[] = [
    null, null, // Mon blank + Tue = 1st starts on Wed? Let's match the HTML exactly
  ];
  // From the actual HTML: <span class=" "></span><span class=" "></span><span class=" ">1</span>
  // So there are 2 blanks before day 1 (starts Wednesday Sept 2026)
  const blanks = [null, null];
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const all: (number | null)[] = [...blanks, ...days];
  while (all.length % 7 !== 0) all.push(null);

  return (
    <div className={s.miniCalendar}>
      <div className={s.calWeekRow}>
        {WEEK.map(d => <span key={d} className={s.calWeekLabel}>{d}</span>)}
      </div>
      <div className={s.calDaysGrid}>
        {all.map((day, i) => (
          <span
            key={i}
            className={[
              s.calDay,
              !day ? s.calDayEmpty : '',
              day === TODAY ? s.calDayToday : '',
              day && EVENT_DAYS.includes(day) && day !== TODAY ? s.calDayEvent : '',
            ].filter(Boolean).join(' ')}
          >
            {day ?? ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Announcements data ──────────────────────────────────── */
const EVENTS = [
  { day: '07', month: 'SEP', tag: 'meeting',  title: 'Weekly Intern Coordination',  time: '10:00', location: 'Mandela Hall' },
  { day: '09', month: 'SEP', tag: 'event',    title: 'Youth Innovation Exchange',   time: '14:00', location: 'Online' },
  { day: '11', month: 'SEP', tag: 'workshop', title: 'Skills Development Workshop', time: '09:30', location: 'Nyerere Room' },
];

export default function DashboardHome() {
  return (
    <>
      {/* ── profile-reminder ────────────────────────── */}
      <div className={s.profileReminder}>
        <div className={s.completionRing}>
          <span className={s.completionRingText}>65%</span>
        </div>
        <div className={s.reminderBody}>
          <b>Complete your profile</b>
          <p>Add the remaining required details so other interns can find and trust your profile.</p>
        </div>
        <Link href="/dashboard/profile" className={s.reminderBtn}>
          Finish profile
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </Link>
      </div>

      {/* ── v2-welcome ──────────────────────────────── */}
      <div className={s.v2Welcome}>
        <div>
          <p className={s.welcomeDate}>TUESDAY, 8 SEPTEMBER</p>
          <h1 className={s.welcomeHeading}>Good morning, Yididiya.</h1>
          <p className={s.welcomeSub}>Here is what is happening across your AU intern community.</p>
        </div>
        <Link href="/dashboard/calendar" className={s.openCalBtn}>
          Open calendar
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>
          </svg>
        </Link>
      </div>

      {/* ── v2-dashboard ────────────────────────────── */}
      <div className={s.v2Dashboard}>

        {/* v2-calendar-card */}
        <div className={s.v2CalendarCard}>
          <div className={s.miniCalHead}>
            <div>
              <p>SEPTEMBER 2026</p>
              <h2>Your calendar</h2>
            </div>
            <Link href="/dashboard/calendar" className={s.fullCalBtn}>
              Full calendar
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Link>
          </div>

          <MiniCalendar />

          {/* Today's event list */}
          <div className={s.todayList}>
            <div className={s.todayEvent}>
              <span className={`${s.eventDot} ${s.meeting}`} />
              <b>10:00</b>
              <p>Weekly Intern Coordination</p>
            </div>
            <div className={s.todayEvent}>
              <span className={`${s.eventDot} ${s.event}`} />
              <b>14:00</b>
              <p>Youth Innovation Exchange</p>
            </div>
          </div>
        </div>

        {/* v2-announcements */}
        <div className={s.v2Announcements}>
          <div className={s.v2PanelHead}>
            <div>
              <p>ANNOUNCEMENTS</p>
              <h2>Coming up</h2>
            </div>
            <span className={s.newBadge}>3 new</span>
          </div>

          {EVENTS.map(ev => (
            <div key={ev.day} className={s.v2Event}>
              <div className={s.dateTile}>
                <b>{ev.day}</b>
                <small>{ev.month}</small>
              </div>
              <div className={s.eventBody}>
                <span className={`${s.eventTag} ${s[ev.tag as keyof typeof s]}`}>{ev.tag}</span>
                <h3>{ev.title}</h3>
                <p>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  {ev.time}
                  {' '}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {ev.location}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}

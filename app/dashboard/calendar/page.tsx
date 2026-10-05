import s from '@/styles/Dashboard.module.css';

const DAYS_FULL = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// September 2026: starts Tuesday (offset 1), 30 days
const OFFSET = 1;
const DAYS_IN_MONTH = 30;
const TODAY = 8;

interface CalEvent { day: number; title: string; time: string; }
const EVENTS: CalEvent[] = [
  { day: 7, title: 'Weekly Intern Coordination', time: '10:00' },
  { day: 9, title: 'Youth Innovation Exchange', time: '14:00' },
  { day: 11, title: 'Skills Development Workshop', time: '09:30' },
  { day: 15, title: 'One-on-one with Supervisor', time: '11:00' },
  { day: 22, title: 'AU Intern Community Call', time: '15:00' },
  { day: 25, title: 'Leadership Forum', time: '09:00' },
];

const UPCOMING = EVENTS.filter(e => e.day >= TODAY).sort((a, b) => a.day - b.day);

export default function CalendarPage() {
  const cells: (number | null)[] = [
    ...Array(OFFSET).fill(null),
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsMap: Record<number, CalEvent[]> = {};
  EVENTS.forEach(e => {
    if (!eventsMap[e.day]) eventsMap[e.day] = [];
    eventsMap[e.day].push(e);
  });

  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Calendar</h1>
          <p className={s.pageSubtitle}>Your schedule and upcoming AU community events.</p>
        </div>
        <button
          style={{
            padding: '10px 20px',
            background: '#032210',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          + Add event
        </button>
      </div>

      <div className={s.grid2} style={{ alignItems: 'start' }}>
        {/* Full calendar */}
        <div style={{ gridColumn: 'span 1' }}>
          <div className={s.calFull}>
            <div className={s.calHeader}>
              <button className={s.calNavBtn}>‹</button>
              <h2 className={s.calMonthTitle}>September 2026</h2>
              <button className={s.calNavBtn}>›</button>
            </div>
            <div className={s.calBody}>
              <div className={s.calFullGrid}>
                {DAYS_FULL.map(d => (
                  <div key={d} className={s.calFullDayHead}>{d}</div>
                ))}
                {cells.map((day, i) => (
                  <div
                    key={i}
                    className={[
                      s.calFullDay,
                      day === TODAY ? s.calFullDayToday : '',
                      !day ? s.calFullDayOtherMonth : '',
                    ].join(' ')}
                  >
                    <div className={s.calFullDayNum}>{day ?? ''}</div>
                    {day && eventsMap[day]?.map(ev => (
                      <div key={ev.title} className={s.calEvent}>{ev.time} {ev.title}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming events panel */}
        <div className={s.card} style={{ gridColumn: 'span 1' }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Upcoming Events</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {UPCOMING.map(ev => (
              <div
                key={ev.title}
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  padding: '14px 16px',
                  background: '#f8f9fb',
                  borderRadius: 12,
                }}
              >
                <div style={{ textAlign: 'center', minWidth: 36 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#032210', lineHeight: 1, display: 'block' }}>{ev.day}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(3,34,16,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEP</span>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: '#032210' }}>{ev.title}</p>
                  <span style={{ fontSize: 12, color: 'rgba(3,34,16,0.45)' }}>{ev.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

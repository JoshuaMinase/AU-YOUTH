import s from '@/styles/Dashboard.module.css';

const HEADS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const OFFSET = 1; // Sept 2026 starts Tuesday → 1 blank before it
const TOTAL  = 30;
const TODAY  = 8;

interface Evt { day: number; title: string; time: string; type: 'meeting' | 'event' | 'workshop' | 'session' | 'call' | 'forum'; }
const EVENTS: Evt[] = [
  { day: 7,  title: 'Weekly Intern Coordination', time: '10:00', type: 'meeting'  },
  { day: 9,  title: 'Youth Innovation Exchange',  time: '14:00', type: 'event'    },
  { day: 11, title: 'Skills Development Workshop',time: '09:30', type: 'workshop' },
  { day: 15, title: 'One-on-one with Supervisor', time: '11:00', type: 'session'  },
  { day: 22, title: 'AU Intern Community Call',   time: '15:00', type: 'call'     },
  { day: 25, title: 'Leadership Forum',            time: '09:00', type: 'forum'   },
];

const TYPE_LABEL: Record<string, string> = {
  meeting:  s.dotMeeting,
  event:    s.dotEvent,
  workshop: s.dotWorkshop,
  session:  s.dotSession,
  call:     s.dotCall,
  forum:    s.dotForum,
};

const evMap: Record<number, Evt[]> = {};
EVENTS.forEach(e => { (evMap[e.day] ??= []).push(e); });

const cells: (number | null)[] = [
  ...Array(OFFSET).fill(null),
  ...Array.from({ length: TOTAL }, (_, i) => i + 1),
];
while (cells.length % 7 !== 0) cells.push(null);

const upcoming = EVENTS.filter(e => e.day >= TODAY).sort((a,b) => a.day - b.day);

export default function CalendarPage() {
  return (
    <>
      {/* ── Page header ────────────────────────────── */}
      <div className={s.pageHero}>
        <div>
          <p className={s.pageEyebrow}>SEPTEMBER 2026</p>
          <h1 className={s.pageHeading}>Calendar</h1>
          <p className={s.pageDesc}>Your schedule and upcoming AU community events.</p>
        </div>
        <button className={s.btnPrimary}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14"/><path d="M12 5v14"/>
          </svg>
          Add event
        </button>
      </div>

      {/* ── Calendar + sidebar ─────────────────────── */}
      <div className={s.calLayout}>

        {/* Full calendar grid */}
        <div className={s.calFull}>
          <div className={s.calFullHeader}>
            <button className={s.calNavBtn} aria-label="Previous month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 className={s.calFullMonth}>September 2026</h2>
            <button className={s.calNavBtn} aria-label="Next month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          <div className={s.calFullGrid}>
            {HEADS.map(h => <div key={h} className={s.calFullHead}>{h}</div>)}
            {cells.map((day, i) => (
              <div
                key={i}
                className={[
                  s.calFullCell,
                  day === TODAY ? s.calFullCellToday : '',
                  !day ? s.calFullCellOther : '',
                ].filter(Boolean).join(' ')}
              >
                {day && <div className={s.calFullNum}>{day}</div>}
                {day && evMap[day]?.map(ev => (
                  <div key={ev.title} className={`${s.calChip} ${TYPE_LABEL[ev.type] ?? ''}`}>
                    <span>{ev.time}</span>
                    <span className={s.calChipTitle}>{ev.title}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming sidebar */}
        <div className={s.calSidebar}>
          <div className={s.cardHead}>
            <p className={s.cardEyebrow}>COMING UP</p>
            <h3 className={s.cardTitle}>Upcoming events</h3>
          </div>

          <div className={s.upcomingList}>
            {upcoming.map(ev => (
              <div key={ev.title} className={s.upcomingItem}>
                <div className={s.dateTile}>
                  <b>{ev.day}</b>
                  <small>SEP</small>
                </div>
                <div className={s.upcomingBody}>
                  <div className={`${s.eventDot} ${TYPE_LABEL[ev.type] ?? ''}`} />
                  <p className={s.upcomingTitle}>{ev.title}</p>
                  <p className={s.upcomingTime}>{ev.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className={s.calLegend}>
            {(['meeting','event','workshop','session'] as const).map(t => (
              <div key={t} className={s.legendRow}>
                <span className={`${s.legendDot} ${TYPE_LABEL[t]}`} />
                <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

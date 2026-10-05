import s from '@/styles/Dashboard.module.css';

const HEADS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const OFFSET = 1;
const TOTAL = 30;
const TODAY = 8;

interface Evt { day: number; title: string; time: string; }
const EVENTS: Evt[] = [
  { day: 7,  title: 'Weekly Intern Coordination', time: '10:00' },
  { day: 9,  title: 'Youth Innovation Exchange',  time: '14:00' },
  { day: 11, title: 'Skills Development Workshop',time: '09:30' },
  { day: 15, title: 'One-on-one with Supervisor', time: '11:00' },
  { day: 22, title: 'AU Intern Community Call',   time: '15:00' },
  { day: 25, title: 'Leadership Forum',            time: '09:00' },
];

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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 className={s.pageTitle}>Calendar</h1>
          <p className={s.pageSubtitle}>Your schedule and upcoming AU community events.</p>
        </div>
        <button className={s.btnPrimary}>+ Add event</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, alignItems:'start' }}>
        <div className={s.calFull}>
          <div className={s.calFullHeader}>
            <button className={s.calNavBtn}>‹</button>
            <h2 className={s.calFullMonth}>September 2026</h2>
            <button className={s.calNavBtn}>›</button>
          </div>
          <div className={s.calFullBody}>
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
                  <div className={s.calFullNum}>{day ?? ''}</div>
                  {day && evMap[day]?.map(ev => (
                    <div key={ev.title} className={s.calChip}>{ev.time} {ev.title}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Upcoming</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {upcoming.map(ev => (
              <div key={ev.title} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 12px', background:'#F7F7F5', borderRadius:8 }}>
                <div style={{ textAlign:'center', minWidth:32 }}>
                  <span style={{ fontSize:18, fontWeight:800, color:'#032210', lineHeight:1, display:'block' }}>{ev.day}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:'rgba(3,34,16,0.35)', textTransform:'uppercase' as const, letterSpacing:'0.06em' }}>SEP</span>
                </div>
                <div>
                  <p style={{ margin:'0 0 2px', fontSize:12, fontWeight:600, color:'#032210' }}>{ev.title}</p>
                  <span style={{ fontSize:11, color:'rgba(3,34,16,0.4)' }}>{ev.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

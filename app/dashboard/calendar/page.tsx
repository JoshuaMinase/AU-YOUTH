'use client';

import { useMemo, useState } from 'react';
import { Hero, I, Modal, useToast } from '@/components/portal/ui';
import { EVENT_TYPES, MONTHS, MONTHS_SHORT, WEEKDAYS, monthCells, parseYmd, ymd, type CalEvent, type EventType } from '@/lib/data';
import { useToday } from '@/lib/hooks';
import { useEvents } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

const HEADS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function AddEvent({ date, onAdd, onClose }: { date: string; onAdd: (e: Omit<CalEvent, 'id'>) => void; onClose: () => void }) {
  const [f, setF] = useState({ title: '', date, time: '10:00', type: 'meeting' as EventType, location: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Add event" onClose={onClose}>
      <form className={s.form} onSubmit={(e) => { e.preventDefault(); onAdd({ ...f, title: f.title.trim(), location: f.location.trim() || 'TBC' }); }}>
        <div className={s.field}>
          <label className={s.label} htmlFor="ev-title">Title</label>
          <input id="ev-title" className={s.input} value={f.title} onChange={set('title')} required maxLength={80} placeholder="e.g. Policy circle meetup" />
        </div>
        <div className={s.formRow}>
          <div className={s.field}>
            <label className={s.label} htmlFor="ev-date">Date</label>
            <input id="ev-date" type="date" className={s.input} value={f.date} onChange={set('date')} required />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="ev-time">Time</label>
            <input id="ev-time" type="time" className={s.input} value={f.time} onChange={set('time')} required />
          </div>
        </div>
        <div className={s.formRow}>
          <div className={s.field}>
            <label className={s.label} htmlFor="ev-type">Type</label>
            <select id="ev-type" className={s.input} value={f.type} onChange={set('type')}>
              {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="ev-loc">Location</label>
            <input id="ev-loc" className={s.input} value={f.location} onChange={set('location')} placeholder="Online" maxLength={60} />
          </div>
        </div>
        <div className={s.formActions}>
          <button type="button" className={s.btnLine} onClick={onClose}>Cancel</button>
          <button type="submit" className={s.btnDark} disabled={!f.title.trim()}>Add event</button>
        </div>
      </form>
    </Modal>
  );
}

export default function CalendarPage() {
  const today = useToday();
  const { events, add, remove } = useEvents(today);
  const [toast, toastNode] = useToast();
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const [selected, setSelected] = useState('');
  const [adding, setAdding] = useState(false);

  const v = view ?? (today ? { y: today.getFullYear(), m: today.getMonth() } : null);
  const todayKey = today ? ymd(today) : '';
  const selKey = selected || todayKey;

  const byDay = useMemo(() => {
    const m: Record<string, CalEvent[]> = {};
    events.forEach((e) => { (m[e.date] ??= []).push(e); });
    return m;
  }, [events]);

  const shift = (n: number) => v && setView(() => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const goToday = () => { setView(null); setSelected(''); };
  const selDate = selKey ? parseYmd(selKey) : null;
  const dayEvents = byDay[selKey] ?? [];
  const upcoming = events.filter((e) => e.date >= todayKey).slice(0, 5);

  return (
    <>
      <Hero plain eyebrow={v ? `${MONTHS[v.m]} ${v.y}` : 'Schedule'} title="Your *Calendar*" desc="Your schedule and upcoming AU community events.">
        <button type="button" className={s.btnDark} onClick={() => setAdding(true)} disabled={!today}>{I.plus} Add event</button>
      </Hero>

      <div className={s.calLayout}>
        <section className={s.card} data-reveal>
          <div className={s.calTop}>
            <h2 className={s.calTitle} aria-live="polite">{v ? `${MONTHS[v.m]} ${v.y}` : ' '}</h2>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={goToday}>Today</button>
              <button type="button" className={s.iconBtn} onClick={() => shift(-1)} aria-label="Previous month">{I.left}</button>
              <button type="button" className={s.iconBtn} onClick={() => shift(1)} aria-label="Next month">{I.right}</button>
            </div>
          </div>

          <div className={s.calFullGrid} role="grid">
            {HEADS.map((h) => <div key={h} className={s.calHeadCell} role="columnheader">{h}</div>)}
            {v && monthCells(v.y, v.m).map((d, i) => {
              if (!d) return <div key={i} className={s.calCell} data-other="" aria-hidden="true" />;
              const k = ymd(d);
              const evs = byDay[k] ?? [];
              return (
                <button key={i} type="button" className={s.calCell} data-today={k === todayKey ? '' : undefined}
                  aria-pressed={k === selKey} onClick={() => setSelected(k)}
                  aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]}, ${evs.length} event${evs.length === 1 ? '' : 's'}`}>
                  <span className={s.calNum}>{d.getDate()}</span>
                  {evs.slice(0, 2).map((ev) => (
                    <span key={ev.id} className={`${s.chip} ${s[`ev_${ev.type}`]}`}><span>{ev.time}</span><span>{ev.title}</span></span>
                  ))}
                  {evs.length > 2 && <span className={s.more}>+{evs.length - 2} more</span>}
                </button>
              );
            })}
          </div>

          <div className={s.legend}>
            {EVENT_TYPES.map((t) => <span key={t.id} className={s[`ev_${t.id}`]}><i className={s.dot} />{t.label}</span>)}
          </div>
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className={s.card} data-reveal>
            <div className={s.cardHead}>
              <div>
                <p className={s.cardEyebrow}>{selKey === todayKey ? 'Today' : 'Selected day'}</p>
                <h3 className={s.cardTitle}>{selDate ? `${WEEKDAYS[selDate.getDay()]} ${selDate.getDate()} ${MONTHS[selDate.getMonth()]}` : ' '}</h3>
              </div>
            </div>
            <div className={s.dayList}>
              {dayEvents.map((ev) => (
                <div key={ev.id} className={`${s.dayItem} ${s[`ev_${ev.type}`]}`}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className={s.dayItemTitle}>{ev.title}</p>
                    <p className={s.dayItemMeta}>{ev.time} · {ev.location}</p>
                  </div>
                  {ev.id.startsWith('u-') && (
                    <button type="button" className={s.iconBtn} aria-label={`Delete ${ev.title}`} onClick={() => { remove(ev.id); toast('Event deleted'); }}>{I.close}</button>
                  )}
                </div>
              ))}
              {!dayEvents.length && <p className={s.agendaEmpty}>Nothing scheduled.</p>}
              <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={() => setAdding(true)} disabled={!today}>{I.plus} Add to this day</button>
            </div>
          </section>

          <section className={s.card} data-reveal>
            <div className={s.cardHead}>
              <div>
                <p className={s.cardEyebrow}>Coming up</p>
                <h3 className={s.cardTitle}>Upcoming events</h3>
              </div>
            </div>
            <div className={s.coming}>
              {upcoming.map((ev) => {
                const d = parseYmd(ev.date);
                return (
                  <button key={ev.id} type="button" className={s.comingItem} style={{ border: 0, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={() => { setSelected(ev.date); setView({ y: d.getFullYear(), m: d.getMonth() }); }}>
                    <span className={s.dateTile}><span className={s.dateMonth}>{MONTHS_SHORT[d.getMonth()]}</span><span className={s.dateDay}>{d.getDate()}</span></span>
                    <span>
                      <span className={s.comingTitle} style={{ display: 'block' }}>{ev.title}</span>
                      <span className={s.comingMeta}>{ev.time} · {ev.location}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      {adding && (
        <AddEvent date={selKey} onClose={() => setAdding(false)}
          onAdd={(e) => { add(e); setAdding(false); setSelected(e.date); const d = parseYmd(e.date); setView({ y: d.getFullYear(), m: d.getMonth() }); toast('Event added'); }} />
      )}
      {toastNode}
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Hero, I, Modal, useToast } from '@/components/portal/ui';
import { EVENT_TYPES, MONTHS, MONTHS_SHORT, WEEKDAYS, monthCells, parseYmd, ymd, type CalEvent, type EventType } from '@/lib/data';
import { useToday } from '@/lib/hooks';
import { useMe } from '@/lib/me';
import { useEvents, type EventInput } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

const HEADS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function EventForm({ date, event, isPublic, onSave, onClose }: { date: string; event?: CalEvent; isPublic: boolean; onSave: (e: EventInput) => Promise<string | null>; onClose: () => void }) {
  const [f, setF] = useState({
    title: event?.title ?? '', date: event?.date ?? date, time: event?.time ?? '10:00',
    type: (event?.type ?? 'meeting') as EventType, location: event && event.location !== 'TBC' ? event.location : '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={event ? (isPublic ? 'Edit public event' : 'Edit my event') : isPublic ? 'Add public event' : 'Add event to my calendar'} onClose={onClose}>
      <form className={s.form} onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setErr(null);
        const msg = await onSave({ ...f, title: f.title.trim(), location: f.location.trim() || 'TBC', isPublic });
        if (msg) { setErr(msg); setBusy(false); }
      }}>
        <p className={s.agendaEmpty} role="note">
          {isPublic ? <><strong>Public:</strong> every member will see this event on their calendar.</> : <><strong>Private:</strong> only you will see this event.</>}
        </p>
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
        {err && <p className={s.agendaEmpty} role="alert">{err}</p>}
        <div className={s.formActions}>
          <button type="button" className={s.btnLine} onClick={onClose}>Cancel</button>
          <button type="submit" className={s.btnDark} disabled={!f.title.trim() || busy}>{busy ? 'Saving…' : event ? 'Save changes' : isPublic ? 'Publish event' : 'Add event'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function CalendarPage() {
  const today = useToday();
  const { me } = useMe();
  const isAdmin = me.access !== 'user';
  const { events, add, update, remove, loaded, error } = useEvents(today);
  const [toast, toastNode] = useToast();
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const [selected, setSelected] = useState('');
  const [adding, setAdding] = useState<'public' | 'private' | null>(null);
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const showEvent = (e: EventInput) => { setSelected(e.date); const d = parseYmd(e.date); setView({ y: d.getFullYear(), m: d.getMonth() }); };

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
      <Hero plain eyebrow={v ? `${MONTHS[v.m]} ${v.y}` : 'Schedule'} title="Your *Calendar*" desc={isAdmin ? 'Public events are seen by every member. Private events are only for you.' : 'Your schedule and upcoming AU community events.'}>
        <button type="button" className={s.btnDark} onClick={() => setAdding(isAdmin ? 'public' : 'private')} disabled={!today}>{I.plus} {isAdmin ? 'Add public event' : 'Add my event'}</button>
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
                    <p className={s.dayItemMeta}>{ev.time} · {ev.location}{(ev.isPublic || isAdmin) && ` · ${ev.isPublic ? 'Public' : 'Private'}`}</p>
                  </div>
                  {ev.mine && (
                    <>
                      <button type="button" className={s.iconBtn} aria-label={`Edit ${ev.title}`} onClick={() => setEditing(ev)}>{I.edit}</button>
                      <button type="button" className={s.iconBtn} aria-label={`Delete ${ev.title}`}
                        onClick={async () => { const msg = await remove(ev.id); toast(msg ?? 'Event deleted'); }}>{I.close}</button>
                    </>
                  )}
                </div>
              ))}
              {!loaded && !error && <p className={s.agendaEmpty}>Loading…</p>}
              {error && <p className={s.agendaEmpty} role="alert">Could not load events: {error}</p>}
              {loaded && !error && !dayEvents.length && <p className={s.agendaEmpty}>Nothing scheduled.</p>}
              <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={() => setAdding('private')} disabled={!today}>{I.plus} {isAdmin ? 'Add private event (only me)' : 'Add to my day'}</button>
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
              {loaded && !error && !upcoming.length && <p className={s.agendaEmpty}>No upcoming events.</p>}
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
        <EventForm date={selKey} isPublic={adding === 'public'} onClose={() => setAdding(null)}
          onSave={async (e) => { const msg = await add(e); if (msg) return msg; setAdding(null); showEvent(e); toast('Event added'); return null; }} />
      )}
      {editing && (
        <EventForm date={selKey} event={editing} isPublic={editing.isPublic} onClose={() => setEditing(null)}
          onSave={async (e) => { const msg = await update(editing.id, e); if (msg) return msg; setEditing(null); showEvent(e); toast('Event updated'); return null; }} />
      )}
      {toastNode}
    </>
  );
}

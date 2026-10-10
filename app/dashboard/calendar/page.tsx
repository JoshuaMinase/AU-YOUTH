'use client';

import { useMemo, useRef, useState } from 'react';
import { ConfirmDialog, Hero, I, Modal, useToast } from '@/components/portal/ui';
import { EVENT_TYPES, MONTHS, MONTHS_SHORT, WEEKDAYS, dateRangeLabel, eventDays, lastDay, monthCells, parseYmd, ymd, type CalEvent, type EventType } from '@/lib/data';
import { useToday } from '@/lib/hooks';
import { useMe } from '@/lib/me';
import { removeEventImages, uploadEventImage, useEvents, type EventInput } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

const HEADS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MAX_PHOTOS = 3;

function EventForm({ date, event, isPublic, onSave, onClose }: { date: string; event?: CalEvent; isPublic: boolean; onSave: (e: EventInput) => Promise<string | null>; onClose: () => void }) {
  const [f, setF] = useState({
    title: event?.title ?? '', date: event?.date ?? date, endDate: event?.endDate ?? '', time: event?.time ?? '10:00',
    type: (event?.type ?? 'meeting') as EventType, location: event && event.location !== 'TBC' ? event.location : '',
    description: event?.description ?? '',
  });
  const [images, setImages] = useState<string[]>(event?.images ?? []);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fresh = useRef<string[]>([]); // photos uploaded in this form, deleted again if the form is closed without saving
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const close = () => { if (fresh.current.length) removeEventImages(fresh.current); onClose(); };
  return (
    <Modal title={event ? (isPublic ? 'Edit public event' : 'Edit my event') : isPublic ? 'Add public event' : 'Add event to my calendar'} onClose={close}>
      <form className={s.form} onSubmit={async (e) => {
        e.preventDefault();
        if (f.endDate && f.endDate < f.date) { setErr('The last day cannot be before the first day.'); return; }
        setBusy(true); setErr(null);
        const msg = await onSave({
          ...f, title: f.title.trim(), location: f.location.trim() || 'TBC', isPublic,
          endDate: f.endDate && f.endDate > f.date ? f.endDate : null, description: f.description.trim(), images,
        });
        if (msg) { setErr(msg); setBusy(false); return; }
        fresh.current = []; // saved, keep them
        removeEventImages((event?.images ?? []).filter((u) => !images.includes(u))); // photos taken off this event
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
            <label className={s.label} htmlFor="ev-date">First day</label>
            <input id="ev-date" type="date" className={s.input} value={f.date} onChange={set('date')} required />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="ev-end">Last day (optional)</label>
            <input id="ev-end" type="date" className={s.input} value={f.endDate} min={f.date} onChange={set('endDate')} />
          </div>
        </div>
        <div className={s.formRow}>
          <div className={s.field}>
            <label className={s.label} htmlFor="ev-time">Start time</label>
            <input id="ev-time" type="time" className={s.input} value={f.time} onChange={set('time')} required />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="ev-type">Type</label>
            <select id="ev-type" className={s.input} value={f.type} onChange={set('type')}>
              {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="ev-loc">Location</label>
          <input id="ev-loc" className={s.input} value={f.location} onChange={set('location')} placeholder="Online" maxLength={60} />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="ev-desc">Description (optional)</label>
          <textarea id="ev-desc" className={s.textarea} style={{ minHeight: 90 }} value={f.description} onChange={set('description')} maxLength={1000}
            placeholder="What is it about? Who should come? What to bring?" />
        </div>
        <div className={s.field}>
          <span className={s.label}>Photos (optional, up to {MAX_PHOTOS})</span>
          {images.length > 0 && (
            <div className={s.evThumbs}>
              {images.map((u) => (
                <div key={u} className={s.evThumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="Event photo preview" loading="lazy" />
                  <button type="button" className={s.evThumbX} aria-label="Remove this photo" onClick={() => {
                    setImages(images.filter((x) => x !== u));
                    if (fresh.current.includes(u)) { removeEventImages([u]); fresh.current = fresh.current.filter((x) => x !== u); }
                  }}>{I.close}</button>
                </div>
              ))}
            </div>
          )}
          {images.length < MAX_PHOTOS && (
            <div className={s.photoRow}>
              <label className={`${s.btnLine} ${s.btnSm}`} style={{ cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? 'Uploading…' : images.length ? 'Add another photo' : 'Add a photo'}
                <input type="file" accept="image/*" hidden disabled={uploading} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setUploading(true); setErr(null);
                  const res = await uploadEventImage(file);
                  setUploading(false);
                  if (res.error) setErr(res.error);
                  else { fresh.current.push(res.url!); setImages((prev) => [...prev, res.url!]); }
                }} />
              </label>
            </div>
          )}
        </div>
        {err && <p className={s.agendaEmpty} role="alert">{err}</p>}
        <div className={s.formActions}>
          <button type="button" className={s.btnLine} onClick={close}>Cancel</button>
          <button type="submit" className={s.btnDark} disabled={!f.title.trim() || busy || uploading}>{busy ? 'Saving…' : event ? 'Save changes' : isPublic ? 'Publish event' : 'Add event'}</button>
        </div>
      </form>
    </Modal>
  );
}

/** Everything about one event. The owner can edit or delete it from here. */
function EventDetail({ ev, onClose, onEdit, onDelete }: { ev: CalEvent; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const type = EVENT_TYPES.find((t) => t.id === ev.type)?.label ?? ev.type;
  const days = ev.endDate ? eventDays(ev).length : 1;
  return (
    <Modal title={ev.title} onClose={onClose}>
      <div className={s.evDetail}>
        {ev.images.length > 0 && (
          <div className={s.evGallery} data-count={ev.images.length}>
            {ev.images.map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt={`Photo for ${ev.title}`} loading="lazy" />
            ))}
          </div>
        )}
        <div className={s.evTags}>
          <span className={`${s.tag} ${s.tMuted}`}>{type}</span>
          <span className={`${s.tag} ${s.tMuted}`}>{ev.isPublic ? 'Public' : 'Private'}</span>
        </div>
        <ul className={s.evFacts}>
          <li>{I.calendar}<span>{dateRangeLabel(ev)}{days > 1 && ` · ${days} days`}</span></li>
          <li>{I.clock}<span>{ev.time}{days > 1 && ' on the first day'}</span></li>
          <li>{I.pin}<span>{ev.location}</span></li>
          {ev.isPublic && ev.by && <li>{I.people}<span>Posted by {ev.by}</span></li>}
        </ul>
        {ev.description ? <p className={s.evDesc}>{ev.description}</p> : <p className={s.agendaEmpty}>No description added.</p>}
        {ev.mine && (
          <div className={s.formActions}>
            <button type="button" className={s.btnLine} onClick={onDelete}>Delete</button>
            <button type="button" className={s.btnDark} onClick={onEdit}>{I.edit} Edit</button>
          </div>
        )}
      </div>
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
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<CalEvent | null>(null);
  const showEvent = (e: EventInput) => { setSelected(e.date); const d = parseYmd(e.date); setView({ y: d.getFullYear(), m: d.getMonth() }); };

  const v = view ?? (today ? { y: today.getFullYear(), m: today.getMonth() } : null);
  const todayKey = today ? ymd(today) : '';
  const selKey = selected || todayKey;

  const byDay = useMemo(() => {
    const m: Record<string, CalEvent[]> = {};
    events.forEach((e) => { eventDays(e).forEach((k) => { (m[k] ??= []).push(e); }); });
    return m;
  }, [events]);

  const shift = (n: number) => v && setView(() => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const goToday = () => { setView(null); setSelected(''); };
  const selDate = selKey ? parseYmd(selKey) : null;
  const dayEvents = byDay[selKey] ?? [];
  const upcoming = events.filter((e) => lastDay(e) >= todayKey).slice(0, 5);
  const viewing = events.find((e) => e.id === viewId) ?? null;

  return (
    <>
      <Hero plain eyebrow={v ? `${MONTHS[v.m]} ${v.y}` : 'Schedule'} title="Your *Calendar*" desc={isAdmin ? 'Public events are seen by every member. Private events are only for you.' : 'Your schedule and upcoming AU community events.'}>
        {isAdmin && <button type="button" className={s.btnDark} onClick={() => setAdding('public')} disabled={!today}>{I.plus} Add public event</button>}
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
                    <span key={ev.id} className={`${s.chip} ${s[`ev_${ev.type}`]}`}><span>{k === ev.date ? ev.time : '…'}</span><span>{ev.title}</span></span>
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
                  <button type="button" className={s.dayItemBtn} onClick={() => setViewId(ev.id)} aria-label={`Open details for ${ev.title}`}>
                    <span className={s.dayItemTitle}>{ev.title}</span>
                    <span className={s.dayItemMeta}>{ev.endDate ? `${dateRangeLabel(ev)} · ` : ''}{ev.time} · {ev.location}{(ev.isPublic || isAdmin) && ` · ${ev.isPublic ? 'Public' : 'Private'}`}</span>
                  </button>
                  {ev.mine && (
                    <>
                      <button type="button" className={s.iconBtn} aria-label={`Edit ${ev.title}`} onClick={() => setEditing(ev)}>{I.edit}</button>
                      <button type="button" className={s.iconBtn} aria-label={`Delete ${ev.title}`} onClick={() => setDeleting(ev)}>{I.close}</button>
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
                    onClick={() => { setSelected(ev.date); setView({ y: d.getFullYear(), m: d.getMonth() }); setViewId(ev.id); }}>
                    <span className={s.dateTile}><span className={s.dateMonth}>{MONTHS_SHORT[d.getMonth()]}</span><span className={s.dateDay}>{d.getDate()}</span></span>
                    <span>
                      <span className={s.comingTitle} style={{ display: 'block' }}>{ev.title}</span>
                      <span className={s.comingMeta}>{dateRangeLabel(ev)} · {ev.time} · {ev.location}</span>
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
      {viewing && !editing && !deleting && (
        <EventDetail ev={viewing} onClose={() => setViewId(null)} onEdit={() => setEditing(viewing)} onDelete={() => setDeleting(viewing)} />
      )}
      {deleting && (
        <ConfirmDialog title="Delete this event?" message={`"${deleting.title}" will be removed${deleting.isPublic ? ' for everyone' : ''}.`} confirmLabel="Delete"
          onCancel={() => setDeleting(null)}
          onConfirm={async () => { const msg = await remove(deleting.id); setDeleting(null); if (!msg) setViewId(null); toast(msg ?? 'Event deleted'); }} />
      )}
      {toastNode}
    </>
  );
}

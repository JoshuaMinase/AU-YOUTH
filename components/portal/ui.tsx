'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { MONTHS, monthCells, ymd, type CalEvent } from '../../lib/data';
import s from '../../styles/Portal.module.css';

/* ── Icons (stroke inherits currentColor via CSS) ─────────────────── */
const P = (d: ReactNode) => <svg className={s.ic} viewBox="0 0 24 24" aria-hidden="true">{d}</svg>;
export const I = {
  home: P(<><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" /></>),
  news: P(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h6M8 17h4" /></>),
  people: P(<><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" /></>),
  calendar: P(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
  help: P(<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></>),
  chat: P(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />),
  left: P(<path d="m15 18-6-6 6-6" />),
  right: P(<path d="m9 18 6-6-6-6" />),
  plus: P(<path d="M5 12h14M12 5v14" />),
  close: P(<path d="M18 6 6 18M6 6l12 12" />),
  more: P(<><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>),
  like: P(<><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></>),
  comment: P(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />),
  share: P(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" /></>),
  send: P(<><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></>),
  clock: P(<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>),
  pin: P(<><path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>),
  search: P(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  bell: P(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>),
  edit: P(<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />),
  mail: P(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>),
  alert: P(<><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>),
  book: P(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>),
  phone: P(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />),
  check: P(<path d="M20 6 9 17l-5-5" />),
  shield: P(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />),
  attach: P(<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />),
  mic: P(<><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" /></>),
  trash: P(<><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6M14 11v6" /></>),
  forward: P(<><path d="m15 14 5-5-5-5" /><path d="M4 20v-7a4 4 0 0 1 4-4h12" /></>),
  file: P(<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z" /><path d="M14 2v6h6" /></>),
  play: P(<path d="M7 4.5v15l12-7.5z" />),
  pause: P(<path d="M8 5v14M16 5v14" />),
  download: P(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>),
};

/* ── Page hero ────────────────────────────────────────────────────── */
/** `plain` = text only, no background box — the heading sits directly on the page */
export function Hero({ eyebrow, title, desc, plain, children }: { eyebrow: string; title: string; desc?: ReactNode; plain?: boolean; children?: ReactNode }) {
  const words = title.split(' ');
  return (
    <section className={`${s.hero} ${plain ? s.heroPlain : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {!plain && <img className={s.heroPattern} src="/assets/pattern.svg" alt="" aria-hidden="true" />}
      <div>
        <p className={s.heroEyebrow}>{eyebrow}</p>
        <h1 className={s.heroTitle} aria-label={title.replace(/\*/g, '')}>
          {words.map((w, i) => {
            const hl = w.includes('*');
            const clean = w.replace(/\*/g, '');
            return (
              <span key={i}>
                {i > 0 && ' '}
                <span className={s.mask}><span data-w className={s.word}>{hl ? <em>{clean}</em> : clean}</span></span>
              </span>
            );
          })}
        </h1>
        {desc && <p className={s.heroDesc}>{desc}</p>}
      </div>
      {children && <div className={s.heroAside}>{children}</div>}
    </section>
  );
}

/* ── Modal ────────────────────────────────────────────────────────── */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus(); };
  }, []);
  return (
    <div className={s.scrim} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} data-lenis-prevent>
      <div ref={box} className={s.modal} role="dialog" aria-modal="true" aria-label={title}>
        <div className={s.modalHead}>
          <h2 className={s.modalTitle}>{title}</h2>
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">{I.close}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Confirm dialog (replaces window.confirm) ─────────────────────── */
export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', busy = false, onConfirm, onCancel }: {
  title: string; message: string; confirmLabel?: string; busy?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className={s.confirmText}>{message}</p>
      <div className={s.formActions}>
        <button type="button" className={s.btnLine} onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className={s.btnDark} onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
      </div>
    </Modal>
  );
}

/* ── Toast ────────────────────────────────────────────────────────── */
export function useToast() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>();
  const toast = useCallback((m: string) => {
    setMsg(m); setShow(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setShow(false), 2200);
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  const node = <div className={s.toast} data-show={show ? '' : undefined} role="status" aria-live="polite">{msg}</div>;
  return [toast, node] as const;
}

/* ── Mini calendar ────────────────────────────────────────────────── */
const WK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function MiniCalendar({ today, events, selected, onSelect }: {
  today: Date; events: CalEvent[]; selected: string; onSelect: (key: string) => void;
}) {
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const has = new Set(events.map((e) => e.date));
  const todayKey = ymd(today);
  const shift = (n: number) => setView(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  return (
    <div className={s.miniCal}>
      <div className={s.calNav}>
        <button type="button" className={s.iconBtn} onClick={() => shift(-1)} aria-label="Previous month">{I.left}</button>
        <span className={s.calMonth} aria-live="polite">{MONTHS[view.m]} {view.y}</span>
        <button type="button" className={s.iconBtn} onClick={() => shift(1)} aria-label="Next month">{I.right}</button>
      </div>
      <div className={s.calWeek}>{WK.map((d) => <span key={d}>{d}</span>)}</div>
      <div className={s.calGrid}>
        {monthCells(view.y, view.m).map((d, i) => {
          if (!d) return <span key={i} className={s.calDay} data-other="" aria-hidden="true" />;
          const k = ymd(d);
          return (
            <button key={i} type="button" className={s.calDay}
              data-today={k === todayKey ? '' : undefined} data-event={has.has(k) ? '' : undefined}
              aria-pressed={k === selected} aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]}${has.has(k) ? ', has events' : ''}`}
              onClick={() => onSelect(k)}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

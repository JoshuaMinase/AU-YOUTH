'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { I } from './ui';
import { useNotifications } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

/** Header bell: a red number for unread notifications, and a small panel with the latest ones. */
export default function NotificationBell() {
  const { notifs, unread, markRead, markAllRead, loaded } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  /* close on navigation, on a click outside and on Escape */
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); wrap.current?.querySelector<HTMLElement>('button')?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className={s.bellWrap}>
      <button type="button" className={s.bellBtn} onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} aria-controls="bell-panel">
        {I.bell}
        {unread > 0 && <span className={s.redBubble} aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div id="bell-panel" className={s.bellPanel} role="dialog" aria-label="Notifications" data-lenis-prevent>
          <div className={s.bellHead}>
            <h2 className={s.bellTitle}>Notifications</h2>
            {unread > 0
              ? <button type="button" className={s.cardLink} style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={markAllRead}>Mark all read</button>
              : <span className={s.cardMeta}>All caught up</span>}
          </div>
          <div className={s.bellList} aria-live="polite">
            {notifs.map((n) => (
              <Link key={n.id} href={n.href} className={s.bellItem} onClick={() => { if (!n.read) markRead(n.id); setOpen(false); }}>
                <span className={s.notifIcon} style={{ background: n.bg, color: n.fg }}>{n.icon}</span>
                <span>
                  <span className={s.notifTitle}>{n.title}{!n.read && <i aria-label="unread" />}</span>
                  <span className={s.notifText} style={{ display: 'block' }}>{n.body}</span>
                  <span className={s.notifTime} style={{ display: 'block' }}>{n.time}</span>
                </span>
              </Link>
            ))}
            {loaded && !notifs.length && <p className={s.agendaEmpty}>No notifications yet.</p>}
            {!loaded && <p className={s.agendaEmpty}>Loading…</p>}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import type { Ticket, TicketStatus } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

export const STATUS_LABEL: Record<TicketStatus, string> = { open: 'Open', in_progress: 'In progress', closed: 'Closed' };
const STATUS_TAG: Record<TicketStatus, string> = { open: s.tGold, in_progress: s.tBlue, closed: s.tMuted };

/** One support ticket. Admins get a status picker; members see the status. */
export function TicketRow({ t, admin, onStatus }: { t: Ticket; admin: boolean; onStatus?: (st: TicketStatus) => void }) {
  return (
    <div className={s.listRow} style={{ alignItems: 'flex-start' }}>
      <div className={s.rowMain}>
        <p className={s.rowTitle}>{t.area} · {t.urgency} urgency</p>
        <p className={s.rowSub} style={{ whiteSpace: 'pre-wrap' }}>{t.description}</p>
        <p className={s.rowSub}>{admin ? `${t.who} · ` : ''}{t.time}</p>
      </div>
      {admin ? (
        <select className={s.select} value={t.status} aria-label={`Status of ${t.area} report`} onChange={(e) => onStatus?.(e.target.value as TicketStatus)}>
          {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
        </select>
      ) : <span className={`${s.tag} ${STATUS_TAG[t.status]}`}>{STATUS_LABEL[t.status]}</span>}
    </div>
  );
}

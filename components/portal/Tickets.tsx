'use client';

import { useState } from 'react';
import Link from 'next/link';
import { I } from './ui';
import type { TicketInfo } from '@/lib/data';
import type { DepartmentOption, Ticket, TicketStatus } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

export const STATUS_LABEL: Record<TicketStatus, string> = { open: 'Open', in_progress: 'In progress', closed: 'Closed' };
const STATUS_TAG: Record<TicketStatus, string> = { open: s.tGold, in_progress: s.tBlue, closed: s.tMuted };

/** what the reporter reads next to a ticket: where it is and what happens next */
function stage(t: Ticket): { label: string; hint: string } {
  if (t.status === 'closed') return { label: 'Closed', hint: 'Both of you marked it resolved.' };
  if (t.status === 'in_progress') return { label: 'In progress', hint: `${t.assignee || 'Someone'} is helping. Open the chat, and mark it resolved when it is fixed.` };
  if (!t.dept) return { label: 'With the admins', hint: 'An admin will pick the department that can fix it.' };
  return { label: 'Waiting for a volunteer', hint: `Sent to ${t.dept}. Someone there will take it.` };
}

/**
 * One support ticket. The reporter sees where it stands (and a link to the chat once someone took it).
 * Admins also get the department picker for a ticket nobody routed yet.
 */
export function TicketRow({ t, admin, depts, onRoute }: {
  t: Ticket; admin: boolean; depts?: DepartmentOption[]; onRoute?: (deptId: string) => Promise<void> | void;
}) {
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState(false);
  const st = stage(t);
  const needsRoute = admin && !t.dept && t.status === 'open';
  return (
    <div className={s.listRow} style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div className={s.rowMain}>
        <p className={s.rowTitle}>{t.code} · {t.title}</p>
        <p className={s.rowSub} style={{ whiteSpace: 'pre-wrap' }}>{t.description}</p>
        <p className={s.rowSub}>
          {admin ? `${t.who}${t.whoDept ? ` (${t.whoDept})` : ''} · ` : ''}{t.urgency} urgency · {t.dept ? `for ${t.dept}` : 'department: admins decide'} · {t.time}
        </p>
        {!admin && <p className={s.rowSub}>{st.hint}</p>}
        {admin && t.assignee && <p className={s.rowSub}>Taken by {t.assignee}</p>}
      </div>
      <div className={s.ticketSide}>
        <span className={`${s.tag} ${STATUS_TAG[t.status]}`}>{admin ? STATUS_LABEL[t.status] : st.label}</span>
        {t.chatId && <Link href={`/dashboard/chats?c=${t.chatId}`} className={`${s.btnLine} ${s.btnSm}`}>{I.chat} Open chat</Link>}
      </div>
      {needsRoute && (
        <form className={s.ticketRoute} onSubmit={async (e) => { e.preventDefault(); if (!pick) return; setBusy(true); await onRoute?.(pick); setBusy(false); }}>
          <label className={s.agendaLabel} htmlFor={`route-${t.id}`}>Send to department</label>
          <select id={`route-${t.id}`} className={s.select} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Choose…</option>
            {(depts ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" className={`${s.btnDark} ${s.btnSm}`} disabled={!pick || busy}>{busy ? 'Sending…' : 'Send'}</button>
        </form>
      )}
    </div>
  );
}

/** weekday and time, e.g. "Sat, 14:30" */
const when = (iso: string) => new Date(iso).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * The bar above a temporary ticket chat: what the ticket is, who has marked it resolved, and the resolve button.
 * Closes when both have marked it; the chat then stays for 24 hours (expiresAt).
 */
export function TicketBar({ t, expiresAt, onResolve }: { t: TicketInfo; expiresAt?: string | null; onResolve: (done: boolean) => Promise<string | null> }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const mine = t.iAmReporter ? t.reporterResolved : t.assigneeResolved;
  const theirs = t.iAmReporter ? t.assigneeResolved : t.reporterResolved;
  const other = t.iAmReporter ? t.assignee : t.reporter;
  const act = async (done: boolean) => {
    setBusy(true); setErr(null);
    const msg = await onResolve(done);
    setBusy(false);
    if (msg) setErr(msg);
  };
  return (
    <div className={s.ticketBar}>
      <div className={s.ticketBarTop}>
        <button type="button" className={s.ticketToggle} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <b>{t.code}</b> · {t.title} <span aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
        <span className={`${s.tag} ${STATUS_TAG[t.status]}`}>{STATUS_LABEL[t.status]}</span>
      </div>
      {open && <p className={s.ticketDesc}>{t.description}</p>}
      {t.status === 'closed' ? (
        <p className={s.ticketNote} role="status">
          {I.check} Closed: you both marked it resolved. {expiresAt ? `This chat disappears on ${when(expiresAt)}.` : 'This chat disappears 24 hours after closing.'}
        </p>
      ) : (
        <div className={s.ticketFoot}>
          <p className={s.ticketNote} role="status">
            {mine ? `You marked this resolved. Waiting for ${other || 'the other person'}.` : theirs ? `${other || 'The other person'} marked this resolved. If it is fixed, mark it too.` : 'When the problem is fixed, you both mark the ticket resolved to close it.'}
          </p>
          {mine
            ? <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={() => act(false)} disabled={busy}>Not resolved yet</button>
            : <button type="button" className={`${s.btnDark} ${s.btnSm}`} onClick={() => act(true)} disabled={busy}>{I.check} Mark as resolved</button>}
        </div>
      )}
      {err && <p className={s.agendaEmpty} role="alert" style={{ margin: '6px 0 0' }}>{err}</p>}
      <p className={s.ticketPrivacy}>This chat is temporary. Admins can review it if a concern is raised.</p>
    </div>
  );
}

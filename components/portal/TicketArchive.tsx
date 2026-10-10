'use client';

import { useState } from 'react';
import { I } from './ui';
import { STATUS_LABEL } from './Tickets';
import { useTicketArchive, type ArchivedMessage, type ArchivedTicket } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

const PAGE = 20;
const fmt = (iso: string) => new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * Admins: look up a ticket chat (live or already gone for the two people) and read it, read-only.
 * Closed by default and empty until a search is made, so it never grows the Admin panel. Opening a chat is logged.
 */
export default function TicketArchive() {
  const { search, read } = useTicketArchive();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<ArchivedTicket[] | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ArchivedMessage[]>([]);
  const [reading, setReading] = useState(false);

  const find = async (offset = 0) => {
    setBusy(true); setErr(null);
    const r = await search(q, offset, PAGE);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setRows((cur) => (offset ? [...(cur ?? []), ...r.rows] : r.rows));
    setMore(r.rows.length === PAGE);
    if (!offset) setViewing(null);
  };

  const view = async (id: string) => {
    if (viewing === id) { setViewing(null); return; }
    setViewing(id); setMsgs([]); setReading(true); setErr(null);
    const r = await read(id);
    setReading(false);
    if (r.error) { setErr(r.error); setViewing(null); return; }
    setMsgs(r.messages);
  };

  return (
    <section className={`${s.card} ${s.panel}`}>
      <div className={s.cardHead}>
        <div><p className={s.cardEyebrow}>Get Help</p><h2 className={s.cardTitle}>Ticket chats</h2></div>
        <button type="button" className={`${s.btnLine} ${s.btnSm}`} aria-expanded={open} aria-controls="ticket-archive" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : 'Look up a chat'}
        </button>
      </div>
      <p className={s.agendaEmpty} style={{ marginTop: 0 }}>
        Temporary ticket chats disappear for the two people 24 hours after the ticket closes. You can still read them here if a concern is raised. Opening a chat is logged.
      </p>
      {open && (
        <div id="ticket-archive">
          <form className={s.archSearch} onSubmit={(e) => { e.preventDefault(); find(0); }}>
            <label className={s.search} style={{ minWidth: 0, flex: 1 }}>
              {I.search}
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ticket ID (T-0012), subject or name…" aria-label="Find a ticket chat" />
            </label>
            <button type="submit" className={`${s.btnDark} ${s.btnSm}`} disabled={busy}>{busy && !rows ? 'Searching…' : q.trim() ? 'Search' : 'Show latest'}</button>
          </form>
          {err && <p className={s.agendaEmpty} role="alert">{err}</p>}
          {rows && (
            <div className={s.list} style={{ marginTop: 8 }}>
              {rows.map((t) => (
                <div key={t.id}>
                  <div className={s.listRow} style={{ flexWrap: 'wrap' }}>
                    <div className={s.rowMain}>
                      <p className={s.rowTitle}>{t.code} · {t.title}</p>
                      <p className={s.rowSub}>
                        {t.reporter} → {t.assignee || 'nobody'} · {t.dept} · {STATUS_LABEL[t.status]} · {t.messages} {t.messages === 1 ? 'message' : 'messages'}
                      </p>
                      <p className={s.rowSub}>
                        {t.expiresAt ? (new Date(t.expiresAt) > new Date() ? `Chat open until ${fmt(t.expiresAt)}` : `Chat ended ${fmt(t.expiresAt)}`) : 'Chat still running'}
                      </p>
                    </div>
                    <button type="button" className={`${s.btnLine} ${s.btnSm}`} aria-expanded={viewing === t.id} onClick={() => view(t.id)}>
                      {viewing === t.id ? 'Hide chat' : 'Read chat'}
                    </button>
                  </div>
                  {viewing === t.id && (
                    <div className={s.archChat} data-lenis-prevent>
                      {reading && <p className={s.agendaEmpty}>Loading…</p>}
                      {!reading && !msgs.length && <p className={s.agendaEmpty}>No messages were sent in this chat.</p>}
                      {msgs.map((m) => (
                        <p key={m.id} className={s.archMsg}>
                          <b>{m.who}</b> <span>{fmt(m.at)}</span>
                          <span className={s.archText}>
                            {m.kind === 'text' ? m.body : `[${m.kind === 'voice' ? 'Voice message' : m.kind === 'image' ? 'Photo' : 'File'}${m.file ? `: ${m.file}` : ''}]${m.body ? ` ${m.body}` : ''}`}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {rows && !rows.length && <p className={s.agendaEmpty}>No ticket chats match.</p>}
          {rows && more && <button type="button" className={`${s.btnLine} ${s.btnSm}`} style={{ marginTop: 12 }} disabled={busy} onClick={() => find(rows.length)}>{busy ? 'Loading…' : 'Show more'}</button>}
        </div>
      )}
    </section>
  );
}

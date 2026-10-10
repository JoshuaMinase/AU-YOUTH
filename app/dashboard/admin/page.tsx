'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Hero, I, useToast } from '@/components/portal/ui';
import { TicketRow } from '@/components/portal/Tickets';
import { softAvatar } from '@/lib/data';
import { useMe } from '@/lib/me';
import { usePeople } from '@/lib/people';
import { useAddedDepartments, useDeleteRequests, useFlaggedMessages, useTickets } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

const linkBtn = { border: 0, background: 'none', cursor: 'pointer' } as const;

export default function AdminPage() {
  const { me, ready } = useMe();
  const isSuper = me.access === 'super_admin';
  const { members, setAdmin, loaded: peopleLoaded } = usePeople();
  const { requests, loaded: requestsLoaded, approve, decline } = useDeleteRequests();
  const { tickets, loaded: ticketsLoaded, setStatus } = useTickets();
  const { departments, loaded: deptsLoaded, remove: removeDept } = useAddedDepartments();
  const { flags, loaded: flagsLoaded, markReviewed } = useFlaggedMessages();
  const [flagFilter, setFlagFilter] = useState<'new' | 'all'>('new');
  const [toast, toastNode] = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [ticketFilter, setTicketFilter] = useState<'active' | 'all'>('active');

  const admins = members.filter((m) => m.access !== 'user');
  /* super admin: search everyone to make or remove admins */
  const found = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? members.filter((m) => `${m.name} ${m.dept}`.toLowerCase().includes(t)).slice(0, 8) : [];
  }, [members, q]);
  const flagList = flags.filter((f) => flagFilter === 'all' || !f.reviewed);
  const queue = tickets.filter((t) => ticketFilter === 'all' || t.status !== 'closed');

  const act = async (id: string, fn: () => Promise<string | null>, done: string) => {
    setBusy(id);
    const err = await fn();
    setBusy(null);
    toast(err ? `Something went wrong: ${err}` : done);
  };

  if (ready && me.access === 'user') {
    return (
      <>
        <Hero plain eyebrow="Admin" title="Admin *panel*" desc="This page is only for admins." />
        <Link href="/dashboard" className={s.btnLine}>← Back to home</Link>
      </>
    );
  }

  return (
    <>
      <Hero plain eyebrow={isSuper ? 'Super admin' : 'Admin'} title="Admin *panel*"
        desc={isSuper ? 'Manage admins, deletion requests, blocked chat messages, support tickets and departments.' : 'Deletion requests, blocked chat messages, support tickets and departments.'}>
        <Link href="/dashboard/news" className={s.btnDark}>{I.news} Write news</Link>
      </Hero>

      {/* ── Admins ── */}
      <section className={`${s.card} ${s.panel}`}>
        <div className={s.cardHead}><div><p className={s.cardEyebrow}>Team</p><h2 className={s.cardTitle}>Admins</h2></div></div>
        <div className={s.list}>
          <div className={s.listRow}>
            <span className={s.av} style={softAvatar('#C9AB5C')}>{me.initials}</span>
            <div className={s.rowMain}><p className={s.rowTitle}>{me.name} (you)</p><p className={s.rowSub}>{isSuper ? 'Super admin' : 'Admin'}</p></div>
          </div>
          {admins.map((m) => (
            <div key={m.id} className={s.listRow}>
              <span className={s.av} style={softAvatar(m.color)}>{m.initials}</span>
              <div className={s.rowMain}><p className={s.rowTitle}>{m.name}</p><p className={s.rowSub}>{m.access === 'super_admin' ? 'Super admin' : 'Admin'}{m.dept ? ` · ${m.dept}` : ''}</p></div>
              {isSuper && m.access === 'admin' && (
                <button type="button" className={`${s.btnLine} ${s.btnSm}`} disabled={busy === m.id}
                  onClick={() => act(m.id, () => setAdmin(m.id, false), `${m.name} is no longer an admin`)}>Remove</button>
              )}
            </div>
          ))}
        </div>
        {peopleLoaded && !admins.length && <p className={s.agendaEmpty}>{isSuper ? 'No other admins yet.' : 'No other admins.'}</p>}

        {isSuper && (
          <div style={{ marginTop: 20 }}>
            <label className={s.agendaLabel} htmlFor="admin-find">Make someone an admin</label>
            <label className={s.search} style={{ minWidth: 0, marginTop: 8 }}>
              {I.search}
              <input id="admin-find" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members by name or department…" />
            </label>
            {found.length > 0 && (
              <div className={s.list} style={{ marginTop: 8 }}>
                {found.map((m) => (
                  <div key={m.id} className={s.listRow}>
                    <span className={s.av} style={softAvatar(m.color)}>{m.initials}</span>
                    <div className={s.rowMain}><p className={s.rowTitle}>{m.name}</p><p className={s.rowSub}>{m.dept || '—'}</p></div>
                    {m.access === 'user' ? (
                      <button type="button" className={`${s.btnDark} ${s.btnSm}`} disabled={busy === m.id}
                        onClick={() => act(m.id, () => setAdmin(m.id, true), `${m.name} is now an admin`)}>Make admin</button>
                    ) : <span className={`${s.tag} ${s.tMuted}`}>{m.access === 'super_admin' ? 'Super admin' : 'Admin'}</span>}
                  </div>
                ))}
              </div>
            )}
            {q.trim() && !found.length && <p className={s.agendaEmpty}>No members match.</p>}
          </div>
        )}
      </section>

      {/* ── Deletion requests ── */}
      <section className={`${s.card} ${s.panel}`}>
        <div className={s.cardHead}><div><p className={s.cardEyebrow}>Feed</p><h2 className={s.cardTitle}>Deletion requests</h2></div></div>
        <div className={s.list}>
          {requests.map((r) => (
            <div key={r.id} className={s.listRow} style={{ alignItems: 'flex-start' }}>
              <div className={s.rowMain}>
                <p className={s.rowTitle}>{r.who} wants to remove a post by {r.author}</p>
                <p className={s.rowSub} style={{ whiteSpace: 'pre-wrap' }}>&ldquo;{r.post.length > 160 ? `${r.post.slice(0, 160)}…` : r.post}&rdquo;</p>
                <p className={s.rowSub}>{r.reason ? `Reason: ${r.reason} · ` : ''}{r.time}</p>
              </div>
              {r.canDecide ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className={`${s.btnDark} ${s.btnSm}`} disabled={busy === r.id}
                    onClick={() => act(r.id, () => approve(r.postId), 'Post deleted')}>Delete post</button>
                  <button type="button" className={`${s.btnLine} ${s.btnSm}`} disabled={busy === r.id}
                    onClick={() => act(r.id, () => decline(r.id), 'Post kept')}>Keep</button>
                </div>
              ) : <span className={`${s.tag} ${s.tMuted}`}>Waiting</span>}
            </div>
          ))}
        </div>
        {requestsLoaded && !requests.length && <p className={s.agendaEmpty}>No pending requests.</p>}
      </section>

      {/* ── Messages blocked by the AI ── */}
      <section className={`${s.card} ${s.panel}`}>
        <div className={s.cardHead}>
          <div><p className={s.cardEyebrow}>Chats</p><h2 className={s.cardTitle}>Blocked messages</h2></div>
          <div className={s.pills} role="group" aria-label="Which blocked messages">
            <button type="button" className={s.pill} aria-pressed={flagFilter === 'new'} onClick={() => setFlagFilter('new')}>To review</button>
            <button type="button" className={s.pill} aria-pressed={flagFilter === 'all'} onClick={() => setFlagFilter('all')}>All</button>
          </div>
        </div>
        <div className={s.list}>
          {flagList.map((f) => (
            <div key={f.id} className={s.listRow} style={{ alignItems: 'flex-start' }}>
              <div className={s.rowMain}>
                <p className={s.rowTitle}>{f.who} tried to send:</p>
                <p className={s.rowSub} style={{ whiteSpace: 'pre-wrap' }}>&ldquo;{f.body.length > 300 ? `${f.body.slice(0, 300)}…` : f.body}&rdquo;</p>
                <p className={s.rowSub}>{f.categories.join(', ') || 'flagged'} · {f.time}</p>
              </div>
              {f.reviewed
                ? <span className={`${s.tag} ${s.tMuted}`}>Reviewed</span>
                : <button type="button" className={`${s.btnLine} ${s.btnSm}`} disabled={busy === f.id}
                    onClick={() => act(f.id, () => markReviewed(f.id), 'Marked as reviewed')}>Mark reviewed</button>}
            </div>
          ))}
        </div>
        {flagsLoaded && !flagList.length && <p className={s.agendaEmpty}>{flagFilter === 'new' ? 'Nothing to review.' : 'No messages have been blocked yet.'}</p>}
      </section>

      {/* ── Support tickets ── */}
      <section className={`${s.card} ${s.panel}`}>
        <div className={s.cardHead}>
          <div><p className={s.cardEyebrow}>Get Help</p><h2 className={s.cardTitle}>Support tickets</h2></div>
          <div className={s.pills} role="group" aria-label="Which tickets">
            <button type="button" className={s.pill} aria-pressed={ticketFilter === 'active'} onClick={() => setTicketFilter('active')}>Open</button>
            <button type="button" className={s.pill} aria-pressed={ticketFilter === 'all'} onClick={() => setTicketFilter('all')}>All</button>
          </div>
        </div>
        <div className={s.list}>
          {queue.map((tk) => (
            <TicketRow key={tk.id} t={tk} admin onStatus={(st) => act(tk.id, () => setStatus(tk.id, st), 'Status updated')} />
          ))}
        </div>
        {ticketsLoaded && !queue.length && <p className={s.agendaEmpty}>{ticketFilter === 'active' ? 'No open tickets.' : 'No tickets yet.'}</p>}
      </section>

      {/* ── Departments members added ── */}
      <section className={`${s.card} ${s.panel}`}>
        <div className={s.cardHead}><div><p className={s.cardEyebrow}>Profiles</p><h2 className={s.cardTitle}>Departments added by members</h2></div></div>
        <div className={s.list}>
          {departments.map((d) => (
            <div key={d.id} className={s.listRow}>
              <div className={s.rowMain}><p className={s.rowTitle}>{d.name}</p><p className={s.rowSub}>Added by {d.who} · {d.time}</p></div>
              {isSuper && (
                <button type="button" style={linkBtn} className={s.cardLink} disabled={busy === d.id}
                  onClick={() => act(d.id, () => removeDept(d.id), `"${d.name}" removed from the list`)}>Remove</button>
              )}
            </div>
          ))}
        </div>
        {deptsLoaded && !departments.length && <p className={s.agendaEmpty}>None yet. Departments members type in that aren&rsquo;t on the official list show up here.</p>}
      </section>
      {toastNode}
    </>
  );
}

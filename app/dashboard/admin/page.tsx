'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Hero, I, useToast } from '@/components/portal/ui';
import GroupMembers from '@/components/portal/GroupMembers';
import { TicketRow } from '@/components/portal/Tickets';
import TicketArchive from '@/components/portal/TicketArchive';
import { softAvatar } from '@/lib/data';
import { useMe } from '@/lib/me';
import { usePeople } from '@/lib/people';
import { useAddedDepartments, useDeleteRequests, useDepartmentOptions, useDepartments, useDeptChatAdmin, useFlaggedMessages, useTickets } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

const linkBtn = { border: 0, background: 'none', cursor: 'pointer' } as const;

export default function AdminPage() {
  const { me, ready } = useMe();
  const isSuper = me.access === 'super_admin';
  const { members, setAdmin, loaded: peopleLoaded } = usePeople();
  const { requests, loaded: requestsLoaded, approve, decline } = useDeleteRequests();
  const { tickets, loaded: ticketsLoaded, route: routeTicket } = useTickets();
  const deptOptions = useDepartmentOptions();
  const { departments, loaded: deptsLoaded, remove: removeDept } = useAddedDepartments();
  const allDepts = useDepartments();
  const { flags, loaded: flagsLoaded, markReviewed } = useFlaggedMessages();
  const { chats: deptChats, loaded: deptChatsLoaded, membersOf, addMember, removeMember } = useDeptChatAdmin();
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [chatMembers, setChatMembers] = useState<{ id: string; name: string }[]>([]);
  const [flagFilter, setFlagFilter] = useState<'new' | 'all'>('new');
  const [toast, toastNode] = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [ticketFilter, setTicketFilter] = useState<'active' | 'all'>('active');

  const admins = members.filter((m) => m.access !== 'user');
  /* one admin per department: every department with its admin (or none yet), plus the super admin and any admin whose department isn't on the list */
  const key = (d: string) => d.trim().toLowerCase();
  const deptAdmins = useMemo(() => {
    const all = [{ id: me.id, name: `${me.name} (you)`, initials: me.initials, color: '#C9AB5C', dept: me.dept, access: me.access }, ...admins]
      .filter((m) => m.access === 'admin');
    const byDept = new Map(all.map((m) => [key(m.dept), m]));
    const rows = allDepts.map((d) => ({ dept: d, admin: byDept.get(key(d)) ?? null }));
    const listed = new Set(allDepts.map(key));
    const other = all.filter((m) => !listed.has(key(m.dept)));
    return { rows, other, filled: rows.filter((r) => r.admin).length };
  }, [admins, allDepts, me]);
  const superAdmin = me.access === 'super_admin'
    ? { name: `${me.name} (you)`, initials: me.initials, color: '#C9AB5C' }
    : admins.find((m) => m.access === 'super_admin') ?? null;
  /* super admin: search everyone to make or remove admins */
  const found = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? members.filter((m) => `${m.name} ${m.dept}`.toLowerCase().includes(t)).slice(0, 8) : [];
  }, [members, q]);
  const flagList = flags.filter((f) => flagFilter === 'all' || !f.reviewed);
  /* tickets nobody routed come first, then the newest */
  const toRoute = tickets.filter((t) => !t.dept && t.status === 'open').length;
  const queue = tickets.filter((t) => ticketFilter === 'all' || t.status !== 'closed')
    .sort((a, b) => Number(!a.dept && a.status === 'open') === Number(!b.dept && b.status === 'open') ? 0 : !a.dept && a.status === 'open' ? -1 : 1);

  const toggleChat = async (id: string) => {
    if (openChat === id) { setOpenChat(null); return; }
    setOpenChat(id); setChatMembers([]);
    setChatMembers(await membersOf(id));
  };
  const changeChat = async (fn: () => Promise<string | null>) => {
    const err = await fn();
    if (openChat) setChatMembers(await membersOf(openChat));
    return err;
  };

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
        <p className={s.agendaEmpty}>Each department has one admin. {deptAdmins.filled} of {deptAdmins.rows.length} departments have one.</p>
        <div className={s.list}>
          {superAdmin && (
            <div className={s.listRow}>
              <span className={s.av} style={softAvatar(superAdmin.color)}>{superAdmin.initials}</span>
              <div className={s.rowMain}><p className={s.rowTitle}>{superAdmin.name}</p><p className={s.rowSub}>Super admin</p></div>
            </div>
          )}
          {deptAdmins.rows.map(({ dept, admin }) => (
            <div key={dept} className={s.listRow}>
              {admin ? <span className={s.av} style={softAvatar(admin.color)}>{admin.initials}</span> : <span className={s.av} style={softAvatar('#9AA09B')}>–</span>}
              <div className={s.rowMain}>
                <p className={s.rowTitle}>{admin ? admin.name : 'No admin yet'}</p>
                <p className={s.rowSub}>{dept}</p>
              </div>
              {isSuper && admin && admin.id !== me.id && (
                <button type="button" className={`${s.btnLine} ${s.btnSm}`} disabled={busy === admin.id}
                  onClick={() => act(admin.id, () => setAdmin(admin.id, false), `${admin.name} is no longer an admin`)}>Remove</button>
              )}
            </div>
          ))}
          {deptAdmins.other.map((m) => (
            <div key={m.id} className={s.listRow}>
              <span className={s.av} style={softAvatar(m.color)}>{m.initials}</span>
              <div className={s.rowMain}><p className={s.rowTitle}>{m.name}</p><p className={s.rowSub}>Admin · {m.dept || 'No department'}</p></div>
              {isSuper && m.id !== me.id && (
                <button type="button" className={`${s.btnLine} ${s.btnSm}`} disabled={busy === m.id}
                  onClick={() => act(m.id, () => setAdmin(m.id, false), `${m.name} is no longer an admin`)}>Remove</button>
              )}
            </div>
          ))}
        </div>

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
                    <div className={s.rowMain}><p className={s.rowTitle}>{m.name}</p><p className={s.rowSub}>{m.dept || 'No department'}</p></div>
                    {m.access === 'user' ? (
                      <button type="button" className={`${s.btnDark} ${s.btnSm}`}
                        disabled={busy === m.id || !m.dept.trim() || deptAdmins.rows.some((r) => r.admin && key(r.dept) === key(m.dept)) || deptAdmins.other.some((o) => key(o.dept) === key(m.dept))}
                        title={!m.dept.trim() ? 'This member has no department yet' : 'One admin per department'}
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

      {/* ── All department chats (super admin) ── */}
      {isSuper && (
        <section className={`${s.card} ${s.panel}`}>
          <div className={s.cardHead}><div><p className={s.cardEyebrow}>Chats</p><h2 className={s.cardTitle}>Department chats</h2></div></div>
          <p className={s.agendaEmpty} style={{ marginTop: 0 }}>See who is in each department&rsquo;s group chat and add or remove people. You can&rsquo;t read the messages unless you are a member.</p>
          <div className={s.list}>
            {deptChats.map((c) => (
              <div key={c.id}>
                <div className={s.listRow}>
                  <div className={s.rowMain}><p className={s.rowTitle}>{c.dept}</p><p className={s.rowSub}>{c.count} {c.count === 1 ? 'member' : 'members'}</p></div>
                  <button type="button" className={`${s.btnLine} ${s.btnSm}`} aria-expanded={openChat === c.id} onClick={() => toggleChat(c.id)}>
                    {openChat === c.id ? 'Hide' : 'Manage members'}
                  </button>
                </div>
                {openChat === c.id && (
                  <GroupMembers members={chatMembers} meId={me.id} canManage
                    onAdd={(id) => changeChat(() => addMember(c.id, id))} onRemove={(id) => changeChat(() => removeMember(c.id, id))} />
                )}
              </div>
            ))}
          </div>
          {deptChatsLoaded && !deptChats.length && <p className={s.agendaEmpty}>No department chats yet.</p>}
        </section>
      )}

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
        {toRoute > 0 && <p className={s.agendaEmpty} style={{ marginTop: 0 }} role="status">{toRoute} {toRoute === 1 ? 'ticket needs' : 'tickets need'} a department. Pick one and it appears in that department&rsquo;s chat.</p>}
        <div className={s.list}>
          {queue.map((tk) => (
            <TicketRow key={tk.id} t={tk} admin depts={deptOptions}
              onRoute={(deptId) => act(tk.id, () => routeTicket(tk.id, deptId), 'Ticket sent to the department')} />
          ))}
        </div>
        {ticketsLoaded && !queue.length && <p className={s.agendaEmpty}>{ticketFilter === 'active' ? 'No open tickets.' : 'No tickets yet.'}</p>}
      </section>

      {/* ── Ticket chats (closed until an admin looks one up) ── */}
      <TicketArchive />

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

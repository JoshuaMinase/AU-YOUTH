'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Hero, I, useToast } from '@/components/portal/ui';
import { softAvatar } from '@/lib/data';
import { useListAnimation } from '@/lib/hooks';
import { usePeople } from '@/lib/people';
import s from '@/styles/Portal.module.css';

const ROLES = ['All', 'Intern', 'Fellow', 'Volunteer'];
const ROLE_TAG: Record<string, string> = { Intern: s.tGreen, Fellow: s.tGold, Volunteer: s.tBlue };

export default function PeoplePage() {
  const [role, setRole] = useState('All');
  const [dept, setDept] = useState('All');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const { members, incoming, relationOf, request, remove, accept, loaded, error } = usePeople();
  const [toast, toastNode] = useToast();
  const grid = useRef<HTMLDivElement>(null);

  const departments = useMemo(() => Array.from(new Set(members.map((m) => m.dept).filter(Boolean))).sort(), [members]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return members.filter((p) => (role === 'All' || p.role === role) && (dept === 'All' || p.dept === dept) &&
      (!t || `${p.name} ${p.dept} ${p.place}`.toLowerCase().includes(t)));
  }, [members, role, dept, q]);

  useListAnimation(grid, `${role}|${dept}|${q}|${members.length}`);

  const act = async (id: string, fn: () => Promise<string | null>, done: string) => {
    setBusy(id);
    const err = await fn();
    setBusy(null);
    toast(err ? `Something went wrong: ${err}` : done);
  };

  const sentCount = members.filter((m) => relationOf(m.id) === 'sent').length;

  return (
    <>
      <Hero plain eyebrow="AU Youth Network" title="Your *People*" desc="Connect with interns, fellows and volunteers serving across the Union.">
        <div className={s.heroStat}>
          <span className={s.heroStatNum}>{members.length + 1}</span>
          <span className={s.heroStatLabel}>members on the network</span>
        </div>
      </Hero>

      {incoming.length > 0 && (
        <section className={s.card} style={{ marginBottom: 20 }} data-reveal>
          <div className={s.cardHead}><div><p className={s.cardEyebrow}>Requests</p><h2 className={s.cardTitle}>{incoming.length} waiting for you</h2></div></div>
          <div className={s.list}>
            {incoming.map((p) => (
              <div key={p.id} className={s.listRow}>
                <span className={s.av} style={softAvatar(p.color)}>{p.initials}</span>
                <div className={s.rowMain}>
                  <p className={s.rowTitle}>{p.name}</p>
                  <p className={s.rowSub}>{[p.role, p.dept].filter(Boolean).join(' · ') || 'Member'}</p>
                </div>
                <button type="button" className={`${s.btnLine} ${s.btnSm}`} disabled={busy === p.id}
                  onClick={() => act(p.id, () => remove(p.id), `Request from ${p.name} declined`)}>Decline</button>
                <button type="button" className={`${s.btnDark} ${s.btnSm}`} disabled={busy === p.id}
                  onClick={() => act(p.id, () => accept(p.id), `You are now connected with ${p.name}`)}>Accept</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={s.toolbar} data-reveal>
        <label className={s.search}>
          {I.search}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, department or place…" aria-label="Search people" />
        </label>
        <div className={s.pills}>
          {ROLES.map((r) => (
            <button key={r} type="button" className={s.pill} aria-pressed={role === r} onClick={() => setRole(r)}>{r === 'All' ? 'All' : `${r}s`}</button>
          ))}
          <select className={s.select} value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
            <option value="All">All departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <p className={s.count} aria-live="polite">
        {list.length} {list.length === 1 ? 'person' : 'people'}{sentCount ? ` · ${sentCount} request${sentCount > 1 ? 's' : ''} sent` : ''}
      </p>
      {error && <p className={s.empty}>Could not load people: {error}</p>}
      <div ref={grid} className={s.peopleGrid}>
        {list.map((p) => {
          const rel = relationOf(p.id);
          return (
            <article key={p.id} className={s.person}>
              <span className={s.personAv} style={softAvatar(p.color)}>{p.initials}</span>
              <h2 className={s.personName}>{p.name}</h2>
              {p.role && <span className={`${s.tag} ${ROLE_TAG[p.role] ?? s.tBlue}`}>{p.role}</span>}
              <p className={s.personDept}>{p.dept || '—'}</p>
              <p className={s.personCountry}>{p.place || ' '}</p>
              <div className={s.personActions}>
                {rel === 'none' && (
                  <button type="button" className={`${s.btnLine} ${s.btnSm}`} disabled={busy === p.id}
                    onClick={() => act(p.id, () => request(p.id), `Connection request sent to ${p.name}`)}>Connect</button>
                )}
                {rel === 'sent' && (
                  <button type="button" className={`${s.btnLine} ${s.btnSm} ${s.connected}`} aria-pressed="true" disabled={busy === p.id}
                    onClick={() => act(p.id, () => remove(p.id), `Request to ${p.name} withdrawn`)}>{I.check} Requested</button>
                )}
                {rel === 'incoming' && (
                  <button type="button" className={`${s.btnDark} ${s.btnSm}`} disabled={busy === p.id}
                    onClick={() => act(p.id, () => accept(p.id), `You are now connected with ${p.name}`)}>Accept</button>
                )}
                {rel === 'connected' && (
                  <button type="button" className={`${s.btnLine} ${s.btnSm} ${s.connected}`} disabled>{I.check} Connected</button>
                )}
                <Link href="/dashboard/chats" className={`${s.btnDark} ${s.btnSm}`} aria-label={`Message ${p.name}`}>{I.chat}</Link>
              </div>
            </article>
          );
        })}
        {loaded && !members.length && !error && (
          <p className={s.empty}>You are the first member here. People appear as soon as they sign up and confirm their email.</p>
        )}
        {loaded && members.length > 0 && !list.length && (
          <p className={s.empty}>
            No one matches those filters.{' '}
            <button type="button" className={s.cardLink} style={{ border: 0, background: 'none', cursor: 'pointer' }}
              onClick={() => { setRole('All'); setDept('All'); setQ(''); }}>Clear filters</button>
          </p>
        )}
      </div>
      {toastNode}
    </>
  );
}

'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Hero, I, useToast } from '@/components/portal/ui';
import { DEPARTMENTS, PEOPLE, type Role, softAvatar } from '@/lib/data';
import { useListAnimation } from '@/lib/hooks';
import { usePersisted, toggleIn } from '@/lib/store';
import s from '@/styles/Portal.module.css';

const ROLES: ('All' | Role)[] = ['All', 'Intern', 'Fellow', 'Volunteer'];
const ROLE_TAG: Record<Role, string> = { Intern: s.tGreen, Fellow: s.tGold, Volunteer: s.tBlue };

export default function PeoplePage() {
  const [role, setRole] = useState<'All' | Role>('All');
  const [dept, setDept] = useState('All');
  const [q, setQ] = useState('');
  const [requested, setRequested] = usePersisted<string[]>('auy-connections', []);
  const [toast, toastNode] = useToast();
  const grid = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return PEOPLE.filter((p) => (role === 'All' || p.role === role) && (dept === 'All' || p.dept === dept) &&
      (!t || `${p.name} ${p.dept} ${p.country}`.toLowerCase().includes(t)));
  }, [role, dept, q]);

  useListAnimation(grid, `${role}|${dept}|${q}`);

  return (
    <>
      <Hero plain eyebrow="AU Youth Network" title="Your *People*" desc="Connect with interns, fellows and volunteers serving across the Union.">
        <div className={s.heroStat}>
          <span className={s.heroStatNum}>{PEOPLE.length}</span>
          <span className={s.heroStatLabel}>members in your cohort</span>
        </div>
      </Hero>

      <div className={s.toolbar} data-reveal>
        <label className={s.search}>
          {I.search}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, department or country…" aria-label="Search people" />
        </label>
        <div className={s.pills}>
          {ROLES.map((r) => (
            <button key={r} type="button" className={s.pill} aria-pressed={role === r} onClick={() => setRole(r)}>{r === 'All' ? 'All' : `${r}s`}</button>
          ))}
          <select className={s.select} value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
            <option value="All">All departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <p className={s.count} aria-live="polite">
        {list.length} {list.length === 1 ? 'person' : 'people'}{requested.length ? ` · ${requested.length} connection request${requested.length > 1 ? 's' : ''} sent` : ''}
      </p>
      <div ref={grid} className={s.peopleGrid}>
        {list.map((p) => {
          const sent = requested.includes(p.id);
          return (
            <article key={p.id} className={s.person}>
              <span className={s.personAv} style={softAvatar(p.c)}>{p.i}</span>
              <h2 className={s.personName}>{p.name}</h2>
              <span className={`${s.tag} ${ROLE_TAG[p.role]}`}>{p.role}</span>
              <p className={s.personDept}>{p.dept}</p>
              <p className={s.personCountry}><span aria-hidden="true">{p.flag}</span> {p.country}</p>
              <div className={s.personActions}>
                <button type="button" className={`${s.btnLine} ${s.btnSm} ${sent ? s.connected : ''}`} aria-pressed={sent}
                  onClick={() => { setRequested((r) => toggleIn(r, p.id)); toast(sent ? `Request to ${p.name} withdrawn` : `Connection request sent to ${p.name}`); }}>
                  {sent ? <>{I.check} Requested</> : 'Connect'}
                </button>
                <Link href="/dashboard/chats" className={`${s.btnDark} ${s.btnSm}`} aria-label={`Message ${p.name}`}>{I.chat}</Link>
              </div>
            </article>
          );
        })}
        {!list.length && (
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

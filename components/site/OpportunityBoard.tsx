'use client';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useListAnimation } from '../../lib/hooks';
import { Bookmark, Clock, Pin, Search } from './icons';
import s from '../../styles/Site.module.css';

type Kind = 'Internship' | 'Fellowship' | 'Volunteer' | 'Event';
const ACCENT: Record<Kind, string> = { Internship: '#117302', Fellowship: '#8F2D56', Volunteer: '#0072C6', Event: '#b86e00' };

const OPPS: { id: string; kind: Kind; title: string; text: string; place: string; length: string; deadline: string }[] = [
  { id: 'o1', kind: 'Internship', title: 'Policy Research Intern — HRST', text: 'Support research on youth employment and skills policy across member states.', place: 'Addis Ababa', length: '6 months', deadline: 'Closes 30 Nov' },
  { id: 'o2', kind: 'Fellowship', title: 'Young Africa Leadership Fellowship', text: 'A year-long fellowship pairing emerging leaders with senior AU mentors.', place: 'Hybrid', length: '12 months', deadline: 'Closes 15 Dec' },
  { id: 'o3', kind: 'Volunteer', title: 'AU Youth Volunteer Programme — Cohort 7', text: 'Six-month placements in communications, data and operations teams.', place: 'Addis Ababa', length: '6 months', deadline: 'Closes 20 Nov' },
  { id: 'o4', kind: 'Event', title: 'Pan-African Youth Innovation Summit', text: 'Apply for a delegate place at the annual summit on digital public infrastructure.', place: 'Addis Ababa', length: '3 days', deadline: 'Register by 1 Nov' },
  { id: 'o5', kind: 'Internship', title: 'Communications Intern — Information & Comms', text: 'Write, design and publish stories from across the Union.', place: 'Remote', length: '4 months', deadline: 'Closes 8 Nov' },
  { id: 'o6', kind: 'Fellowship', title: 'Climate & Agriculture Research Fellowship', text: 'Fund and publish applied research on climate-resilient food systems.', place: 'Nairobi', length: '9 months', deadline: 'Closes 31 Dec' },
  { id: 'o7', kind: 'Volunteer', title: 'Election Observation Support Volunteer', text: 'Join logistics and reporting teams for upcoming observation missions.', place: 'Various', length: '2 months', deadline: 'Rolling' },
  { id: 'o8', kind: 'Event', title: 'Skills Development Workshop Series', text: 'Fortnightly workshops on data analysis, public speaking and policy writing.', place: 'Online', length: 'Fortnightly', deadline: 'Open now' },
];

const KINDS: ('All' | Kind)[] = ['All', 'Internship', 'Fellowship', 'Volunteer', 'Event'];

export default function OpportunityBoard() {
  const [kind, setKind] = useState<'All' | Kind>('All');
  const [q, setQ] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const grid = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return OPPS.filter((o) => (kind === 'All' || o.kind === kind) &&
      (!t || `${o.title} ${o.text} ${o.place}`.toLowerCase().includes(t)));
  }, [kind, q]);

  useListAnimation(grid, `${kind}|${q}`);

  return (
    <>
      <div className={s.toolbar} data-reveal>
        <div className={s.pills} role="group" aria-label="Filter by type">
          {KINDS.map((k) => (
            <button key={k} type="button" className={s.pill} aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>
          ))}
        </div>
        <label className={s.search}>
          <Search />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles, places…" aria-label="Search opportunities" />
        </label>
      </div>
      <p className={s.resultCount} aria-live="polite">
        {list.length} {list.length === 1 ? 'opportunity' : 'opportunities'}{saved.length ? ` · ${saved.length} saved` : ''}
      </p>
      <div ref={grid} className={s.oppGrid}>
        {list.map((o) => {
          const isSaved = saved.includes(o.id);
          return (
            <article key={o.id} className={s.opp} style={{ ['--accent' as string]: ACCENT[o.kind] }}>
              <div className={s.oppTop}>
                <span className={s.oppType}>{o.kind}</span>
                <span className={s.oppDeadline}>{o.deadline}</span>
              </div>
              <h3 className={s.oppTitle}>{o.title}</h3>
              <p className={s.oppText}>{o.text}</p>
              <div className={s.oppMeta}>
                <span><Pin />{o.place}</span>
                <span><Clock />{o.length}</span>
              </div>
              <div className={s.oppFoot}>
                <button type="button" className={s.save} aria-pressed={isSaved}
                  onClick={() => setSaved((p) => (isSaved ? p.filter((x) => x !== o.id) : [...p, o.id]))}>
                  <Bookmark />{isSaved ? 'Saved' : 'Save'}
                </button>
                <Link href="/sign-up" className={s.btnDark} style={{ height: 42, padding: '0 18px', fontSize: 14 }}>Apply</Link>
              </div>
            </article>
          );
        })}
        {!list.length && <p className={s.empty}>No opportunities match that search. Try another filter.</p>}
      </div>
    </>
  );
}

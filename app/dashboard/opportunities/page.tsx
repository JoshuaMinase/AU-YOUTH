'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Hero, I } from '@/components/portal/ui';
import { OpportunityEditor } from '@/components/portal/OpportunityEditor';
import { TAG_CLASS } from '@/components/portal/tags';
import { useListAnimation } from '@/lib/hooks';
import { useMe } from '@/lib/me';
import { OPP_KINDS, formatWhen } from '@/lib/news';
import { useOpportunities } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

const KINDS = ['All', ...OPP_KINDS] as const;

export default function OpportunitiesPage() {
  const { items, loaded, error } = useOpportunities();
  const { me } = useMe();
  const router = useRouter();
  const [writing, setWriting] = useState(false);
  const [kind, setKind] = useState<(typeof KINDS)[number]>('All');
  const [q, setQ] = useState('');
  const grid = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items.filter((o) => (kind === 'All' || o.kind === kind) && (!t || `${o.title} ${o.excerpt} ${o.source}`.toLowerCase().includes(t)));
  }, [items, kind, q]);

  useListAnimation(grid, `${kind}|${q}|${loaded}`);

  return (
    <>
      <Hero plain eyebrow="AU Youth Network" title="Open *Opportunities*" desc="Internships, fellowships, volunteering and events. Apply, register or ask to be reminded.">
        {me.access !== 'user' && <button type="button" className={s.btnDark} onClick={() => setWriting(true)}>{I.plus} New opportunity</button>}
      </Hero>
      {writing && <OpportunityEditor onClose={() => setWriting(false)} onSaved={(slug) => router.push(`/dashboard/opportunities/${slug}`)} />}

      <div className={s.toolbar} data-reveal>
        <div className={s.pills} role="group" aria-label="Filter by type">
          {KINDS.map((k) => (
            <button key={k} type="button" className={s.pill} aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>
          ))}
        </div>
        <label className={s.search}>
          {I.search}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search opportunities…" aria-label="Search opportunities" />
        </label>
      </div>

      <p className={s.count} aria-live="polite">
        {error ? `Could not load opportunities: ${error}` : !loaded ? 'Loading…' : `${list.length} ${list.length === 1 ? 'opportunity' : 'opportunities'}`}
      </p>
      <div ref={grid} className={s.newsGrid}>
        {list.map((o) => (
          <Link key={o.slug} href={`/dashboard/opportunities/${o.slug}`} className={s.newsCard}>
            <div className={s.newsImg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.img} alt="" loading="lazy" />
            </div>
            <div className={s.newsBody}>
              <span><span className={`${s.tag} ${TAG_CLASS[o.kind]}`}>{o.kind}</span></span>
              <h2 className={s.newsTitle}>{o.title}</h2>
              <p className={s.newsExcerpt}>{o.excerpt}</p>
              <div className={s.newsMeta}>
                <b>{o.source}</b><span aria-hidden="true">·</span>
                <span>{o.eventAt ? formatWhen(o.eventAt) : o.meta}</span>
              </div>
            </div>
          </Link>
        ))}
        {loaded && !error && !list.length && <p className={s.empty}>{items.length ? 'Nothing matches that filter.' : 'No opportunities yet.'}</p>}
      </div>
    </>
  );
}

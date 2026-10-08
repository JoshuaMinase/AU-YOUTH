'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Hero, I } from '@/components/portal/ui';
import { NewsEditor } from '@/components/portal/NewsEditor';
import { TAG_CLASS } from '@/components/portal/tags';
import { NEWS_CATS, type NewsItem } from '@/lib/data';
import { useListAnimation } from '@/lib/hooks';
import { useMe } from '@/lib/me';
import { useNews } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

function Meta({ n }: { n: NewsItem }) {
  return <div className={s.newsMeta}><b>{n.source}</b><span aria-hidden="true">·</span><span>{n.meta}</span></div>;
}

export default function NewsPage() {
  const { news, loaded, error } = useNews();
  const { me } = useMe();
  const router = useRouter();
  const [writing, setWriting] = useState(false);
  const [cat, setCat] = useState<(typeof NEWS_CATS)[number]>('All');
  const [q, setQ] = useState('');
  const grid = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return news.filter((n) => (cat === 'All' || n.cat === cat) && (!t || `${n.title} ${n.excerpt} ${n.source}`.toLowerCase().includes(t)));
  }, [news, cat, q]);
  /* the featured story leads only on the unfiltered view */
  const featured = cat === 'All' && !q ? list.find((n) => n.featured) : undefined;
  const rest = list.filter((n) => n !== featured);

  useListAnimation(grid, `${cat}|${q}|${loaded}`);

  return (
    <>
      <Hero plain eyebrow="AU Youth Network" title="News & *Updates*" desc="Official initiatives, opportunities and developments from across the Union.">
        {me.access !== 'user' && <button type="button" className={s.btnDark} onClick={() => setWriting(true)}>{I.plus} New article</button>}
      </Hero>
      {writing && <NewsEditor onClose={() => setWriting(false)} onSaved={(slug) => router.push(`/dashboard/news/${slug}`)} />}

      <div className={s.toolbar} data-reveal>
        <div className={s.pills} role="group" aria-label="Filter by category">
          {NEWS_CATS.map((c) => (
            <button key={c} type="button" className={s.pill} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <label className={s.search}>
          {I.search}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search news…" aria-label="Search news" />
        </label>
      </div>

      {featured && (
        <Link href={`/dashboard/news/${featured.slug}`} className={s.featured}>
          <div className={s.featuredImg}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featured.img} alt="" />
          </div>
          <div className={s.featuredBody}>
            <span><span className={`${s.tag} ${TAG_CLASS[featured.tag]}`}>{featured.tag}</span></span>
            <h2 className={s.featuredTitle}>{featured.title}</h2>
            <p className={s.newsExcerpt} style={{ flex: 'none', fontSize: 15 }}>{featured.excerpt}</p>
            <Meta n={featured} />
          </div>
        </Link>
      )}

      <p className={s.count} aria-live="polite">
        {error ? `Could not load news: ${error}` : !loaded ? 'Loading…' : `${list.length} ${list.length === 1 ? 'story' : 'stories'}`}
      </p>
      <div ref={grid} className={s.newsGrid}>
        {rest.map((n) => (
          <Link key={n.slug} href={`/dashboard/news/${n.slug}`} className={s.newsCard}>
            <div className={s.newsImg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={n.img} alt="" loading="lazy" />
            </div>
            <div className={s.newsBody}>
              <span><span className={`${s.tag} ${TAG_CLASS[n.tag]}`}>{n.tag}</span></span>
              <h2 className={s.newsTitle}>{n.title}</h2>
              <p className={s.newsExcerpt}>{n.excerpt}</p>
              <Meta n={n} />
            </div>
          </Link>
        ))}
        {loaded && !error && !list.length && <p className={s.empty}>{news.length ? 'No stories match that filter.' : 'No news yet.'}</p>}
      </div>
    </>
  );
}

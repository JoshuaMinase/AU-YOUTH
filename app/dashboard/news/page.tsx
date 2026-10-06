import s from '@/styles/Dashboard.module.css';

const CATS = ['All', 'Initiatives', 'Opportunities', 'Events', 'Partnerships', 'Announcements'];

const NEWS = [
  {
    tag: 'Initiative',
    title: 'AU launches new Youth Engagement Framework for 2026–2030',
    excerpt: 'The African Union Commission has unveiled an ambitious five-year strategy to deepen youth participation across all member states and institutional bodies.',
    meta: '2 hours ago',
    source: 'AU Commission',
    img: '/assets/card-img-1.jpg',
    featured: true,
  },
  {
    tag: 'Opportunity',
    title: 'Applications open: AU Youth Volunteer Programme — Cohort 7',
    excerpt: 'Young professionals from across the continent are invited to apply for a six-month volunteer placement at the AU headquarters in Addis Ababa.',
    meta: 'Yesterday',
    source: 'Political Affairs',
    img: '/assets/card-img-2.jpg',
    featured: false,
  },
  {
    tag: 'Event',
    title: 'Pan-African Youth Innovation Summit to be held in Addis Ababa',
    excerpt: 'The annual summit convenes over 500 young innovators, entrepreneurs and policy makers from 55 member states.',
    meta: '3 days ago',
    source: 'HRST Department',
    img: '/assets/card-img-3.jpg',
    featured: false,
  },
  {
    tag: 'Development',
    title: 'New skills programme targets 10,000 young professionals across member states',
    excerpt: 'A joint initiative between the AU and key continental partners will provide digital and vocational training to youth across all regions.',
    meta: '4 days ago',
    source: 'AU Commission',
    img: '/assets/card-img-4.jpg',
    featured: false,
  },
  {
    tag: 'Partnership',
    title: 'AU and AfDB deepen cooperation on youth employment and entrepreneurship',
    excerpt: 'The two continental institutions have signed a memorandum of understanding to co-fund youth-led businesses and employment hubs.',
    meta: '5 days ago',
    source: 'Economic Affairs',
    img: '/assets/card-img-1.jpg',
    featured: false,
  },
  {
    tag: 'Announcement',
    title: 'Quarterly intern coordination meeting — agenda and venue confirmed',
    excerpt: 'All active interns and fellows are requested to attend the upcoming coordination session in Mandela Hall.',
    meta: '6 days ago',
    source: 'Protocol Office',
    img: '/assets/card-img-2.jpg',
    featured: false,
  },
];

const TAG_COLORS: Record<string, string> = {
  Initiative:   s.tagGreen,
  Opportunity:  s.tagGold,
  Event:        s.tagBlue,
  Development:  s.tagPurple,
  Partnership:  s.tagTeal,
  Announcement: s.tagMuted,
};

export default function NewsPage() {
  return (
    <>
      {/* ── Page header ────────────────────────────── */}
      <div className={s.pageHero}>
        <div>
          <p className={s.pageEyebrow}>AU YOUTH NETWORK</p>
          <h1 className={s.pageHeading}>News &amp; Updates</h1>
          <p className={s.pageDesc}>
            Official initiatives, opportunities and developments from across the Union.
          </p>
        </div>
      </div>

      {/* ── Filter pills ───────────────────────────── */}
      <div className={s.filterBar}>
        {CATS.map((cat, i) => (
          <button
            key={cat}
            className={`${s.filterPill} ${i === 0 ? s.filterPillActive : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Featured article ───────────────────────── */}
      {NEWS.filter(n => n.featured).map(item => (
        <article key={item.title} className={s.newsFeatured}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.img} alt="" className={s.newsFeaturedImg} />
          <div className={s.newsFeaturedBody}>
            <span className={`${s.newsTag} ${TAG_COLORS[item.tag] ?? s.tagMuted}`}>{item.tag}</span>
            <h2 className={s.newsFeaturedTitle}>{item.title}</h2>
            <p className={s.newsFeaturedExcerpt}>{item.excerpt}</p>
            <div className={s.newsMeta}>
              <span className={s.newsSource}>{item.source}</span>
              <span className={s.newsDot}>·</span>
              <span>{item.meta}</span>
            </div>
          </div>
        </article>
      ))}

      {/* ── News grid ──────────────────────────────── */}
      <div className={s.newsGrid}>
        {NEWS.filter(n => !n.featured).map(item => (
          <article key={item.title} className={s.newsCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className={s.newsCardImgWrap}>
              <img src={item.img} alt="" className={s.newsCardImg} />
            </div>
            <div className={s.newsCardBody}>
              <span className={`${s.newsTag} ${TAG_COLORS[item.tag] ?? s.tagMuted}`}>{item.tag}</span>
              <h2 className={s.newsTitle}>{item.title}</h2>
              <p className={s.newsExcerpt}>{item.excerpt}</p>
              <div className={s.newsMeta}>
                <span className={s.newsSource}>{item.source}</span>
                <span className={s.newsDot}>·</span>
                <span>{item.meta}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

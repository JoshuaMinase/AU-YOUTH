import s from '@/styles/Dashboard.module.css';

const CATS = ['All', 'Initiatives', 'Opportunities', 'Events', 'Partnerships'];

const NEWS = [
  { tag: 'Initiative',  title: 'AU launches new Youth Engagement Framework for 2026–2030',                         meta: '2 hours ago · AU Commission',       img: '/assets/card-img-1.jpg' },
  { tag: 'Opportunity', title: 'Applications open: AU Youth Volunteer Programme — Cohort 7',                      meta: 'Yesterday · Political Affairs',      img: '/assets/card-img-2.jpg' },
  { tag: 'Event',       title: 'Pan-African Youth Innovation Summit to be held in Addis Ababa',                   meta: '3 days ago · HRST Department',       img: '/assets/card-img-3.jpg' },
  { tag: 'Development', title: 'New skills programme targets 10,000 young professionals across member states',    meta: '4 days ago · AU Commission',         img: '/assets/card-img-4.jpg' },
  { tag: 'Partnership', title: 'AU and AfDB deepen cooperation on youth employment and entrepreneurship',         meta: '5 days ago · Economic Affairs',      img: '/assets/card-img-1.jpg' },
  { tag: 'Announcement',title: 'Quarterly intern coordination meeting — agenda and venue confirmed',              meta: '6 days ago · Protocol Office',       img: '/assets/card-img-2.jpg' },
];

export default function NewsPage() {
  return (
    <>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>News</h1>
        <p className={s.pageSubtitle}>Official initiatives, events and developments from across the Union.</p>
      </div>

      <div className={s.filterRow}>
        {CATS.map((cat, i) => (
          <button key={cat} className={`${s.filterPill} ${i === 0 ? s.filterPillActive : ''}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className={s.newsGrid}>
        {NEWS.map(item => (
          <article key={item.title} className={s.newsCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.img} alt="" className={s.newsCardImg} />
            <div className={s.newsCardBody}>
              <span className={s.newsTag}>{item.tag}</span>
              <h2 className={s.newsTitle}>{item.title}</h2>
              <span className={s.newsMeta}>{item.meta}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

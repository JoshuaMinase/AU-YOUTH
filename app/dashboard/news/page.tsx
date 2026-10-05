import s from '@/styles/Dashboard.module.css';

const NEWS = [
  {
    tag: 'Initiative',
    title: 'AU launches new Youth Engagement Framework for 2026–2030',
    meta: '2 hours ago · African Union Commission',
    img: '/assets/card-img-1.jpg',
  },
  {
    tag: 'Opportunity',
    title: 'Applications open: AU Youth Volunteer Programme — Cohort 7',
    meta: 'Yesterday · Department of Political Affairs',
    img: '/assets/card-img-2.jpg',
  },
  {
    tag: 'Event',
    title: 'Pan-African Youth Innovation Summit to be held in Addis Ababa',
    meta: '3 days ago · HRST Department',
    img: '/assets/card-img-3.jpg',
  },
  {
    tag: 'Development',
    title: 'New skills programme targets 10,000 young professionals across 55 member states',
    meta: '4 days ago · AU Commission',
    img: '/assets/card-img-4.jpg',
  },
  {
    tag: 'Partnership',
    title: 'AU and AfDB deepen cooperation on youth employment and entrepreneurship',
    meta: '5 days ago · Economic Affairs',
    img: '/assets/card-img-1.jpg',
  },
  {
    tag: 'Announcement',
    title: 'Quarterly intern coordination meeting — agenda and venue confirmed',
    meta: '6 days ago · Protocol Office',
    img: '/assets/card-img-2.jpg',
  },
];

const CATEGORIES = ['All', 'Initiatives', 'Opportunities', 'Events', 'Partnerships'];

export default function NewsPage() {
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>AU News</h1>
          <p className={s.pageSubtitle}>Official initiatives, events and developments from across the Union.</p>
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat}
            style={{
              padding: '7px 16px',
              borderRadius: 999,
              border: i === 0 ? 'none' : '1.5px solid #eaecef',
              background: i === 0 ? '#032210' : '#fff',
              color: i === 0 ? '#fff' : 'rgba(3,34,16,0.6)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News grid */}
      <div className={s.grid3}>
        {NEWS.map(item => (
          <article key={item.title} className={s.newsCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.img} alt="" className={s.newsCardImg} />
            <div className={s.newsCardBody}>
              <span className={s.newsCardTag}>{item.tag}</span>
              <h2 className={s.newsCardTitle}>{item.title}</h2>
              <span className={s.newsCardMeta}>{item.meta}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

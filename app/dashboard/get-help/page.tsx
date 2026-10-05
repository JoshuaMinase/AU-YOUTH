import s from '@/styles/Dashboard.module.css';

const HELP_CARDS = [
  {
    title: 'Contact a department',
    sub: 'Send a direct message to an AU department or office.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 4h12a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V5a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Report an issue',
    sub: 'Let us know about a technical problem or platform concern.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="10" cy="10" r="7" strokeLinecap="round"/>
        <path d="M10 7v4" strokeLinecap="round"/>
        <circle cx="10" cy="13.5" r="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    title: 'Intern handbook',
    sub: 'Access the AU intern guide, policies and code of conduct.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4" y="3" width="12" height="14" rx="2" strokeLinecap="round"/>
        <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'FAQs',
    sub: 'Browse frequently asked questions from the intern community.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="10" cy="10" r="7"/>
        <path d="M10 11v-1a2 2 0 10-2-2" strokeLinecap="round"/>
        <circle cx="10" cy="14" r="0.5" fill="currentColor"/>
      </svg>
    ),
  },
];

const DEPTS = [
  { name: 'Human Resources, Science & Technology (HRST)', email: 'hrst@au.int' },
  { name: 'Political Affairs & Peace',                    email: 'paps@au.int' },
  { name: 'Economic Affairs',                             email: 'ea@au.int'   },
  { name: 'Social Affairs',                               email: 'sa@au.int'   },
  { name: 'Infrastructure & Energy',                      email: 'ie@au.int'   },
];

export default function GetHelpPage() {
  return (
    <>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Get Help</h1>
        <p className={s.pageSubtitle}>Find support, contact departments and access intern resources.</p>
      </div>

      {/* Help cards */}
      <div className={s.helpGrid}>
        {HELP_CARDS.map(h => (
          <div key={h.title} className={s.helpCard}>
            <div className={s.helpCardIcon}>{h.icon}</div>
            <p className={s.helpCardTitle}>{h.title}</p>
            <p className={s.helpCardSub}>{h.sub}</p>
          </div>
        ))}
      </div>

      {/* Department contacts */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}>Department Contacts</span>
        </div>
        {DEPTS.map(d => (
          <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #F7F7F5' }}>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#032210' }}>{d.name}</p>
              <p style={{ margin:0, fontSize:11, color:'rgba(3,34,16,0.4)' }}>{d.email}</p>
            </div>
            <button className={s.btnPrimary} style={{ fontSize:12, padding:'7px 14px' }}>Contact</button>
          </div>
        ))}
      </div>
    </>
  );
}

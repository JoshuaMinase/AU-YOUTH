import s from '@/styles/Dashboard.module.css';

const COLORS = ['#C9A84C','#7BC9A0','#6BB5D9','#E07B7B','#A78BFA','#F9A74B','#60C9A8','#89B4D9'];
const ROLES  = ['All', 'Interns', 'Fellows', 'Volunteers'];
const DEPTS  = ['All Departments','HRST','Political Affairs','Peace & Security','Economic Affairs'];

const PEOPLE = [
  { i:'AM', name:'Amara Mensah',    role:'Intern',     dept:'HRST',               country:'Ghana',       flag:'🇬🇭', c:COLORS[0] },
  { i:'FO', name:'Fatima Osei',     role:'Fellow',     dept:'Peace & Security',   country:'Nigeria',     flag:'🇳🇬', c:COLORS[1] },
  { i:'KB', name:'Kofi Boateng',    role:'Volunteer',  dept:'Economic Affairs',   country:'Senegal',     flag:'🇸🇳', c:COLORS[2] },
  { i:'ZA', name:'Zinash Alemu',    role:'Intern',     dept:'Political Affairs',  country:'Ethiopia',    flag:'🇪🇹', c:COLORS[3] },
  { i:'ND', name:'Nadia Diallo',    role:'Fellow',     dept:'Social Affairs',     country:'Ivory Coast', flag:'🇨🇮', c:COLORS[4] },
  { i:'TM', name:'Tariq Moussa',    role:'Intern',     dept:'Infrastructure',     country:'Morocco',     flag:'🇲🇦', c:COLORS[5] },
  { i:'AA', name:'Amina Abdi',      role:'Volunteer',  dept:'Agriculture',        country:'Kenya',       flag:'🇰🇪', c:COLORS[6] },
  { i:'JN', name:'Jean Nkosi',      role:'Intern',     dept:'Trade & Industry',   country:'DRC',         flag:'🇨🇩', c:COLORS[7] },
  { i:'BS', name:'Binta Sow',       role:'Fellow',     dept:'HRST',               country:'Guinea',      flag:'🇬🇳', c:COLORS[0] },
  { i:'EW', name:'Emmanuel Waweru', role:'Intern',     dept:'Legal Affairs',      country:'Uganda',      flag:'🇺🇬', c:COLORS[1] },
  { i:'LT', name:'Layla Tadesse',   role:'Volunteer',  dept:'Education',          country:'Eritrea',     flag:'🇪🇷', c:COLORS[2] },
  { i:'SM', name:'Sola Martins',    role:'Intern',     dept:'Finance',            country:'Nigeria',     flag:'🇳🇬', c:COLORS[3] },
];

const ROLE_TAG: Record<string, string> = {
  Intern:    s.tagGreen,
  Fellow:    s.tagGold,
  Volunteer: s.tagBlue,
};

export default function PeoplePage() {
  return (
    <>
      {/* ── Page header ────────────────────────────── */}
      <div className={s.pageHero}>
        <div>
          <p className={s.pageEyebrow}>AU YOUTH NETWORK</p>
          <h1 className={s.pageHeading}>People</h1>
          <p className={s.pageDesc}>
            Connect with interns, fellows and volunteers serving across the Union.
          </p>
        </div>
        <div className={s.pageHeroStat}>
          <span className={s.heroStatNum}>{PEOPLE.length}</span>
          <span className={s.heroStatLabel}>members online</span>
        </div>
      </div>

      {/* ── Search + filters ───────────────────────── */}
      <div className={s.toolBar}>
        <div className={s.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="9" cy="9" r="5.5"/><path d="M13.5 13.5L17 17" strokeLinecap="round"/>
          </svg>
          <input className={s.searchInput} placeholder="Search by name, department or country…" />
        </div>
        <div className={s.filterBar} style={{ marginTop: 0 }}>
          {ROLES.map((r, i) => (
            <button key={r} className={`${s.filterPill} ${i === 0 ? s.filterPillActive : ''}`}>{r}</button>
          ))}
          <select className={s.deptSelect}>
            {DEPTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* ── People grid ────────────────────────────── */}
      <div className={s.peopleGrid}>
        {PEOPLE.map(p => (
          <div key={p.name} className={s.personCard}>
            <div className={s.personAvatarWrap}>
              <div className={s.personAvatar} style={{ background: p.c }}>{p.i}</div>
            </div>
            <div className={s.personCardBody}>
              <p className={s.personName}>{p.name}</p>
              <span className={`${s.newsTag} ${ROLE_TAG[p.role] ?? s.tagMuted}`}>{p.role}</span>
              <p className={s.personDept}>{p.dept}</p>
              <p className={s.personCountry}>
                <span aria-hidden="true">{p.flag}</span>{' '}
                {p.country}
              </p>
            </div>
            <button className={s.connectBtn}>Connect</button>
          </div>
        ))}
      </div>
    </>
  );
}

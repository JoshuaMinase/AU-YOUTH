import s from '@/styles/Dashboard.module.css';

const COLORS = ['#C9A84C','#7BC9A0','#6BB5D9','#E07B7B','#A78BFA','#F9A74B','#60C9A8','#89B4D9'];
const ROLES  = ['All', 'Interns', 'Fellows', 'Volunteers'];
const DEPTS  = ['All Departments','HRST','Political Affairs','Peace & Security','Economic Affairs'];

const PEOPLE = [
  { i:'AM', name:'Amara Mensah',    role:'Intern · HRST',              country:'Ghana',        c:COLORS[0] },
  { i:'FO', name:'Fatima Osei',     role:'Fellow · Peace & Security',  country:'Nigeria',      c:COLORS[1] },
  { i:'KB', name:'Kofi Boateng',    role:'Volunteer · Economic Affairs',country:'Senegal',     c:COLORS[2] },
  { i:'ZA', name:'Zinash Alemu',    role:'Intern · Political Affairs', country:'Ethiopia',     c:COLORS[3] },
  { i:'ND', name:'Nadia Diallo',    role:'Fellow · Social Affairs',    country:'Ivory Coast',  c:COLORS[4] },
  { i:'TM', name:'Tariq Moussa',    role:'Intern · Infrastructure',    country:'Morocco',      c:COLORS[5] },
  { i:'AA', name:'Amina Abdi',      role:'Volunteer · Agriculture',    country:'Kenya',        c:COLORS[6] },
  { i:'JN', name:'Jean Nkosi',      role:'Intern · Trade & Industry',  country:'DRC',          c:COLORS[7] },
  { i:'BS', name:'Binta Sow',       role:'Fellow · HRST',              country:'Guinea',       c:COLORS[0] },
  { i:'EW', name:'Emmanuel Waweru', role:'Intern · Legal Affairs',     country:'Uganda',       c:COLORS[1] },
  { i:'LT', name:'Layla Tadesse',   role:'Volunteer · Education',      country:'Eritrea',      c:COLORS[2] },
  { i:'SM', name:'Sola Martins',    role:'Intern · Finance',           country:'Nigeria',      c:COLORS[3] },
];

export default function PeoplePage() {
  return (
    <>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>People</h1>
        <p className={s.pageSubtitle}>Connect with interns, fellows and volunteers across the Union.</p>
      </div>

      <div className={s.searchWrap}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="rgba(3,34,16,0.35)" strokeWidth="1.8">
          <circle cx="9" cy="9" r="5.5"/><path d="M13.5 13.5L17 17" strokeLinecap="round"/>
        </svg>
        <input className={s.searchInput} placeholder="Search by name, department or country…" />
      </div>

      <div className={s.filterRow}>
        {ROLES.map((r, i) => (
          <button key={r} className={`${s.filterPill} ${i === 0 ? s.filterPillActive : ''}`}>{r}</button>
        ))}
        <select style={{ marginLeft:'auto', padding:'6px 12px', borderRadius:8, border:'1.5px solid #ECEAE4', fontSize:12, fontFamily:'inherit', color:'#032210', background:'#fff', outline:'none', cursor:'pointer' }}>
          {DEPTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className={s.peopleGrid}>
        {PEOPLE.map(p => (
          <div key={p.name} className={s.personCard}>
            <div className={s.personAvatar} style={{ background: p.c }}>{p.i}</div>
            <p className={s.personName}>{p.name}</p>
            <p className={s.personRole}>{p.role}</p>
            <p className={s.personCountry}>{p.country}</p>
            <button className={s.connectBtn}>Connect</button>
          </div>
        ))}
      </div>
    </>
  );
}

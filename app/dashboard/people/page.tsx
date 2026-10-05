import s from '@/styles/Dashboard.module.css';

const COLORS = ['#FBB13C', '#7BC9A0', '#6BB5D9', '#E07B7B', '#A78BFA', '#F9A74B', '#60C9A8', '#89B4D9'];

const PEOPLE = [
  { initials: 'AM', name: 'Amara Mensah', role: 'Intern · HRST', country: 'Ghana', color: COLORS[0] },
  { initials: 'FO', name: 'Fatima Osei', role: 'Fellow · Peace & Security', country: 'Nigeria', color: COLORS[1] },
  { initials: 'KB', name: 'Kofi Boateng', role: 'Volunteer · Economic Affairs', country: 'Senegal', color: COLORS[2] },
  { initials: 'ZA', name: 'Zinash Alemu', role: 'Intern · Political Affairs', country: 'Ethiopia', color: COLORS[3] },
  { initials: 'ND', name: 'Nadia Diallo', role: 'Fellow · Social Affairs', country: 'Ivory Coast', color: COLORS[4] },
  { initials: 'TM', name: 'Tariq Moussa', role: 'Intern · Infrastructure', country: 'Morocco', color: COLORS[5] },
  { initials: 'AA', name: 'Amina Abdi', role: 'Volunteer · Agriculture', country: 'Kenya', color: COLORS[6] },
  { initials: 'JN', name: 'Jean Nkosi', role: 'Intern · Trade & Industry', country: 'DRC', color: COLORS[7] },
  { initials: 'BS', name: 'Binta Sow', role: 'Fellow · HRST', country: 'Guinea', color: COLORS[0] },
  { initials: 'EW', name: 'Emmanuel Waweru', role: 'Intern · Legal Affairs', country: 'Uganda', color: COLORS[1] },
  { initials: 'LT', name: 'Layla Tadesse', role: 'Volunteer · Education', country: 'Eritrea', color: COLORS[2] },
  { initials: 'SM', name: 'Sola Martins', role: 'Intern · Finance', country: 'Nigeria', color: COLORS[3] },
];

const FILTERS = ['All', 'Interns', 'Fellows', 'Volunteers'];
const DEPARTMENTS = ['All Departments', 'HRST', 'Political Affairs', 'Peace & Security', 'Economic Affairs'];

export default function PeoplePage() {
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>People</h1>
          <p className={s.pageSubtitle}>Connect with interns, fellows and volunteers across the Union.</p>
        </div>
      </div>

      {/* Search */}
      <div className={s.searchBar}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="rgba(3,34,16,0.35)" strokeWidth="1.8">
          <circle cx="9" cy="9" r="5.5"/>
          <path d="M13.5 13.5L17 17" strokeLinecap="round"/>
        </svg>
        <input className={s.searchInput} placeholder="Search by name, department, or country…" />
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map((f, i) => (
          <button
            key={f}
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
            {f}
          </button>
        ))}
        <select
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            borderRadius: 10,
            border: '1.5px solid #eaecef',
            fontSize: 13,
            fontFamily: 'inherit',
            color: '#032210',
            background: '#fff',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* People grid */}
      <div className={s.gridAuto}>
        {PEOPLE.map(p => (
          <div key={p.name} className={s.personCard}>
            <div className={s.personAvatar} style={{ background: p.color }}>
              {p.initials}
            </div>
            <h3 className={s.personName}>{p.name}</h3>
            <p className={s.personRole}>{p.role}</p>
            <p className={s.personCountry}>🌍 {p.country}</p>
            <button className={s.personConnectBtn}>Connect</button>
          </div>
        ))}
      </div>
    </>
  );
}

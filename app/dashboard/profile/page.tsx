import s from '@/styles/Dashboard.module.css';

const SKILLS = [
  'Policy Analysis','Research','Public Speaking',
  'Data Analysis','Project Management',
  'French','English','Amharic',
];

const CONNECTIONS = [
  { i:'AM', name:'Amara Mensah',    role:'Intern · HRST',               c:'#C9A84C' },
  { i:'FO', name:'Fatima Osei',     role:'Fellow · Peace & Security',   c:'#7BC9A0' },
  { i:'KB', name:'Kofi Boateng',    role:'Volunteer · Economic Affairs', c:'#6BB5D9' },
  { i:'ZA', name:'Zinash Alemu',    role:'Intern · Political Affairs',  c:'#E07B7B' },
  { i:'ND', name:'Nadia Diallo',    role:'Fellow · Social Affairs',     c:'#A78BFA' },
];

const DETAILS = [
  ['Department', 'HRST'],
  ['Role',       'Intern'],
  ['Nationality','Ethiopian'],
  ['Based in',   'Addis Ababa, Ethiopia'],
  ['Start date', 'July 2026'],
  ['End date',   'December 2026'],
];

const EDUCATION = [
  ['University','Addis Ababa University'],
  ['Degree',    'MSc International Relations'],
  ['Year',      '2025–2026'],
];

export default function ProfilePage() {
  return (
    <>
      {/* ── Profile hero ───────────────────────────── */}
      <div className={s.profileHeroBanner}>
        {/* completion ring */}
        <div className={s.completionRingLg}>
          <svg viewBox="0 0 36 36" className={s.ringCircle} aria-hidden="true">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ddd4c5" strokeWidth="2.5"/>
            <circle
              cx="18" cy="18" r="15.9"
              fill="none" stroke="#D68B17" strokeWidth="2.5"
              strokeDasharray="65 35"
              strokeDashoffset="25"
              strokeLinecap="round"
            />
          </svg>
          <span className={s.ringPct}>65%</span>
        </div>

        {/* avatar */}
        <div className={s.profileAvatarLg}>YD</div>

        {/* name + details */}
        <div className={s.profileHeroInfo}>
          <p className={s.pageEyebrow}>YOUR PROFILE</p>
          <h1 className={s.profileName}>Yididiya D.</h1>
          <p className={s.profileSub}>Intern · Human Resources, Science &amp; Technology · AU Commission</p>
          <div className={s.profileActions}>
            <button className={s.btnPrimary}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
              Edit profile
            </button>
            <button className={s.btnSecondary}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Share profile
            </button>
          </div>
        </div>
      </div>

      {/* ── Completion notice ──────────────────────── */}
      <div className={s.completionBanner}>
        <div className={s.completionLeft}>
          <div className={s.completionMeta}>
            <span className={s.completionPct}>65% complete</span>
            <div className={s.progressBar}><div className={s.progressFill} style={{ width:'65%' }} /></div>
          </div>
          <p className={s.completionTitle}>Complete your profile</p>
          <p className={s.completionSub}>Add a profile photo, bio and areas of interest to reach 100%.</p>
        </div>
        <button className={s.btnPrimary}>Finish profile</button>
      </div>

      {/* ── Details grid ───────────────────────────── */}
      <div className={s.profileGrid}>
        {/* Details card */}
        <div className={s.infoCard}>
          <p className={s.infoCardTitle}>Details</p>
          <div className={s.infoGrid}>
            {DETAILS.map(([label, value]) => (
              <div key={label} className={s.infoItem}>
                <p className={s.infoLabel}>{label}</p>
                <p className={s.infoValue}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Education + skills card */}
        <div className={s.infoCard}>
          <p className={s.infoCardTitle}>Education</p>
          <div className={s.infoGrid}>
            {EDUCATION.map(([label, value]) => (
              <div key={label} className={s.infoItem}>
                <p className={s.infoLabel}>{label}</p>
                <p className={s.infoValue}>{value}</p>
              </div>
            ))}
          </div>

          <p className={s.infoCardTitle} style={{ marginTop: 28 }}>Skills &amp; Languages</p>
          <div className={s.skillTags}>
            {SKILLS.map(sk => <span key={sk} className={s.skillTag}>{sk}</span>)}
          </div>
        </div>
      </div>

      {/* ── Connections ────────────────────────────── */}
      <div className={s.connectionsCard}>
        <div className={s.cardHead}>
          <div>
            <p className={s.cardEyebrow}>NETWORK</p>
            <h3 className={s.cardTitle}>Connections</h3>
          </div>
          <span className={s.cardMeta}>{CONNECTIONS.length} people</span>
        </div>
        <div className={s.connectionsList}>
          {CONNECTIONS.map(c => (
            <div key={c.name} className={s.connectionRow}>
              <div className={s.connectionAvatar} style={{ background: c.c }}>{c.i}</div>
              <div className={s.connectionInfo}>
                <p className={s.connectionName}>{c.name}</p>
                <p className={s.connectionRole}>{c.role}</p>
              </div>
              <button className={s.msgBtn}>Message</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

import s from '@/styles/Dashboard.module.css';

const SKILLS = ['Policy Analysis','Research','Public Speaking','Data Analysis','Project Management','French','English','Amharic'];

const CONNECTIONS = [
  { i:'AM', name:'Amara Mensah',    role:'Intern · HRST',              c:'#C9A84C' },
  { i:'FO', name:'Fatima Osei',     role:'Fellow · Peace & Security',  c:'#7BC9A0' },
  { i:'KB', name:'Kofi Boateng',    role:'Volunteer · Economic Affairs',c:'#6BB5D9' },
  { i:'ZA', name:'Zinash Alemu',    role:'Intern · Political Affairs', c:'#E07B7B' },
  { i:'ND', name:'Nadia Diallo',    role:'Fellow · Social Affairs',    c:'#A78BFA' },
];

export default function ProfilePage() {
  return (
    <>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Profile</h1>
        <p className={s.pageSubtitle}>Your public presence on the AU Youth Network.</p>
      </div>

      {/* Completion */}
      <div className={s.completionBanner} style={{ marginBottom:16 }}>
        <div className={s.completionLeft}>
          <p className={s.completionPct}>65% complete</p>
          <p className={s.completionTitle}>Complete your profile</p>
          <p className={s.completionSub}>Add a profile photo, bio and areas of interest to reach 100%.</p>
          <div className={s.progressBar}><div className={s.progressFill} style={{ width:'65%' }} /></div>
        </div>
      </div>

      {/* Hero */}
      <div className={s.profileHero}>
        <div className={s.profileAvatarLg}>YD</div>
        <div style={{ flex:1 }}>
          <h2 className={s.profileName}>Yididiya D.</h2>
          <p className={s.profileSub}>Intern · Human Resources, Science & Technology · AU Commission</p>
          <div className={s.profileActions}>
            <button className={s.btnPrimary}>Edit profile</button>
            <button className={s.btnSecondary}>Share profile</button>
          </div>
        </div>
      </div>

      <div className={s.profileGrid}>
        {/* Details */}
        <div className={s.infoCard}>
          <p className={s.infoCardTitle}>Details</p>
          <div className={s.infoRow}>
            {[
              ['Department', 'HRST'],
              ['Role', 'Intern'],
              ['Nationality', 'Ethiopian'],
              ['Based in', 'Addis Ababa, Ethiopia'],
              ['Start date', 'July 2026'],
              ['End date', 'December 2026'],
            ].map(([label, value]) => (
              <div key={label} className={s.infoItem}>
                <p className={s.infoLabel}>{label}</p>
                <p className={s.infoValue}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className={s.infoCard}>
          <p className={s.infoCardTitle}>Education</p>
          <div className={s.infoRow}>
            {[
              ['University', 'Addis Ababa University'],
              ['Degree', 'MSc International Relations'],
              ['Year', '2025–2026'],
            ].map(([label, value]) => (
              <div key={label} className={s.infoItem}>
                <p className={s.infoLabel}>{label}</p>
                <p className={s.infoValue}>{value}</p>
              </div>
            ))}
          </div>

          <p className={s.infoCardTitle} style={{ marginTop:20 }}>Skills &amp; Languages</p>
          <div className={s.skillTags}>
            {SKILLS.map(sk => <span key={sk} className={s.skillTag}>{sk}</span>)}
          </div>
        </div>
      </div>

      {/* Connections */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}>Connections</span>
          <span style={{ fontSize:12, color:'rgba(3,34,16,0.4)' }}>5 people</span>
        </div>
        {CONNECTIONS.map(c => (
          <div key={c.name} className={s.connectionRow}>
            <div className={s.connectionAvatar} style={{ background: c.c }}>{c.i}</div>
            <div style={{ flex:1 }}>
              <p className={s.connectionName}>{c.name}</p>
              <p className={s.connectionRole}>{c.role}</p>
            </div>
            <button className={s.msgBtn}>Message</button>
          </div>
        ))}
      </div>
    </>
  );
}

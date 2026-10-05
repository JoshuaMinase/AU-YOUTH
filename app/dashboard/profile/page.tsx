import s from '@/styles/Dashboard.module.css';

const SKILLS = ['Policy Analysis', 'Research', 'Public Speaking', 'Data Analysis', 'Project Management', 'French', 'English', 'Amharic'];

const INFO = [
  { label: 'Department', value: 'Human Resources, Science & Technology (HRST)' },
  { label: 'Role', value: 'Intern' },
  { label: 'Nationality', value: 'Ethiopian' },
  { label: 'Based in', value: 'Addis Ababa, Ethiopia' },
  { label: 'Start date', value: 'July 2026' },
  { label: 'End date', value: 'December 2026' },
  { label: 'University', value: 'Addis Ababa University' },
  { label: 'Degree', value: 'MSc International Relations' },
];

const CONNECTIONS = [
  { initials: 'AM', color: '#FBB13C' },
  { initials: 'FO', color: '#7BC9A0' },
  { initials: 'KB', color: '#6BB5D9' },
  { initials: 'ZA', color: '#E07B7B' },
  { initials: 'ND', color: '#A78BFA' },
];

export default function ProfilePage() {
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Profile</h1>
          <p className={s.pageSubtitle}>Your public presence on the AU Youth Network.</p>
        </div>
      </div>

      {/* Completion */}
      <div className={s.completionBanner} style={{ marginBottom: 24 }}>
        <div className={s.completionText}>
          <p className={s.completionTitle}>Profile is 65% complete</p>
          <p className={s.completionSub}>Add a profile photo, bio and areas of interest to reach 100%.</p>
          <div className={s.progressTrack}>
            <div className={s.progressFill} style={{ width: '65%' }} />
          </div>
        </div>
      </div>

      {/* Profile header */}
      <div className={s.card} style={{ marginBottom: 20 }}>
        <div className={s.profileHeader}>
          <div className={s.profileAvatarLarge}>YD</div>
          <div style={{ flex: 1 }}>
            <h2 className={s.profileName}>Yididiya D.</h2>
            <p className={s.profileSubtitle}>Intern · Human Resources, Science & Technology · AU Commission</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className={s.profileEditBtn}>Edit profile</button>
              <button
                style={{
                  padding: '9px 20px',
                  background: '#f5f6f8',
                  color: '#032210',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Share profile
              </button>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className={s.profileInfoGrid}>
          {INFO.map(({ label, value }) => (
            <div key={label} className={s.profileInfoItem}>
              <p className={s.profileInfoLabel}>{label}</p>
              <p className={s.profileInfoValue}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={s.grid2}>
        {/* Skills */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Skills &amp; Languages</span>
            <button
              style={{ fontSize: 12, fontWeight: 600, background: 'none', border: 'none', color: 'rgba(3,34,16,0.45)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + Add skill
            </button>
          </div>
          <div className={s.skillTags}>
            {SKILLS.map(skill => (
              <span key={skill} className={s.skillTag}>{skill}</span>
            ))}
          </div>
        </div>

        {/* Connections */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Connections</span>
            <span style={{ fontSize: 13, color: 'rgba(3,34,16,0.45)' }}>5 people</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { initials: 'AM', name: 'Amara Mensah', role: 'Intern · HRST', color: '#FBB13C' },
              { initials: 'FO', name: 'Fatima Osei', role: 'Fellow · Peace & Security', color: '#7BC9A0' },
              { initials: 'KB', name: 'Kofi Boateng', role: 'Volunteer · Economic Affairs', color: '#6BB5D9' },
              { initials: 'ZA', name: 'Zinash Alemu', role: 'Intern · Political Affairs', color: '#E07B7B' },
              { initials: 'ND', name: 'Nadia Diallo', role: 'Fellow · Social Affairs', color: '#A78BFA' },
            ].map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: c.color, color: '#032210',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}
                >
                  {c.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#032210' }}>{c.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(3,34,16,0.45)' }}>{c.role}</p>
                </div>
                <button
                  style={{
                    padding: '5px 14px',
                    background: '#f5f6f8',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    color: '#032210',
                  }}
                >
                  Message
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

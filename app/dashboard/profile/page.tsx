'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Hero, I, Modal, useToast } from '@/components/portal/ui';
import { ME, PEOPLE, PROFILE_DEFAULT, profileScore, type Profile, softAvatar } from '@/lib/data';
import { copyText } from '@/lib/hooks';
import { usePersisted } from '@/lib/store';
import s from '@/styles/Portal.module.css';

function EditProfile({ value, onSave, onClose }: { value: Profile; onSave: (p: Profile) => void; onClose: () => void }) {
  const [f, setF] = useState(value);
  const [skill, setSkill] = useState('');
  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const addSkill = () => { const t = skill.trim(); if (t && !f.skills.includes(t)) setF({ ...f, skills: [...f.skills, t] }); setSkill(''); };
  return (
    <Modal title="Edit profile" onClose={onClose}>
      <form className={s.form} onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
        <div className={s.field}>
          <label className={s.label} htmlFor="p-bio">Bio</label>
          <textarea id="p-bio" className={s.textarea} value={f.bio} onChange={set('bio')} maxLength={400} placeholder="A few lines about you, your work and interests (20+ characters)" />
        </div>
        <div className={s.formRow}>
          <div className={s.field}><label className={s.label} htmlFor="p-nat">Nationality</label><input id="p-nat" className={s.input} value={f.nationality} onChange={set('nationality')} /></div>
          <div className={s.field}><label className={s.label} htmlFor="p-city">Based in</label><input id="p-city" className={s.input} value={f.basedIn} onChange={set('basedIn')} /></div>
        </div>
        <div className={s.formRow}>
          <div className={s.field}><label className={s.label} htmlFor="p-uni">University</label><input id="p-uni" className={s.input} value={f.university} onChange={set('university')} /></div>
          <div className={s.field}><label className={s.label} htmlFor="p-deg">Degree</label><input id="p-deg" className={s.input} value={f.degree} onChange={set('degree')} /></div>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="p-skill">Skills &amp; languages</label>
          <div className={s.skills} style={{ marginBottom: 8 }}>
            {f.skills.map((sk) => (
              <span key={sk} className={s.skill}>{sk}
                <button type="button" aria-label={`Remove ${sk}`} onClick={() => setF({ ...f, skills: f.skills.filter((x) => x !== sk) })}>×</button>
              </span>
            ))}
          </div>
          <div className={s.inlineForm}>
            <input id="p-skill" className={s.input} value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Add a skill"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
            <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={addSkill} disabled={!skill.trim()}>Add</button>
          </div>
        </div>
        <div className={s.formActions}>
          <button type="button" className={s.btnLine} onClick={onClose}>Cancel</button>
          <button type="submit" className={s.btnDark}>Save changes</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = usePersisted<Profile>('auy-profile', PROFILE_DEFAULT);
  const [connections] = usePersisted<string[]>('auy-connections', []);
  const [editing, setEditing] = useState(false);
  const [toast, toastNode] = useToast();
  const pct = profileScore(profile);

  const network = PEOPLE.filter((p) => ['amara', 'fatima', 'kofi', 'zinash', 'nadia'].includes(p.id) || connections.includes(p.id));

  const details: [string, string][] = [
    ['Department', ME.dept], ['Role', ME.role], ['Nationality', profile.nationality],
    ['Based in', profile.basedIn], ['Start date', profile.start], ['End date', profile.end],
  ];
  const education: [string, string][] = [['University', profile.university], ['Degree', profile.degree], ['Year', profile.year]];

  return (
    <>
      <Hero eyebrow="Your profile" title={`*${ME.name}*`} desc={`${ME.role} · ${ME.deptLong} · ${ME.org}`}>
        <span className={s.avatarLg} aria-hidden="true">{ME.initials}</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className={s.btn} onClick={() => setEditing(true)}>{I.edit} Edit profile</button>
          <button type="button" className={s.btnGhost}
            onClick={async () => toast((await copyText(`${location.origin}/dashboard/profile`)) ? 'Profile link copied' : 'Could not copy link')}>
            {I.share} Share
          </button>
        </div>
      </Hero>

      {pct < 100 && (
        <section className={`${s.card} ${s.completion}`} data-reveal>
          <div>
            <p className={s.cardEyebrow}>{pct}% complete</p>
            <h2 className={s.cardTitle} style={{ marginBottom: 10 }}>Complete your profile</h2>
            <div className={s.progress}><div className={s.progressFill} style={{ width: `${pct}%` }} /></div>
            <p className={s.cardMeta} style={{ marginTop: 10 }}>
              {profile.bio.trim().length < 20 ? 'Add a short bio' : ''}{profile.bio.trim().length < 20 && profile.skills.length < 5 ? ' and ' : ''}{profile.skills.length < 5 ? 'list at least five skills' : ''} to reach 100%.
            </p>
          </div>
          <button type="button" className={s.btnDark} onClick={() => setEditing(true)}>Finish profile</button>
        </section>
      )}

      {profile.bio && (
        <section className={s.card} style={{ marginBottom: 20 }} data-reveal>
          <p className={s.cardEyebrow}>About</p>
          <p style={{ fontSize: 16, lineHeight: 1.7 }}>{profile.bio}</p>
        </section>
      )}

      <div className={s.twoCol}>
        <section className={s.card} data-reveal>
          <div className={s.cardHead}><h2 className={s.cardTitle}>Details</h2></div>
          <div className={s.infoGrid}>
            {details.map(([l, v]) => <div key={l}><p className={s.infoLabel}>{l}</p><p className={s.infoValue}>{v || '—'}</p></div>)}
          </div>
        </section>
        <section className={s.card} data-reveal>
          <div className={s.cardHead}><h2 className={s.cardTitle}>Education</h2></div>
          <div className={s.infoGrid}>
            {education.map(([l, v]) => <div key={l}><p className={s.infoLabel}>{l}</p><p className={s.infoValue}>{v || '—'}</p></div>)}
          </div>
          <h3 className={s.cardTitle} style={{ fontSize: 16, margin: '22px 0 12px' }}>Skills &amp; languages</h3>
          <div className={s.skills}>{profile.skills.map((sk) => <span key={sk} className={s.skill}>{sk}</span>)}</div>
        </section>
      </div>

      <section className={s.card} data-reveal>
        <div className={s.cardHead}>
          <div><p className={s.cardEyebrow}>Network</p><h2 className={s.cardTitle}>Connections</h2></div>
          <Link href="/dashboard/people" className={s.cardLink}>Find people →</Link>
        </div>
        <div className={s.list}>
          {network.map((c) => (
            <div key={c.id} className={s.listRow}>
              <span className={s.av} style={softAvatar(c.c)}>{c.i}</span>
              <div className={s.rowMain}>
                <p className={s.rowTitle}>{c.name}</p>
                <p className={s.rowSub}>{c.role} · {c.dept}{connections.includes(c.id) ? ' · Request sent' : ''}</p>
              </div>
              <Link href="/dashboard/chats" className={`${s.btnLine} ${s.btnSm}`}>{I.chat} Message</Link>
            </div>
          ))}
        </div>
      </section>

      {editing && (
        <EditProfile value={profile} onClose={() => setEditing(false)}
          onSave={(p) => { setProfile(p); setEditing(false); toast('Profile saved'); }} />
      )}
      {toastNode}
    </>
  );
}

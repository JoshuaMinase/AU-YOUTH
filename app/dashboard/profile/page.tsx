'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Hero, I, Modal, useToast } from '@/components/portal/ui';
import { MONTHS, PEOPLE, parseYmd, profileScore, type Profile, softAvatar } from '@/lib/data';
import { useMe } from '@/lib/me';
import { copyText } from '@/lib/hooks';
import { usePersisted } from '@/lib/store';
import s from '@/styles/Portal.module.css';

type Editable = Profile & { role: string; dept: string };

const STUDYING = 'Currently studying';

/** "2026-07-01" -> "1 July 2026"; anything else is shown as typed */
const fmtDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = parseYmd(v);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

function Tags({ id, label, items, draft, setDraft, onChange, placeholder }: {
  id: string; label: string; items: string[]; draft: string; setDraft: (v: string) => void;
  onChange: (next: string[]) => void; placeholder: string;
}) {
  const add = () => { const t = draft.trim(); if (t && !items.includes(t)) onChange([...items, t]); setDraft(''); };
  return (
    <div className={s.field}>
      <label className={s.label} htmlFor={id}>{label}</label>
      <div className={s.skills} style={{ marginBottom: 8 }}>
        {items.map((sk) => (
          <span key={sk} className={s.skill}>{sk}
            <button type="button" aria-label={`Remove ${sk}`} onClick={() => onChange(items.filter((x) => x !== sk))}>×</button>
          </span>
        ))}
      </div>
      <div className={s.inlineForm}>
        <input id={id} className={s.input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={add} disabled={!draft.trim()}>Add</button>
      </div>
    </div>
  );
}

function EditProfile({ value, onSave, onClose }: { value: Editable; onSave: (p: Editable) => void; onClose: () => void }) {
  const [f, setF] = useState(value);
  const [skill, setSkill] = useState('');
  const [lang, setLang] = useState('');
  const [saving, setSaving] = useState(false);
  const studying = f.year === STUDYING;
  const [prevYear, setPrevYear] = useState('');
  const set = (k: keyof Editable) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  // anything typed but not yet added with "Add" is included on save
  const withPending = (list: string[], draft: string) => { const t = draft.trim(); return t && !list.includes(t) ? [...list, t] : list; };
  return (
    <Modal title="Edit profile" onClose={onClose}>
      <form className={s.form} onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave({ ...f, skills: withPending(f.skills, skill), languages: withPending(f.languages, lang) });
        setSaving(false);
      }}>
        <div className={s.field}>
          <label className={s.label} htmlFor="p-bio">Bio</label>
          <textarea id="p-bio" className={s.textarea} value={f.bio} onChange={set('bio')} maxLength={400} placeholder="A few lines about you, your work and interests (20+ characters)" />
        </div>
        <div className={s.formRow}>
          <div className={s.field}><label className={s.label} htmlFor="p-role">Role</label><input id="p-role" className={s.input} value={f.role} onChange={set('role')} placeholder="e.g. Intern" /></div>
          <div className={s.field}><label className={s.label} htmlFor="p-dept">Department</label><input id="p-dept" className={s.input} value={f.dept} onChange={set('dept')} placeholder="e.g. HRST" /></div>
        </div>
        <div className={s.formRow}>
          <div className={s.field}><label className={s.label} htmlFor="p-start">Start date</label><input id="p-start" className={s.input} type="date" value={f.start} onChange={set('start')} /></div>
          <div className={s.field}><label className={s.label} htmlFor="p-end">End date</label><input id="p-end" className={s.input} type="date" value={f.end} onChange={set('end')} /></div>
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
          <label className={s.label} htmlFor="p-year">Year of study</label>
          <input id="p-year" className={s.input} value={f.year} onChange={set('year')} disabled={studying}
            style={studying ? { opacity: 0.55, background: '#ECEBE6', cursor: 'not-allowed' } : undefined}
            placeholder="e.g. 2023 – Present, or 3rd year" />
          <label htmlFor="p-studying" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 14, cursor: 'pointer' }}>
            <input id="p-studying" type="checkbox" checked={studying}
              onChange={(e) => {
                if (e.target.checked) { setPrevYear(f.year); setF({ ...f, year: STUDYING }); }
                else setF({ ...f, year: prevYear });
              }} />
            I am currently studying
          </label>
        </div>
        <Tags id="p-skill" label="Skills" items={f.skills} draft={skill} setDraft={setSkill}
          onChange={(skills) => setF({ ...f, skills })} placeholder="Add a skill, then press Enter" />
        <Tags id="p-lang" label="Languages" items={f.languages} draft={lang} setDraft={setLang}
          onChange={(languages) => setF({ ...f, languages })} placeholder="Add a language, then press Enter" />
        <div className={s.formActions}>
          <button type="button" className={s.btnLine} onClick={onClose}>Cancel</button>
          <button type="submit" className={s.btnDark} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProfilePage() {
  const { me, profile, save } = useMe();
  const [connections] = usePersisted<string[]>('auy-connections', []);
  const [editing, setEditing] = useState(false);
  const [toast, toastNode] = useToast();
  const pct = profileScore(profile);

  const network = PEOPLE.filter((p) => ['amara', 'fatima', 'kofi', 'zinash', 'nadia'].includes(p.id) || connections.includes(p.id));

  const details: [string, string][] = [
    ['Department', me.dept], ['Role', me.role], ['Nationality', profile.nationality],
    ['Based in', profile.basedIn], ['Start date', fmtDate(profile.start)], ['End date', fmtDate(profile.end)],
  ];
  const education: [string, string][] = [['University', profile.university], ['Degree', profile.degree], ['Year', profile.year]];

  return (
    <>
      <Hero eyebrow="Your profile" title={`*${me.name}*`} desc={[me.role, me.dept].filter(Boolean).join(' · ') || me.email}>
        <span className={s.avatarLg} aria-hidden="true">{me.initials}</span>
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
          <h3 className={s.cardTitle} style={{ fontSize: 16, margin: '22px 0 12px' }}>Skills</h3>
          <div className={s.skills}>{profile.skills.length ? profile.skills.map((sk) => <span key={sk} className={s.skill}>{sk}</span>) : <span className={s.cardMeta}>None added yet</span>}</div>
          <h3 className={s.cardTitle} style={{ fontSize: 16, margin: '22px 0 12px' }}>Languages</h3>
          <div className={s.skills}>{profile.languages.length ? profile.languages.map((l) => <span key={l} className={s.skill}>{l}</span>) : <span className={s.cardMeta}>None added yet</span>}</div>
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
        <EditProfile value={{ ...profile, role: me.role, dept: me.dept }} onClose={() => setEditing(false)}
          onSave={async ({ role, dept, ...p }) => {
            const err = await save(p, { role, dept });
            if (err) { toast(`Could not save: ${err}`); return; }
            setEditing(false);
            toast('Profile saved');
          }} />
      )}
      {toastNode}
    </>
  );
}

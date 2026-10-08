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

const SKILL_OPTIONS = [
  'Communications', 'Policy Analysis', 'Research', 'Public Speaking', 'Data Analysis', 'Project Management',
  'Leadership', 'Teamwork', 'Writing', 'Report Writing', 'Event Planning', 'Fundraising', 'Grant Writing',
  'Advocacy', 'Diplomacy', 'Negotiation', 'Translation', 'Interpretation', 'Social Media', 'Graphic Design',
  'Video Editing', 'Microsoft Office', 'Excel', 'Python', 'JavaScript', 'Web Development', 'Software Development',
  'Cybersecurity', 'Database Management', 'Monitoring & Evaluation', 'Budgeting', 'Community Organizing',
  'Teaching', 'Critical Thinking', 'Problem Solving', 'Time Management',
];

const LANGUAGE_OPTIONS = [
  'English', 'French', 'Arabic', 'Portuguese', 'Spanish', 'Swahili', 'Amharic', 'Tigrinya', 'Oromo', 'Somali',
  'Hausa', 'Yoruba', 'Igbo', 'Zulu', 'Xhosa', 'Afrikaans', 'Shona', 'Kinyarwanda', 'Lingala', 'Wolof',
  'Tamazight', 'Malagasy', 'Chinese (Mandarin)', 'German', 'Italian', 'Russian', 'Hindi', 'Turkish',
];

/** "2026-07-01" -> "1 July 2026"; anything else is shown as typed */
const fmtDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = parseYmd(v);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

function Tags({ id, label, items, options, draft, setDraft, onChange, placeholder }: {
  id: string; label: string; items: string[]; options: string[]; draft: string; setDraft: (v: string) => void;
  onChange: (next: string[]) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [touched, setTouched] = useState(false);
  const q = draft.trim().toLowerCase();
  const matches = options.filter((o) => !items.includes(o) && (!q || o.toLowerCase().includes(q)));
  const add = (v: string) => {
    const t = v.trim();
    const canon = options.find((o) => o.toLowerCase() === t.toLowerCase()) ?? t; // "english" -> "English"
    if (canon && !items.some((x) => x.toLowerCase() === canon.toLowerCase())) onChange([...items, canon]);
    setDraft(''); setHi(0); setTouched(false);
  };
  // Enter / Add: pick the highlighted suggestion. Free text is only accepted when nothing in the list matches,
  // so partial typing like "ha" can never be saved as its own entry.
  const commit = () => {
    if (matches.length) { if (q || touched) add(matches[Math.min(hi, matches.length - 1)]); }
    else add(draft);
  };
  const custom = !!draft.trim() && matches.length === 0 && !items.some((x) => x.toLowerCase() === q);
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
        <div style={{ position: 'relative', flex: 1 }}>
          <input id={id} className={s.input} value={draft} autoComplete="off" placeholder={placeholder}
            role="combobox" aria-expanded={open} aria-controls={`${id}-list`}
            onChange={(e) => { setDraft(e.target.value); setHi(0); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setTouched(true); setHi((h) => Math.min(h + 1, matches.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setTouched(true); setHi((h) => Math.max(h - 1, 0)); }
              else if (e.key === 'Escape') { setOpen(false); }
              else if (e.key === 'Enter') { e.preventDefault(); commit(); }
            }} />
          {open && (matches.length > 0 || custom) && (
            <ul id={`${id}-list`} role="listbox"
              style={{
                position: 'absolute', left: 0, right: 0, top: 'calc(100% + 6px)', zIndex: 30, margin: 0, padding: 6,
                listStyle: 'none', maxHeight: 220, overflowY: 'auto', background: '#fff',
                border: '1px solid rgba(0,0,0,0.12)', borderRadius: 14, boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
              }}>
              {matches.map((o, i) => (
                <li key={o} role="option" aria-selected={i === hi}
                  onMouseDown={(e) => { e.preventDefault(); add(o); }}
                  onMouseEnter={() => setHi(i)}
                  style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 15, background: i === hi ? '#F1EFE8' : 'transparent' }}>
                  {o}
                </li>
              ))}
              {custom && (
                <li role="option" aria-selected={false}
                  onMouseDown={(e) => { e.preventDefault(); add(draft); }}
                  style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 15, color: '#5b5b52' }}>
                  Add “{draft.trim()}”
                </li>
              )}
            </ul>
          )}
        </div>
        <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={commit} disabled={!draft.trim()}>Add</button>
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
  // only an exact suggestion, or text that matches nothing in the list, is kept; partial typing like "ha" is dropped
  const withPending = (list: string[], draft: string, options: string[]) => {
    const t = draft.trim();
    if (!t) return list;
    const lower = t.toLowerCase();
    const exact = options.find((o) => o.toLowerCase() === lower);
    const next = exact ?? (options.some((o) => o.toLowerCase().includes(lower)) ? '' : t);
    return next && !list.some((x) => x.toLowerCase() === next.toLowerCase()) ? [...list, next] : list;
  };
  return (
    <Modal title="Edit profile" onClose={onClose}>
      <form className={s.form} onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave({ ...f, skills: withPending(f.skills, skill, SKILL_OPTIONS), languages: withPending(f.languages, lang, LANGUAGE_OPTIONS) });
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
        <Tags id="p-skill" label="Skills" items={f.skills} options={SKILL_OPTIONS} draft={skill} setDraft={setSkill}
          onChange={(skills) => setF({ ...f, skills })} placeholder="Tap to choose, or type your own" />
        <Tags id="p-lang" label="Languages" items={f.languages} options={LANGUAGE_OPTIONS} draft={lang} setDraft={setLang}
          onChange={(languages) => setF({ ...f, languages })} placeholder="Tap to choose, or type your own" />
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

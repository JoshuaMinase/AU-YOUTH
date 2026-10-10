'use client';

import { useMemo, useState } from 'react';
import { I } from '@/components/portal/ui';
import { softAvatar } from '@/lib/data';
import { colorFor, usePeople } from '@/lib/people';
import s from '@/styles/Portal.module.css';

interface Props {
  members: { id: string; name: string }[];
  meId: string;
  canManage: boolean;
  onAdd: (memberId: string) => Promise<string | null>;
  onRemove: (memberId: string) => Promise<string | null>;
}

const initialsOf = (name: string) => name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || 'M';

/** Member list of a group chat. Admins of the department also get Remove buttons and a search to add people. */
export default function GroupMembers({ members, meId, canManage, onAdd, onRemove }: Props) {
  const { members: everyone } = usePeople();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const inGroup = useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const found = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? everyone.filter((m) => !inGroup.has(m.id) && `${m.name} ${m.dept}`.toLowerCase().includes(t)).slice(0, 6) : [];
  }, [everyone, inGroup, q]);

  const run = async (id: string, fn: () => Promise<string | null>) => {
    setBusy(id); setErr(null);
    const e = await fn();
    setBusy(null);
    if (e) setErr(e); else setQ('');
  };

  return (
    <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', maxHeight: 280, overflowY: 'auto' }} data-lenis-prevent>
      {canManage && (
        <div style={{ marginBottom: 10 }}>
          <label className={s.search} style={{ minWidth: 0 }}>
            {I.search}
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add someone: search by name or department…" aria-label="Add someone to this group" />
          </label>
          {found.map((m) => (
            <div key={m.id} className={s.listRow}>
              <span className={s.av} style={softAvatar(m.color)}>{m.initials}</span>
              <div className={s.rowMain}><p className={s.rowTitle}>{m.name}</p><p className={s.rowSub}>{m.dept || '—'}</p></div>
              <button type="button" className={`${s.btnDark} ${s.btnSm}`} disabled={busy === m.id} onClick={() => run(m.id, () => onAdd(m.id))}>Add</button>
            </div>
          ))}
          {q.trim() && !found.length && <p className={s.agendaEmpty}>No one else matches.</p>}
        </div>
      )}
      {err && <p className={s.agendaEmpty} role="alert">{err}</p>}
      <div className={s.list}>
        {members.map((m) => (
          <div key={m.id} className={s.listRow}>
            <span className={s.av} style={softAvatar(colorFor(m.id))}>{initialsOf(m.name)}</span>
            <div className={s.rowMain}><p className={s.rowTitle}>{m.name}{m.id === meId ? ' (you)' : ''}</p></div>
            {canManage && m.id !== meId && (
              <button type="button" className={`${s.btnLine} ${s.btnSm}`} disabled={busy === m.id} onClick={() => run(m.id, () => onRemove(m.id))}>Remove</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

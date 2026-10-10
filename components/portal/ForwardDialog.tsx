'use client';
import { useMemo, useState } from 'react';
import { I, Modal } from './ui';
import { softAvatar, type Chat, type Msg } from '@/lib/data';
import s from '@/styles/Portal.module.css';

/** a short line that says what is being forwarded */
const summary = (m: Msg) =>
  m.kind === 'image' ? `Photo${m.text ? `: ${m.text}` : ''}`
    : m.kind === 'voice' ? 'Voice message'
    : m.kind === 'file' ? `${m.file?.name ?? 'File'}${m.text ? `: ${m.text}` : ''}`
    : m.text;

/** Pick one or more conversations to forward a message to. onForward returns an error message or null. */
export default function ForwardDialog({ msg, chats, onForward, onClose }: {
  msg: Msg; chats: Chat[]; onForward: (ids: string[]) => Promise<string | null>; onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? chats.filter((c) => c.name.toLowerCase().includes(t)) : chats;
  }, [chats, q]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const go = async () => {
    setBusy(true); setErr('');
    const e = await onForward(picked);
    setBusy(false);
    if (e) setErr(e); else onClose();
  };

  return (
    <Modal title="Forward message" onClose={onClose}>
      <p className={s.fwdPreview}>{I.forward}<span>{summary(msg)}</span></p>
      <label className={s.search} style={{ minWidth: 0, marginBottom: 10 }}>
        {I.search}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" aria-label="Search conversations" />
      </label>
      <div className={s.fwdList} data-lenis-prevent role="group" aria-label="Conversations to forward to">
        {list.map((c) => (
          <label key={c.id} className={s.fwdItem}>
            <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} />
            <span className={s.av} style={softAvatar(c.color)}>{c.initials}</span>
            <span className={s.fwdName}>{c.name}</span>
          </label>
        ))}
        {!list.length && <p className={s.agendaEmpty}>No conversations found.</p>}
      </div>
      {err && <p className={s.agendaEmpty} role="alert" style={{ marginTop: 10 }}>{err}</p>}
      <div className={s.formActions}>
        <button type="button" className={s.btnLine} onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className={s.btnDark} onClick={go} disabled={busy || !picked.length}>
          {busy ? 'Forwarding…' : picked.length ? `Forward to ${picked.length}` : 'Forward'}
        </button>
      </div>
    </Modal>
  );
}

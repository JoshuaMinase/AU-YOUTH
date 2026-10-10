'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Hero, I, Modal, useToast } from '@/components/portal/ui';
import { softAvatar, type Msg } from '@/lib/data';
import ChatMessage from '@/components/portal/ChatMessage';
import ForwardDialog from '@/components/portal/ForwardDialog';
import GroupMembers from '@/components/portal/GroupMembers';
import VoiceRecorder from '@/components/portal/VoiceRecorder';
import { CHAT_ACCEPT, CHAT_MAX_STAGED, chatMime, checkChatFile, cleanName } from '@/lib/chatFiles';
import { useMe } from '@/lib/me';
import { useChats } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

/** a file queued above the message box; photos show a small preview */
function StagedFile({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState('');
  const isImg = !!chatMime(file.name)?.startsWith('image/');
  useEffect(() => {
    if (!isImg) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, isImg]);
  return (
    <span className={s.trayItem}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {isImg && url ? <img className={s.trayThumb} src={url} alt="" aria-hidden="true" /> : <span className={s.trayIcon}>{I.file}</span>}
      <span className={s.trayName}>{cleanName(file.name)}</span>
      <button type="button" className={s.trayRemove} onClick={onRemove} aria-label={`Remove ${cleanName(file.name)}`}>{I.close}</button>
    </span>
  );
}

export default function ChatsPage() {
  const { chats, unread, markRead, send, sendFile, forward, addMember, removeMember, loaded, error } = useChats();
  const { me } = useMe();
  const [showMembers, setShowMembers] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [staged, setStaged] = useState<File[]>([]);          // photos / files waiting to be sent
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);                   // uploading a file or voice message
  const [fwd, setFwd] = useState<Msg | null>(null);          // message being forwarded
  const [photo, setPhoto] = useState<{ url: string; alt: string } | null>(null);
  const [toast, toastNode] = useToast();
  const picker = useRef<HTMLInputElement>(null);
  const msgs = useRef<HTMLDivElement>(null);
  const chat = chats.find((c) => c.id === activeId) ?? chats[0];
  /* department chats: the super admin and admins of that department manage the members (the database enforces it too) */
  const norm = (v?: string) => (v ?? '').trim().toLowerCase();
  const canManage = !!chat?.dept && (me.access === 'super_admin' || (me.access === 'admin' && norm(me.dept) === norm(chat.dept)));
  useEffect(() => { setShowMembers(false); setStaged([]); setRecording(false); }, [activeId]);

  /* /dashboard/chats?c=<id> (the People "Message" button) opens that conversation */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('c');
    if (id) { setActiveId(id); setView('chat'); }
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? chats.filter((c) => c.name.toLowerCase().includes(t)) : chats;
  }, [chats, q]);

  /* a conversation counts as read once it is on screen (always on desktop, after tapping on mobile) */
  useEffect(() => {
    if (chat && (view === 'chat' || window.matchMedia('(min-width: 861px)').matches)) markRead(chat.id);
  }, [chat, view, markRead]);
  /* keep the newest message in view */
  useEffect(() => {
    const el = msgs.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chat?.messages.length, activeId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!chat || busy) return;

    /* files first: each one is its own message, the typed text is the caption of the first */
    if (staged.length) {
      const files = staged;
      setBusy(true); setSendErr(null); setStaged([]); setInput('');
      for (let i = 0; i < files.length; i++) {
        const err = await sendFile(chat.id, files[i], { caption: i === 0 ? text : '' });
        if (err) {
          setStaged(files.slice(i)); if (i === 0) setInput(text);   // keep what was not sent so it can be retried
          setSendErr(`Not sent: ${err}`);
          break;
        }
      }
      setBusy(false);
      return;
    }

    if (!text) return;
    setInput(''); setSendErr(null);
    const err = await send(chat.id, text);
    if (err) { setInput(text); setSendErr(`Not sent: ${err}`); }
  };

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';   // so choosing the same file again still fires
    if (!files.length) return;
    const ok: File[] = [];
    let problem: string | null = null;
    for (const f of files) {
      const bad = checkChatFile(f);
      if (bad) { problem = problem ?? bad; continue; }
      if (staged.length + ok.length >= CHAT_MAX_STAGED) { problem = problem ?? `You can attach up to ${CHAT_MAX_STAGED} files at a time.`; continue; }
      ok.push(f);
    }
    setSendErr(problem);
    if (ok.length) setStaged((p) => [...p, ...ok]);
  };

  const sendVoice = async (blob: Blob, seconds: number) => {
    if (!chat) return;
    setRecording(false); setBusy(true); setSendErr(null);
    const err = await sendFile(chat.id, blob, { voiceSeconds: seconds });
    setBusy(false);
    if (err) setSendErr(`Not sent: ${err}`);
  };

  return (
    <>
      <Hero eyebrow="Messages" title="Your *Chats*" desc="Direct messages and group conversations with your cohort.">
        {unread > 0 && (
          <div className={s.heroStat}>
            <span className={s.heroStatNum}>{unread}</span>
            <span className={s.heroStatLabel}>unread messages</span>
          </div>
        )}
      </Hero>

      <div className={s.chatShell} data-view={view} data-reveal>
        <div className={s.chatList}>
          <div className={s.chatListHead}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className={s.cardTitle}>Messages</h2>
              <Link href="/dashboard/people" className={s.iconBtn} aria-label="New message — find people">{I.plus}</Link>
            </div>
            <label className={s.search} style={{ minWidth: 0 }}>
              {I.search}
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" aria-label="Search conversations" />
            </label>
          </div>
          <div className={s.chatItems} data-lenis-prevent>
            {list.map((c) => (
              <button key={c.id} type="button" className={s.chatItem} aria-current={c.id === chat?.id}
                onClick={() => { setActiveId(c.id); setView('chat'); }}>
                <span className={s.av} style={softAvatar(c.color)}>{c.initials}</span>
                <span className={s.chatInfo}>
                  <span className={s.chatName} style={{ display: 'block' }}>{c.name}</span>
                  <span className={s.chatPreview} style={{ display: 'block' }}>{c.preview}</span>
                </span>
                <span className={s.chatSide}>
                  <span className={s.chatTime}>{c.time}</span>
                  {c.unread > 0 && <span className={s.chatUnread}>{c.unread}</span>}
                </span>
              </button>
            ))}
            {error && <p className={s.agendaEmpty} style={{ padding: 12 }} role="alert">Could not load chats: {error}</p>}
            {!loaded && !error && <p className={s.agendaEmpty} style={{ padding: 12 }}>Loading…</p>}
            {loaded && !error && !list.length && <p className={s.agendaEmpty} style={{ padding: 12 }}>
              {chats.length ? 'No conversations found.' : 'No conversations yet. Connect with someone on People, then message them.'}
            </p>}
          </div>
        </div>

        <div className={s.chatArea}>
          {chat ? (<>
          <div className={s.chatAreaHead}>
            <button type="button" className={`${s.iconBtn} ${s.chatBack}`} onClick={() => setView('list')} aria-label="Back to conversations">{I.left}</button>
            <span className={s.av} style={{ ...softAvatar(chat.color), width: 38, height: 38 }}>{chat.initials}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className={s.chatName}>{chat.name}</p>
              <span className={s.chatStatus}>{chat.group ? `Group chat · ${chat.members?.length ?? 0} members` : 'Direct message'}</span>
            </div>
            {chat.group && (
              <button type="button" className={`${s.btnLine} ${s.btnSm}`} aria-expanded={showMembers} onClick={() => setShowMembers((v) => !v)}>
                {showMembers ? 'Hide members' : canManage ? 'Manage members' : 'Members'}
              </button>
            )}
          </div>
          {chat.group && showMembers && (
            <GroupMembers members={chat.members ?? []} meId={me.id} canManage={canManage}
              onAdd={(id) => addMember(chat.id, id)} onRemove={(id) => removeMember(chat.id, id)} />
          )}

          <div ref={msgs} className={s.msgs} data-lenis-prevent aria-live="polite">
            {chat.messages.map((m, i) => (
              <ChatMessage key={m.id ?? i} m={m} onForward={setFwd} onOpenImage={(url, alt) => setPhoto({ url, alt })} />
            ))}
            {!chat.messages.length && <p className={s.agendaEmpty}>No messages yet. Say hello!</p>}
          </div>

          {sendErr && <p className={s.agendaEmpty} role="alert" style={{ padding: '0 16px' }}>{sendErr}</p>}
          {staged.length > 0 && (
            <div className={s.chatTray} aria-label="Files ready to send">
              {staged.map((f, i) => <StagedFile key={`${f.name}-${f.size}-${i}`} file={f} onRemove={() => setStaged((p) => p.filter((_, j) => j !== i))} />)}
            </div>
          )}
          <form className={s.chatForm} onSubmit={submit}>
            {recording ? (
              <VoiceRecorder onDone={sendVoice} onCancel={() => setRecording(false)} onError={(m) => { setRecording(false); setSendErr(m); }} />
            ) : (<>
              <input ref={picker} type="file" hidden multiple accept={CHAT_ACCEPT} onChange={pick} />
              <button type="button" className={s.chatTool} onClick={() => picker.current?.click()} disabled={busy || staged.length >= CHAT_MAX_STAGED} aria-label="Attach a photo or file">{I.attach}</button>
              <input className={s.input} value={input} onChange={(e) => setInput(e.target.value)}
                placeholder={staged.length ? 'Add a caption…' : `Message ${chat.name.split(' ')[0]}…`} aria-label={staged.length ? 'Caption' : 'Write a message'} maxLength={1000} />
              {input.trim() || staged.length ? (
                <button type="submit" className={s.btnDark} disabled={busy}>{I.send} {busy ? 'Sending…' : 'Send'}</button>
              ) : (
                <button type="button" className={s.btnDark} onClick={() => { setSendErr(null); setRecording(true); }} disabled={busy} aria-label="Record a voice message">{I.mic}</button>
              )}
            </>)}
          </form>
          </>) : (
            <p className={s.agendaEmpty} style={{ margin: 'auto', padding: 24 }}>{loaded ? 'Pick a conversation to start chatting.' : 'Loading…'}</p>
          )}
        </div>
      </div>

      {fwd && (
        <ForwardDialog msg={fwd} chats={chats} onClose={() => setFwd(null)}
          onForward={async (ids) => {
            const err = await forward(fwd.id!, ids);
            if (!err) toast(ids.length === 1 ? 'Message forwarded' : `Forwarded to ${ids.length} chats`);
            return err;
          }} />
      )}
      {photo && (
        <Modal title="Photo" onClose={() => setPhoto(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.photoFull} src={photo.url} alt={photo.alt} />
        </Modal>
      )}
      {toastNode}
    </>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Hero, I } from '@/components/portal/ui';
import { softAvatar } from '@/lib/data';
import GroupMembers from '@/components/portal/GroupMembers';
import { useMe } from '@/lib/me';
import { useChats } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

export default function ChatsPage() {
  const { chats, unread, markRead, send, addMember, removeMember, loaded, error } = useChats();
  const { me } = useMe();
  const [showMembers, setShowMembers] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [sendErr, setSendErr] = useState<string | null>(null);
  const msgs = useRef<HTMLDivElement>(null);
  const chat = chats.find((c) => c.id === activeId) ?? chats[0];
  /* department chats: the super admin and admins of that department manage the members (the database enforces it too) */
  const norm = (v?: string) => (v ?? '').trim().toLowerCase();
  const canManage = !!chat?.dept && (me.access === 'super_admin' || (me.access === 'admin' && norm(me.dept) === norm(chat.dept)));
  useEffect(() => { setShowMembers(false); }, [activeId]);

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
    if (!text || !chat) return;
    setInput(''); setSendErr(null);
    const err = await send(chat.id, text);
    if (err) { setInput(text); setSendErr(`Not sent: ${err}`); }
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
              <div key={m.id ?? i} className={`${s.msg} ${m.from === 'me' ? s.msgMe : s.msgThem}`}>
                {m.who && <b style={{ display: 'block', fontSize: 12 }}>{m.who}</b>}
                {m.text}<small>{m.time}</small>
              </div>
            ))}
            {!chat.messages.length && <p className={s.agendaEmpty}>No messages yet. Say hello!</p>}
          </div>

          {sendErr && <p className={s.agendaEmpty} role="alert" style={{ padding: '0 16px' }}>{sendErr}</p>}
          <form className={s.chatForm} onSubmit={submit}>
            <input className={s.input} value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${chat.name.split(' ')[0]}…`} aria-label="Write a message" maxLength={1000} />
            <button type="submit" className={s.btnDark} disabled={!input.trim()}>{I.send} Send</button>
          </form>
          </>) : (
            <p className={s.agendaEmpty} style={{ margin: 'auto', padding: 24 }}>{loaded ? 'Pick a conversation to start chatting.' : 'Loading…'}</p>
          )}
        </div>
      </div>
    </>
  );
}

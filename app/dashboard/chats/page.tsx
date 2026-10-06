'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Hero, I } from '@/components/portal/ui';
import { softAvatar } from '@/lib/data';
import { useChats } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

export default function ChatsPage() {
  const { chats, unread, markRead, send } = useChats();
  const [activeId, setActiveId] = useState(chats[0].id);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const msgs = useRef<HTMLDivElement>(null);
  const chat = chats.find((c) => c.id === activeId) ?? chats[0];

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? chats.filter((c) => c.name.toLowerCase().includes(t)) : chats;
  }, [chats, q]);

  /* a conversation counts as read once it is on screen (always on desktop, after tapping on mobile) */
  useEffect(() => {
    if (view === 'chat' || window.matchMedia('(min-width: 861px)').matches) markRead(activeId);
  }, [activeId, view, markRead]);
  /* keep the newest message in view */
  useEffect(() => {
    const el = msgs.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chat.messages.length, activeId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    send(chat.id, text);
    setInput('');
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
              <button key={c.id} type="button" className={s.chatItem} aria-current={c.id === chat.id}
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
            {!list.length && <p className={s.agendaEmpty} style={{ padding: 12 }}>No conversations found.</p>}
          </div>
        </div>

        <div className={s.chatArea}>
          <div className={s.chatAreaHead}>
            <button type="button" className={`${s.iconBtn} ${s.chatBack}`} onClick={() => setView('list')} aria-label="Back to conversations">{I.left}</button>
            <span className={s.av} style={{ ...softAvatar(chat.color), width: 38, height: 38 }}>{chat.initials}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className={s.chatName}>{chat.name}</p>
              <span className={s.chatStatus}>Active now</span>
            </div>
          </div>

          <div ref={msgs} className={s.msgs} data-lenis-prevent aria-live="polite">
            {chat.messages.map((m, i) => (
              <div key={i} className={`${s.msg} ${m.from === 'me' ? s.msgMe : s.msgThem}`}>
                {m.text}<small>{m.time}</small>
              </div>
            ))}
          </div>

          <form className={s.chatForm} onSubmit={submit}>
            <input className={s.input} value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${chat.name.split(' ')[0]}…`} aria-label="Write a message" maxLength={1000} />
            <button type="submit" className={s.btnDark} disabled={!input.trim()}>{I.send} Send</button>
          </form>
        </div>
      </div>
    </>
  );
}

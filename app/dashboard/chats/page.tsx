'use client';

import { useState } from 'react';
import s from '@/styles/Dashboard.module.css';

const COLORS = ['#C9A84C','#7BC9A0','#6BB5D9','#E07B7B','#A78BFA'];

const CHATS = [
  {
    initials: 'AM', name: 'Amara Mensah',
    preview: 'Thanks for sharing the report!',
    time: '10:22', unread: 2, color: COLORS[0],
    messages: [
      { from: 'them', text: 'Hey! Did you get a chance to look at the agenda for tomorrow?' },
      { from: 'me',   text: 'Yes, just finished reading it. Looks solid.' },
      { from: 'them', text: 'Thanks for sharing the report! I will review it tonight.' },
    ],
  },
  {
    initials: 'FO', name: 'Fatima Osei',
    preview: 'The session starts at 14:00, Nyerere Room.',
    time: '09:45', unread: 1, color: COLORS[1],
    messages: [
      { from: 'them', text: 'Are you joining the workshop today?' },
      { from: 'me',   text: 'Of course! What time does it start?' },
      { from: 'them', text: 'The session starts at 14:00, Nyerere Room.' },
    ],
  },
  {
    initials: 'KB', name: 'Kofi Boateng',
    preview: 'Great, I will ping the group channel.',
    time: 'Yesterday', unread: 0, color: COLORS[2],
    messages: [
      { from: 'me',   text: 'Did you connect with the trade department lead?' },
      { from: 'them', text: 'Great, I will ping the group channel.' },
    ],
  },
  {
    initials: 'AU', name: 'AU Intern Community',
    preview: 'Reminder: monthly roundup this Friday.',
    time: 'Monday', unread: 0, color: '#032210',
    messages: [
      { from: 'them', text: 'Welcome everyone to the September cohort!' },
      { from: 'them', text: 'Reminder: monthly roundup is this Friday at 15:00.' },
    ],
  },
  {
    initials: 'ZA', name: 'Zinash Alemu',
    preview: 'I sent you the document link.',
    time: 'Sunday', unread: 0, color: COLORS[3],
    messages: [
      { from: 'me',   text: 'Could you share the policy brief draft?' },
      { from: 'them', text: 'I sent you the document link.' },
    ],
  },
];

export default function ChatsPage() {
  const [active, setActive] = useState(0);
  const [input, setInput]   = useState('');
  const chat = CHATS[active];

  const totalUnread = CHATS.reduce((n, c) => n + c.unread, 0);

  return (
    <>
      {/* ── Page header ────────────────────────────── */}
      <div className={s.pageHero}>
        <div>
          <p className={s.pageEyebrow}>MESSAGES</p>
          <h1 className={s.pageHeading}>Chats</h1>
          <p className={s.pageDesc}>Direct messages and group conversations with your cohort.</p>
        </div>
        {totalUnread > 0 && (
          <div className={s.unreadBanner}>
            <span className={s.unreadCount}>{totalUnread}</span>
            <span>unread messages</span>
          </div>
        )}
      </div>

      {/* ── Two-panel chat shell ───────────────────── */}
      <div className={s.chatsShell}>

        {/* Conversation list */}
        <div className={s.chatList}>
          <div className={s.chatListHeader}>
            <span>Messages</span>
            <button className={s.newChatBtn} aria-label="New message">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14"/><path d="M12 5v14"/>
              </svg>
            </button>
          </div>

          {CHATS.map((c, i) => (
            <button
              key={c.name}
              className={`${s.chatItem} ${i === active ? s.chatItemActive : ''}`}
              onClick={() => setActive(i)}
            >
              <div
                className={s.chatAvatar}
                style={{
                  background: c.color,
                  color: c.color === '#032210' ? '#fff' : '#032210',
                }}
              >
                {c.initials}
              </div>
              <div className={s.chatInfo}>
                <p className={s.chatName}>{c.name}</p>
                <p className={s.chatPreview}>{c.preview}</p>
              </div>
              <div className={s.chatMeta}>
                <p className={s.chatTime}>{c.time}</p>
                {c.unread > 0 && (
                  <div className={s.chatUnreadBadge}>{c.unread}</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Message area */}
        <div className={s.chatArea}>
          {/* Header */}
          <div className={s.chatAreaHeader}>
            <div
              className={s.chatAvatar}
              style={{
                width: 38, height: 38, fontSize: 13,
                background: chat.color,
                color: chat.color === '#032210' ? '#fff' : '#032210',
                flexShrink: 0,
              }}
            >
              {chat.initials}
            </div>
            <div className={s.chatAreaInfo}>
              <p className={s.chatAreaName}>{chat.name}</p>
              <span className={s.chatAreaStatus}>
                <span className={s.statusDot} />
                Active now
              </span>
            </div>
            <button className={s.chatMoreBtn} aria-label="More options">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className={s.chatMessages}>
            {chat.messages.map((msg, i) => (
              <div key={i} className={`${s.msgBubble} ${msg.from === 'me' ? s.msgMe : s.msgThem}`}>
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className={s.chatInputRow}>
            <input
              className={s.chatInput}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Write a message…"
              onKeyDown={e => { if (e.key === 'Enter') setInput(''); }}
            />
            <button
              className={s.chatSendBtn}
              onClick={() => setInput('')}
              disabled={!input.trim()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>
              </svg>
              Send
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

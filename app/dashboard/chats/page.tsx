'use client';

import { useState } from 'react';
import s from '@/styles/Dashboard.module.css';

const COLORS = ['#FBB13C', '#7BC9A0', '#6BB5D9', '#E07B7B', '#A78BFA'];

const CHATS = [
  {
    initials: 'AM',
    name: 'Amara Mensah',
    preview: "Thanks for sharing the report! I'll review it tonight.",
    time: '10:22',
    unread: 2,
    color: COLORS[0],
    messages: [
      { from: 'them', text: 'Hey! Did you get a chance to look at the agenda for tomorrow?' },
      { from: 'me', text: 'Yes, just finished reading it. Looks solid.' },
      { from: 'them', text: "Thanks for sharing the report! I'll review it tonight." },
    ],
  },
  {
    initials: 'FO',
    name: 'Fatima Osei',
    preview: 'The session starts at 14:00, Nyerere Room.',
    time: '09:45',
    unread: 1,
    color: COLORS[1],
    messages: [
      { from: 'them', text: 'Are you joining the workshop today?' },
      { from: 'me', text: 'Of course! What time does it start?' },
      { from: 'them', text: 'The session starts at 14:00, Nyerere Room.' },
    ],
  },
  {
    initials: 'KB',
    name: 'Kofi Boateng',
    preview: "Great, I'll ping the group channel.",
    time: 'Yesterday',
    unread: 0,
    color: COLORS[2],
    messages: [
      { from: 'me', text: 'Did you connect with the trade department lead?' },
      { from: 'them', text: "Great, I'll ping the group channel." },
    ],
  },
  {
    initials: 'AU',
    name: 'AU Intern Community',
    preview: 'Reminder: monthly roundup is this Friday at 15:00.',
    time: 'Monday',
    unread: 0,
    color: '#032210',
    messages: [
      { from: 'them', text: 'Welcome everyone to the September cohort!' },
      { from: 'them', text: 'Reminder: monthly roundup is this Friday at 15:00.' },
    ],
  },
  {
    initials: 'ZA',
    name: 'Zinash Alemu',
    preview: 'I sent you the document link.',
    time: 'Sunday',
    unread: 0,
    color: COLORS[3],
    messages: [
      { from: 'me', text: 'Could you share the policy brief draft?' },
      { from: 'them', text: 'I sent you the document link.' },
    ],
  },
];

export default function ChatsPage() {
  const [active, setActive] = useState(0);
  const [input, setInput] = useState('');
  const chat = CHATS[active];

  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Chats</h1>
          <p className={s.pageSubtitle}>Direct messages and group conversations.</p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: 0,
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          minHeight: 520,
        }}
      >
        {/* Chat list */}
        <div style={{ borderRight: '1px solid #eaecef' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #eaecef' }}>
            <div className={s.searchBar} style={{ margin: 0 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="rgba(3,34,16,0.35)" strokeWidth="1.8">
                <circle cx="9" cy="9" r="5.5"/>
                <path d="M13.5 13.5L17 17" strokeLinecap="round"/>
              </svg>
              <input className={s.searchInput} placeholder="Search messages…" style={{ fontSize: 13 }} />
            </div>
          </div>
          <div className={s.chatList}>
            {CHATS.map((c, i) => (
              <div
                key={c.name}
                className={`${s.chatItem} ${i === active ? s.chatItemActive : ''}`}
                onClick={() => setActive(i)}
              >
                <div className={s.chatAvatar} style={{ background: c.color, color: c.color === '#032210' ? '#fff' : '#032210' }}>
                  {c.initials}
                </div>
                <div className={s.chatInfo}>
                  <p className={s.chatName}>{c.name}</p>
                  <p className={s.chatPreview}>{c.preview}</p>
                </div>
                <div className={s.chatMeta}>
                  <p className={s.chatTime}>{c.time}</p>
                  {c.unread > 0 && <div className={s.chatUnread}>{c.unread}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message view */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Chat header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #eaecef', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className={s.chatAvatar} style={{ background: chat.color, color: chat.color === '#032210' ? '#fff' : '#032210', width: 38, height: 38, fontSize: 14 }}>
              {chat.initials}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#032210' }}>{chat.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(3,34,16,0.4)' }}>Active now</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            {chat.messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '68%',
                    padding: '10px 14px',
                    borderRadius: msg.from === 'me' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.from === 'me' ? '#032210' : '#f5f6f8',
                    color: msg.from === 'me' ? '#fff' : '#032210',
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 24px', borderTop: '1px solid #eaecef', display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Write a message…"
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 12,
                border: '1.5px solid #eaecef',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                color: '#032210',
              }}
            />
            <button
              style={{
                padding: '10px 20px',
                background: '#032210',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

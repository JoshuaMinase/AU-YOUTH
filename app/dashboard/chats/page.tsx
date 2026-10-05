'use client';

import { useState } from 'react';
import s from '@/styles/Dashboard.module.css';

const COLORS = ['#C9A84C','#7BC9A0','#6BB5D9','#E07B7B','#A78BFA'];

const CHATS = [
  {
    initials: 'AM', name: 'Amara Mensah',
    preview: "Thanks for sharing the report!",
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

  return (
    <>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Chats</h1>
        <p className={s.pageSubtitle}>Direct messages and group conversations.</p>
      </div>

      <div className={s.chatsShell}>
        {/* List */}
        <div className={s.chatList}>
          <div className={s.chatListHeader}>Messages</div>
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
                {c.unread > 0 && <div className={s.chatUnreadBadge}>{c.unread}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Messages */}
        <div className={s.chatArea}>
          <div className={s.chatAreaHeader}>
            <div className={s.chatAvatar} style={{ width:36, height:36, fontSize:13, background: chat.color, color: chat.color === '#032210' ? '#fff' : '#032210' }}>
              {chat.initials}
            </div>
            <div>
              <p className={s.chatAreaName}>{chat.name}</p>
              <p className={s.chatAreaStatus}>Active now</p>
            </div>
          </div>

          <div className={s.chatMessages}>
            {chat.messages.map((msg, i) => (
              <div key={i} className={`${s.msgBubble} ${msg.from === 'me' ? s.msgMe : s.msgThem}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className={s.chatInputRow}>
            <input
              className={s.chatInput}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Write a message…"
            />
            <button className={s.chatSendBtn}>Send</button>
          </div>
        </div>
      </div>
    </>
  );
}

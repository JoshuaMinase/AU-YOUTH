'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { I, MiniCalendar, useToast } from '@/components/portal/ui';
import { MONTHS, MONTHS_SHORT, NEWS, WEEKDAYS, parseYmd, profileScore, ymd, softAvatar } from '@/lib/data';
import { useMe } from '@/lib/me';
import { useToday, copyText } from '@/lib/hooks';
import { useChats, useEvents } from '@/lib/portal';
import { usePersisted, toggleIn } from '@/lib/store';
import s from '@/styles/Portal.module.css';

interface Post { id: string; initials: string; bg: string; name: string; meta: string; body: string; image?: string; likes: number; comments: { who: string; text: string }[] }

const SEED_POSTS: Post[] = [
  { id: 'p1', initials: 'AU', bg: '#032210', name: 'AU Youth Network', meta: '2 hours ago · Pinned',
    body: '🎉 Welcome to Intern Onboarding Week! Make sure to complete your profile so coordinators can match you to the right projects. Reach out to your cohort lead if you have any questions.',
    image: '/assets/card-img-1.webp', likes: 124, comments: [{ who: 'Amara Mensah', text: 'So excited to be here!' }] },
  { id: 'p2', initials: 'SD', bg: '#117302', name: 'Skills Development Team', meta: 'Yesterday · Public',
    body: '📋 Registration is now open for the Skills Development Workshop in Mandela Hall. Seats are limited — secure yours today!', likes: 57, comments: [] },
];

const NOTIFS = [
  { id: 'n1', icon: 'AU', bg: '#ECECE8', fg: '#1E2A22', title: 'New announcement posted', body: 'AU Youth Network shared an update about Intern Onboarding Week.', time: '2 hours ago', href: `/dashboard/news/${NEWS[0].slug}` },
  { id: 'n2', icon: '📅', bg: '#F3EEE4', fg: '#8a6a3c', title: 'Event reminder', body: 'Youth Innovation Exchange starts today at 14:00 — Online.', time: '5 hours ago', href: '/dashboard/calendar' },
  { id: 'n3', icon: '✓', bg: '#E8EEE9', fg: '#2F4A3A', title: 'Profile tip', body: 'Complete your profile to increase your visibility to project coordinators.', time: '1 day ago', href: '/dashboard/profile' },
];

const greet = (d: Date) => { const h = d.getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export default function DashboardHome() {
  const today = useToday();
  const { events } = useEvents(today);
  const { chats, unread, send, markRead } = useChats();
  const [toast, toastNode] = useToast();
  const [selected, setSelected] = useState('');
  const selKey = selected || (today ? ymd(today) : '');

  /* feed */
  const [myPosts, setMyPosts] = usePersisted<Post[]>('auy-posts', []);
  const [liked, setLiked] = usePersisted<string[]>('auy-likes', []);
  const [hidden, setHidden] = usePersisted<string[]>('auy-hidden', []);
  const [extraComments, setExtraComments] = usePersisted<Record<string, { who: string; text: string }[]>>('auy-comments', {});
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const posts = [...myPosts, ...SEED_POSTS].filter((p) => !hidden.includes(p.id));

  const { me, profile } = useMe();
  const completion = profileScore(profile);

  const [readNotifs, setReadNotifs] = usePersisted<string[]>('auy-notifs-read', []);
  const newCount = NOTIFS.filter((n) => !readNotifs.includes(n.id)).length;

  const dayEvents = useMemo(() => events.filter((e) => e.date === selKey), [events, selKey]);
  const upcoming = useMemo(() => (today ? events.filter((e) => e.date >= ymd(today)).slice(0, 3) : []), [events, today]);
  /* quick chat: unread conversations first, then most recent */
  const recentChats = useMemo(() => [...chats].sort((a, b) => b.unread - a.unread).slice(0, 3), [chats]);
  const [qcId, setQcId] = useState('');
  const [qcDraft, setQcDraft] = useState('');
  const qc = chats.find((c) => c.id === qcId) ?? recentChats[0];

  const publish = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setMyPosts((p) => [{ id: `me-${Date.now()}`, initials: me.initials, bg: '#E2CBA4', name: me.name, meta: 'Just now · Public', body, likes: 0, comments: [] }, ...p]);
    setDraft('');
    toast('Posted to the community');
  };

  const addComment = (id: string) => {
    const text = commentDraft.trim();
    if (!text) return;
    setExtraComments((p) => ({ ...p, [id]: [...(p[id] ?? []), { who: me.name, text }] }));
    setCommentDraft('');
  };

  const selDate = selKey ? parseYmd(selKey) : null;

  return (
    <>
      <div className={s.homeGrid}>
        {/* ── Left ─────────────────────────────── */}
        <aside className={s.col}>
          <Link href="/dashboard/profile" className={s.profileCard} data-reveal>
            <span className={s.ringWrap}>
              <svg viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ECECE8" strokeWidth="3.4" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1E2A22" strokeWidth="3.4" strokeLinecap="round"
                  strokeDasharray={`${completion} ${100 - completion}`} pathLength={100} />
              </svg>
              <span className={s.ringPct}>{completion}%</span>
            </span>
            <span className={s.profileText}>
              <span className={s.profileTitle} style={{ display: 'block' }}>{completion < 100 ? 'Complete your profile' : 'Profile complete'}</span>
              <span className={s.profileSub}>{completion < 100 ? 'A few details left' : 'Looking good'}</span>
            </span>
            <span className={s.profileCta} aria-hidden="true">{I.right}</span>
          </Link>

          <div className={s.card} data-reveal>
            <div className={s.cardHead}>
              <div>
                <p className={s.cardEyebrow}>Schedule</p>
                <h2 className={s.cardTitle}>Your calendar</h2>
              </div>
              <Link href="/dashboard/calendar" className={s.cardLink}>Full calendar →</Link>
            </div>
            {today ? (
              <>
                <MiniCalendar today={today} events={events} selected={selKey} onSelect={setSelected} />
                <div className={s.agenda}>
                  <p className={s.agendaLabel}>
                    {selKey === ymd(today) ? 'Today' : selDate && `${WEEKDAYS[selDate.getDay()]} ${selDate.getDate()} ${MONTHS[selDate.getMonth()]}`}
                  </p>
                  {dayEvents.length ? dayEvents.map((ev) => (
                    <div key={ev.id} className={`${s.agendaRow} ${s[`ev_${ev.type}`]}`}>
                      <span className={s.dot} />
                      <span className={s.agendaTime}>{ev.time}</span>
                      <span className={s.agendaTitle}>{ev.title}</span>
                    </div>
                  )) : <p className={s.agendaEmpty}>Nothing scheduled.</p>}
                </div>
              </>
            ) : <div style={{ height: 300 }} />}
          </div>
        </aside>

        {/* ── Centre ───────────────────────────── */}
        <section className={s.col}>
          <Link href={`/dashboard/news/${NEWS[0].slug}`} className={s.announce} data-reveal style={{ textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/baskets.webp" alt="" aria-hidden="true" />
            <span className={s.announceEyebrow}>Latest announcement</span>
            <span className={s.announceRow}>
              <span>
                <h2 className={s.announceTitle}>{NEWS[0].title}</h2>
                <span className={s.announceBody} style={{ display: 'block' }}>{NEWS[0].source} · {NEWS[0].meta}</span>
              </span>
              <span className={s.announceBtn}>Read more {I.right}</span>
            </span>
          </Link>

          <section className={s.greet}>
            <div>
              <p className={s.greetDate}>{today ? `${WEEKDAYS[today.getDay()]}, ${today.getDate()} ${MONTHS[today.getMonth()]}` : 'Welcome back'}</p>
              <h1 className={s.greetTitle}>
                <span className={s.mask}><span data-w className={s.word}>{today ? greet(new Date()) : 'Hello'},</span></span>{' '}
                <span className={s.mask}><span data-w className={s.word}><em>{me.first || 'there'}.</em></span></span>
              </h1>
              <p className={s.greetSub}>Here is what is happening across your AU intern community.</p>
            </div>
            <Link href="/dashboard/calendar" className={s.btnLine}>{I.calendar} Open calendar</Link>
          </section>

          {/* composer */}
          <div className={`${s.card} ${s.composer}`} data-reveal>
            <span className={s.av} style={{ background: '#E2CBA4', color: '#1E2A22' }}>{me.initials}</span>
            <form onSubmit={publish}>
              <label className={s.agendaLabel} htmlFor="composer">Share with the community</label>
              <textarea id="composer" className={s.textarea} style={{ minHeight: 70 }} value={draft}
                onChange={(e) => setDraft(e.target.value)} placeholder="Share an update, idea or question…" maxLength={600} />
              <div className={s.composerRow}>
                <span className={s.cardMeta}>{draft.length}/600</span>
                <button type="submit" className={s.btnDark} disabled={!draft.trim()}>{I.send} Post</button>
              </div>
            </form>
          </div>

          {posts.map((p) => {
            const isLiked = liked.includes(p.id);
            const comments = [...p.comments, ...(extraComments[p.id] ?? [])];
            return (
              <article key={p.id} className={`${s.card} ${s.post}`} data-reveal>
                <div className={s.postHead}>
                  <span className={s.av} style={softAvatar(p.bg)}>{p.initials}</span>
                  <div>
                    <p className={s.postName}>{p.name}</p>
                    <p className={s.postMeta}>{p.meta}</p>
                  </div>
                  <div className={s.menuWrap}>
                    <button type="button" className={s.iconBtn} aria-label="Post options" aria-expanded={menu === p.id}
                      onClick={() => setMenu(menu === p.id ? null : p.id)}>{I.more}</button>
                    {menu === p.id && (
                      <div className={s.menu} role="menu">
                        <button type="button" role="menuitem" onClick={() => { setHidden((h) => [...h, p.id]); setMenu(null); toast('Post hidden'); }}>Hide post</button>
                        {p.id.startsWith('me-') && (
                          <button type="button" role="menuitem" onClick={() => { setMyPosts((m) => m.filter((x) => x.id !== p.id)); setMenu(null); toast('Post deleted'); }}>Delete post</button>
                        )}
                        <button type="button" role="menuitem" onClick={() => setMenu(null)}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
                <p className={s.postBody}>{p.body}</p>
                {p.image && (
                  <div className={s.postImg}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" loading="lazy" />
                  </div>
                )}
                <div className={s.postActions}>
                  <button type="button" className={s.action} aria-pressed={isLiked} onClick={() => setLiked((l) => toggleIn(l, p.id))}>
                    {I.like}{p.likes + (isLiked ? 1 : 0)} likes
                  </button>
                  <button type="button" className={s.action} aria-expanded={openComments === p.id}
                    onClick={() => { setOpenComments(openComments === p.id ? null : p.id); setCommentDraft(''); }}>
                    {I.comment}{comments.length} comments
                  </button>
                  <button type="button" className={s.action}
                    onClick={async () => toast((await copyText(`${location.origin}/dashboard#${p.id}`)) ? 'Link copied' : 'Could not copy link')}>
                    {I.share}Share
                  </button>
                </div>
                {openComments === p.id && (
                  <div className={s.comments}>
                    {comments.map((c, i) => <p key={i} className={s.comment}><b>{c.who}</b>{c.text}</p>)}
                    <form className={s.inlineForm} onSubmit={(e) => { e.preventDefault(); addComment(p.id); }}>
                      <input className={s.input} value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="Write a comment…" aria-label="Write a comment" autoFocus />
                      <button type="submit" className={`${s.btnDark} ${s.btnSm}`} disabled={!commentDraft.trim()}>Reply</button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
          {!posts.length && <p className={s.empty}>You have hidden every post. <button type="button" className={s.cardLink} style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => setHidden([])}>Show them again</button></p>}
        </section>

        {/* ── Right ────────────────────────────── */}
        <aside className={s.col}>
          <div className={s.card} data-reveal>
            <div className={s.cardHead}>
              <div>
                <p className={s.cardEyebrow}>Messages</p>
                <h3 className={s.cardTitle}>Quick chat</h3>
              </div>
              <span className={s.unreadPill}>{unread ? `${unread} unread` : 'All read'}</span>
            </div>
            <div className={s.qc}>
              {recentChats.map((c) => (
                <button key={c.id} type="button" className={s.qcRow} aria-pressed={c.id === qc.id}
                  onClick={() => { setQcId(c.id); markRead(c.id); }}>
                  <span className={`${s.av} ${s.qcAv}`} style={softAvatar(c.color)}>{c.initials}</span>
                  <span className={s.qcMain}>
                    <span className={s.qcTop}><span className={s.qcName}>{c.name}</span><span className={s.qcTime}>{c.time}</span></span>
                    <span className={s.qcPreview} data-unread={c.unread ? '' : undefined} style={{ display: 'block' }}>{c.preview}</span>
                  </span>
                  {c.unread > 0 && <span className={s.chatUnread}>{c.unread}</span>}
                </button>
              ))}
            </div>
            <form className={s.qcReply} onSubmit={(e) => {
              e.preventDefault();
              const t = qcDraft.trim(); if (!t) return;
              send(qc.id, t); markRead(qc.id); setQcDraft(''); toast(`Sent to ${qc.name.split(' ')[0]}`);
            }}>
              <input value={qcDraft} onChange={(e) => setQcDraft(e.target.value)} placeholder={`Reply to ${qc.name.split(' ')[0]}…`} aria-label={`Reply to ${qc.name}`} maxLength={1000} />
              <button type="submit" className={s.qcSend} disabled={!qcDraft.trim()} aria-label="Send">{I.send}</button>
            </form>
            <div className={s.qcFoot}><Link href="/dashboard/chats" className={s.cardLink}>Open all chats →</Link></div>
          </div>

          <div className={s.card} data-reveal>
            <div className={s.cardHead}>
              <div>
                <p className={s.cardEyebrow}>Activity</p>
                <h3 className={s.cardTitle}>Notifications</h3>
              </div>
              {newCount > 0
                ? <button type="button" className={s.cardLink} style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => setReadNotifs(NOTIFS.map((n) => n.id))}>Mark all read</button>
                : <span className={s.cardMeta}>All caught up</span>}
            </div>
            {NOTIFS.map((n) => (
              <Link key={n.id} href={n.href} className={s.notif} onClick={() => setReadNotifs((r) => (r.includes(n.id) ? r : [...r, n.id]))}>
                <span className={s.notifIcon} style={{ background: n.bg, color: n.fg }}>{n.icon}</span>
                <span>
                  <span className={s.notifTitle}>{n.title}{!readNotifs.includes(n.id) && <i aria-label="unread" />}</span>
                  <span className={s.notifText} style={{ display: 'block' }}>{n.body}</span>
                  <span className={s.notifTime} style={{ display: 'block' }}>{n.time}</span>
                </span>
              </Link>
            ))}
          </div>

          <div className={s.card} data-reveal>
            <div className={s.cardHead}>
              <div>
                <p className={s.cardEyebrow}>Events</p>
                <h3 className={s.cardTitle}>Coming up</h3>
              </div>
              <Link href="/dashboard/calendar" className={s.cardLink}>See all →</Link>
            </div>
            <div className={s.coming}>
              {upcoming.map((ev) => {
                const d = parseYmd(ev.date);
                return (
                  <Link key={ev.id} href="/dashboard/calendar" className={s.comingItem}>
                    <span className={s.dateTile}><span className={s.dateMonth}>{MONTHS_SHORT[d.getMonth()]}</span><span className={s.dateDay}>{d.getDate()}</span></span>
                    <span>
                      <span className={s.comingTitle} style={{ display: 'block' }}>{ev.title}</span>
                      <span className={s.comingMeta}>{ev.time} · {ev.location}</span>
                    </span>
                  </Link>
                );
              })}
              {today && !upcoming.length && <p className={s.agendaEmpty}>No upcoming events.</p>}
            </div>
          </div>

        </aside>
      </div>
      {toastNode}
    </>
  );
}

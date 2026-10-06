import s from '@/styles/Dashboard.module.css';
import Link from 'next/link';

/* ─── Calendar data ───────────────────────────────────────────── */
const WEEK_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
// October 2026: 1st is a Thursday → 3 blanks before day 1
const CAL_OFFSET = 3;
const CAL_DAYS   = 31;
const CAL_TODAY  = 18;
const CAL_EVENT_DAYS = [7, 9, 11, 18, 22, 25];

function MiniCalendar() {
  const cells: (number | null)[] = [
    ...Array(CAL_OFFSET).fill(null),
    ...Array.from({ length: CAL_DAYS }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={s.miniCal}>
      {/* Week labels */}
      <div className={s.miniCalWeekRow}>
        {WEEK_LABELS.map(d => (
          <span key={d} className={s.miniCalWeekLabel}>{d}</span>
        ))}
      </div>
      {/* Day cells */}
      <div className={s.miniCalGrid}>
        {cells.map((day, i) => {
          const isToday    = day === CAL_TODAY;
          const hasEvent   = day !== null && CAL_EVENT_DAYS.includes(day) && !isToday;
          return (
            <span
              key={i}
              className={[
                s.miniCalDay,
                !day       ? s.miniCalDayEmpty : '',
                isToday    ? s.miniCalDayToday : '',
                hasEvent   ? s.miniCalDayEvent : '',
              ].filter(Boolean).join(' ')}
            >
              {day ?? ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Today's events ──────────────────────────────────────────── */
const TODAY_EVENTS = [
  { time: '10:00', title: 'Weekly Intern Coordination', type: 'meeting'  },
  { time: '14:00', title: 'Youth Innovation Exchange',  type: 'event'    },
  { time: '09:00', title: 'Skills Development Workshop',type: 'workshop' },
];

/* ─── Notifications ───────────────────────────────────────────── */
const NOTIFICATIONS = [
  {
    id: 1,
    icon: 'AU',
    iconBg: '#032210',
    iconColor: '#D68B17',
    title: 'New announcement posted',
    body: 'AU Youth Network shared an update about Intern Onboarding Week 2026.',
    time: '2 hours ago',
    timeColor: '#D68B17',
  },
  {
    id: 2,
    icon: '📅',
    iconBg: 'rgba(214,139,23,0.12)',
    iconColor: '#D68B17',
    title: 'Event reminder',
    body: 'Youth Innovation Exchange starts tomorrow at 14:00 — Online.',
    time: '5 hours ago',
    timeColor: '#D68B17',
  },
  {
    id: 3,
    icon: '✓',
    iconBg: 'rgba(23,108,80,0.12)',
    iconColor: '#176C50',
    title: 'Profile tip',
    body: 'Complete your profile to increase your visibility to project coordinators.',
    time: '1 day ago',
    timeColor: 'var(--muted)',
  },
];

/* ─── Coming up events ────────────────────────────────────────── */
const COMING_UP = [
  { day: '07', month: 'SEP', tag: 'MEETING',  tagColor: s.tagMeeting,  title: 'Weekly Intern Coordination', time: '10:00', location: 'Mandela Hall' },
  { day: '09', month: 'SEP', tag: 'EVENT',    tagColor: s.tagEvent,    title: 'Youth Innovation Exchange',   time: '14:00', location: 'Online'       },
  { day: '11', month: 'SEP', tag: 'WORKSHOP', tagColor: s.tagWorkshop, title: 'Skills Development Workshop', time: '09:00', location: 'Mandela Hall' },
];

/* ─── Social feed posts ───────────────────────────────────────── */
const FEED_POSTS = [
  {
    id: 1,
    initials: 'AU',
    avatarBg: '#032210',
    avatarColor: '#D68B17',
    name: 'AU Youth Network',
    meta: '2 hours ago · Pinned',
    isPinned: true,
    body: '🎉 Welcome to Intern Onboarding Week 2026! Make sure to complete your profile so coordinators can match you to the right projects. Reach out to your cohort lead if you have any questions.',
    image: '/assets/card-img-1.jpg',
    likes: 124,
    comments: 18,
  },
  {
    id: 2,
    initials: 'SD',
    avatarBg: '#176C50',
    avatarColor: '#fff',
    name: 'Skills Development Team',
    meta: 'Yesterday · Public',
    isPinned: false,
    body: '📋 Registration is now open for the Skills Development Workshop on 11 Sep, 09:00 at Mandela Hall. Seats are limited — secure yours today!',
    image: null,
    likes: 57,
    comments: 9,
  },
];

/* ─────────────────────────────────────────────────────────────── */

export default function DashboardHome() {
  return (
    <div className={s.homeGrid}>

      {/* ════════════════════════════════════════════
          LEFT COLUMN
          ════════════════════════════════════════════ */}
      <aside className={s.homeLeft}>

        {/* Profile completion card */}
        <div className={s.profileCard}>
          <div className={s.profileCardRing}>
            {/* Conic-gradient ring */}
            <svg viewBox="0 0 36 36" className={s.ringCircleSvg} aria-hidden="true">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ddd4c5" strokeWidth="3"/>
              <circle
                cx="18" cy="18" r="15.9"
                fill="none" stroke="#D68B17" strokeWidth="3"
                strokeDasharray="65 35"
                strokeDashoffset="25"
                strokeLinecap="round"
              />
            </svg>
            <span className={s.ringPctLabel}>65%</span>
          </div>
          <div className={s.profileCardBody}>
            <p className={s.profileCardTitle}>Complete your profile</p>
            <p className={s.profileCardSub}>Add the remaining required details so other interns can find and trust your profile.</p>
          </div>
        </div>

        {/* Mini calendar */}
        <div className={s.calCard}>
          <div className={s.calCardHead}>
            <div>
              <p className={s.calCardEyebrow}>OCTOBER 2026</p>
              <h2 className={s.calCardTitle}>Your calendar</h2>
            </div>
            <Link href="/dashboard/calendar" className={s.calCardLink}>
              Full calendar
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Link>
          </div>

          {/* Month navigation */}
          <div className={s.calMonthNav}>
            <button className={s.calNavArrow} aria-label="Previous month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span className={s.calMonthLabel}>October 2026</span>
            <button className={s.calNavArrow} aria-label="Next month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          <MiniCalendar />

          {/* Today's schedule */}
          <div className={s.todaySchedule}>
            {TODAY_EVENTS.map((ev, i) => (
              <div key={i} className={s.todayRow}>
                <span className={`${s.todayDot} ${s[`dot_${ev.type}`]}`} />
                <span className={s.todayTime}>{ev.time}</span>
                <span className={s.todayTitle}>{ev.title}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════════
          CENTRE COLUMN
          ════════════════════════════════════════════ */}
      <section className={s.homeCentre}>

        {/* Welcome greeting */}
        <div className={s.welcomeRow}>
          <div>
            <p className={s.welcomeDate}>TUESDAY, 8 SEPTEMBER</p>
            <h1 className={s.welcomeHeading}>Good morning, Yididiya.</h1>
            <p className={s.welcomeSub}>Here is what is happening across your AU intern community.</p>
          </div>
          <Link href="/dashboard/calendar" className={s.openCalBtn}>
            Open calendar
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>
            </svg>
          </Link>
        </div>

        {/* Featured announcement banner */}
        <div className={s.announceBanner}>
          <div className={s.announceBannerInner}>
            <p className={s.announceEyebrow}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 11l19-9-9 19-2-8-8-2z"/>
              </svg>
              LATEST ANNOUNCEMENT
            </p>
            <h2 className={s.announceTitle}>AU Youth Network — Intern Onboarding Week 2026</h2>
            <p className={s.announceBody}>Welcome all new interns! Check your schedules and complete your profiles.</p>
          </div>
          <button className={s.announceBtn}>
            Read more
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Social feed */}
        <div className={s.feedList}>
          {FEED_POSTS.map(post => (
            <article key={post.id} className={s.feedPost}>
              {/* Post header */}
              <div className={s.feedPostHead}>
                <div
                  className={s.feedAvatar}
                  style={{ background: post.avatarBg, color: post.avatarColor }}
                >
                  {post.initials}
                </div>
                <div className={s.feedPostMeta}>
                  <p className={s.feedPostName}>{post.name}</p>
                  <p className={s.feedPostTime}>{post.meta}</p>
                </div>
                <button className={s.feedMoreBtn} aria-label="More options">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                  </svg>
                </button>
              </div>

              {/* Post body */}
              <p className={s.feedPostBody}>{post.body}</p>

              {/* Post image */}
              {post.image && (
                <div className={s.feedPostImgWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.image} alt="" className={s.feedPostImg} />
                </div>
              )}

              {/* Post actions */}
              <div className={s.feedActions}>
                <button className={s.feedAction}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>
                  </svg>
                  {post.likes} likes
                </button>
                <button className={s.feedAction}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {post.comments} comments
                </button>
                <button className={s.feedAction}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Share
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          RIGHT COLUMN
          ════════════════════════════════════════════ */}
      <aside className={s.homeRight}>

        {/* Notifications */}
        <div className={s.notifCard}>
          <div className={s.notifCardHead}>
            <div className={s.notifCardHeadLeft}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <h3 className={s.notifCardTitle}>Notifications</h3>
            </div>
            <span className={s.notifBadge}>3 new</span>
          </div>

          <div className={s.notifList}>
            {NOTIFICATIONS.map(n => (
              <div key={n.id} className={s.notifItem}>
                <div
                  className={s.notifIcon}
                  style={{ background: n.iconBg, color: n.iconColor }}
                >
                  {n.icon}
                </div>
                <div className={s.notifBody}>
                  <p className={s.notifTitle}>{n.title}</p>
                  <p className={s.notifText}>{n.body}</p>
                  <span className={s.notifTime} style={{ color: n.timeColor }}>{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming up */}
        <div className={s.comingCard}>
          <div className={s.comingCardHead}>
            <div>
              <p className={s.comingEyebrow}>ANNOUNCEMENTS</p>
              <h3 className={s.comingTitle}>Coming up</h3>
            </div>
            <span className={s.comingBadge}>3 new</span>
          </div>

          <div className={s.comingList}>
            {COMING_UP.map(ev => (
              <div key={ev.day} className={s.comingItem}>
                <div className={s.comingDateBlock}>
                  <span className={s.comingMonth}>{ev.month}</span>
                  <span className={s.comingDay}>{ev.day}</span>
                </div>
                <div className={s.comingItemBody}>
                  <span className={`${s.comingTag} ${ev.tagColor}`}>{ev.tag}</span>
                  <p className={s.comingItemTitle}>{ev.title}</p>
                  <p className={s.comingItemMeta}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {ev.time}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 6 }}>
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {ev.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick chat */}
        <div className={s.quickChatCard}>
          <div className={s.quickChatHead}>
            <div className={s.quickChatHeadLeft}>
              <div className={s.quickChatIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>
                </svg>
              </div>
              <div>
                <p className={s.quickChatTitle}>Quick chat</p>
                <p className={s.quickChatSub}>3 unread messages</p>
              </div>
            </div>
            <div className={s.quickChatActions}>
              <Link href="/dashboard/chats" className={s.quickChatExpand} aria-label="Open full chats">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </Link>
              <button className={s.quickChatClose} aria-label="Close quick chat">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Latest message preview */}
          <div className={s.quickChatPreview}>
            <div className={s.quickChatAvatar} style={{ background: '#032210', color: '#D68B17' }}>
              YD
            </div>
            <div className={s.quickChatMsg}>
              <p className={s.quickChatMsgName}>Yididiya D.</p>
              <p className={s.quickChatMsgText}>Hey, when is the workshop starting?</p>
            </div>
            <span className={s.quickChatUnread}>3</span>
          </div>
        </div>

      </aside>
    </div>
  );
}

/**
 * Mock data shared by every portal page. There is no backend yet — swap
 * these for API calls later. Event dates are generated relative to "today"
 * so the calendar, home page and "coming up" lists always agree.
 */
import type { ChatFile, ChatKind } from './chatFiles';

/* ── Current user ─────────────────────────────────────────────────── */
export const ME = {
  first: 'Yididiya',
  name: 'Yididiya D.',
  initials: 'YD',
  role: 'Intern',
  dept: 'HRST',
  deptLong: 'Human Resources, Science & Technology',
  org: 'AU Commission',
};

/* ── Editable profile ─────────────────────────────────────────────── */
export interface Profile {
  bio: string; nationality: string; basedIn: string; start: string; end: string;
  gender: string; skills: string[]; languages: string[];
}

/** values stored in profiles.gender (docs/sql/019_gender.sql allows exactly these, or empty) */
export const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;
export const genderLabel = (v: string) => GENDERS.find((g) => g.value === v)?.label ?? '';

export const PROFILE_DEFAULT: Profile = {
  bio: '', nationality: 'Ethiopian', basedIn: 'Addis Ababa, Ethiopia', start: 'July 2026', end: 'December 2026',
  gender: '',
  skills: ['Policy Analysis', 'Research', 'Public Speaking', 'Data Analysis', 'Project Management', 'French', 'English', 'Amharic'],
  languages: [],
};

/** sign-up is limited to these email domains (enforced in Supabase by docs/sql/013_roles.sql) */
export const ALLOWED_DOMAINS = ['africanunion.org', 'africa-union.org'];
export const isAllowedEmail = (email: string) => ALLOWED_DOMAINS.includes(email.trim().toLowerCase().split('@')[1] ?? '');
/** super admin (one) > admin (set by the super admin) > user */
export type Access = 'super_admin' | 'admin' | 'user';

/* ── Department colour tones ───────────────────────────────────────────
 * Each department gets a slightly different calm tone for the dashboard (page tint, soft fills, bronze accent).
 * Chosen from the department name, so everyone in a department sees the same tone. No department = the original look. */
export interface DeptTone { bg: string; glow: string; soft: string; accent: string; accentLt: string }
export const DEFAULT_TONE: DeptTone = { bg: '#F5F5F3', glow: '#F5F5F3', soft: '#ECECE8', accent: '#B8935A', accentLt: '#E2CBA4' };
const DEPT_TONES: DeptTone[] = [
  { bg: '#F6F3EE', glow: '#EFE4D2', soft: '#EDE8DF', accent: '#B8935A', accentLt: '#E2CBA4' }, // sand
  { bg: '#F7F2F1', glow: '#F0DDDA', soft: '#EEE6E4', accent: '#B07468', accentLt: '#E5C3BB' }, // rose
  { bg: '#F1F4F7', glow: '#DCE8F1', soft: '#E6EBEF', accent: '#5E86A3', accentLt: '#BFD4E4' }, // sky
  { bg: '#F2F5F2', glow: '#DDE9DE', soft: '#E6EBE6', accent: '#6E9072', accentLt: '#C5D9C7' }, // sage
  { bg: '#F4F2F7', glow: '#E4DEEE', soft: '#EAE6EF', accent: '#8473A6', accentLt: '#D2C8E6' }, // lavender
  { bg: '#F0F5F5', glow: '#D6E8E7', soft: '#E4EBEB', accent: '#4F8E8C', accentLt: '#B9DAD8' }, // teal
  { bg: '#F8F3EF', glow: '#F3DFCF', soft: '#EFE7E0', accent: '#C0805A', accentLt: '#EBCBB3' }, // apricot
  { bg: '#F2F3F5', glow: '#DFE2E8', soft: '#E7E9ED', accent: '#6B778C', accentLt: '#C7CEDA' }, // slate
];
export function deptTone(dept: string): DeptTone {
  const key = dept.trim().toLowerCase();
  if (!key) return DEFAULT_TONE;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return DEPT_TONES[h % DEPT_TONES.length];
}

/** What a member must fill in before they can post, chat, add events or connect (until then: view-only).
 *  Keep in sync with private.profile_complete() in docs/sql/022_profile_gate.sql. Admins and the super admin are not limited, only reminded. */
export const profileMissing = (p: Profile, extra: { role: string; dept: string }): string[] => {
  const m: string[] = [];
  if (!extra.role.trim()) m.push('your role');
  if (!extra.dept.trim()) m.push('your department');
  if (!p.nationality.trim()) m.push('your nationality');
  if (!p.basedIn.trim()) m.push('where you are based');
  if (!p.gender) m.push('your gender');
  if (!p.skills.length) m.push('at least one skill');
  return m;
};
const PROFILE_REQUIRED = 6; // role, department, nationality, based in, gender, one skill (the bio is optional)
/** completion %: share of the required fields filled in, so 100% means the profile is complete and nothing is locked */
export const profileScore = (p: Profile, extra: { role: string; dept: string }) =>
  Math.round((100 * (PROFILE_REQUIRED - profileMissing(p, extra).length)) / PROFILE_REQUIRED);
export const PROFILE_LOCKED_MSG = 'Complete your profile first (Profile → Finish profile) to use this.';

/* ── Dates ─────────────────────────────────────────────────────────── */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const pad = (n: number) => String(n).padStart(2, '0');
/** local YYYY-MM-DD key (no timezone shifts) */
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3).toUpperCase());
export const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/** Monday-first month grid: null = padding cell */
export function monthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

/* ── Events ───────────────────────────────────────────────────────── */
export type EventType = 'meeting' | 'event' | 'workshop' | 'session' | 'call' | 'forum';
/** isPublic = visible to every member (admins only can create these); mine = you created it, so you can edit or delete it */
export interface CalEvent {
  id: string; date: string; time: string; title: string; type: EventType; location: string; isPublic: boolean; mine: boolean;
  /** last day of a multi-day event (null = single day) */
  endDate: string | null; description: string; images: string[];
  /** who created it (shown on public events) */
  by: string;
}

export const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: 'meeting', label: 'Meeting' }, { id: 'event', label: 'Event' },
  { id: 'workshop', label: 'Workshop' }, { id: 'session', label: 'Session' },
  { id: 'call', label: 'Call' }, { id: 'forum', label: 'Forum' },
];

/** last day an event covers */
export const lastDay = (e: Pick<CalEvent, 'date' | 'endDate'>) => e.endDate ?? e.date;
/** does the event cover this day? (date keys compare as plain strings) */
export const eventOn = (e: Pick<CalEvent, 'date' | 'endDate'>, key: string) => key >= e.date && key <= lastDay(e);
/** every day key an event covers (capped, the database allows 90 days) */
export function eventDays(e: Pick<CalEvent, 'date' | 'endDate'>): string[] {
  const out: string[] = [];
  const end = parseYmd(lastDay(e));
  for (let d = parseYmd(e.date); d <= end && out.length < 92; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) out.push(ymd(d));
  return out;
}
/** "3 Nov 2026", "3–6 Nov 2026" or "30 Oct – 2 Nov 2026" */
export function dateRangeLabel(e: Pick<CalEvent, 'date' | 'endDate'>): string {
  const a = parseYmd(e.date), b = parseYmd(lastDay(e));
  const m = (d: Date) => MONTHS[d.getMonth()].slice(0, 3);
  if (e.date === lastDay(e)) return `${a.getDate()} ${m(a)} ${a.getFullYear()}`;
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${a.getDate()}–${b.getDate()} ${m(b)} ${b.getFullYear()}`;
  return `${a.getDate()} ${m(a)}${a.getFullYear() === b.getFullYear() ? '' : ` ${a.getFullYear()}`} – ${b.getDate()} ${m(b)} ${b.getFullYear()}`;
}

export const sortEvents = (a: CalEvent, b: CalEvent) => (a.date + a.time).localeCompare(b.date + b.time);

/* ── News ─────────────────────────────────────────────────────────── */
export type NewsCat = 'Initiatives' | 'Opportunities' | 'Events' | 'Partnerships' | 'Announcements' | 'Development';
export interface NewsItem {
  slug: string; tag: string; cat: NewsCat; title: string; excerpt: string;
  body: string[]; meta: string; source: string; img: string; featured?: boolean;
}

export const NEWS_CATS: ('All' | NewsCat)[] = ['All', 'Initiatives', 'Opportunities', 'Events', 'Partnerships', 'Development', 'Announcements'];

/* articles live in the Supabase `news` table (seeded by docs/sql/009_news.sql) */

/* ── People ───────────────────────────────────────────────────────── */
/* members and departments live in Supabase (`profiles`, `departments`) */

/* ── Chats ────────────────────────────────────────────────────────── */
/** `who` names the sender in group chats */
/** a support ticket as the chats show it: the card in a department chat and the bar above a ticket chat */
export interface TicketInfo {
  id: string; code: string; title: string; description: string; urgency: string;
  status: 'open' | 'in_progress' | 'closed';
  reporter: string; reporterDept: string; assignee: string;
  iAmReporter: boolean; iAmAssignee: boolean;
  reporterResolved: boolean; assigneeResolved: boolean;
}
/** T-0012 */
export const ticketCode = (no: number) => `T-${String(no).padStart(4, '0')}`;

export interface Msg { id?: string; from: 'me' | 'them'; text: string; time: string; who?: string;
  /** photo, file or voice message (text is then the optional caption); 'ticket' = a ticket card (see `ticket`) */ kind?: ChatKind; file?: ChatFile; forwarded?: boolean; ticket?: TicketInfo;
  /** still being sent (shown at once with a spinner); localUrl previews a photo that is uploading */ pending?: boolean; localUrl?: string }
export interface Chat { id: string; initials: string; name: string; color: string; time: string; unread: number; messages: Msg[]; group?: boolean;
  /** department chats only */ dept?: string; members?: { id: string; name: string }[];
  /** temporary ticket chats only: the ticket, and when the chat disappears (set once the ticket is closed) */ ticket?: TicketInfo; expiresAt?: string | null }

/** readable text colour on a coloured avatar */
export const onColor = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? '#032210' : '#fff';
};

/** calm avatar: a light tint of the member colour with dark text */
export const softAvatar = (hex: string) => ({ background: `${hex}2e`, color: '#1E2A22' });

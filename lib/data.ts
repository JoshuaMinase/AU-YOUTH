/**
 * Mock data shared by every portal page. There is no backend yet — swap
 * these for API calls later. Event dates are generated relative to "today"
 * so the calendar, home page and "coming up" lists always agree.
 */

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

/** completeness: base 50% + bio (25) + 5+ skills (15) + nationality and based-in filled (10) */
/** sign-up is limited to these email domains (enforced in Supabase by docs/sql/013_roles.sql) */
export const ALLOWED_DOMAINS = ['africanunion.org', 'africa-union.org'];
export const isAllowedEmail = (email: string) => ALLOWED_DOMAINS.includes(email.trim().toLowerCase().split('@')[1] ?? '');
/** super admin (one) > admin (set by the super admin) > user */
export type Access = 'super_admin' | 'admin' | 'user';

export const profileScore = (p: Profile) =>
  Math.min(100, 50 + (p.bio.trim().length >= 20 ? 25 : 0) + (p.skills.length >= 5 ? 15 : 0) + (p.nationality.trim() && p.basedIn.trim() ? 10 : 0));

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
export interface CalEvent { id: string; date: string; time: string; title: string; type: EventType; location: string }

export const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: 'meeting', label: 'Meeting' }, { id: 'event', label: 'Event' },
  { id: 'workshop', label: 'Workshop' }, { id: 'session', label: 'Session' },
  { id: 'call', label: 'Call' }, { id: 'forum', label: 'Forum' },
];

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
export interface Msg { id?: string; from: 'me' | 'them'; text: string; time: string; who?: string }
export interface Chat { id: string; initials: string; name: string; color: string; time: string; unread: number; messages: Msg[]; group?: boolean;
  /** department chats only */ dept?: string; members?: { id: string; name: string }[] }

/** readable text colour on a coloured avatar */
export const onColor = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? '#032210' : '#fff';
};

/** calm avatar: a light tint of the member colour with dark text */
export const softAvatar = (hex: string) => ({ background: `${hex}2e`, color: '#1E2A22' });

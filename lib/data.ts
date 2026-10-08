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
  university: string; degree: string; year: string; skills: string[]; languages: string[];
}

export const PROFILE_DEFAULT: Profile = {
  bio: '', nationality: 'Ethiopian', basedIn: 'Addis Ababa, Ethiopia', start: 'July 2026', end: 'December 2026',
  university: 'Addis Ababa University', degree: 'MSc International Relations', year: '2025–2026',
  skills: ['Policy Analysis', 'Research', 'Public Speaking', 'Data Analysis', 'Project Management', 'French', 'English', 'Amharic'],
  languages: [],
};

/** completeness: base 50% + bio (25) + 5+ skills (15) + education (10) */
/** sign-up is limited to these email domains (enforced in Supabase by docs/sql/013_roles.sql) */
export const ALLOWED_DOMAINS = ['africanunion.org', 'africa-union.org'];
export const isAllowedEmail = (email: string) => ALLOWED_DOMAINS.includes(email.trim().toLowerCase().split('@')[1] ?? '');
/** super admin (one) > admin (set by the super admin) > user */
export type Access = 'super_admin' | 'admin' | 'user';

export const profileScore = (p: Profile) =>
  Math.min(100, 50 + (p.bio.trim().length >= 20 ? 25 : 0) + (p.skills.length >= 5 ? 15 : 0) + (p.university && p.degree ? 10 : 0));

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
export type Role = 'Intern' | 'Fellow' | 'Volunteer';
export interface Person { id: string; i: string; name: string; role: Role; dept: string; country: string; flag: string; c: string }

const PC = ['#C9AB5C', '#117302', '#0072C6', '#8F2D56', '#218380', '#FBB13C', '#73D2DE', '#032210'];

export const PEOPLE: Person[] = [
  { id: 'amara',    i: 'AM', name: 'Amara Mensah',    role: 'Intern',    dept: 'HRST',              country: 'Ghana',       flag: '🇬🇭', c: PC[0] },
  { id: 'fatima',   i: 'FO', name: 'Fatima Osei',     role: 'Fellow',    dept: 'Peace & Security',  country: 'Nigeria',     flag: '🇳🇬', c: PC[1] },
  { id: 'kofi',     i: 'KB', name: 'Kofi Boateng',    role: 'Volunteer', dept: 'Economic Affairs',  country: 'Senegal',     flag: '🇸🇳', c: PC[2] },
  { id: 'zinash',   i: 'ZA', name: 'Zinash Alemu',    role: 'Intern',    dept: 'Political Affairs', country: 'Ethiopia',    flag: '🇪🇹', c: PC[3] },
  { id: 'nadia',    i: 'ND', name: 'Nadia Diallo',    role: 'Fellow',    dept: 'Social Affairs',    country: 'Ivory Coast', flag: '🇨🇮', c: PC[4] },
  { id: 'tariq',    i: 'TM', name: 'Tariq Moussa',    role: 'Intern',    dept: 'Infrastructure',    country: 'Morocco',     flag: '🇲🇦', c: PC[5] },
  { id: 'amina',    i: 'AA', name: 'Amina Abdi',      role: 'Volunteer', dept: 'Agriculture',       country: 'Kenya',       flag: '🇰🇪', c: PC[6] },
  { id: 'jean',     i: 'JN', name: 'Jean Nkosi',      role: 'Intern',    dept: 'Trade & Industry',  country: 'DRC',         flag: '🇨🇩', c: PC[7] },
  { id: 'binta',    i: 'BS', name: 'Binta Sow',       role: 'Fellow',    dept: 'HRST',              country: 'Guinea',      flag: '🇬🇳', c: PC[0] },
  { id: 'emmanuel', i: 'EW', name: 'Emmanuel Waweru', role: 'Intern',    dept: 'Legal Affairs',     country: 'Uganda',      flag: '🇺🇬', c: PC[1] },
  { id: 'layla',    i: 'LT', name: 'Layla Tadesse',   role: 'Volunteer', dept: 'Education',         country: 'Eritrea',     flag: '🇪🇷', c: PC[2] },
  { id: 'sola',     i: 'SM', name: 'Sola Martins',    role: 'Intern',    dept: 'Finance',           country: 'Nigeria',     flag: '🇳🇬', c: PC[3] },
];

export const DEPARTMENTS = Array.from(new Set(PEOPLE.map((p) => p.dept))).sort();

/* ── Chats ────────────────────────────────────────────────────────── */
/** `who` names the sender in group chats */
export interface Msg { id?: string; from: 'me' | 'them'; text: string; time: string; who?: string }
export interface Chat { id: string; initials: string; name: string; color: string; time: string; unread: number; messages: Msg[]; group?: boolean }

/** readable text colour on a coloured avatar */
export const onColor = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? '#032210' : '#fff';
};

/** calm avatar: a light tint of the member colour with dark text */
export const softAvatar = (hex: string) => ({ background: `${hex}2e`, color: '#1E2A22' });

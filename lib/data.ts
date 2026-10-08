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

export const NEWS: NewsItem[] = [
  {
    slug: 'youth-engagement-framework', tag: 'Initiative', cat: 'Initiatives', featured: true,
    title: 'AU launches new Youth Engagement Framework for 2026–2030',
    excerpt: 'The African Union Commission has unveiled an ambitious five-year strategy to deepen youth participation across all member states and institutional bodies.',
    body: [
      'The framework sets out how young people will be consulted on continental policy, from early drafting through to implementation reviews.',
      'Interns, volunteers and fellows will be able to contribute through structured working groups, with quarterly sessions hosted both online and at the AU headquarters in Addis Ababa.',
      'Departments are asked to nominate a youth focal point before the end of the quarter, so that every programme has a clear contact for the network.',
    ],
    meta: '2 hours ago', source: 'AU Commission', img: '/assets/card-img-1.webp',
  },
  {
    slug: 'volunteer-programme-cohort-7', tag: 'Opportunity', cat: 'Opportunities',
    title: 'Applications open: AU Youth Volunteer Programme — Cohort 7',
    excerpt: 'Young professionals from across the continent are invited to apply for a six-month volunteer placement at the AU headquarters in Addis Ababa.',
    body: [
      'Cohort 7 placements cover policy, communications, data and operations roles across eight departments.',
      'Applicants should be between 21 and 35, hold a degree or equivalent experience, and be a citizen of an AU member state.',
      'Shortlisted candidates will be invited to a short online interview before final selection.',
    ],
    meta: 'Yesterday', source: 'Political Affairs', img: '/assets/card-img-2.webp',
  },
  {
    slug: 'youth-innovation-summit', tag: 'Event', cat: 'Events',
    title: 'Pan-African Youth Innovation Summit to be held in Addis Ababa',
    excerpt: 'The annual summit convenes over 500 young innovators, entrepreneurs and policy makers from 55 member states.',
    body: [
      'This year’s summit focuses on digital public infrastructure, climate resilience and youth-led enterprise.',
      'Members of the network can register for a limited number of delegate places through the portal.',
    ],
    meta: '3 days ago', source: 'HRST Department', img: '/assets/card-img-3.webp',
  },
  {
    slug: 'skills-programme-10000', tag: 'Development', cat: 'Development',
    title: 'New skills programme targets 10,000 young professionals across member states',
    excerpt: 'A joint initiative between the AU and key continental partners will provide digital and vocational training to youth across all regions.',
    body: [
      'Tracks include data analysis, project management, public speaking and policy writing.',
      'Courses are self-paced, with live mentorship sessions every fortnight.',
    ],
    meta: '4 days ago', source: 'AU Commission', img: '/assets/card-img-4.webp',
  },
  {
    slug: 'au-afdb-youth-employment', tag: 'Partnership', cat: 'Partnerships',
    title: 'AU and AfDB deepen cooperation on youth employment and entrepreneurship',
    excerpt: 'The two continental institutions have signed a memorandum of understanding to co-fund youth-led businesses and employment hubs.',
    body: [
      'The agreement will fund incubation hubs in each of the five AU regions.',
      'Network members will be among the first invited to apply for mentorship and seed funding rounds.',
    ],
    meta: '5 days ago', source: 'Economic Affairs', img: '/assets/card-img-1.webp',
  },
  {
    slug: 'intern-coordination-meeting', tag: 'Announcement', cat: 'Announcements',
    title: 'Quarterly intern coordination meeting — agenda and venue confirmed',
    excerpt: 'All active interns and fellows are requested to attend the upcoming coordination session in Mandela Hall.',
    body: [
      'The agenda covers onboarding feedback, project matching and the upcoming Leadership Forum.',
      'Please bring your updated work plan and confirm attendance with your cohort lead.',
    ],
    meta: '6 days ago', source: 'Protocol Office', img: '/assets/card-img-2.webp',
  },
];

export const findNews = (slug: string) => NEWS.find((n) => n.slug === slug);

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

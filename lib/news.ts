import { MONTHS, type NewsCat, type NewsItem } from './data';

/** Columns the news pages read from the Supabase `news` table. */
export const NEWS_COLS = 'id, slug, cat, title, excerpt, body, source, img, featured, published_at, event_at';

/** stock photos an admin can pick for an article (or upload their own: see uploadNewsImage in lib/portal.ts) */
export const NEWS_IMAGES = [
  { src: '/assets/card-img-1.webp', label: 'Photo 1' },
  { src: '/assets/card-img-2.webp', label: 'Photo 2' },
  { src: '/assets/card-img-3.webp', label: 'Photo 3' },
  { src: '/assets/card-img-4.webp', label: 'Photo 4' },
  { src: '/assets/baskets.webp', label: 'Baskets' },
];

/** category → the singular label on the chip (keys of TAG_CLASS) */
const CAT_TAG: Record<NewsCat, string> = {
  Initiatives: 'Initiative', Events: 'Event',
  Partnerships: 'Partnership', Announcements: 'Announcement', Development: 'Development',
};

/** "2 hours ago", "Yesterday", "3 days ago", then the date. */
export function timeAgo(iso: string, now: Date) {
  const d = new Date(iso);
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** A `news` row in the shape the pages already use. */
export function toNews(r: Record<string, any>, now: Date): NewsItem {
  return {
    slug: r.slug, cat: r.cat as NewsCat, tag: CAT_TAG[r.cat as NewsCat] ?? r.cat,
    title: r.title, excerpt: r.excerpt ?? '', body: r.body ?? [], source: r.source ?? '',
    img: r.img, featured: !!r.featured, meta: timeAgo(r.published_at, now),
    id: r.id, eventAt: r.event_at ?? null,
  };
}

/* ── Opportunities (Supabase `opportunities`, SQL 033) ─────────────── */
export const OPP_COLS = 'id, slug, kind, title, excerpt, body, source, img, apply_url, event_at, published_at';
export const OPP_KINDS = ['Internship', 'Fellowship', 'Volunteer', 'Event', 'Other'] as const;
export type OppKind = (typeof OPP_KINDS)[number];
export interface Opportunity {
  id: string; slug: string; kind: OppKind; title: string; excerpt: string; body: string[]; source: string; img: string;
  /** with a link, Apply opens it; without one, members register on the site */
  applyUrl: string | null;
  /** the date members are reminded about (event day or deadline), ISO */
  eventAt: string | null;
  meta: string;
}

export function toOpp(r: Record<string, any>, now: Date): Opportunity {
  return {
    id: r.id, slug: r.slug, kind: (OPP_KINDS as readonly string[]).includes(r.kind) ? r.kind : 'Other',
    title: r.title, excerpt: r.excerpt ?? '', body: r.body ?? [], source: r.source ?? '', img: r.img,
    applyUrl: r.apply_url ?? null, eventAt: r.event_at ?? null, meta: timeAgo(r.published_at, now),
  };
}

/** "Fri 12 Nov 2026, 14:00" in the viewer's own time zone. Call it in the browser only (never while rendering on the server). */
export function formatWhen(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** ISO time ↔ the value of an <input type="datetime-local"> (local time, no zone) */
export function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

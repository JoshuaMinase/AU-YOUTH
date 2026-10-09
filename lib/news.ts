import { MONTHS, type NewsCat, type NewsItem } from './data';

/** Columns the news pages read from the Supabase `news` table. */
export const NEWS_COLS = 'slug, cat, title, excerpt, body, source, img, featured, published_at';

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
  Initiatives: 'Initiative', Opportunities: 'Opportunity', Events: 'Event',
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
  };
}

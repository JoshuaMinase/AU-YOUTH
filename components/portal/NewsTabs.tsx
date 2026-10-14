'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from '@/styles/Portal.module.css';

/** Phone-only News | Opportunities toggle. Both routes stay as they are; this just links the two pages. */
export default function NewsTabs() {
  const onOpps = usePathname().startsWith('/dashboard/opportunities');
  return (
    <nav className={s.segmented} aria-label="News or Opportunities">
      <Link href="/dashboard/news" aria-current={onOpps ? undefined : 'page'}>News</Link>
      <Link href="/dashboard/opportunities" aria-current={onOpps ? 'page' : undefined}>Opportunities</Link>
    </nav>
  );
}

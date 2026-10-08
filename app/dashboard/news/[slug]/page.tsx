import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/portal/ui';
import { ArticleAdmin } from '@/components/portal/ArticleAdmin';
import { TAG_CLASS } from '@/components/portal/tags';
import { NEWS_COLS, toNews } from '@/lib/news';
import { createClient } from '@/lib/supabase/server';
import s from '@/styles/Portal.module.css';

/* the article + four latest others from Supabase `news`; cached so metadata and page share one fetch.
   Rendered on the server only (no hydration), so reading the clock for "2 hours ago" is safe here. */
const getArticle = cache(async (slug: string) => {
  const supabase = createClient();
  const [one, more] = await Promise.all([
    supabase.from('news').select(NEWS_COLS).eq('slug', slug).maybeSingle(),
    supabase.from('news').select(NEWS_COLS).neq('slug', slug).order('published_at', { ascending: false }).limit(4),
  ]);
  const now = new Date();
  return { item: one.data ? toNews(one.data, now) : null, related: (more.data ?? []).map((r) => toNews(r, now)) };
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { item } = await getArticle(params.slug);
  return { title: item?.title ?? 'News' };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const { item, related } = await getArticle(params.slug);
  if (!item) notFound();

  return (
    <>
      <Link href="/dashboard/news" className={s.back}>← All news</Link>
      <Hero eyebrow={`${item.tag} · ${item.source}`} title={item.title} desc={item.meta} />

      <div className={s.article}>
        <article className={s.card} style={{ padding: 'clamp(20px, 3vw, 36px)' }}>
          <div className={s.articleImg} data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.img} alt="" />
          </div>
          <div className={s.articleBody}>
            <p className={s.articleLead} data-reveal>{item.excerpt}</p>
            {item.body.map((para, i) => <p key={i} data-reveal>{para}</p>)}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }} data-reveal>
            <span className={`${s.tag} ${TAG_CLASS[item.tag]}`}>{item.tag}</span>
            <span className={`${s.tag} ${s.tMuted}`}>{item.source}</span>
          </div>
          <ArticleAdmin item={item} />
        </article>

        <aside className={`${s.card} ${s.sticky}`} data-reveal>
          <div className={s.cardHead}>
            <div>
              <p className={s.cardEyebrow}>Keep reading</p>
              <h2 className={s.cardTitle}>More stories</h2>
            </div>
          </div>
          <div className={s.related}>
            {related.map((n) => (
              <Link key={n.slug} href={`/dashboard/news/${n.slug}`} className={s.relatedItem}>
                <span className={s.relatedImg}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={n.img} alt="" loading="lazy" />
                </span>
                <span>
                  <span className={s.relatedTitle} style={{ display: 'block' }}>{n.title}</span>
                  <span className={s.cardMeta}>{n.meta}</span>
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

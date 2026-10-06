import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/portal/ui';
import { TAG_CLASS } from '@/components/portal/tags';
import { NEWS, findNews } from '@/lib/data';
import s from '@/styles/Portal.module.css';

export function generateStaticParams() {
  return NEWS.map((n) => ({ slug: n.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  return { title: findNews(params.slug)?.title ?? 'News' };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const item = findNews(params.slug);
  if (!item) notFound();
  const related = NEWS.filter((n) => n.slug !== item.slug).slice(0, 4);

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
